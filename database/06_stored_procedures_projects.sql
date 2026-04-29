/*
  Workflow Multi-Tenant Database - PROJECT MANAGEMENT STORED PROCEDURES
  File này bao gồm 20 stored procedures cho module Quản lý Dự án:
  
  Danh sách & Tìm kiếm:
  - Api_ProjectList_Load: Danh sách dự án với filter, phân trang, thống kê
  - Api_ProjectSummary_Load: Thống kê tổng hợp tất cả dự án
  - Api_ProjectList_ByStatus: Danh sách dự án theo trạng thái
  
  Chi tiết & Dashboard:
  - Api_ProjectDashboard_Load: Dashboard dự án đầy đủ
  - Api_ProjectDetail_Load: Chi tiết 1 dự án
  
  CRUD:
  - Api_Project_Create: Tạo dự án (sinh ProjectCode, thêm PM vào members, log activity)
  - Api_Project_Update: Cập nhật dự án (log activity khi đổi status)
  - Api_Project_Delete: Xóa mềm dự án (log activity)
  
  Thành viên:
  - Api_ProjectMember_Add: Thêm thành viên (upsert)
  - Api_ProjectMember_Remove: Xóa thành viên
  - Api_ProjectMember_List: Danh sách thành viên
  
  Tài liệu:
  - Api_ProjectDocument_Upload: Upload tài liệu (log activity)
  - Api_ProjectDocument_Delete: Xóa tài liệu (log activity)
  - Api_ProjectDocument_List: Danh sách tài liệu
  - Api_ProjectDocument_Download: Lấy thông tin document để download
  
  Bài đăng:
  - Api_ProjectPost_Create: Tạo bài đăng (log activity)
  - Api_ProjectPost_List: Danh sách bài đăng
  
  Hoạt động:
  - Api_ProjectActivities_Load: Lấy danh sách activities với filter và pagination
  
  LƯU Ý:
  - Tất cả SPs đều yêu cầu @CompanyCode để filter theo công ty
  - Tất cả SPs đều có error handling (TRY-CATCH)
  - Không sử dụng CompanyId, chỉ dùng CompanyCode
*/

