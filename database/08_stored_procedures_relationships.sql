/*
  Workflow Multi-Tenant Database - RELATIONSHIP STORED PROCEDURES
  File này bao gồm 9 stored procedures cho module Liên kết Logic:
  
  User-Project:
  - Api_UserProjects_Load: Dự án mà nhân viên tham gia
  - Api_ProjectUsers_Load: Nhân viên trong dự án (kèm thống kê tasks)
  - Api_UserProjectStats_Load: Thống kê dự án của nhân viên
  
  Task-Project:
  - Api_ProjectTasks_Load: Công việc của dự án (kèm thống kê)
  - Api_ProjectTaskStats_Load: Thống kê công việc của dự án
  - Api_UserProjectTasks_Load: Công việc của nhân viên trong dự án
  
  Dashboards:
  - Api_UserDashboard_Load: Dashboard nhân viên
  - Api_ProjectDashboard_Comprehensive: Dashboard dự án đầy đủ
  
  Search:
  - Api_Search_ProjectsAndTasks: Tìm kiếm liên module
  
  LƯU Ý:
  - Tất cả SPs đều yêu cầu @CompanyCode để filter theo công ty.
  - Các SP làm việc với Tasks sử dụng bảng phân kỳ theo tháng `WorkflowTasks_yyyymm` (không còn master/detail).
  - Các liên kết tới Tasks dùng `TaskId` (BIGINT) + tham số `@yyyymm` để xác định bảng.
  - Tất cả SPs đều có error handling (TRY-CATCH).
  - Không sử dụng CompanyId, chỉ dùng CompanyCode.
*/

