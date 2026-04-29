/*
  Workflow Multi-Tenant Database - USER LAYOUT STORED PROCEDURES
  ===================================================================
  File này bao gồm các stored procedures cho module User Layout Configuration
  (Drag-and-Drop Layout cho Task Detail, Project Detail, ...)
  
  Danh sách Stored Procedures:
  - Api_UserLayout_Load: Lấy layout của user cho entity type
  - Api_UserLayout_Save: Lưu toàn bộ layout (thay thế layout cũ)
  - Api_UserLayout_AddModule: Thêm module vào layout
  - Api_UserLayout_RemoveModule: Xóa module khỏi layout
  - Api_UserLayout_Reorder: Sắp xếp lại thứ tự modules
  - Api_UserLayout_Reset: Reset về layout mặc định
  
  LƯU Ý:
  - Tất cả SPs đều yêu cầu @CompanyCode để filter theo công ty
  - Không sử dụng CompanyId, chỉ dùng CompanyCode
  - Tất cả SPs đều có error handling (TRY-CATCH)
  - Layout mặc định: chỉ có module "overview" với DisplayOrder = 0
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_Load';
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
    
    -- Validate JSON
    IF @ModulesJson IS NULL OR @ModulesJson = ''
    BEGIN
      SELECT N'ModulesJson không được để trống' as message, 400 as status;
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
    
    -- Parse JSON và insert modules mới (SQL Server 2016+)
    INSERT INTO dbo.WorkflowUserLayouts (
      CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder, 
      IsEnabled, IsDefault, ConfigJson, CreatedBy, user_id0
    )
    SELECT 
      @CompanyCode,
      @DepId,
      @UserId,
      @EntityType,
      module.value('$.moduleId', 'NVARCHAR(50)') AS ModuleId,
      module.value('$.order', 'INT') AS DisplayOrder,
      1 AS IsEnabled,
      CASE WHEN module.value('$.moduleId', 'NVARCHAR(50)') = 'overview' THEN 1 ELSE 0 END AS IsDefault,
      module.value('$.config', 'NVARCHAR(MAX)') AS ConfigJson,
      @SavedBy,
      @SavedBy
    FROM OPENJSON(@ModulesJson) AS module;
    
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_Save';
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
      
      -- Shift các module có order >= @MaxOrder lên 1
      UPDATE dbo.WorkflowUserLayouts
      SET DisplayOrder = DisplayOrder + 1,
          datetime2 = SYSDATETIME(),
          user_id2 = @AddedBy
      WHERE CompanyCode = @CompanyCode
        AND UserId = @UserId
        AND EntityType = @EntityType
        AND DisplayOrder >= @MaxOrder
        AND IsDeleted = 0;
    END
    
    BEGIN TRANSACTION;
    
    -- Insert module mới
    INSERT INTO dbo.WorkflowUserLayouts (
      CompanyCode, DepId, UserId, EntityType, ModuleId, DisplayOrder,
      IsEnabled, IsDefault, ConfigJson, CreatedBy, user_id0
    )
    VALUES (
      @CompanyCode, @DepId, @UserId, @EntityType, @ModuleId, @MaxOrder,
      1, 0, @ConfigJson, @AddedBy, @AddedBy
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_AddModule';
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
    DECLARE @RemovedOrder INT;
    
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
    
    -- Lấy DisplayOrder của module cần xóa
    SELECT @RemovedOrder = DisplayOrder
    FROM dbo.WorkflowUserLayouts
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND ModuleId = @ModuleId
      AND IsDeleted = 0;
    
    IF @RemovedOrder IS NULL
    BEGIN
      SELECT N'Không tìm thấy module ' + @ModuleId + N' trong layout' as message, 400 as status;
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
    
    -- Cập nhật lại DisplayOrder của các module còn lại (giảm 1)
    UPDATE dbo.WorkflowUserLayouts
    SET 
      DisplayOrder = DisplayOrder - 1,
      datetime2 = SYSDATETIME(),
      user_id2 = @RemovedBy
    WHERE CompanyCode = @CompanyCode
      AND UserId = @UserId
      AND EntityType = @EntityType
      AND DisplayOrder > @RemovedOrder
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_RemoveModule';
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
    -- Validate JSON
    IF @ModulesJson IS NULL OR @ModulesJson = ''
    BEGIN
      SELECT N'ModulesJson không được để trống' as message, 400 as status;
      RETURN;
    END
    
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_Reorder';
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

PRINT 'Đã tạo stored procedure: Api_UserLayout_Reset';
GO

------------------------------------------------------------
-- TÓM TẮT
------------------------------------------------------------
-- 1. Api_UserLayout_Load: Lấy layout của user (trả về mặc định nếu chưa có)
-- 2. Api_UserLayout_Save: Lưu toàn bộ layout (thay thế layout cũ)
-- 3. Api_UserLayout_AddModule: Thêm module vào layout
-- 4. Api_UserLayout_RemoveModule: Xóa module khỏi layout (không cho xóa module mặc định)
-- 5. Api_UserLayout_Reorder: Sắp xếp lại thứ tự modules
-- 6. Api_UserLayout_Reset: Reset về layout mặc định (chỉ có "overview")
------------------------------------------------------------
-- LƯU Ý:
------------------------------------------------------------
-- - Tất cả SPs sử dụng @CompanyCode (không dùng @DvcsCode)
-- - Layout mặc định: chỉ có module "overview" với DisplayOrder = 0, IsDefault = 1
-- - Module mặc định không thể xóa (IsDefault = 1)
-- - Khi thêm module, nếu không chỉ định DisplayOrder thì thêm vào cuối
-- - Khi xóa module, các module sau sẽ tự động giảm DisplayOrder đi 1
-- - Khi reorder, cần truyền toàn bộ danh sách modules với order mới
------------------------------------------------------------

PRINT '========================================';
PRINT 'Hoàn tất tạo stored procedures cho User Layouts!';
PRINT '========================================';
GO