------------------------------------------------------------
-- 1. Api_ProjectList_Load: Danh sách dự án với filter, phân trang, thống kê
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectList_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectList_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectList_Load
  @CompanyCode    NVARCHAR(50),
  @PageIndex   INT = 1,
  @PageSize    INT = 20,
  @SearchKey   NVARCHAR(255) = NULL,
  @Status      NVARCHAR(30) = NULL,
  @Priority    NVARCHAR(20) = NULL,
  @OrgUnitId   INT = NULL,
  @CustomerId  INT = NULL,  -- Filter theo Customer
  @ProjectManagerId INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    -- Danh sách projects với các trường mới
    SELECT 
      p.Id, p.ProjectCode, p.ProjectName, p.Status, p.Priority,
      p.HealthStatus, p.Progress, p.StartDate, p.EndDate,
      p.Budget, p.BudgetUsed, p.ClientName,
      p.CustomerId,  -- Trường mới
      c.CustomerName,  -- JOIN WorkflowCustomers
      p.EstimatedHours,  -- Trường mới
      p.ActualHours,  -- Trường mới
      pm.Id AS ProjectManagerId,
      pm.FullName AS ProjectManagerName,
      pm.Email AS ProjectManagerEmail,
      ou.Id AS OrgUnitId,
      ou.UnitName AS OrgUnitName,
      p.datetime0 AS CreatedDate,
      p.datetime2 AS UpdatedDate,
      -- Thống kê thành viên
      (SELECT COUNT(*) FROM dbo.WorkflowProjectMembers m WHERE m.ProjectId = p.Id AND m.IsDeleted = 0) AS MemberCount
    FROM dbo.WorkflowProjects p
    LEFT JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    LEFT JOIN dbo.WorkflowOrgUnits ou ON p.OrgUnitId = ou.Id
    LEFT JOIN dbo.WorkflowCustomers c ON p.CustomerId = c.Id  -- JOIN mới
    WHERE p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND (@SearchKey IS NULL OR p.ProjectName LIKE '%' + @SearchKey + '%' OR p.ProjectCode LIKE '%' + @SearchKey + '%')
      AND (@Status IS NULL OR p.Status = @Status)
      AND (@Priority IS NULL OR p.Priority = @Priority)
      AND (@OrgUnitId IS NULL OR p.OrgUnitId = @OrgUnitId)
      AND (@CustomerId IS NULL OR p.CustomerId = @CustomerId)  -- Filter mới
      AND (@ProjectManagerId IS NULL OR p.ProjectManagerId = @ProjectManagerId)
    ORDER BY p.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Tổng số bản ghi
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowProjects p
    WHERE p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND (@SearchKey IS NULL OR p.ProjectName LIKE '%' + @SearchKey + '%' OR p.ProjectCode LIKE '%' + @SearchKey + '%')
      AND (@Status IS NULL OR p.Status = @Status)
      AND (@Priority IS NULL OR p.Priority = @Priority)
      AND (@OrgUnitId IS NULL OR p.OrgUnitId = @OrgUnitId)
      AND (@CustomerId IS NULL OR p.CustomerId = @CustomerId)  -- Filter mới
      AND (@ProjectManagerId IS NULL OR p.ProjectManagerId = @ProjectManagerId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 2. Api_ProjectSummary_Load: Thống kê tổng hợp tất cả dự án
-- FIX: Map Status sang số (0-6) để hỗ trợ cả số và string
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectSummary_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectSummary_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectSummary_Load
  @CompanyCode NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- CHỈ TÍNH CÁC DỰ ÁN CHƯA BỊ XÓA VÀ ĐANG ACTIVE
    -- Filter: IsDeleted = 0 AND RecordStatus = 1
    
    -- Helper: Convert Status (số hoặc string) sang số (0-6)
    -- 0=PLANNING, 1=ACTIVE, 2=IN_PROGRESS, 3=COMPLETED, 4=ON_HOLD, 5=PAUSED, 6=CANCELLED
    WITH StatusMapped AS (
      SELECT *,
        CASE 
          -- Nếu Status là số (0-6), dùng trực tiếp
          WHEN ISNUMERIC(Status) = 1 AND CAST(Status AS INT) BETWEEN 0 AND 6 THEN CAST(Status AS INT)
          -- Nếu Status là string, map sang số
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'PLANNING' THEN 0
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'ACTIVE' THEN 1
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'IN_PROGRESS' THEN 2
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'COMPLETED' THEN 3
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'ON_HOLD' THEN 4
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'PAUSED' THEN 5
          WHEN UPPER(LTRIM(RTRIM(Status))) = 'CANCELLED' THEN 6
          -- Status NULL hoặc không hợp lệ → coi như 0 (PLANNING)
          ELSE 0
        END AS StatusCode
      FROM dbo.WorkflowProjects
      WHERE CompanyCode = @CompanyCode
        AND IsDeleted = 0        -- CHỈ TÍNH DỰ ÁN CHƯA BỊ XÓA
        AND RecordStatus = 1     -- CHỈ TÍNH DỰ ÁN ĐANG ACTIVE
    )
    SELECT 
      -- Tổng số dự án (chỉ tính dự án chưa bị xóa)
      COUNT(*) AS TotalProjects,
      
      -- Status counts (dùng StatusCode 0-6)
      SUM(CASE WHEN StatusCode = 0 THEN 1 ELSE 0 END) AS PlanningProjects,      -- 0 = PLANNING
      SUM(CASE WHEN StatusCode = 1 THEN 1 ELSE 0 END) AS ActiveProjects,         -- 1 = ACTIVE
      SUM(CASE WHEN StatusCode = 2 THEN 1 ELSE 0 END) AS InProgressProjects,     -- 2 = IN_PROGRESS
      SUM(CASE WHEN StatusCode = 3 THEN 1 ELSE 0 END) AS CompletedProjects,     -- 3 = COMPLETED
      SUM(CASE WHEN StatusCode = 4 THEN 1 ELSE 0 END) AS OnHoldProjects,         -- 4 = ON_HOLD
      SUM(CASE WHEN StatusCode = 5 THEN 1 ELSE 0 END) AS PausedProjects,        -- 5 = PAUSED
      SUM(CASE WHEN StatusCode = 6 THEN 1 ELSE 0 END) AS CancelledProjects,      -- 6 = CANCELLED
      -- Các status khác (StatusCode không phải 0-6) - không nên có nhưng để an toàn
      SUM(CASE WHEN StatusCode NOT BETWEEN 0 AND 6 THEN 1 ELSE 0 END) AS OtherStatusProjects,
      
      -- Health status counts (chỉ tính dự án chưa bị xóa)
      SUM(CASE WHEN HealthStatus = 'GOOD' THEN 1 ELSE 0 END) AS GoodHealthProjects,
      SUM(CASE WHEN HealthStatus = 'WARNING' THEN 1 ELSE 0 END) AS WarningHealthProjects,
      SUM(CASE WHEN HealthStatus = 'CRITICAL' THEN 1 ELSE 0 END) AS CriticalHealthProjects,
      SUM(CASE WHEN HealthStatus = 'RISK' THEN 1 ELSE 0 END) AS RiskHealthProjects,
      
      -- Progress và Budget (chỉ tính dự án chưa bị xóa)
      AVG(Progress) AS AvgProgress,
      SUM(Budget) AS TotalBudget,
      SUM(BudgetUsed) AS TotalBudgetUsed,
      
      -- Overdue counts riêng cho từng status (chỉ tính cho projects chưa hoàn thành/hủy và chưa bị xóa)
      SUM(CASE WHEN EndDate < GETDATE() AND StatusCode = 0 THEN 1 ELSE 0 END) AS OverduePlanningProjects,      -- 0 = PLANNING
      SUM(CASE WHEN EndDate < GETDATE() AND StatusCode = 1 THEN 1 ELSE 0 END) AS OverdueActiveProjects,         -- 1 = ACTIVE
      SUM(CASE WHEN EndDate < GETDATE() AND StatusCode = 2 THEN 1 ELSE 0 END) AS OverdueInProgressProjects,    -- 2 = IN_PROGRESS
      SUM(CASE WHEN EndDate < GETDATE() AND StatusCode NOT IN (3, 6) THEN 1 ELSE 0 END) AS OverdueProjects     -- Tổng tất cả overdue (trừ COMPLETED=3, CANCELLED=6)
    FROM StatusMapped;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 3. Api_ProjectList_ByStatus: Danh sách dự án theo trạng thái
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectList_ByStatus') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectList_ByStatus;
GO
CREATE PROCEDURE dbo.Api_ProjectList_ByStatus
  @CompanyCode NVARCHAR(50),
  @Status   NVARCHAR(30),
  @PageIndex INT = 1,
  @PageSize  INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    SELECT 
      p.Id, p.ProjectCode, p.ProjectName, p.Status, p.Priority,
      p.HealthStatus, p.Progress, p.StartDate, p.EndDate,
      p.Budget, p.BudgetUsed, p.ClientName,
      pm.FullName AS ProjectManagerName,
      ou.UnitName AS OrgUnitName
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    INNER JOIN dbo.WorkflowOrgUnits ou ON p.OrgUnitId = ou.Id
    WHERE p.CompanyCode = @CompanyCode
      AND p.Status = @Status
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
    ORDER BY p.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowProjects
    WHERE CompanyCode = @CompanyCode
      AND Status = @Status
      AND IsDeleted = 0
      AND RecordStatus = 1;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 4. Api_ProjectDashboard_Load: Dashboard dự án đầy đủ
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDashboard_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDashboard_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectDashboard_Load
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Thông tin dự án
    SELECT 
      p.*,
      pm.FullName AS ProjectManagerName,
      pm.Email AS ProjectManagerEmail,
      ou.UnitName AS OrgUnitName
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    INNER JOIN dbo.WorkflowOrgUnits ou ON p.OrgUnitId = ou.Id
    WHERE p.Id = @ProjectId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1;
    
    -- Thống kê thành viên
    SELECT 
      COUNT(*) AS TotalMembers,
      COUNT(DISTINCT Role) AS RoleCount
    FROM dbo.WorkflowProjectMembers
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND RecordStatus = 1;
    
    -- Thống kê tài liệu
    SELECT 
      COUNT(*) AS TotalDocuments,
      SUM(FileSize) AS TotalFileSize
    FROM dbo.WorkflowProjectDocuments
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0
      AND RecordStatus = 1;
    
    -- Thống kê bài đăng
    SELECT COUNT(*) AS TotalPosts
    FROM dbo.WorkflowProjectPosts
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND RecordStatus = 1;
    
    -- Hoạt động gần đây (10 hoạt động mới nhất)
    SELECT TOP 10
      ActivityType,
      Description,
      TriggeredBy,
      u.FullName AS TriggeredByName,
      CreatedDate
    FROM dbo.WorkflowProjectActivities a
    INNER JOIN dbo.WorkflowUsers u ON a.TriggeredBy = u.Id
    WHERE a.ProjectId = @ProjectId
      AND a.CompanyCode = @CompanyCode
      AND a.RecordStatus = 1
    ORDER BY a.CreatedDate DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 5. Api_ProjectDetail_Load: Chi tiết 1 dự án
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDetail_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDetail_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectDetail_Load
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    SELECT 
      p.Id,
      p.ProjectCode,
      p.ProjectName,
      p.Status,
      p.Priority,
      p.HealthStatus,
      p.Progress,
      p.StartDate,
      p.EndDate,
      p.Budget,
      p.BudgetUsed,
      p.ClientName,
      p.CustomerId,  -- Trường mới
      c.CustomerCode,  -- JOIN WorkflowCustomers
      c.CustomerName,  -- JOIN WorkflowCustomers
      p.Description,
      p.EstimatedHours,  -- Trường mới
      p.ActualHours,  -- Trường mới
      p.Notes,  -- Trường mới
      p.ProjectManagerId,
      pm.FullName AS ProjectManagerName,
      pm.Email AS ProjectManagerEmail,
      pm.Phone AS ProjectManagerPhone,
      p.OrgUnitId,
      ou.UnitName AS OrgUnitName,
      ou.UnitCode AS OrgUnitCode,
      p.CreatedBy,
      creator.FullName AS CreatorName,
      p.datetime0 AS CreatedDate,
      p.UpdatedBy,
      updater.FullName AS UpdatedByName,
      p.datetime2 AS UpdatedDate
    FROM dbo.WorkflowProjects p
    LEFT JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    LEFT JOIN dbo.WorkflowOrgUnits ou ON p.OrgUnitId = ou.Id
    LEFT JOIN dbo.WorkflowUsers creator ON p.CreatedBy = creator.Id
    LEFT JOIN dbo.WorkflowUsers updater ON p.UpdatedBy = updater.Id
    LEFT JOIN dbo.WorkflowCustomers c ON p.CustomerId = c.Id  -- JOIN mới
    WHERE p.Id = @ProjectId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 6. Api_Project_Create: Tạo dự án (sinh ProjectCode, thêm PM vào members, log activity)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Project_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Project_Create;
GO
CREATE PROCEDURE dbo.Api_Project_Create
  @CompanyCode         NVARCHAR(50),
  @ProjectName      NVARCHAR(255),
  @Status           NVARCHAR(30) = 'PLANNING',
  @Priority         NVARCHAR(20) = 'MEDIUM',
  @ProjectManagerId INT,
  @OrgUnitId        INT,
  @ClientName       NVARCHAR(255) = NULL,
  @CustomerId       INT = NULL,  -- Liên kết đến WorkflowCustomers
  @HealthStatus     NVARCHAR(20) = 'GOOD',
  @StartDate        DATETIME,
  @EndDate          DATETIME,
  @Budget           DECIMAL(18,2) = NULL,
  @Description      NVARCHAR(MAX) = NULL,
  @EstimatedHours   DECIMAL(10,2) = NULL,  -- Số giờ ước tính
  @ActualHours      DECIMAL(10,2) = NULL,  -- Số giờ thực tế
  @Notes            NVARCHAR(MAX) = NULL,  -- Ghi chú dự án
  @CreatedBy        INT,
  @NewProjectId     INT OUTPUT,
  @ProjectCode      NVARCHAR(50) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @FinalClientName NVARCHAR(255) = @ClientName;
    
    -- Kiểm tra company code tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode)
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    -- Auto-fill ClientName từ CustomerId nếu có
    IF @CustomerId IS NOT NULL AND (@FinalClientName IS NULL OR @FinalClientName = '')
    BEGIN
      SELECT @FinalClientName = CustomerName FROM dbo.WorkflowCustomers WHERE Id = @CustomerId AND CompanyCode = @CompanyCode;
    END
    
    -- Sinh ProjectCode tự động (PRJ-YYYYMM-XXXX)
    DECLARE @DatePrefix NVARCHAR(6) = FORMAT(GETDATE(), 'yyyyMM');
    DECLARE @MaxSeq INT = 0;
    
    SELECT @MaxSeq = ISNULL(MAX(CAST(SUBSTRING(ProjectCode, 12, 10) AS INT)), 0)
    FROM dbo.WorkflowProjects
    WHERE CompanyCode = @CompanyCode
      AND ProjectCode LIKE 'PRJ-' + @DatePrefix + '-%';
    
    SET @ProjectCode = 'PRJ-' + @DatePrefix + '-' + RIGHT('0000' + CAST(@MaxSeq + 1 AS NVARCHAR), 4);
    
    BEGIN TRANSACTION;
    
    -- Insert project với các trường mới: CustomerId, EstimatedHours, ActualHours, Notes
    INSERT INTO dbo.WorkflowProjects (
      CompanyCode, ProjectCode, ProjectName, Status, Priority,
      ProjectManagerId, OrgUnitId, ClientName, CustomerId, HealthStatus,
      StartDate, EndDate, Budget, BudgetUsed, Description,
      EstimatedHours, ActualHours, Notes,
      CreatedBy, UpdatedBy
    )
    VALUES (
      @CompanyCode, @ProjectCode, @ProjectName, @Status, @Priority,
      @ProjectManagerId, @OrgUnitId, @FinalClientName, @CustomerId, @HealthStatus,
      @StartDate, @EndDate, @Budget, 0, @Description,
      @EstimatedHours, ISNULL(@ActualHours, 0), @Notes,
      @CreatedBy, @CreatedBy
    );
    
    SET @NewProjectId = SCOPE_IDENTITY();
    
    -- Thêm PM vào members (bỏ CompanyId, chỉ dùng CompanyCode)
    INSERT INTO dbo.WorkflowProjectMembers (
      CompanyCode, ProjectId, UserId, Role, Allocation, StartDate, DepId
    )
    VALUES (
      @CompanyCode, @NewProjectId, @ProjectManagerId, 'PROJECT_MANAGER', 100, @StartDate, ''
    );
    
    -- Log activity (bỏ CompanyId, chỉ dùng CompanyCode)
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
    )
    VALUES (
      @CompanyCode, @NewProjectId, 'PROJECT_CREATED', 
      N'Dự án ' + @ProjectName + N' đã được tạo', @CreatedBy, ''
    );
    
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 7. Api_Project_Update: Cập nhật dự án (log activity khi đổi status)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Project_Update') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Project_Update;
GO
CREATE PROCEDURE dbo.Api_Project_Update
  @CompanyCode         NVARCHAR(50),
  @ProjectId        INT,
  @ProjectName      NVARCHAR(255) = NULL,
  @Status           NVARCHAR(30) = NULL,
  @Priority         NVARCHAR(20) = NULL,
  @ProjectManagerId INT = NULL,
  @OrgUnitId        INT = NULL,
  @ClientName       NVARCHAR(255) = NULL,
  @CustomerId       INT = NULL,  -- Liên kết đến WorkflowCustomers
  @HealthStatus     NVARCHAR(20) = NULL,
  @StartDate        DATETIME = NULL,
  @EndDate          DATETIME = NULL,
  @Budget           DECIMAL(18,2) = NULL,
  @BudgetUsed       DECIMAL(18,2) = NULL,
  @Progress         DECIMAL(5,2) = NULL,
  @Description      NVARCHAR(MAX) = NULL,
  @EstimatedHours   DECIMAL(10,2) = NULL,  -- Số giờ ước tính
  @ActualHours      DECIMAL(10,2) = NULL,  -- Số giờ thực tế
  @Notes            NVARCHAR(MAX) = NULL,  -- Ghi chú dự án
  @UpdatedBy        INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @OldStatus NVARCHAR(30);
    DECLARE @OldProjectManagerId INT;
    DECLARE @ProjectExists BIT = 0;
    DECLARE @OldPMName NVARCHAR(255);
    DECLARE @NewPMName NVARCHAR(255);
    DECLARE @FinalClientName NVARCHAR(255) = @ClientName;
    
    -- Lấy status cũ, PM cũ
    SELECT @OldStatus = Status, @OldProjectManagerId = ProjectManagerId, @ProjectExists = 1
    FROM dbo.WorkflowProjects
    WHERE Id = @ProjectId AND CompanyCode = @CompanyCode;
    
    IF @ProjectExists = 0
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Auto-fill ClientName từ CustomerId
    IF @CustomerId IS NOT NULL
    BEGIN
      SELECT @FinalClientName = CustomerName FROM dbo.WorkflowCustomers WHERE Id = @CustomerId AND CompanyCode = @CompanyCode;
    END
    
    BEGIN TRANSACTION;
    
    -- Build dynamic UPDATE với các trường mới
    DECLARE @sql NVARCHAR(MAX) = 'UPDATE dbo.WorkflowProjects SET ';
    DECLARE @updates NVARCHAR(MAX) = '';
    
    IF @ProjectName IS NOT NULL SET @updates = @updates + 'ProjectName = @ProjectName, ';
    IF @Status IS NOT NULL SET @updates = @updates + 'Status = @Status, ';
    IF @Priority IS NOT NULL SET @updates = @updates + 'Priority = @Priority, ';
    IF @ProjectManagerId IS NOT NULL SET @updates = @updates + 'ProjectManagerId = @ProjectManagerId, ';
    IF @OrgUnitId IS NOT NULL SET @updates = @updates + 'OrgUnitId = @OrgUnitId, ';
    IF @FinalClientName IS NOT NULL SET @updates = @updates + 'ClientName = @FinalClientName, ';
    IF @CustomerId IS NOT NULL SET @updates = @updates + 'CustomerId = @CustomerId, ';
    IF @HealthStatus IS NOT NULL SET @updates = @updates + 'HealthStatus = @HealthStatus, ';
    IF @StartDate IS NOT NULL SET @updates = @updates + 'StartDate = @StartDate, ';
    IF @EndDate IS NOT NULL SET @updates = @updates + 'EndDate = @EndDate, ';
    IF @Budget IS NOT NULL SET @updates = @updates + 'Budget = @Budget, ';
    IF @BudgetUsed IS NOT NULL SET @updates = @updates + 'BudgetUsed = @BudgetUsed, ';
    IF @Progress IS NOT NULL SET @updates = @updates + 'Progress = @Progress, ';
    IF @Description IS NOT NULL SET @updates = @updates + 'Description = @Description, ';
    IF @EstimatedHours IS NOT NULL SET @updates = @updates + 'EstimatedHours = @EstimatedHours, ';
    IF @ActualHours IS NOT NULL SET @updates = @updates + 'ActualHours = @ActualHours, ';
    IF @Notes IS NOT NULL SET @updates = @updates + 'Notes = @Notes, ';
    
    SET @updates = @updates + 'UpdatedBy = @UpdatedBy, user_id2 = @UpdatedBy, datetime2 = SYSDATETIME() ';
    SET @sql = @sql + @updates + 'WHERE Id = @ProjectId AND CompanyCode = @CompanyCode;';
    
    EXEC sp_executesql @sql,
      N'@ProjectId INT, @CompanyCode NVARCHAR(50), @ProjectName NVARCHAR(255), @Status NVARCHAR(30), @Priority NVARCHAR(20), @ProjectManagerId INT, @OrgUnitId INT, @FinalClientName NVARCHAR(255), @CustomerId INT, @HealthStatus NVARCHAR(20), @StartDate DATETIME, @EndDate DATETIME, @Budget DECIMAL(18,2), @BudgetUsed DECIMAL(18,2), @Progress DECIMAL(5,2), @Description NVARCHAR(MAX), @EstimatedHours DECIMAL(10,2), @ActualHours DECIMAL(10,2), @Notes NVARCHAR(MAX), @UpdatedBy INT',
      @ProjectId, @CompanyCode, @ProjectName, @Status, @Priority, @ProjectManagerId, @OrgUnitId, @FinalClientName, @CustomerId, @HealthStatus, @StartDate, @EndDate, @Budget, @BudgetUsed, @Progress, @Description, @EstimatedHours, @ActualHours, @Notes, @UpdatedBy;
    
    -- XỬ LÝ THAY ĐỔI PM CHÍNH
    IF @ProjectManagerId IS NOT NULL AND @ProjectManagerId <> @OldProjectManagerId
    BEGIN
      -- Lấy tên PM cũ và PM mới
      SELECT @OldPMName = FullName FROM dbo.WorkflowUsers WHERE Id = @OldProjectManagerId;
      SELECT @NewPMName = FullName FROM dbo.WorkflowUsers WHERE Id = @ProjectManagerId;
      
      -- XÓA PM CŨ: Xóa PM cũ khỏi WorkflowProjectMembers (nếu có role PROJECT_MANAGER)
      UPDATE dbo.WorkflowProjectMembers
      SET IsDeleted = 1, RecordStatus = 0, datetime2 = SYSDATETIME(), user_id2 = @UpdatedBy
      WHERE ProjectId = @ProjectId 
        AND UserId = @OldProjectManagerId 
        AND (Role = 'PROJECT_MANAGER' OR Role = 'PM')
        AND IsDeleted = 0;
      
      -- PM MỚI: Kiểm tra đã có trong members chưa
      IF EXISTS (
        SELECT 1 FROM dbo.WorkflowProjectMembers 
        WHERE ProjectId = @ProjectId 
          AND UserId = @ProjectManagerId 
          AND IsDeleted = 0
      )
      BEGIN
        -- PM MỚI đã có (MEMBER hoặc CO-PM) => SWITCH ROLE sang PROJECT_MANAGER
        UPDATE dbo.WorkflowProjectMembers
        SET Role = 'PROJECT_MANAGER', 
            Allocation = 100,
            datetime2 = SYSDATETIME(), 
            user_id2 = @UpdatedBy
        WHERE ProjectId = @ProjectId 
          AND UserId = @ProjectManagerId 
          AND IsDeleted = 0;
      END
      ELSE
      BEGIN
        -- PM MỚI chưa có => THÊM MỚI với role PROJECT_MANAGER
        INSERT INTO dbo.WorkflowProjectMembers (
          CompanyCode, ProjectId, UserId, Role, Allocation, StartDate, EndDate, DepId
        )
        VALUES (
          @CompanyCode, @ProjectId, @ProjectManagerId, 'PROJECT_MANAGER', 100, 
          ISNULL(@StartDate, GETDATE()), NULL, ''
        );
      END
      
      -- Log activity khi thay đổi PM
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'PM_CHANGED',
        N'PM chính đã được thay đổi từ ' + ISNULL(@OldPMName, N'') + N' sang ' + ISNULL(@NewPMName, N''), 
        @UpdatedBy, ''
      );
    END
    
    -- Log activity nếu status thay đổi
    IF @Status IS NOT NULL AND @Status <> @OldStatus
    BEGIN
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'STATUS_CHANGED',
        N'Trạng thái dự án đã thay đổi từ ' + @OldStatus + N' sang ' + @Status, @UpdatedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 8. Api_Project_Delete: Xóa mềm dự án (log activity)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Project_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Project_Delete;