------------------------------------------------------------
-- 1. Api_UserProjects_Load: Dự án mà nhân viên tham gia
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserProjects_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserProjects_Load;
GO
CREATE PROCEDURE dbo.Api_UserProjects_Load
  @CompanyCode  NVARCHAR(50),
  @UserId    INT,
  @Status    NVARCHAR(30) = NULL,
  @PageIndex INT = 1,
  @PageSize  INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
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
      m.Role AS UserRole,
      m.Allocation,
      m.JoinedDate,
      pm.FullName AS ProjectManagerName
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowProjectMembers m ON p.Id = m.ProjectId
    INNER JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    WHERE m.UserId = @UserId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND m.RecordStatus = 1
      AND (@Status IS NULL OR p.Status = @Status)
    ORDER BY p.CreatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowProjectMembers m ON p.Id = m.ProjectId
    WHERE m.UserId = @UserId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND m.RecordStatus = 1
      AND (@Status IS NULL OR p.Status = @Status);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 2. Api_ProjectUsers_Load: Nhân viên trong dự án (kèm thống kê tasks)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectUsers_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectUsers_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectUsers_Load
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT,
  @yyyymm    CHAR(6) = NULL  -- Nếu NULL thì không tính tasks
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @tableDetail NVARCHAR(100);
    DECLARE @sql NVARCHAR(MAX);
    
    IF @yyyymm IS NOT NULL
    BEGIN
      SET @tableDetail = 'WorkflowTasksDetail_' + @yyyymm;
      
      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableDetail)
      BEGIN
        SET @yyyymm = NULL;  -- Bỏ qua nếu bảng không tồn tại
      END
    END
    
    IF @yyyymm IS NOT NULL
    BEGIN
      -- Có thống kê tasks
      SET @sql = N'
      SELECT 
        u.Id AS UserId,
        u.FullName,
        u.Email,
        u.Phone,
        u.Title,
        u.AvatarUrl,
        m.Role,
        m.Allocation,
        m.StartDate,
        m.EndDate,
        m.JoinedDate,
        (SELECT COUNT(*) FROM dbo.' + QUOTENAME(@tableDetail) + ' d
         INNER JOIN dbo.WorkflowTasksMaster_' + @yyyymm + ' m ON d.TaskMasterId = m.Id
         WHERE m.ProjectId = @ProjectId AND d.AssignedTo = u.Id AND d.RecordStatus = 1) AS TaskCount,
        (SELECT COUNT(*) FROM dbo.' + QUOTENAME(@tableDetail) + ' d
         INNER JOIN dbo.WorkflowTasksMaster_' + @yyyymm + ' m ON d.TaskMasterId = m.Id
         WHERE m.ProjectId = @ProjectId AND d.AssignedTo = u.Id AND d.Status = ''COMPLETED'' AND d.RecordStatus = 1) AS CompletedTaskCount
      FROM dbo.WorkflowProjectMembers m
      INNER JOIN dbo.WorkflowUsers u ON m.UserId = u.Id
      WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
        AND m.RecordStatus = 1
      ORDER BY m.JoinedDate DESC;';
      
      EXEC sp_executesql @sql, N'@CompanyCode NVARCHAR(50), @ProjectId INT, @yyyymm CHAR(6)', @CompanyCode, @ProjectId, @yyyymm;
    END
    ELSE
    BEGIN
      -- Không có thống kê tasks
      SELECT 
        u.Id AS UserId,
        u.FullName,
        u.Email,
        u.Phone,
        u.Title,
        u.AvatarUrl,
        m.Role,
        m.Allocation,
        m.StartDate,
        m.EndDate,
        m.JoinedDate,
        0 AS TaskCount,
        0 AS CompletedTaskCount
      FROM dbo.WorkflowProjectMembers m
      INNER JOIN dbo.WorkflowUsers u ON m.UserId = u.Id
      WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
        AND m.RecordStatus = 1
      ORDER BY m.JoinedDate DESC;
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
-- 3. Api_UserProjectStats_Load: Thống kê dự án của nhân viên
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserProjectStats_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserProjectStats_Load;
GO
CREATE PROCEDURE dbo.Api_UserProjectStats_Load
  @CompanyCode NVARCHAR(50),
  @UserId   INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    SELECT 
      COUNT(DISTINCT p.Id) AS TotalProjects,
      SUM(CASE WHEN p.Status = 'ACTIVE' THEN 1 ELSE 0 END) AS ActiveProjects,
      SUM(CASE WHEN p.Status = 'COMPLETED' THEN 1 ELSE 0 END) AS CompletedProjects,
      SUM(CASE WHEN m.Role = 'PROJECT_MANAGER' THEN 1 ELSE 0 END) AS ManagedProjects,
      AVG(p.Progress) AS AvgProjectProgress,
      SUM(CASE WHEN p.EndDate < GETDATE() AND p.Status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 ELSE 0 END) AS OverdueProjects
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowProjectMembers m ON p.Id = m.ProjectId
    WHERE m.UserId = @UserId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND m.RecordStatus = 1;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 4. Api_ProjectTasks_Load: Công việc của dự án (kèm thống kê)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectTasks_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectTasks_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectTasks_Load
  @CompanyCode    NVARCHAR(50),
  @yyyymm      CHAR(6),
  @ProjectId   INT,
  @Status      NVARCHAR(30) = NULL,
  @PageIndex   INT = 1,
  @PageSize    INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    DECLARE @tableMaster NVARCHAR(100) = 'WorkflowTasksMaster_' + @yyyymm;
    DECLARE @tableDetail NVARCHAR(100) = 'WorkflowTasksDetail_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableMaster)
    BEGIN
      SELECT N'Bảng Master ' + @tableMaster + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Danh sách tasks
    SET @sql = N'
    SELECT 
      m.Id AS TaskMasterId,
      m.TaskCode,
      m.TaskName,
      d.Status,
      d.Priority,
      d.Progress,
      d.DueDate,
      d.CompletedDate,
      d.AssignedTo,
      u.FullName AS AssignedToName,
      d.Description
    FROM dbo.' + QUOTENAME(@tableMaster) + ' m
    INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
    LEFT JOIN dbo.WorkflowUsers u ON d.AssignedTo = u.Id
    WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
      AND m.IsDeleted = 0
      AND m.RecordStatus = 1
      AND d.RecordStatus = 1
      AND (@Status IS NULL OR d.Status = @Status)
    ORDER BY d.DueDate ASC, d.Priority DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @Status NVARCHAR(30), @Offset INT, @PageSize INT',
      @CompanyCode, @ProjectId, @Status, @Offset, @PageSize;
    
    -- Tổng số
    SET @sql = N'
    SELECT COUNT(*) AS TotalCount
    FROM dbo.' + QUOTENAME(@tableMaster) + ' m
    INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
    WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
      AND m.IsDeleted = 0
      AND m.RecordStatus = 1
      AND d.RecordStatus = 1
      AND (@Status IS NULL OR d.Status = @Status);';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @Status NVARCHAR(30)',
      @CompanyCode, @ProjectId, @Status;
    
    -- Thống kê
    SET @sql = N'
    SELECT 
      COUNT(*) AS TotalTasks,
      SUM(CASE WHEN d.Status = ''PENDING'' THEN 1 ELSE 0 END) AS PendingTasks,
      SUM(CASE WHEN d.Status = ''IN_PROGRESS'' THEN 1 ELSE 0 END) AS InProgressTasks,
      SUM(CASE WHEN d.Status = ''COMPLETED'' THEN 1 ELSE 0 END) AS CompletedTasks,
      AVG(d.Progress) AS AvgProgress,
      SUM(CASE WHEN d.DueDate < GETDATE() AND d.Status <> ''COMPLETED'' THEN 1 ELSE 0 END) AS OverdueTasks
    FROM dbo.' + QUOTENAME(@tableMaster) + ' m
    INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
    WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
      AND m.IsDeleted = 0
      AND m.RecordStatus = 1
      AND d.RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT',
      @CompanyCode, @ProjectId;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 5. Api_ProjectTaskStats_Load: Thống kê công việc của dự án
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectTaskStats_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectTaskStats_Load;
GO
CREATE PROCEDURE dbo.Api_ProjectTaskStats_Load
  @CompanyCode  NVARCHAR(50),
  @yyyymm    CHAR(6),
  @ProjectId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @tableMaster NVARCHAR(100) = 'WorkflowTasksMaster_' + @yyyymm;
    DECLARE @tableDetail NVARCHAR(100) = 'WorkflowTasksDetail_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableMaster)
    BEGIN
      SELECT N'Bảng Master ' + @tableMaster + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    SET @sql = N'
    SELECT 
      COUNT(*) AS TotalTasks,
      SUM(CASE WHEN d.Status = ''PENDING'' THEN 1 ELSE 0 END) AS PendingTasks,
      SUM(CASE WHEN d.Status = ''IN_PROGRESS'' THEN 1 ELSE 0 END) AS InProgressTasks,
      SUM(CASE WHEN d.Status = ''COMPLETED'' THEN 1 ELSE 0 END) AS CompletedTasks,
      SUM(CASE WHEN d.Status = ''CANCELLED'' THEN 1 ELSE 0 END) AS CancelledTasks,
      AVG(d.Progress) AS AvgProgress,
      SUM(d.EstimatedHours) AS TotalEstimatedHours,
      SUM(d.ActualHours) AS TotalActualHours,
      SUM(CASE WHEN d.DueDate < GETDATE() AND d.Status <> ''COMPLETED'' THEN 1 ELSE 0 END) AS OverdueTasks,
      SUM(CASE WHEN d.Priority = ''HIGH'' THEN 1 ELSE 0 END) AS HighPriorityTasks,
      SUM(CASE WHEN d.Priority = ''MEDIUM'' THEN 1 ELSE 0 END) AS MediumPriorityTasks,
      SUM(CASE WHEN d.Priority = ''LOW'' THEN 1 ELSE 0 END) AS LowPriorityTasks
    FROM dbo.' + QUOTENAME(@tableMaster) + ' m
    INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
    WHERE m.ProjectId = @ProjectId
        AND m.CompanyCode = @CompanyCode
      AND m.IsDeleted = 0
      AND m.RecordStatus = 1
      AND d.RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT',
      @CompanyCode, @ProjectId;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 6. Api_UserProjectTasks_Load: Công việc của nhân viên trong dự án
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserProjectTasks_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserProjectTasks_Load;
GO
CREATE PROCEDURE dbo.Api_UserProjectTasks_Load
  @CompanyCode    NVARCHAR(50),
  @yyyymm         CHAR(6),
  @ProjectId      INT,
  @UserId         INT,
  @Status         NVARCHAR(30) = NULL,
  @PageIndex      INT = 1,
  @PageSize       INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    -- Kiểm tra bảng tồn tại
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại! Vui lòng tạo bảng trước.' as message, 400 as status;
      RETURN;
    END
    
    -- Danh sách tasks với pagination
    SET @sql = N'
    SELECT 
      t.Id AS TaskId,
      t.TaskCode,
      t.TaskName,
      t.ProjectId,
      p.ProjectName,
      p.ProjectCode,
      t.Status,
      t.Priority,
      t.Mode,
      t.Category,
      t.Progress,
      t.StartDate,
      t.EndDate,
      t.DueDate,
      t.CompletedDate,
      t.AssignedBy,
      t.AssignedTo,
      t.ReviewerId,
      t.Description,
      t.EstimatedHours,
      t.ActualHours,
      u1.FullName AS AssignedByName,
      u1.Email AS AssignedByEmail,
      u2.FullName AS AssignedToName,
      u2.Email AS AssignedToEmail,
      u3.FullName AS ReviewerName,
      u3.Email AS ReviewerEmail,
      t.datetime0 AS CreatedDate,
      t.datetime2 AS UpdatedDate
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    LEFT JOIN dbo.WorkflowUsers u1 ON t.AssignedBy = u1.Id
    LEFT JOIN dbo.WorkflowUsers u2 ON t.AssignedTo = u2.Id
    LEFT JOIN dbo.WorkflowUsers u3 ON t.ReviewerId = u3.Id
    LEFT JOIN dbo.WorkflowProjects p ON t.ProjectId = p.Id
    WHERE t.CompanyCode = @CompanyCode
      AND t.ProjectId = @ProjectId
      AND t.AssignedTo = @UserId
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@Status IS NULL OR t.Status = @Status)
    ORDER BY COALESCE(t.datetime2, t.datetime0) DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @UserId INT, @Status NVARCHAR(30), @Offset INT, @PageSize INT',
      @CompanyCode, @ProjectId, @UserId, @Status, @Offset, @PageSize;
    
    -- Tổng số bản ghi
    SET @sql = N'
    SELECT COUNT(*) AS TotalCount
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    WHERE t.CompanyCode = @CompanyCode
      AND t.ProjectId = @ProjectId
      AND t.AssignedTo = @UserId
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@Status IS NULL OR t.Status = @Status);';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @UserId INT, @Status NVARCHAR(30)',
      @CompanyCode, @ProjectId, @UserId, @Status;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 7. Api_UserDashboard_Load: Dashboard nhân viên
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserDashboard_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserDashboard_Load;
GO
CREATE PROCEDURE dbo.Api_UserDashboard_Load
  @CompanyCode NVARCHAR(50),
  @UserId   INT,
  @yyyymm   CHAR(6) = NULL  -- Nếu NULL thì không tính tasks
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Thông tin user
    SELECT 
      Id, FullName, Email, Phone, Title, AvatarUrl, Status
    FROM dbo.WorkflowUsers
    WHERE Id = @UserId AND CompanyCode = @CompanyCode;
    
    -- Thống kê projects
    SELECT 
      COUNT(DISTINCT p.Id) AS TotalProjects,
      SUM(CASE WHEN p.Status = 'ACTIVE' THEN 1 ELSE 0 END) AS ActiveProjects,
      SUM(CASE WHEN m.Role = 'PROJECT_MANAGER' THEN 1 ELSE 0 END) AS ManagedProjects
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowProjectMembers m ON p.Id = m.ProjectId
    WHERE m.UserId = @UserId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND m.RecordStatus = 1;
    
    -- Thống kê tasks (nếu có @yyyymm)
    IF @yyyymm IS NOT NULL
    BEGIN
      DECLARE @tableMaster NVARCHAR(100) = 'WorkflowTasksMaster_' + @yyyymm;
      DECLARE @tableDetail NVARCHAR(100) = 'WorkflowTasksDetail_' + @yyyymm;
      DECLARE @sql NVARCHAR(MAX);
      
      IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableMaster)
      BEGIN
        SET @sql = N'
        SELECT 
          COUNT(*) AS TotalTasks,
          SUM(CASE WHEN d.Status = ''PENDING'' THEN 1 ELSE 0 END) AS PendingTasks,
          SUM(CASE WHEN d.Status = ''IN_PROGRESS'' THEN 1 ELSE 0 END) AS InProgressTasks,
          SUM(CASE WHEN d.Status = ''COMPLETED'' THEN 1 ELSE 0 END) AS CompletedTasks,
          SUM(CASE WHEN d.DueDate < GETDATE() AND d.Status <> ''COMPLETED'' THEN 1 ELSE 0 END) AS OverdueTasks,
          AVG(d.Progress) AS AvgProgress
        FROM dbo.' + QUOTENAME(@tableMaster) + ' m
        INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
        WHERE d.AssignedTo = @UserId
          AND m.CompanyCode = @CompanyCode
          AND m.IsDeleted = 0
          AND m.RecordStatus = 1
          AND d.RecordStatus = 1;';
        
        EXEC sp_executesql @sql,
          N'@CompanyCode NVARCHAR(50), @UserId INT',
          @CompanyCode, @UserId;
      END
    END
    
    -- Projects gần đây (5 projects)
    SELECT TOP 5
      p.Id, p.ProjectCode, p.ProjectName, p.Status, p.Progress,
      m.Role AS UserRole
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowProjectMembers m ON p.Id = m.ProjectId
    WHERE m.UserId = @UserId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND m.RecordStatus = 1
    ORDER BY p.UpdatedDate DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 8. Api_ProjectDashboard_Comprehensive: Dashboard dự án đầy đủ
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_ProjectDashboard_Comprehensive') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_ProjectDashboard_Comprehensive;
GO
CREATE PROCEDURE dbo.Api_ProjectDashboard_Comprehensive
  @CompanyCode  NVARCHAR(50),
  @ProjectId INT,
  @yyyymm    CHAR(6) = NULL  -- Nếu NULL thì không tính tasks
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Thông tin project
    SELECT 
      p.*,
      pm.FullName AS ProjectManagerName,
      ou.UnitName AS OrgUnitName
    FROM dbo.WorkflowProjects p
    INNER JOIN dbo.WorkflowUsers pm ON p.ProjectManagerId = pm.Id
    INNER JOIN dbo.WorkflowOrgUnits ou ON p.OrgUnitId = ou.Id
    WHERE p.Id = @ProjectId
      AND p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1;
    
    -- Thống kê members
    SELECT 
      COUNT(*) AS TotalMembers,
      COUNT(DISTINCT Role) AS RoleCount
    FROM dbo.WorkflowProjectMembers
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND RecordStatus = 1;
    
    -- Thống kê documents
    SELECT 
      COUNT(*) AS TotalDocuments,
      SUM(FileSize) AS TotalFileSize
    FROM dbo.WorkflowProjectDocuments
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0
      AND RecordStatus = 1;
    
    -- Thống kê posts
    SELECT COUNT(*) AS TotalPosts
    FROM dbo.WorkflowProjectPosts
    WHERE ProjectId = @ProjectId
      AND CompanyCode = @CompanyCode
      AND RecordStatus = 1;
    
    -- Thống kê tasks (nếu có @yyyymm)
    IF @yyyymm IS NOT NULL
    BEGIN
      DECLARE @tableMaster NVARCHAR(100) = 'WorkflowTasksMaster_' + @yyyymm;
      DECLARE @tableDetail NVARCHAR(100) = 'WorkflowTasksDetail_' + @yyyymm;
      DECLARE @sql NVARCHAR(MAX);
      
      IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableMaster)
      BEGIN
        SET @sql = N'
        SELECT 
          COUNT(*) AS TotalTasks,
          SUM(CASE WHEN d.Status = ''PENDING'' THEN 1 ELSE 0 END) AS PendingTasks,
          SUM(CASE WHEN d.Status = ''IN_PROGRESS'' THEN 1 ELSE 0 END) AS InProgressTasks,
          SUM(CASE WHEN d.Status = ''COMPLETED'' THEN 1 ELSE 0 END) AS CompletedTasks,
          AVG(d.Progress) AS AvgProgress,
          SUM(CASE WHEN d.DueDate < GETDATE() AND d.Status <> ''COMPLETED'' THEN 1 ELSE 0 END) AS OverdueTasks
        FROM dbo.' + QUOTENAME(@tableMaster) + ' m
        INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
        WHERE m.ProjectId = @ProjectId
          AND m.CompanyCode = @CompanyCode
          AND m.IsDeleted = 0
          AND m.RecordStatus = 1
          AND d.RecordStatus = 1;';
        
        EXEC sp_executesql @sql,
          N'@CompanyCode NVARCHAR(50), @ProjectId INT',
          @CompanyCode, @ProjectId;
      END
    END
    
    -- Hoạt động gần đây (10 hoạt động)
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
-- 9. Api_Search_ProjectsAndTasks: Tìm kiếm liên module
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Search_ProjectsAndTasks') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Search_ProjectsAndTasks;
GO
CREATE PROCEDURE dbo.Api_Search_ProjectsAndTasks
  @CompanyCode  NVARCHAR(50),
  @yyyymm    CHAR(6),
  @SearchKey NVARCHAR(255),
  @PageIndex INT = 1,
  @PageSize  INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    DECLARE @tableMaster NVARCHAR(100) = 'WorkflowTasksMaster_' + @yyyymm;
    DECLARE @tableDetail NVARCHAR(100) = 'WorkflowTasksDetail_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    -- Tìm kiếm Projects
    SELECT 
      'PROJECT' AS ResultType,
      CAST(p.Id AS NVARCHAR) AS Id,
      p.ProjectCode AS Code,
      p.ProjectName AS Name,
      p.Status,
      p.Progress,
      NULL AS Priority,
      p.UpdatedDate AS UpdatedDate
    FROM dbo.WorkflowProjects p
    WHERE p.CompanyCode = @CompanyCode
      AND p.IsDeleted = 0
      AND p.RecordStatus = 1
      AND (p.ProjectName LIKE '%' + @SearchKey + '%' OR p.ProjectCode LIKE '%' + @SearchKey + '%')
    
    UNION ALL
    
    -- Tìm kiếm Tasks (nếu bảng tồn tại)
    (SELECT 
      'TASK' AS ResultType,
      CAST(m.Id AS NVARCHAR) AS Id,
      m.TaskCode AS Code,
      m.TaskName AS Name,
      d.Status,
      d.Progress,
      d.Priority,
      d.UpdatedDate
    FROM dbo.' + QUOTENAME(@tableMaster) + ' m
    INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
    WHERE m.CompanyCode = @CompanyCode
      AND m.IsDeleted = 0
      AND m.RecordStatus = 1
      AND d.RecordStatus = 1
      AND (m.TaskName LIKE ''%'' + @SearchKey + ''%'' OR m.TaskCode LIKE ''%'' + @SearchKey + ''%'')
    )
    
    ORDER BY UpdatedDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Tổng số kết quả
    DECLARE @TotalCount INT = 0;
    
    SELECT @TotalCount = COUNT(*)
    FROM dbo.WorkflowProjects
      WHERE CompanyCode = @CompanyCode
      AND IsDeleted = 0
      AND RecordStatus = 1
      AND (ProjectName LIKE '%' + @SearchKey + '%' OR ProjectCode LIKE '%' + @SearchKey + '%');
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableMaster)
    BEGIN
      SET @sql = N'
      SELECT @TotalCount = @TotalCount + COUNT(*)
      FROM dbo.' + QUOTENAME(@tableMaster) + ' m
      INNER JOIN dbo.' + QUOTENAME(@tableDetail) + ' d ON m.Id = d.TaskMasterId
      WHERE m.CompanyCode = @CompanyCode
        AND m.IsDeleted = 0
        AND m.RecordStatus = 1
        AND d.RecordStatus = 1
        AND (m.TaskName LIKE ''%'' + @SearchKey + ''%'' OR m.TaskCode LIKE ''%'' + @SearchKey + ''%'');';
      
      EXEC sp_executesql @sql,
        N'@CompanyCode NVARCHAR(50), @SearchKey NVARCHAR(255), @TotalCount INT OUTPUT',
        @CompanyCode, @SearchKey, @TotalCount OUTPUT;
    END
    
    SELECT @TotalCount AS TotalCount;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO




