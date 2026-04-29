# HƯỚNG DẪN PHÁT TRIỂN TỪ FRONTEND ĐẾN BACKEND

## 📋 MỤC LỤC
1. [Quy trình tổng quan](#quy-trình-tổng-quan)
2. [Bước 1: Phân tích yêu cầu từ Frontend](#bước-1-phân-tích-yêu-cầu-từ-frontend)
3. [Bước 2: Thiết kế Database Schema](#bước-2-thiết-kế-database-schema)
4. [Bước 3: Tạo/Cập nhật bảng lưu trữ](#bước-3-tạocập-nhật-bảng-lưu-trữ)
5. [Bước 4: Viết Stored Procedures](#bước-4-viết-stored-procedures)
6. [Bước 5: Testing và Validation](#bước-5-testing-và-validation)
7. [Ví dụ cụ thể: Tính năng Drag-and-Drop Layout](#ví-dụ-cụ-thể-tính-năng-drag-and-drop-layout)

---

## 🔄 QUY TRÌNH TỔNG QUAN

```
Frontend (FE) Mô tả yêu cầu
    ↓
Backend (BE) Phân tích & Thiết kế
    ↓
1. Thiết kế Database Schema
    ↓
2. Tạo/Cập nhật bảng lưu trữ
    ↓
3. Viết Stored Procedures (SP)
    ↓
4. Testing SP
    ↓
5. Frontend tích hợp API
```

---

## 📝 BƯỚC 1: PHÂN TÍCH YÊU CẦU TỪ FRONTEND

### 1.1. Thu thập thông tin từ Frontend

**Câu hỏi cần trả lời:**
- ✅ Tính năng cần làm gì? (CRUD, Query, Report, ...)
- ✅ Dữ liệu nào cần lưu trữ?
- ✅ Có cần filter/search không?
- ✅ Có cần pagination không?
- ✅ Có cần realtime update không?
- ✅ Có cần permission/authorization không?
- ✅ Có cần audit log không?

**Ví dụ: Tính năng Drag-and-Drop Layout cho Task Detail**

**Yêu cầu từ FE:**
- User có thể kéo thả các module (Tổng quan, Bình luận, Người theo dõi, ...) để sắp xếp
- User có thể thêm/xóa module khỏi layout
- Layout được lưu theo user (mỗi user có layout riêng)
- Layout mặc định: chỉ có "Tổng quan"
- Cần lưu: danh sách module đã chọn, thứ tự hiển thị

**Phân tích:**
- ✅ Cần lưu: UserId, ModuleId, Order, IsEnabled
- ✅ Cần CRUD: Create (thêm module), Read (lấy layout), Update (sắp xếp), Delete (xóa module)
- ✅ Cần filter: theo UserId
- ❌ Không cần pagination (số lượng module ít)
- ❌ Không cần realtime (user tự cấu hình)
- ✅ Cần permission: user chỉ xem/sửa layout của chính mình
- ✅ Cần audit log: log khi user thay đổi layout

---

## 🗄️ BƯỚC 2: THIẾT KẾ DATABASE SCHEMA

### 2.1. Xác định các bảng cần thiết

**Nguyên tắc:**
- Mỗi entity chính = 1 bảng
- Quan hệ nhiều-nhiều = bảng trung gian
- Audit fields: `CreatedBy`, `UpdatedBy`, `datetime0`, `datetime2`, `IsDeleted`, `RecordStatus`
- Multi-tenant: `CompanyCode`, `DepId`

### 2.2. Ví dụ: Bảng lưu Layout Configuration

```sql
-- Bảng lưu cấu hình layout của user
CREATE TABLE dbo.WorkflowUserLayouts (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    CompanyCode         NVARCHAR(50) NOT NULL,
    DepId               INT NOT NULL,
    UserId              INT NOT NULL,              -- User sở hữu layout
    EntityType          NVARCHAR(50) NOT NULL,     -- 'TASK_DETAIL', 'PROJECT_DETAIL', ...
    ModuleId            NVARCHAR(50) NOT NULL,     -- 'overview', 'comments', 'watchers', ...
    DisplayOrder        INT NOT NULL DEFAULT 0,    -- Thứ tự hiển thị (0, 1, 2, ...)
    IsEnabled           BIT NOT NULL DEFAULT 1,    -- Module có được hiển thị không
    IsDefault           BIT NOT NULL DEFAULT 0,    -- Module mặc định (không thể xóa)
    ConfigJson          NVARCHAR(MAX) NULL,        -- Cấu hình thêm (JSON)
    
    -- Audit fields
    CreatedBy           INT NOT NULL,
    UpdatedBy           INT NULL,
    datetime0           DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    datetime2            DATETIME2 NULL,
    user_id0            INT NOT NULL,
    user_id2            INT NULL,
    IsDeleted           BIT NOT NULL DEFAULT 0,
    RecordStatus        TINYINT NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT FK_WorkflowUserLayouts_User FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
    CONSTRAINT FK_WorkflowUserLayouts_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
    CONSTRAINT UQ_WorkflowUserLayouts UNIQUE (CompanyCode, UserId, EntityType, ModuleId)
);

-- Indexes
CREATE INDEX IX_WorkflowUserLayouts_User_Entity 
    ON dbo.WorkflowUserLayouts(CompanyCode, UserId, EntityType, DisplayOrder);
```

**Giải thích:**
- `EntityType`: Loại entity (TASK_DETAIL, PROJECT_DETAIL, ...) - cho phép mở rộng sau
- `ModuleId`: ID của module (overview, comments, watchers, ...)
- `DisplayOrder`: Thứ tự hiển thị (0 = đầu tiên, 1 = thứ hai, ...)
- `IsEnabled`: Module có được hiển thị không (có thể tắt mà không xóa)
- `IsDefault`: Module mặc định (không thể xóa, luôn hiển thị)
- `ConfigJson`: Cấu hình thêm (ví dụ: kích thước, vị trí, ...)

---

## 🛠️ BƯỚC 3: TẠO/CẬP NHẬT BẢNG LƯU TRỮ

### 3.1. Tạo script SQL

**File:** `database/01_tables.sql` (thêm vào cuối file)

```sql
-- ============================================================
-- WORKFLOW USER LAYOUTS TABLE
-- Mô tả: Lưu cấu hình layout của user (drag-and-drop modules)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.WorkflowUserLayouts') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.WorkflowUserLayouts (
        Id                  INT IDENTITY(1,1) PRIMARY KEY,
        CompanyCode         NVARCHAR(50) NOT NULL,
        DepId               INT NOT NULL,
        UserId              INT NOT NULL,
        EntityType          NVARCHAR(50) NOT NULL,     -- 'TASK_DETAIL', 'PROJECT_DETAIL', ...
        ModuleId            NVARCHAR(50) NOT NULL,     -- 'overview', 'comments', 'watchers', ...
        DisplayOrder        INT NOT NULL DEFAULT 0,
        IsEnabled           BIT NOT NULL DEFAULT 1,
        IsDefault           BIT NOT NULL DEFAULT 0,
        ConfigJson          NVARCHAR(MAX) NULL,
        
        -- Audit fields
        CreatedBy           INT NOT NULL,
        UpdatedBy           INT NULL,
        datetime0           DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        datetime2           DATETIME2 NULL,
        user_id0            INT NOT NULL,
        user_id2            INT NULL,
        IsDeleted           BIT NOT NULL DEFAULT 0,
        RecordStatus        TINYINT NOT NULL DEFAULT 1,
        
        -- Foreign keys
        CONSTRAINT FK_WorkflowUserLayouts_User FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
        CONSTRAINT FK_WorkflowUserLayouts_Company FOREIGN KEY (DepId) REFERENCES dbo.WorkflowCompanies(Id),
        
        -- Unique constraint: Mỗi user chỉ có 1 layout cho 1 module trong 1 entity type
        CONSTRAINT UQ_WorkflowUserLayouts UNIQUE (CompanyCode, UserId, EntityType, ModuleId)
    );
    
    -- Indexes
    CREATE INDEX IX_WorkflowUserLayouts_User_Entity 
        ON dbo.WorkflowUserLayouts(CompanyCode, UserId, EntityType, DisplayOrder);
    
    CREATE INDEX IX_WorkflowUserLayouts_Company 
        ON dbo.WorkflowUserLayouts(CompanyCode, IsDeleted, RecordStatus);
    
    PRINT 'Đã tạo bảng: WorkflowUserLayouts';
END
ELSE
BEGIN
    PRINT 'Bảng WorkflowUserLayouts đã tồn tại';
END
GO
```

### 3.2. Chạy script

```sql
-- Chạy script trong SQL Server Management Studio hoặc Azure Data Studio
-- Hoặc dùng command line:
-- sqlcmd -S server -d database -i database/01_tables.sql
```

---

## 📦 BƯỚC 4: VIẾT STORED PROCEDURES

### 4.1. Danh sách Stored Procedures cần viết

**Quy tắc đặt tên:**
- `Api_<Entity>_<Action>`: Ví dụ: `Api_UserLayout_Load`, `Api_UserLayout_Save`
- Actions: `Load`, `Create`, `Update`, `Delete`, `List`

**Ví dụ cho User Layout:**

1. **Api_UserLayout_Load**: Lấy layout của user cho entity type
2. **Api_UserLayout_Save**: Lưu toàn bộ layout (thay thế layout cũ)
3. **Api_UserLayout_AddModule**: Thêm module vào layout
4. **Api_UserLayout_RemoveModule**: Xóa module khỏi layout
5. **Api_UserLayout_Reorder**: Sắp xếp lại thứ tự modules
6. **Api_UserLayout_Reset**: Reset về layout mặc định

### 4.2. Template Stored Procedure

**File:** `database/10_stored_procedures_user_layouts.sql`

```sql
/*
  Workflow Multi-Tenant Database - USER LAYOUT STORED PROCEDURES
  File này bao gồm các stored procedures cho module User Layout Configuration
  
  LƯU Ý:
  - Tất cả SPs đều yêu cầu @CompanyCode để filter theo công ty
  - Không sử dụng CompanyId, chỉ dùng CompanyCode
  - Tất cả SPs đều có error handling (TRY-CATCH)
*/

------------------------------------------------------------
-- 1. Api_UserLayout_Load: Lấy layout của user cho entity type
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_Load;
GO
CREATE PROCEDURE dbo.Api_UserLayout_Load
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50)  -- 'TASK_DETAIL', 'PROJECT_DETAIL', ...
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Lấy layout của user
    SELECT 
      Id,
      ModuleId,
      DisplayOrder,
      IsEnabled,
      IsDefault,
      ConfigJson,
      datetime0 AS CreatedDate,
      datetime2 AS UpdatedDate
    FROM dbo.WorkflowUserLayouts
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND IsDeleted = 0
      AND RecordStatus = 1
    ORDER BY DisplayOrder ASC;
    
    -- Nếu user chưa có layout, trả về layout mặc định
    IF @@ROWCOUNT = 0
    BEGIN
      -- Layout mặc định: chỉ có module "overview"
      SELECT 
        'overview' AS ModuleId,
        0 AS DisplayOrder,
        1 AS IsEnabled,
        1 AS IsDefault,
        NULL AS ConfigJson,
        GETDATE() AS CreatedDate,
        NULL AS UpdatedDate;
    END
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 2. Api_UserLayout_Save: Lưu toàn bộ layout (thay thế layout cũ)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_Save') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_Save;
GO
CREATE PROCEDURE dbo.Api_UserLayout_Save
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50),
  @ModulesJson    NVARCHAR(MAX),  -- JSON array: [{"moduleId": "overview", "order": 0}, ...]
  @SavedBy        INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    
    -- Lấy DepId từ CompanyCode
    SELECT @DepId = Id FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode;
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Xóa layout cũ (soft delete, trừ các module mặc định)
    UPDATE dbo.WorkflowUserLayouts
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @SavedBy
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND IsDefault = 0
      AND IsDeleted = 0;
    
    -- Parse JSON và insert modules mới
    -- Lưu ý: SQL Server 2016+ mới có JSON functions
    -- Nếu dùng SQL Server cũ, cần parse JSON ở application layer
    
    -- Ví dụ với SQL Server 2016+:
    INSERT INTO dbo.WorkflowUserLayouts (
      CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder, 
      IsEnabled, IsDefault, CreatedBy, user_id0
    )
    SELECT 
      @CompanyCode,
      @DepId,
      @UserId,
      @EntityType,
      module.value('moduleId[1]', 'NVARCHAR(50)') AS ModuleId,
      module.value('order[1]', 'INT') AS DisplayOrder,
      1 AS IsEnabled,
      0 AS IsDefault,
      @SavedBy,
      @SavedBy
    FROM OPENJSON(@ModulesJson) WITH (
      moduleId NVARCHAR(50) '$.moduleId',
      order INT '$.order'
    ) AS module;
    
    COMMIT TRANSACTION;
    
    -- Trả về layout đã lưu
    EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 3. Api_UserLayout_AddModule: Thêm module vào layout
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_AddModule') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_AddModule;
GO
CREATE PROCEDURE dbo.Api_UserLayout_AddModule
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50),
  @ModuleId       NVARCHAR(50),
  @DisplayOrder   INT = NULL,  -- NULL = thêm vào cuối
  @ConfigJson     NVARCHAR(MAX) = NULL,
  @AddedBy        INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    DECLARE @MaxOrder INT = 0;
    
    -- Lấy DepId từ CompanyCode
    SELECT @DepId = Id FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode;
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra module đã tồn tại chưa
    IF EXISTS (
      SELECT 1 FROM dbo.WorkflowUserLayouts
      WHERE CompanyCode = @CompanyCode
        AND UserId = @UserId
        AND EntityType = @EntityType
        AND ModuleId = @ModuleId
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Module ' + @ModuleId + N' đã tồn tại trong layout' as message, 400 as status;
      RETURN;
    END
    
    -- Nếu DisplayOrder NULL, lấy order lớn nhất + 1
    IF @DisplayOrder IS NULL
    BEGIN
      SELECT @MaxOrder = ISNULL(MAX(DisplayOrder), -1) + 1
      FROM dbo.WorkflowUserLayouts
      WHERE CompanyCode = @CompanyCode
        AND UserId = @UserId
        AND EntityType = @EntityType
        AND IsDeleted = 0;
    END
    ELSE
    BEGIN
      SET @MaxOrder = @DisplayOrder;
    END
    
    BEGIN TRANSACTION;
    
    -- Insert module mới
    INSERT INTO dbo.WorkflowUserLayouts (
      CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder,
      IsEnabled, ConfigJson, CreatedBy, user_id0
    )
    VALUES (
      @CompanyCode, @DepId, @UserId, @EntityType, @ModuleId, @MaxOrder,
      1, @ConfigJson, @AddedBy, @AddedBy
    );
    
    COMMIT TRANSACTION;
    
    -- Trả về layout đã cập nhật
    EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 4. Api_UserLayout_RemoveModule: Xóa module khỏi layout
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_RemoveModule') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_RemoveModule;
GO
CREATE PROCEDURE dbo.Api_UserLayout_RemoveModule
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50),
  @ModuleId       NVARCHAR(50),
  @RemovedBy      INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra module có phải mặc định không
    IF EXISTS (
      SELECT 1 FROM dbo.WorkflowUserLayouts
      WHERE CompanyCode = @CompanyCode
        AND UserId = @UserId
        AND EntityType = @EntityType
        AND ModuleId = @ModuleId
        AND IsDefault = 1
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Không thể xóa module mặc định' as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Soft delete module
    UPDATE dbo.WorkflowUserLayouts
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @RemovedBy
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND ModuleId = @ModuleId
      AND IsDeleted = 0;
    
    -- Cập nhật lại DisplayOrder của các module còn lại
    UPDATE dbo.WorkflowUserLayouts
    SET DisplayOrder = DisplayOrder - 1
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND DisplayOrder > (
        SELECT DisplayOrder FROM dbo.WorkflowUserLayouts
        WHERE CompanyCode = @CompanyCode
          AND UserId = @UserId
          AND EntityType = @EntityType
          AND ModuleId = @ModuleId
          AND IsDeleted = 1
      )
      AND IsDeleted = 0;
    
    COMMIT TRANSACTION;
    
    -- Trả về layout đã cập nhật
    EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 5. Api_UserLayout_Reorder: Sắp xếp lại thứ tự modules
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_Reorder') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_Reorder;
GO
CREATE PROCEDURE dbo.Api_UserLayout_Reorder
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50),
  @ModulesJson    NVARCHAR(MAX),  -- JSON array: [{"moduleId": "overview", "order": 0}, ...]
  @UpdatedBy      INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    BEGIN TRANSACTION;
    
    -- Update DisplayOrder cho từng module
    UPDATE l
    SET 
      DisplayOrder = m.order,
      datetime2 = SYSDATETIME(),
      user_id2 = @UpdatedBy
    FROM dbo.WorkflowUserLayouts l
    INNER JOIN OPENJSON(@ModulesJson) WITH (
      moduleId NVARCHAR(50) '$.moduleId',
      order INT '$.order'
    ) AS m ON l.ModuleId = m.moduleId
    WHERE l.CompanyCode = @CompanyCode
      AND l.UserId = @UserId
      AND l.EntityType = @EntityType
      AND l.IsDeleted = 0;
    
    COMMIT TRANSACTION;
    
    -- Trả về layout đã cập nhật
    EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 6. Api_UserLayout_Reset: Reset về layout mặc định
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserLayout_Reset') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserLayout_Reset;
GO
CREATE PROCEDURE dbo.Api_UserLayout_Reset
  @CompanyCode    NVARCHAR(50),
  @UserId         INT,
  @EntityType     NVARCHAR(50),
  @ResetBy        INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    
    -- Lấy DepId từ CompanyCode
    SELECT @DepId = Id FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode;
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Xóa tất cả layout cũ (soft delete)
    UPDATE dbo.WorkflowUserLayouts
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @ResetBy
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND IsDeleted = 0;
    
    -- Tạo layout mặc định: chỉ có module "overview"
    INSERT INTO dbo.WorkflowUserLayouts (
      CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder,
      IsEnabled, IsDefault, CreatedBy, user_id0
    )
    VALUES (
      @CompanyCode, @DepId, @UserId, @EntityType, 'overview', 0,
      1, 1, @ResetBy, @ResetBy
    );
    
    COMMIT TRANSACTION;
    
    -- Trả về layout mặc định
    EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO
```

### 4.3. Checklist khi viết Stored Procedure

- [ ] ✅ Có error handling (TRY-CATCH)
- [ ] ✅ Có transaction cho các thao tác multi-step
- [ ] ✅ Validate input parameters
- [ ] ✅ Check permissions (user chỉ sửa layout của chính mình)
- [ ] ✅ Soft delete (không xóa cứng)
- [ ] ✅ Audit log (CreatedBy, UpdatedBy, datetime0, datetime2)
- [ ] ✅ Multi-tenant support (CompanyCode, DepId)
- [ ] ✅ Return data sau khi thao tác (để FE update UI)
- [ ] ✅ Comments rõ ràng

---

## 🧪 BƯỚC 5: TESTING VÀ VALIDATION

### 5.1. Test từng Stored Procedure

**Test Case 1: Api_UserLayout_Load**
```sql
-- Test: Lấy layout của user chưa có layout (phải trả về mặc định)
EXEC dbo.Api_UserLayout_Load 
  @CompanyCode = 'DVCS01',
  @UserId = 1,
  @EntityType = 'TASK_DETAIL';
-- Expected: Trả về 1 row với ModuleId = 'overview', DisplayOrder = 0
```

**Test Case 2: Api_UserLayout_AddModule**
```sql
-- Test: Thêm module "comments" vào layout
EXEC dbo.Api_UserLayout_AddModule
  @CompanyCode = 'DVCS01',
  @UserId = 1,
  @EntityType = 'TASK_DETAIL',
  @ModuleId = 'comments',
  @DisplayOrder = 1,
  @AddedBy = 1;
-- Expected: Thêm thành công, trả về layout có 2 modules: overview (0), comments (1)
```

**Test Case 3: Api_UserLayout_Reorder**
```sql
-- Test: Đổi thứ tự: comments lên đầu, overview xuống sau
EXEC dbo.Api_UserLayout_Reorder
  @CompanyCode = 'DVCS01',
  @UserId = 1,
  @EntityType = 'TASK_DETAIL',
  @ModulesJson = '[{"moduleId":"comments","order":0},{"moduleId":"overview","order":1}]',
  @UpdatedBy = 1;
-- Expected: comments.DisplayOrder = 0, overview.DisplayOrder = 1
```

### 5.2. Test Integration với Frontend

1. **Frontend gọi API** → Backend gọi Stored Procedure
2. **Kiểm tra response** có đúng format không
3. **Kiểm tra UI** có hiển thị đúng không
4. **Kiểm tra persistence** (refresh page, layout vẫn giữ nguyên)

---

## 📚 VÍ DỤ CỤ THỂ: TÍNH NĂNG DRAG-AND-DROP LAYOUT

### Yêu cầu từ Frontend:
> "User có thể kéo thả các module (Tổng quan, Bình luận, Người theo dõi, ...) để sắp xếp layout cho Task Detail. Layout được lưu theo user."

### Backend cần làm:

#### ✅ Bước 1: Phân tích
- **Entity**: User Layout Configuration
- **Actions**: Load, Save, Add Module, Remove Module, Reorder, Reset
- **Data**: UserId, EntityType, ModuleId, DisplayOrder, IsEnabled

#### ✅ Bước 2: Thiết kế Database
- **Bảng**: `WorkflowUserLayouts`
- **Fields**: Id, CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder, IsEnabled, IsDefault, ConfigJson, audit fields

#### ✅ Bước 3: Tạo bảng
- **File**: `database/01_tables.sql` (thêm vào cuối)
- **Script**: CREATE TABLE WorkflowUserLayouts với đầy đủ constraints và indexes

#### ✅ Bước 4: Viết Stored Procedures
- **File**: `database/10_stored_procedures_user_layouts.sql` (file mới)
- **SPs**: 
  1. `Api_UserLayout_Load`
  2. `Api_UserLayout_Save`
  3. `Api_UserLayout_AddModule`
  4. `Api_UserLayout_RemoveModule`
  5. `Api_UserLayout_Reorder`
  6. `Api_UserLayout_Reset`

#### ✅ Bước 5: Testing
- Test từng SP riêng lẻ
- Test integration với Frontend
- Test edge cases (xóa module mặc định, duplicate module, ...)

---

## 📋 CHECKLIST TỔNG QUAN

### Khi nhận yêu cầu từ Frontend:

- [ ] **Phân tích yêu cầu**
  - [ ] Xác định entity chính
  - [ ] Xác định các actions cần thiết (CRUD)
  - [ ] Xác định dữ liệu cần lưu trữ
  - [ ] Xác định business rules

- [ ] **Thiết kế Database**
  - [ ] Vẽ ERD (nếu cần)
  - [ ] Xác định các bảng cần tạo
  - [ ] Xác định relationships
  - [ ] Xác định indexes

- [ ] **Tạo/Cập nhật bảng**
  - [ ] Viết CREATE TABLE script
  - [ ] Thêm vào `database/01_tables.sql`
  - [ ] Chạy script trên database
  - [ ] Verify bảng đã tạo thành công

- [ ] **Viết Stored Procedures**
  - [ ] Tạo file mới hoặc thêm vào file có sẵn
  - [ ] Viết từng SP theo template
  - [ ] Test từng SP
  - [ ] Document parameters và return values

- [ ] **Testing**
  - [ ] Unit test từng SP
  - [ ] Integration test với Frontend
  - [ ] Performance test (nếu cần)
  - [ ] Security test (permissions, SQL injection, ...)

---

## 🔗 LIÊN KẾT CÁC FILE

### File Structure:
```
database/
├── 01_tables.sql                          # Tất cả CREATE TABLE
├── 06_stored_procedures_projects.sql      # SPs cho Projects
├── 07_stored_procedures_tasks.sql         # SPs cho Tasks
├── 08_stored_procedures_relationships.sql # SPs cho Relationships
├── 09_stored_procedures_users_customers_dashboard.sql # SPs cho Users/Customers
├── 10_stored_procedures_user_layouts.sql  # SPs cho User Layouts (MỚI)
└── DEVELOPMENT_GUIDE_FE_TO_BE.md         # File hướng dẫn này
```

### Quy tắc đặt tên:
- **Bảng**: `Workflow<EntityName>` (ví dụ: `WorkflowUserLayouts`)
- **Stored Procedure**: `Api_<Entity>_<Action>` (ví dụ: `Api_UserLayout_Load`)
- **File SP**: `10_stored_procedures_<module>.sql`

---

## 💡 TIPS & BEST PRACTICES

### 1. **Luôn dùng CompanyCode, không dùng CompanyId**
```sql
-- ✅ ĐÚNG
WHERE CompanyCode = @CompanyCode

-- ❌ SAI
WHERE CompanyId = @CompanyId
```

### 2. **Luôn có error handling**
```sql
BEGIN TRY
    -- Code here
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
END CATCH
```

### 3. **Luôn dùng transaction cho multi-step operations**
```sql
BEGIN TRANSACTION;
    -- Step 1
    -- Step 2
    -- Step 3
COMMIT TRANSACTION;
```

### 4. **Luôn validate input**
```sql
IF @UserId IS NULL OR @UserId <= 0
BEGIN
    SELECT N'UserId không hợp lệ' as message, 400 as status;
    RETURN;
END
```

### 5. **Luôn return data sau khi thao tác**
```sql
-- Sau khi INSERT/UPDATE/DELETE, gọi lại Load SP để trả về data mới nhất
EXEC dbo.Api_UserLayout_Load @CompanyCode, @UserId, @EntityType;
```

---

## 📞 HỖ TRỢ

Nếu có thắc mắc, tham khảo:
- File `WORKFLOW_STORED_PROCEDURES_DVCS.md` - Hướng dẫn chi tiết về SPs
- File `WORKFLOW_TABLE_STRUCTURE_DVCS.md` - Cấu trúc bảng
- Các file SP mẫu trong thư mục `database/`

---

**Cập nhật lần cuối:** 2025-01-21