GO
CREATE PROCEDURE dbo.Api_Project_Delete
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT,
  @DeletedBy INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @ProjectName NVARCHAR(255);
    DECLARE @ProjectExists BIT = 0;
    
    SELECT @ProjectName = ProjectName, @ProjectExists = 1
    FROM dbo.WorkflowProjects
    WHERE Id = @ProjectId AND CompanyCode = @CompanyCode;
    
    IF @ProjectExists = 0
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Xóa mềm
    UPDATE dbo.WorkflowProjects
    SET IsDeleted = 1, datetime2 = SYSDATETIME(), UpdatedBy = @DeletedBy, user_id2 = @DeletedBy
    WHERE Id = @ProjectId AND CompanyCode = @CompanyCode;
    
    -- Log activity
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, 'PROJECT_DELETED',
      N'Dự án ' + @ProjectName + N' đã bị xóa', @DeletedBy, ''
    );
    
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 9. Api_ProjectMember_Add: Thêm thành viên (upsert)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectMember_Add') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectMember_Add;
GO
CREATE PROCEDURE dbo.Api_ProjectMember_Add
  @CompanyCode    NVARCHAR(50),
  @ProjectId   INT,
  @UserId      INT,
  @Role        NVARCHAR(50) = 'MEMBER',
  @Allocation  DECIMAL(5,2) = 100,
  @StartDate   DATETIME,
  @EndDate     DATETIME = NULL,
  @CreatedBy   INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @ProjectManagerId INT;
    DECLARE @ProjectExists BIT = 0;
    
    -- Kiểm tra company code tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode)
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    -- Lấy ProjectManagerId
    SELECT @ProjectManagerId = ProjectManagerId, @ProjectExists = 1
    FROM dbo.WorkflowProjects
    WHERE Id = @ProjectId AND CompanyCode = @CompanyCode;
    
    IF @ProjectExists = 0
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- VALIDATION: Không cho phép thêm PROJECT_MANAGER (PM chính đã được set trong ProjectManagerId)
    IF @Role = 'PROJECT_MANAGER' OR @Role = 'PM'
    BEGIN
      SELECT N'Không thể thêm PM chính. PM chính đã được thiết lập khi tạo dự án (ProjectManagerId). Chỉ có thể thêm CO-PM (CO_PROJECT_MANAGER) hoặc thành viên (MEMBER).' as message, 400 as status;
      RETURN;
    END
    
    -- VALIDATION: Nếu thêm CO_PROJECT_MANAGER, kiểm tra xem user có phải là PM chính không
    IF (@Role = 'CO_PROJECT_MANAGER' OR @Role = 'CO_PM') AND @UserId = @ProjectManagerId
    BEGIN
      SELECT N'Người dùng này đã là PM chính của dự án. Không thể thêm làm CO-PM.' as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra thành viên đã tồn tại chưa
    IF EXISTS (
      SELECT 1 
      FROM dbo.WorkflowProjectMembers 
      WHERE ProjectId = @ProjectId 
        AND UserId = @UserId 
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Thành viên đã tồn tại trong dự án' as message, 400 as status;
      RETURN;
    END
    
    -- Nếu StartDate NULL thì lấy từ project
    IF @StartDate IS NULL
      SELECT @StartDate = StartDate 
      FROM dbo.WorkflowProjects 
      WHERE Id = @ProjectId;
    
    -- Upsert (MERGE)
    MERGE dbo.WorkflowProjectMembers AS target
    USING (SELECT @ProjectId, @UserId) AS source (ProjectId, UserId)
    ON target.ProjectId = source.ProjectId AND target.UserId = source.UserId
    WHEN MATCHED THEN
      UPDATE SET
        Role = @Role,
        Allocation = @Allocation,
        StartDate = @StartDate,
        EndDate = @EndDate,
        UpdatedDate = GETDATE(),
        user_id2 = @CreatedBy
    WHEN NOT MATCHED THEN
      INSERT (CompanyCode, ProjectId, UserId, Role, Allocation, StartDate, EndDate, DepId)
      VALUES (@CompanyCode, @ProjectId, @UserId, @Role, @Allocation, @StartDate, @EndDate, '');
    
    -- Ghi activity log với role cụ thể
    DECLARE @UserName NVARCHAR(255);
    SELECT @UserName = FullName FROM dbo.WorkflowUsers WHERE Id = @UserId;
    
    DECLARE @RoleLabel NVARCHAR(50);
    IF @Role = 'CO_PROJECT_MANAGER' OR @Role = 'CO_PM'
      SET @RoleLabel = N'CO-PM';
    ELSE IF @Role = 'MEMBER'
      SET @RoleLabel = N'Thành viên';
    ELSE
      SET @RoleLabel = @Role;
    
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, 'MEMBER_ADDED',
      N'Thành viên ' + ISNULL(@UserName, N'') + N' đã được thêm vào dự án với vai trò ' + @RoleLabel, @CreatedBy, ''
    );
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 10. Api_ProjectMember_Remove: Xóa thành viên
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectMember_Remove') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectMember_Remove;
GO
CREATE PROCEDURE dbo.Api_ProjectMember_Remove
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT,
  @UserId    INT,
  @DeletedBy INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    UPDATE dbo.WorkflowProjectMembers
    SET RecordStatus = 0, UpdatedDate = GETDATE(), user_id2 = @DeletedBy
    WHERE ProjectId = @ProjectId
      AND UserId = @UserId
      AND CompanyCode = @CompanyCode;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 11. Api_ProjectMember_List: Danh sách thành viên
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectMember_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectMember_List;
GO
CREATE PROCEDURE dbo.Api_ProjectMember_List
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    SELECT 
      m.Id,
      m.UserId,
      u.FullName,
      u.Email,
      u.Phone,
      u.Title,
      m.Role,
      m.Allocation,
      m.StartDate,
      m.EndDate,
      m.JoinedDate
    FROM dbo.WorkflowProjectMembers m
    INNER JOIN dbo.WorkflowUsers u ON m.UserId = u.Id
    WHERE m.ProjectId = @ProjectId
      AND m.CompanyCode = @CompanyCode
      AND m.RecordStatus = 1
    ORDER BY m.JoinedDate DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 12. Api_ProjectDocument_Upload: Upload tài liệu
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDocument_Upload') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDocument_Upload;
GO
CREATE PROCEDURE dbo.Api_ProjectDocument_Upload
  @CompanyCode    NVARCHAR(50),
  @ProjectId   INT,
  @FileName    NVARCHAR(255),
  @FilePath    NVARCHAR(500),
  @FileType    NVARCHAR(20) = NULL,
  @FileSize    BIGINT,
  @Tags        NVARCHAR(255) = NULL,
  @UploadedBy  INT,
  @NewDocumentId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @ProjectExists BIT = 0;
    
    SELECT @ProjectExists = 1
    FROM dbo.WorkflowProjects
    WHERE Id = @ProjectId AND CompanyCode = @CompanyCode AND IsDeleted = 0;
    
    IF @ProjectExists = 0
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    INSERT INTO dbo.WorkflowProjectDocuments (
      CompanyCode, ProjectId, FileName, FilePath, FileType, FileSize, Tags, UploadedBy, user_id0, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, @FileName, @FilePath, @FileType, @FileSize, @Tags, @UploadedBy, @UploadedBy, ''
    );
    
    SET @NewDocumentId = SCOPE_IDENTITY();
    
    -- Log activity vào WorkflowProjectActivities
    DECLARE @FileSizeDesc NVARCHAR(50) = N'';
    IF @FileSize IS NOT NULL
    BEGIN
      IF @FileSize < 1024
        SET @FileSizeDesc = CAST(@FileSize AS NVARCHAR(20)) + N' bytes';
      ELSE IF @FileSize < 1048576
        SET @FileSizeDesc = CAST(CAST(CAST(@FileSize AS FLOAT) / 1024.0 AS DECIMAL(10,2)) AS NVARCHAR(20)) + N' KB';
      ELSE
        SET @FileSizeDesc = CAST(CAST(CAST(@FileSize AS FLOAT) / 1048576.0 AS DECIMAL(10,2)) AS NVARCHAR(20)) + N' MB';
    END
    
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, 'DOCUMENT_UPLOADED',
      N'Đã tải lên tài liệu: ' + @FileName + 
      CASE 
        WHEN @FileSizeDesc <> N'' THEN N' (' + @FileSizeDesc + N')'
        ELSE N''
      END,
      @UploadedBy, ''
    );
    
    COMMIT TRANSACTION;
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
-- 13. Api_ProjectDocument_Delete: Xóa tài liệu
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDocument_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDocument_Delete;
GO
CREATE PROCEDURE dbo.Api_ProjectDocument_Delete
  @CompanyCode    NVARCHAR(50),
  @DocumentId     INT,
  @DeletedBy      INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Lấy ProjectId và FileName trước khi xóa (QUAN TRỌNG: Phải lấy TRƯỚC khi UPDATE)
    DECLARE @ProjectId INT;
    DECLARE @FileName NVARCHAR(255);
    
    SELECT 
      @ProjectId = ProjectId, 
      @FileName = FileName
    FROM dbo.WorkflowProjectDocuments
    WHERE Id = @DocumentId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0
      AND RecordStatus = 1;
    
    -- Kiểm tra document tồn tại
    IF @ProjectId IS NULL
    BEGIN
      SELECT N'Không tìm thấy tài liệu với ID: ' + CAST(@DocumentId AS NVARCHAR) + N' hoặc tài liệu đã bị xóa' as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra project tồn tại và chưa bị xóa
    IF NOT EXISTS (
      SELECT 1 
      FROM dbo.WorkflowProjects 
      WHERE Id = @ProjectId 
        AND CompanyCode = @CompanyCode 
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) + N' hoặc dự án đã bị xóa' as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Soft delete document
    UPDATE dbo.WorkflowProjectDocuments
    SET 
      IsDeleted = 1, 
      RecordStatus = 0, 
      UpdatedDate = GETDATE(), 
      datetime2 = SYSDATETIME(),
      user_id2 = @DeletedBy
    WHERE Id = @DocumentId
      AND CompanyCode = @CompanyCode;
    
    -- Log activity vào WorkflowProjectActivities (SAU khi xóa thành công)
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, 
      ProjectId, 
      ActivityType, 
      Description, 
      TriggeredBy, 
      DepId
    )
    VALUES (
      @CompanyCode, 
      @ProjectId, 
      'DOCUMENT_DELETED',
      N'Đã xóa tài liệu: ' + ISNULL(@FileName, N'Document #' + CAST(@DocumentId AS NVARCHAR(20))),
      @DeletedBy, 
      ''
    );
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã xóa để frontend có thể hiển thị
    SELECT 
      @DocumentId AS DocumentId,
      @ProjectId AS ProjectId,
      @FileName AS FileName,
      'DELETED' AS Status;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 
      ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 14. Api_ProjectDocument_List: Danh sách tài liệu
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDocument_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDocument_List;
GO
CREATE PROCEDURE dbo.Api_ProjectDocument_List
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    SELECT 
      d.Id,
      d.FileName,
      d.FilePath,
      d.FileType,
      d.FileSize,
      d.Tags,
      d.UploadedDate,
      u.FullName AS UploadedByName
    FROM dbo.WorkflowProjectDocuments d
    INNER JOIN dbo.WorkflowUsers u ON d.UploadedBy = u.Id
    WHERE d.ProjectId = @ProjectId
      AND d.CompanyCode = @CompanyCode
      AND d.IsDeleted = 0
      AND d.RecordStatus = 1
    ORDER BY d.UploadedDate DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 15. Api_ProjectDocument_Download: Lấy thông tin document để download
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDocument_Download') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDocument_Download;
GO
CREATE PROCEDURE dbo.Api_ProjectDocument_Download
  @CompanyCode    NVARCHAR(50),
  @DocumentId    INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Lấy thông tin document
    SELECT 
      d.Id AS DocumentId,
      d.ProjectId,
      d.FileName,
      d.FilePath,
      d.FileType,
      d.FileSize,
      d.Tags,
      d.UploadedBy,
      d.UploadedDate,
      u.FullName AS UploadedByName,
      p.ProjectName,
      p.ProjectCode
    FROM dbo.WorkflowProjectDocuments d
    INNER JOIN dbo.WorkflowProjects p ON d.ProjectId = p.Id AND d.CompanyCode = p.CompanyCode
    LEFT JOIN dbo.WorkflowUsers u ON d.UploadedBy = u.Id
    WHERE d.Id = @DocumentId
      AND d.CompanyCode = @CompanyCode
      AND d.IsDeleted = 0
      AND d.RecordStatus = 1
      AND p.IsDeleted = 0;
    
    -- Nếu không tìm thấy document
    IF @@ROWCOUNT = 0
    BEGIN
      SELECT N'Không tìm thấy tài liệu với ID: ' + CAST(@DocumentId AS NVARCHAR) + N' hoặc tài liệu đã bị xóa' as message, 400 as status;
      RETURN;
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
-- 16. Api_ProjectPost_Create: Tạo bài đăng (với logging)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectPost_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectPost_Create;
GO
CREATE PROCEDURE dbo.Api_ProjectPost_Create
  @CompanyCode   NVARCHAR(50),
  @ProjectId     INT,
  @Content       NVARCHAR(MAX),
  @IsPinned      BIT = 0,
  @MentionsJson  NVARCHAR(MAX) = NULL,
  @CreatedBy     INT,
  @NewPostId     INT = NULL OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra project tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowProjects WHERE Id = @ProjectId AND CompanyCode = @CompanyCode AND IsDeleted = 0)
    BEGIN
      SELECT N'Không tìm thấy dự án với ID: ' + CAST(@ProjectId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Insert post
    INSERT INTO dbo.WorkflowProjectPosts (
      CompanyCode, ProjectId, Content, IsPinned, MentionsJson, CreatedBy, user_id0, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, @Content, @IsPinned, @MentionsJson, @CreatedBy, @CreatedBy, ''
    );
    
    SET @NewPostId = SCOPE_IDENTITY();
    
    -- Log activity: POST_CREATED
    INSERT INTO dbo.WorkflowProjectActivities (
      CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
    )
    VALUES (
      @CompanyCode, @ProjectId, 'POST_CREATED',
      N'Đã tạo bài viết mới: ' + LEFT(@Content, 100) + CASE WHEN LEN(@Content) > 100 THEN '...' ELSE '' END,
      @CreatedBy, ''
    );
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 16. Api_ProjectPost_List: Danh sách bài đăng
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectPost_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectPost_List;
GO
CREATE PROCEDURE dbo.Api_ProjectPost_List
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT,
  @PageIndex INT = 1,
  @PageSize  INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    SELECT 
      p.Id,
      p.Content,
      p.IsPinned,
      p.MentionsJson,
      p.CreatedDate,
      u.FullName AS CreatedByName,
      u.Email AS CreatedByEmail
    FROM dbo.WorkflowProjectPosts p
    INNER JOIN dbo.WorkflowUsers u ON p.CreatedBy = u.Id
    WHERE p.ProjectId = @ProjectId
      AND p.CompanyCode = @CompanyCode
      AND p.RecordStatus = 1
      AND p.IsDeleted = 0
    ORDER BY p.IsPinned DESC, p.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowProjectPosts
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND RecordStatus = 1
      AND IsDeleted = 0;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 18. Api_ProjectActivities_Load: Lấy danh sách activities với filter và pagination
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectActivities_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectActivities_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectActivities_Load
  @CompanyCode  NVARCHAR(50),
  @ProjectId    INT,
  @PageIndex    INT = 1,
  @PageSize     INT = 50,
  @ActivityType NVARCHAR(50) = NULL,  -- Filter theo loại hoạt động
  @TriggeredBy  INT = NULL,            -- Filter theo người thực hiện
  @StartDate    DATETIME = NULL,       -- Filter từ ngày
  @EndDate      DATETIME = NULL,       -- Filter đến ngày
  @SearchKey    NVARCHAR(255) = NULL   -- Tìm kiếm trong Description
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    -- Danh sách activities với filter
    SELECT 
      a.Id,
      a.ActivityType,
      a.Description,
      a.datetime0 AS CreatedDate,
      a.TriggeredBy,
      u.FullName AS TriggeredByName,
      u.Email AS TriggeredByEmail
    FROM dbo.WorkflowProjectActivities a
    INNER JOIN dbo.WorkflowUsers u ON a.TriggeredBy = u.Id
    WHERE a.ProjectId = @ProjectId
      AND a.CompanyCode = @CompanyCode
      AND a.RecordStatus = 1
      AND a.IsDeleted = 0
      AND (@ActivityType IS NULL OR a.ActivityType = @ActivityType)
      AND (@TriggeredBy IS NULL OR a.TriggeredBy = @TriggeredBy)
      AND (@StartDate IS NULL OR a.datetime0 >= @StartDate)
      AND (@EndDate IS NULL OR a.datetime0 <= @EndDate)
      AND (@SearchKey IS NULL OR a.Description LIKE '%' + @SearchKey + '%')
    ORDER BY a.datetime0 DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Tổng số bản ghi
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowProjectActivities a
    WHERE a.ProjectId = @ProjectId
      AND a.CompanyCode = @CompanyCode
      AND a.RecordStatus = 1
      AND a.IsDeleted = 0
      AND (@ActivityType IS NULL OR a.ActivityType = @ActivityType)
      AND (@TriggeredBy IS NULL OR a.TriggeredBy = @TriggeredBy)
      AND (@StartDate IS NULL OR a.datetime0 >= @StartDate)
      AND (@EndDate IS NULL OR a.datetime0 <= @EndDate)
      AND (@SearchKey IS NULL OR a.Description LIKE '%' + @SearchKey + '%');
    
    -- Thống kê theo ActivityType
    SELECT 
      a.ActivityType,
      COUNT(*) AS Count
    FROM dbo.WorkflowProjectActivities a
    WHERE a.ProjectId = @ProjectId
      AND a.CompanyCode = @CompanyCode
      AND a.RecordStatus = 1
      AND a.IsDeleted = 0
      AND (@StartDate IS NULL OR a.datetime0 >= @StartDate)
      AND (@EndDate IS NULL OR a.datetime0 <= @EndDate)
    GROUP BY a.ActivityType
    ORDER BY Count DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

