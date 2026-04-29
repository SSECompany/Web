/*
  Workflow Multi-Tenant Database - TASK MANAGEMENT STORED PROCEDURES
  ===================================================================
  PHIÊN BẢN THỐNG NHẤT - Sử dụng @CompanyCode và DepId
  
  File này bao gồm 7 stored procedures cho module Quản lý Công việc:
  
  - Api_TaskList_Load: Danh sách công việc với filter
  - Api_TaskList_ByProject: Danh sách công việc theo dự án
  - Api_TaskDetail_Load: Chi tiết công việc đầy đủ
  - Api_Task_Create: Tạo công việc (sinh TaskCode, log history, log activity)
  - Api_Task_Update: Cập nhật công việc (log history, log TẤT CẢ các thay đổi vào activity, log riêng TASK_ASSIGNED khi giao việc)
  - Api_Task_Delete: Xóa mềm công việc (log activity)
  - Api_Task_UpdateStatus: Cập nhật trạng thái (Kanban)
  
  LƯU Ý QUAN TRỌNG:
  - ✅ Sử dụng @CompanyCode NVARCHAR(50) - KHÔNG dùng @DvcsCode
  - ✅ Sử dụng DepId (lấy từ WorkflowCompanies) - KHÔNG dùng @CompanyId
  - ✅ Tự động log vào WorkflowProjectActivities cho các actions quan trọng
  - Tất cả SPs làm việc với Tasks cần parameter @yyyymm để chỉ định bảng phân kỳ (WorkflowTasks_yyyymm)
  - Tất cả SPs đều có error handling (TRY-CATCH)
  - Sử dụng dynamic SQL cho các SPs làm việc với bảng phân kỳ theo tháng
  
  CẬP NHẬT GẦN NHẤT: 2025-01-19
  - Thay thế @DvcsCode bằng @CompanyCode
  - Thêm logging tự động vào WorkflowProjectActivities
  - Thêm parameters: @Category, @FormTemplate, @Mode cho Task
*/

------------------------------------------------------------
-- 1. Api_TaskList_Load: Danh sách công việc với filter
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskList_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskList_Load;
GO
CREATE PROCEDURE dbo.Api_TaskList_Load
  @CompanyCode NVARCHAR(50),
  @yyyymm      CHAR(6),  -- Format: 'YYYYMM'
  @PageIndex   INT = 1,
  @PageSize    INT = 20,
  @SearchKey   NVARCHAR(255) = NULL,
  @Status      NVARCHAR(30) = NULL,
  @Priority    NVARCHAR(20) = NULL,
  @ProjectId   INT = NULL,
  @AssignedTo  INT = NULL
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
    
    -- Build dynamic SQL
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
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@SearchKey IS NULL OR t.TaskName LIKE ''%'' + @SearchKey + ''%'' OR t.TaskCode LIKE ''%'' + @SearchKey + ''%'')
      AND (@Status IS NULL OR t.Status = @Status)
      AND (@Priority IS NULL OR t.Priority = @Priority)
      AND (@ProjectId IS NULL OR t.ProjectId = @ProjectId)
      AND (@AssignedTo IS NULL OR t.AssignedTo = @AssignedTo)
    ORDER BY COALESCE(t.datetime2, t.datetime0) DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;';
    
    EXEC sp_executesql @sql, 
      N'@CompanyCode NVARCHAR(50), @SearchKey NVARCHAR(255), @Status NVARCHAR(30), @Priority NVARCHAR(20), @ProjectId INT, @AssignedTo INT, @Offset INT, @PageSize INT',
      @CompanyCode, @SearchKey, @Status, @Priority, @ProjectId, @AssignedTo, @Offset, @PageSize;
    
    -- Tổng số bản ghi
    SET @sql = N'
    SELECT COUNT(*) AS TotalCount
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    WHERE t.CompanyCode = @CompanyCode
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@SearchKey IS NULL OR t.TaskName LIKE ''%'' + @SearchKey + ''%'' OR t.TaskCode LIKE ''%'' + @SearchKey + ''%'')
      AND (@Status IS NULL OR t.Status = @Status)
      AND (@Priority IS NULL OR t.Priority = @Priority)
      AND (@ProjectId IS NULL OR t.ProjectId = @ProjectId)
      AND (@AssignedTo IS NULL OR t.AssignedTo = @AssignedTo);';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @SearchKey NVARCHAR(255), @Status NVARCHAR(30), @Priority NVARCHAR(20), @ProjectId INT, @AssignedTo INT',
      @CompanyCode, @SearchKey, @Status, @Priority, @ProjectId, @AssignedTo;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 2. Api_TaskList_ByProject: Danh sách công việc theo dự án
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskList_ByProject') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskList_ByProject;
GO
CREATE PROCEDURE dbo.Api_TaskList_ByProject
  @CompanyCode NVARCHAR(50),
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
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    SET @sql = N'
    SELECT 
      t.Id AS TaskId,
      t.TaskCode,
      t.TaskName,
      t.Status,
      t.Priority,
      t.Progress,
      t.DueDate,
      t.CompletedDate,
      t.AssignedTo,
      u.FullName AS AssignedToName,
      t.Description
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    LEFT JOIN dbo.WorkflowUsers u ON t.AssignedTo = u.Id
    WHERE t.ProjectId = @ProjectId
      AND t.CompanyCode = @CompanyCode
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@Status IS NULL OR t.Status = @Status)
    ORDER BY t.DueDate ASC, t.Priority DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @Status NVARCHAR(30), @Offset INT, @PageSize INT',
      @CompanyCode, @ProjectId, @Status, @Offset, @PageSize;
    
    SET @sql = N'
    SELECT COUNT(*) AS TotalCount
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    WHERE t.ProjectId = @ProjectId
      AND t.CompanyCode = @CompanyCode
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1
      AND (@Status IS NULL OR t.Status = @Status);';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @ProjectId INT, @Status NVARCHAR(30)',
      @CompanyCode, @ProjectId, @Status;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 3. Api_TaskDetail_Load: Chi tiết công việc đầy đủ
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskDetail_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskDetail_Load;
GO
CREATE PROCEDURE dbo.Api_TaskDetail_Load
  @CompanyCode NVARCHAR(50),
  @yyyymm      CHAR(6),
  @TaskId      BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Thông tin task
    SET @sql = N'
    SELECT 
      t.Id AS TaskId,
      t.TaskCode,
      t.TaskName,
      t.ProjectId,
      t.ParentTaskId,
      t.Level,
      t.Status,
      t.Priority,
      t.Mode,
      t.Category,
      t.FormTemplate,
      t.EstimatedHours,
      t.ActualHours,
      t.Progress,
      t.StartDate,
      t.EndDate,
      t.DueDate,
      t.CompletedDate,
      t.AssignedBy,
      t.AssignedTo,
      t.ReviewerId,
      t.Description,
      t.datetime0 AS CreatedDate,
      t.datetime2 AS UpdatedDate,
      p.ProjectName,
      p.ProjectCode,
      u1.FullName AS AssignedByName,
      u1.Email AS AssignedByEmail,
      u2.FullName AS AssignedToName,
      u2.Email AS AssignedToEmail,
      u3.FullName AS ReviewerName,
      u3.Email AS ReviewerEmail,
      u4.FullName AS CreatedByName
    FROM dbo.' + QUOTENAME(@tableName) + ' t
    LEFT JOIN dbo.WorkflowProjects p ON t.ProjectId = p.Id
    LEFT JOIN dbo.WorkflowUsers u1 ON t.AssignedBy = u1.Id
    LEFT JOIN dbo.WorkflowUsers u2 ON t.AssignedTo = u2.Id
    LEFT JOIN dbo.WorkflowUsers u3 ON t.ReviewerId = u3.Id
    LEFT JOIN dbo.WorkflowUsers u4 ON t.CreatedBy = u4.Id
    WHERE t.Id = @TaskId
      AND t.CompanyCode = @CompanyCode
      AND t.IsDeleted = 0
      AND t.RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @TaskId BIGINT',
      @CompanyCode, @TaskId;
    
    -- Checklist
    SELECT 
      c.Id, c.ItemOrder, c.ItemText, c.IsDone, c.DoneBy, c.DoneDate,
      u.FullName AS DoneByName
    FROM dbo.WorkflowTaskChecklist c
    LEFT JOIN dbo.WorkflowUsers u ON c.DoneBy = u.Id
    WHERE c.TaskId = @TaskId
      AND c.TaskMonth = @yyyymm
      AND c.CompanyCode = @CompanyCode
      AND c.RecordStatus = 1
    ORDER BY c.ItemOrder;
    
    -- Comments
    SELECT 
      c.Id, c.Content, c.ContentParent, c.datetime0 AS CreatedDate, c.datetime2 AS UpdatedDate, c.MentionsJson,
      u.FullName AS CreatedByName, u.Email AS CreatedByEmail
    FROM dbo.WorkflowTaskComments c
    INNER JOIN dbo.WorkflowUsers u ON c.CreatedBy = u.Id
    WHERE c.TaskId = @TaskId
      AND c.TaskMonth = @yyyymm
      AND c.CompanyCode = @CompanyCode
      AND c.IsDeleted = 0
      AND c.RecordStatus = 1
    ORDER BY c.datetime0 DESC;
    
    -- Attachments
    SELECT 
      a.Id, a.FileName, a.FilePath, a.FileType, a.FileSize, a.UploadedDate,
      u.FullName AS UploadedByName
    FROM dbo.WorkflowTaskAttachments a
    INNER JOIN dbo.WorkflowUsers u ON a.UploadedBy = u.Id
    WHERE a.TaskId = @TaskId
      AND a.TaskMonth = @yyyymm
      AND a.CompanyCode = @CompanyCode
      AND a.RecordStatus = 1
    ORDER BY a.UploadedDate DESC;
    
    -- History
    SELECT TOP 20
      h.FieldName, h.OldValue, h.NewValue, h.ChangedDate,
      u.FullName AS ChangedByName
    FROM dbo.WorkflowTaskHistory h
    INNER JOIN dbo.WorkflowUsers u ON h.ChangedBy = u.Id
    WHERE h.TaskId = @TaskId
      AND h.TaskMonth = @yyyymm
      AND h.CompanyCode = @CompanyCode
      AND h.RecordStatus = 1
    ORDER BY h.ChangedDate DESC;
    
    -- Task Flows (người flow)
    SELECT 
      f.Id, f.UserId, f.FlowOrder,
      u.FullName AS UserName, u.Email AS UserEmail
    FROM dbo.WorkflowTaskFlows f
    INNER JOIN dbo.WorkflowUsers u ON f.UserId = u.Id
    WHERE f.TaskId = @TaskId
      AND f.TaskMonth = @yyyymm
      AND f.CompanyCode = @CompanyCode
      AND f.RecordStatus = 1
    ORDER BY f.FlowOrder;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

------------------------------------------------------------
-- 4. Api_Task_Create: Tạo công việc (sinh TaskCode, log history, log activity)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Task_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Task_Create;
GO
CREATE PROCEDURE dbo.Api_Task_Create
  @CompanyCode     NVARCHAR(50),
  @yyyymm          CHAR(6),
  @TaskName        NVARCHAR(255),
  @ProjectId       INT = NULL,
  @ParentTaskId    BIGINT = NULL,
  @Level           INT = 1,
  @Status          NVARCHAR(30) = 'PENDING',
  @Priority        NVARCHAR(20) = 'MEDIUM',
  @Mode            NVARCHAR(20) = 'INTERNAL',
  @Category        NVARCHAR(50) = 'TASK',
  @FormTemplate    NVARCHAR(50) = NULL,
  @EstimatedHours  DECIMAL(10,2) = NULL,
  @StartDate       DATETIME = NULL,
  @EndDate         DATETIME = NULL,
  @DueDate         DATETIME = NULL,
  @AssignedBy      INT = NULL,
  @AssignedTo      INT = NULL,
  @ReviewerId      INT = NULL,
  @Description     NVARCHAR(MAX) = NULL,
  @CreatedBy       INT = 1,
  @NewTaskId       BIGINT = NULL OUTPUT,
  @TaskCode        NVARCHAR(50) = NULL OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại! Vui lòng tạo bảng trước.' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy DepId từ CompanyCode
    SELECT @DepId = Id FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode;
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    -- Sinh TaskCode tự động (TASK + YYYYMMDD + số thứ tự)
    DECLARE @DatePrefix NVARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    DECLARE @MaxSeq INT = 0;
    
    SET @sql = N'SELECT @MaxSeq = ISNULL(MAX(CAST(SUBSTRING(TaskCode, 13, 10) AS INT)), 0)
    FROM dbo.' + QUOTENAME(@tableName) + '
    WHERE CompanyCode = @CompanyCode
      AND TaskCode LIKE ''TASK'' + @DatePrefix + ''%'';';
    
    EXEC sp_executesql @sql,
      N'@CompanyCode NVARCHAR(50), @DatePrefix NVARCHAR(8), @MaxSeq INT OUTPUT',
      @CompanyCode, @DatePrefix, @MaxSeq OUTPUT;
    
    SET @TaskCode = 'TASK' + @DatePrefix + RIGHT('0000' + CAST(@MaxSeq + 1 AS NVARCHAR), 4);
    
    -- Fix cứng AssignedBy và CreatedBy = 1
    SET @AssignedBy = ISNULL(@AssignedBy, 1);
    SET @CreatedBy = ISNULL(@CreatedBy, 1);
    
    -- Xử lý EndDate nếu NULL
    IF @EndDate IS NULL
    BEGIN
      IF @StartDate IS NOT NULL
        SET @EndDate = @StartDate;
      ELSE
        SET @EndDate = GETDATE();
    END
    
    BEGIN TRANSACTION;
    
    -- Insert Task
    SET @sql = N'
    INSERT INTO dbo.' + QUOTENAME(@tableName) + ' 
      (DepId, CompanyCode, ProjectId, ParentTaskId, TaskCode, TaskName, Level, Status, Priority, Mode, 
       Category, FormTemplate, EstimatedHours, StartDate, EndDate, DueDate, AssignedBy, AssignedTo, ReviewerId, Description, CreatedBy, user_id0)
    VALUES 
      (@DepId, @CompanyCode, @ProjectId, @ParentTaskId, @TaskCode, @TaskName, @Level, @Status, @Priority, @Mode,
       @Category, @FormTemplate, @EstimatedHours, @StartDate, @EndDate, @DueDate, @AssignedBy, @AssignedTo, @ReviewerId, @Description, @CreatedBy, @CreatedBy);
    SET @NewTaskId = SCOPE_IDENTITY();';
    
    EXEC sp_executesql @sql,
      N'@DepId INT, @CompanyCode NVARCHAR(50), @ProjectId INT, @ParentTaskId BIGINT, @TaskCode NVARCHAR(50), @TaskName NVARCHAR(255), @Level INT, @Status NVARCHAR(30), @Priority NVARCHAR(20), @Mode NVARCHAR(20), @Category NVARCHAR(50), @FormTemplate NVARCHAR(50), @EstimatedHours DECIMAL(10,2), @StartDate DATETIME, @EndDate DATETIME, @DueDate DATETIME, @AssignedBy INT, @AssignedTo INT, @ReviewerId INT, @Description NVARCHAR(MAX), @CreatedBy INT, @NewTaskId BIGINT OUTPUT',
      @DepId, @CompanyCode, @ProjectId, @ParentTaskId, @TaskCode, @TaskName, @Level, @Status, @Priority, @Mode, @Category, @FormTemplate, @EstimatedHours, @StartDate, @EndDate, @DueDate, @AssignedBy, @AssignedTo, @ReviewerId, @Description, @CreatedBy, @NewTaskId OUTPUT;
    
    -- Log history
    INSERT INTO dbo.WorkflowTaskHistory (DepId, CompanyCode, TaskId, TaskMonth, FieldName, NewValue, ChangedBy)
    VALUES (@DepId, @CompanyCode, @NewTaskId, @yyyymm, 'TASK_CREATED', @TaskName, @CreatedBy);
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'TASK_CREATED',
        N'Đã tạo công việc: ' + @TaskName + N' (' + @TaskCode + N')',
        @CreatedBy, ''
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
-- 5. Api_Task_Update: Cập nhật công việc (log history, log activity)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Task_Update') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Task_Update;
GO
CREATE PROCEDURE dbo.Api_Task_Update
  @CompanyCode     NVARCHAR(50),
  @yyyymm          CHAR(6),
  @TaskId          BIGINT,
  @TaskName        NVARCHAR(255) = NULL,
  @Status          NVARCHAR(30) = NULL,
  @Priority        NVARCHAR(20) = NULL,
  @Progress        DECIMAL(5,2) = NULL,
  @EstimatedHours  DECIMAL(10,2) = NULL,
  @ActualHours     DECIMAL(10,2) = NULL,
  @StartDate       DATETIME = NULL,
  @EndDate         DATETIME = NULL,
  @DueDate         DATETIME = NULL,
  @AssignedBy      INT = NULL,
  @AssignedTo      INT = NULL,
  @ReviewerId      INT = NULL,
  @Category        NVARCHAR(50) = NULL,
  @FormTemplate    NVARCHAR(50) = NULL,
  @Mode            NVARCHAR(20) = NULL,
  @Description     NVARCHAR(MAX) = NULL,
  @UpdatedBy       INT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    IF @yyyymm IS NULL OR LEN(@yyyymm) <> 6 OR @yyyymm LIKE '%[^0-9]%'
    BEGIN
      SELECT N'@yyyymm invalid. Expected YYYYMM.' as message, 400 as status;
      RETURN;
    END

    DECLARE @TaskBase SYSNAME = N'WorkflowTasks_' + @yyyymm;

    IF OBJECT_ID(N'dbo.' + @TaskBase, 'U') IS NULL
    BEGIN
      SELECT N'Bảng dbo.' + @TaskBase + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END

    DECLARE @TaskTable NVARCHAR(300) = QUOTENAME(N'dbo') + N'.' + QUOTENAME(@TaskBase);
    DECLARE @sql NVARCHAR(MAX);

    -- Lấy DepId + ProjectId + giá trị cũ
    DECLARE
      @DepId INT,
      @ProjectId INT,
      @OldTaskName NVARCHAR(255),
      @OldStatus NVARCHAR(30),
      @OldPriority NVARCHAR(20),
      @OldProgress DECIMAL(5,2),
      @OldAssignedTo INT,
      @OldDueDate DATETIME,
      @OldEstimatedHours DECIMAL(10,2);

    SET @sql = N'
      SELECT
        @DepIdOut = DepId,
        @ProjectIdOut = ProjectId,
        @OldTaskNameOut = TaskName,
        @OldStatusOut = Status,
        @OldPriorityOut = Priority,
        @OldProgressOut = Progress,
        @OldAssignedToOut = AssignedTo,
        @OldDueDateOut = DueDate,
        @OldEstimatedHoursOut = EstimatedHours
      FROM ' + @TaskTable + N'
      WHERE Id = @TaskId
        AND CompanyCode = @CompanyCode
        AND IsDeleted = 0
        AND RecordStatus = 1;';

    EXEC sp_executesql
      @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50),
        @DepIdOut INT OUTPUT, @ProjectIdOut INT OUTPUT, @OldTaskNameOut NVARCHAR(255) OUTPUT, @OldStatusOut NVARCHAR(30) OUTPUT,
        @OldPriorityOut NVARCHAR(20) OUTPUT, @OldProgressOut DECIMAL(5,2) OUTPUT,
        @OldAssignedToOut INT OUTPUT, @OldDueDateOut DATETIME OUTPUT, @OldEstimatedHoursOut DECIMAL(10,2) OUTPUT',
      @TaskId=@TaskId, @CompanyCode=@CompanyCode,
      @DepIdOut=@DepId OUTPUT, @ProjectIdOut=@ProjectId OUTPUT, @OldTaskNameOut=@OldTaskName OUTPUT, @OldStatusOut=@OldStatus OUTPUT,
      @OldPriorityOut=@OldPriority OUTPUT, @OldProgressOut=@OldProgress OUTPUT,
      @OldAssignedToOut=@OldAssignedTo OUTPUT, @OldDueDateOut=@OldDueDate OUTPUT, @OldEstimatedHoursOut=@OldEstimatedHours OUTPUT;

    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy task (TaskId=' + CAST(@TaskId AS NVARCHAR) + N', CompanyCode=' + @CompanyCode + N').' as message, 400 as status;
      RETURN;
    END

    BEGIN TRANSACTION;

    -- Xử lý CompletedDate theo Status (nếu có update Status)
    DECLARE @SetCompletedDate BIT = 0;
    DECLARE @CompletedDateValue DATETIME = NULL;

    IF @Status IS NOT NULL
    BEGIN
      IF @Status = N'COMPLETED' AND ISNULL(@OldStatus, N'') <> N'COMPLETED'
      BEGIN
        SET @SetCompletedDate = 1;
        SET @CompletedDateValue = GETDATE();
      END
      ELSE IF @Status <> N'COMPLETED' AND ISNULL(@OldStatus, N'') = N'COMPLETED'
      BEGIN
        SET @SetCompletedDate = 1;
        SET @CompletedDateValue = NULL;
      END
    END

    -- Update (static COALESCE)
    SET @sql = N'
      UPDATE t
      SET
        TaskName       = COALESCE(@TaskName, t.TaskName),
        Status         = COALESCE(@Status, t.Status),
        Priority       = COALESCE(@Priority, t.Priority),
        Progress       = COALESCE(@Progress, t.Progress),
        EstimatedHours = COALESCE(@EstimatedHours, t.EstimatedHours),
        ActualHours    = COALESCE(@ActualHours, t.ActualHours),
        StartDate      = COALESCE(@StartDate, t.StartDate),
        EndDate        = COALESCE(@EndDate, t.EndDate),
        DueDate        = COALESCE(@DueDate, t.DueDate),
        AssignedBy     = COALESCE(@AssignedBy, t.AssignedBy),
        AssignedTo     = COALESCE(@AssignedTo, t.AssignedTo),
        ReviewerId     = COALESCE(@ReviewerId, t.ReviewerId),
        Category       = COALESCE(@Category, t.Category),
        FormTemplate   = COALESCE(@FormTemplate, t.FormTemplate),
        Mode           = COALESCE(@Mode, t.Mode),
        Description    = COALESCE(@Description, t.Description),
        CompletedDate  = CASE WHEN @SetCompletedDate = 1 THEN @CompletedDateValue ELSE t.CompletedDate END,
        datetime2      = SYSDATETIME(),
        user_id2       = @UpdatedBy
      FROM ' + @TaskTable + N' t
      WHERE t.Id = @TaskId
        AND t.CompanyCode = @CompanyCode
        AND t.IsDeleted = 0
        AND t.RecordStatus = 1;';

    EXEC sp_executesql
      @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50),
        @TaskName NVARCHAR(255), @Status NVARCHAR(30), @Priority NVARCHAR(20), @Progress DECIMAL(5,2),
        @EstimatedHours DECIMAL(10,2), @ActualHours DECIMAL(10,2),
        @StartDate DATETIME, @EndDate DATETIME, @DueDate DATETIME,
        @AssignedBy INT, @AssignedTo INT, @ReviewerId INT,
        @Category NVARCHAR(50), @FormTemplate NVARCHAR(50), @Mode NVARCHAR(20),
        @Description NVARCHAR(MAX),
        @SetCompletedDate BIT, @CompletedDateValue DATETIME,
        @UpdatedBy INT',
      @TaskId=@TaskId, @CompanyCode=@CompanyCode,
      @TaskName=@TaskName, @Status=@Status, @Priority=@Priority, @Progress=@Progress,
      @EstimatedHours=@EstimatedHours, @ActualHours=@ActualHours,
      @StartDate=@StartDate, @EndDate=@EndDate, @DueDate=@DueDate,
      @AssignedBy=@AssignedBy, @AssignedTo=@AssignedTo, @ReviewerId=@ReviewerId,
      @Category=@Category, @FormTemplate=@FormTemplate, @Mode=@Mode,
      @Description=@Description,
      @SetCompletedDate=@SetCompletedDate, @CompletedDateValue=@CompletedDateValue,
      @UpdatedBy=@UpdatedBy;

    -- History (log các field hay dùng)
    IF @TaskName IS NOT NULL AND @TaskName <> @OldTaskName
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'TaskName', @OldTaskName, @TaskName, @UpdatedBy);

    IF @Status IS NOT NULL AND @Status <> @OldStatus
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'Status', @OldStatus, @Status, @UpdatedBy);

    IF @Priority IS NOT NULL AND @Priority <> @OldPriority
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'Priority', @OldPriority, @Priority, @UpdatedBy);

    IF @Progress IS NOT NULL AND @Progress <> @OldProgress
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'Progress', CONVERT(NVARCHAR(50), @OldProgress), CONVERT(NVARCHAR(50), @Progress), @UpdatedBy);

    IF @AssignedTo IS NOT NULL AND ISNULL(@AssignedTo, -1) <> ISNULL(@OldAssignedTo, -1)
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'AssignedTo', CONVERT(NVARCHAR(50), @OldAssignedTo), CONVERT(NVARCHAR(50), @AssignedTo), @UpdatedBy);

    IF @DueDate IS NOT NULL AND ( (@OldDueDate IS NULL AND @DueDate IS NOT NULL) OR (@OldDueDate IS NOT NULL AND @DueDate IS NULL) OR (@OldDueDate <> @DueDate) )
      INSERT INTO dbo.WorkflowTaskHistory(DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, N'DueDate', CONVERT(NVARCHAR(50), @OldDueDate, 121), CONVERT(NVARCHAR(50), @DueDate, 121), @UpdatedBy);

    -- Log activity vào WorkflowProjectActivities
    IF @ProjectId IS NOT NULL
    BEGIN
      -- Log riêng cho giao việc (TASK_ASSIGNED) nếu có thay đổi AssignedTo
      IF @AssignedTo IS NOT NULL AND ISNULL(@AssignedTo, -1) <> ISNULL(@OldAssignedTo, -1)
      BEGIN
        -- Lấy tên người cũ và người mới
        DECLARE @OldAssignedToName NVARCHAR(255) = N'Chưa giao';
        DECLARE @NewAssignedToName NVARCHAR(255) = N'Chưa giao';
        
        IF @OldAssignedTo IS NOT NULL AND @OldAssignedTo > 0
        BEGIN
          SELECT @OldAssignedToName = ISNULL(FullName, N'User #' + CAST(@OldAssignedTo AS NVARCHAR(20)))
          FROM dbo.WorkflowUsers
          WHERE Id = @OldAssignedTo;
        END
        
        IF @AssignedTo IS NOT NULL AND @AssignedTo > 0
        BEGIN
          SELECT @NewAssignedToName = ISNULL(FullName, N'User #' + CAST(@AssignedTo AS NVARCHAR(20)))
          FROM dbo.WorkflowUsers
          WHERE Id = @AssignedTo;
        END
        
        -- Lấy StartDate, EndDate và DueDate để log (ưu tiên từ parameter, nếu không có thì lấy từ task sau khi update)
        DECLARE @TaskStartDate DATETIME = NULL;
        DECLARE @TaskEndDate DATETIME = NULL;
        DECLARE @TaskDueDate DATETIME = NULL;
        DECLARE @DateDesc NVARCHAR(300) = N'';
        
        -- Ưu tiên lấy từ parameter @StartDate và @EndDate (giá trị mới được truyền vào)
        -- Nếu parameter là NULL, lấy từ task sau khi update
        IF @StartDate IS NOT NULL
          SET @TaskStartDate = @StartDate;
        ELSE
        BEGIN
          SET @sql = N'SELECT @StartDateOut = StartDate FROM ' + @TaskTable + N' WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
          EXEC sp_executesql @sql,
            N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @StartDateOut DATETIME OUTPUT',
            @TaskId, @CompanyCode, @TaskStartDate OUTPUT;
        END
        
        IF @EndDate IS NOT NULL
          SET @TaskEndDate = @EndDate;
        ELSE
        BEGIN
          SET @sql = N'SELECT @EndDateOut = EndDate FROM ' + @TaskTable + N' WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
          EXEC sp_executesql @sql,
            N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @EndDateOut DATETIME OUTPUT',
            @TaskId, @CompanyCode, @TaskEndDate OUTPUT;
        END
        
        -- Lấy DueDate (ưu tiên từ parameter, nếu không có thì lấy từ task)
        IF @DueDate IS NOT NULL
          SET @TaskDueDate = @DueDate;
        ELSE
        BEGIN
          SET @sql = N'SELECT @DueDateOut = DueDate FROM ' + @TaskTable + N' WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
          EXEC sp_executesql @sql,
            N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DueDateOut DATETIME OUTPUT',
            @TaskId, @CompanyCode, @TaskDueDate OUTPUT;
        END
        
        -- Tạo mô tả ngày: Từ ngày → Tới ngày, Hết hạn
        IF @TaskStartDate IS NOT NULL AND @TaskEndDate IS NOT NULL
        BEGIN
          SET @DateDesc = N' (Từ ngày: ' + CONVERT(NVARCHAR(20), @TaskStartDate, 103) + N' → Tới ngày: ' + CONVERT(NVARCHAR(20), @TaskEndDate, 103);
          IF @TaskDueDate IS NOT NULL
            SET @DateDesc = @DateDesc + N', Hết hạn: ' + CONVERT(NVARCHAR(20), @TaskDueDate, 103);
          SET @DateDesc = @DateDesc + N')';
        END
        ELSE IF @TaskStartDate IS NOT NULL
        BEGIN
          SET @DateDesc = N' (Từ ngày: ' + CONVERT(NVARCHAR(20), @TaskStartDate, 103);
          IF @TaskDueDate IS NOT NULL
            SET @DateDesc = @DateDesc + N', Hết hạn: ' + CONVERT(NVARCHAR(20), @TaskDueDate, 103);
          SET @DateDesc = @DateDesc + N')';
        END
        ELSE IF @TaskEndDate IS NOT NULL
        BEGIN
          SET @DateDesc = N' (Tới ngày: ' + CONVERT(NVARCHAR(20), @TaskEndDate, 103);
          IF @TaskDueDate IS NOT NULL
            SET @DateDesc = @DateDesc + N', Hết hạn: ' + CONVERT(NVARCHAR(20), @TaskDueDate, 103);
          SET @DateDesc = @DateDesc + N')';
        END
        ELSE IF @TaskDueDate IS NOT NULL
        BEGIN
          SET @DateDesc = N' (Hết hạn: ' + CONVERT(NVARCHAR(20), @TaskDueDate, 103) + N')';
        END
        
        -- Log riêng cho giao việc với thông tin ngày
        INSERT INTO dbo.WorkflowProjectActivities (
          CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
        )
        VALUES (
          @CompanyCode, @ProjectId, 'TASK_ASSIGNED',
          N'Đã giao việc: ' + ISNULL(@OldTaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20))) + 
          N' từ ' + @OldAssignedToName + N' → ' + @NewAssignedToName + @DateDesc,
          @UpdatedBy, ''
        );
      END
      ELSE
      BEGIN
        -- Log các thay đổi khác (không phải giao việc)
        DECLARE @ActivityDesc NVARCHAR(MAX) = N'Đã cập nhật công việc: ' + ISNULL(@OldTaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20)));
        DECLARE @HasChanges BIT = 0;
        DECLARE @ChangeList NVARCHAR(MAX) = N'';
        
        -- Kiểm tra từng trường có thay đổi không (BỎ AssignedTo vì đã log riêng ở trên)
        IF @TaskName IS NOT NULL AND ISNULL(@TaskName, N'') <> ISNULL(@OldTaskName, N'')
        BEGIN
          SET @ChangeList = @ChangeList + N'Tên: ' + ISNULL(@OldTaskName, N'NULL') + N' → ' + @TaskName + N'; ';
          SET @HasChanges = 1;
        END
        
        IF @Status IS NOT NULL AND ISNULL(@Status, N'') <> ISNULL(@OldStatus, N'')
        BEGIN
          SET @ChangeList = @ChangeList + N'Trạng thái: ' + ISNULL(@OldStatus, N'NULL') + N' → ' + @Status + N'; ';
          SET @HasChanges = 1;
        END
        
        IF @Priority IS NOT NULL AND ISNULL(@Priority, N'') <> ISNULL(@OldPriority, N'')
        BEGIN
          SET @ChangeList = @ChangeList + N'Độ ưu tiên: ' + ISNULL(@OldPriority, N'NULL') + N' → ' + @Priority + N'; ';
          SET @HasChanges = 1;
        END
        
        IF @Progress IS NOT NULL AND ISNULL(@Progress, 0) <> ISNULL(@OldProgress, 0)
        BEGIN
          SET @ChangeList = @ChangeList + N'Tiến độ: ' + CONVERT(NVARCHAR(10), ISNULL(@OldProgress, 0)) + N'% → ' + CONVERT(NVARCHAR(10), @Progress) + N'%; ';
          SET @HasChanges = 1;
        END
        
        IF @DueDate IS NOT NULL AND ( (@OldDueDate IS NULL AND @DueDate IS NOT NULL) OR (@OldDueDate IS NOT NULL AND @DueDate IS NULL) OR (@OldDueDate <> @DueDate) )
        BEGIN
          SET @ChangeList = @ChangeList + N'Ngày hết hạn: ' + ISNULL(CONVERT(NVARCHAR(20), @OldDueDate, 103), N'NULL') + N' → ' + CONVERT(NVARCHAR(20), @DueDate, 103) + N'; ';
          SET @HasChanges = 1;
        END
        
        IF @EstimatedHours IS NOT NULL AND ISNULL(@EstimatedHours, 0) <> ISNULL(@OldEstimatedHours, 0)
        BEGIN
          SET @ChangeList = @ChangeList + N'Số giờ ước tính: ' + CONVERT(NVARCHAR(20), ISNULL(@OldEstimatedHours, 0)) + N' → ' + CONVERT(NVARCHAR(20), @EstimatedHours) + N'; ';
          SET @HasChanges = 1;
        END
        
        -- Nếu có thay đổi (không phải giao việc), log vào WorkflowProjectActivities
        IF @HasChanges = 1
        BEGIN
          -- Rút ngắn mô tả nếu quá dài
          IF LEN(@ChangeList) > 500
          BEGIN
            SET @ChangeList = LEFT(@ChangeList, 497) + N'...';
          END
          
          INSERT INTO dbo.WorkflowProjectActivities (
            CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
          )
          VALUES (
            @CompanyCode, @ProjectId, 'TASK_UPDATED',
            @ActivityDesc + N' (' + LTRIM(RTRIM(@ChangeList)) + N')',
            @UpdatedBy, ''
          );
        END
      END
    END

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
-- 6. Api_Task_Delete: Xóa mềm công việc (với logging)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Task_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Task_Delete;
GO
CREATE PROCEDURE dbo.Api_Task_Delete
  @CompanyCode NVARCHAR(50),
  @yyyymm      CHAR(6),
  @TaskId      BIGINT,
  @DeletedBy   INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    DECLARE @ProjectId INT;
    DECLARE @TaskName NVARCHAR(255);
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy DepId, ProjectId, TaskName
    SET @sql = N'SELECT @DepId = DepId, @ProjectId = ProjectId, @TaskName = TaskName FROM dbo.' + QUOTENAME(@tableName) + '
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode AND IsDeleted = 0 AND RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DepId INT OUTPUT, @ProjectId INT OUTPUT, @TaskName NVARCHAR(255) OUTPUT',
      @TaskId, @CompanyCode, @DepId OUTPUT, @ProjectId OUTPUT, @TaskName OUTPUT;
    
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công việc với ID: ' + CAST(@TaskId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Soft delete
    SET @sql = N'UPDATE dbo.' + QUOTENAME(@tableName) + '
    SET IsDeleted = 1, RecordStatus = 0, datetime2 = SYSDATETIME(), user_id2 = @DeletedBy
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DeletedBy INT',
      @TaskId, @CompanyCode, @DeletedBy;
    
    -- Log history
    INSERT INTO dbo.WorkflowTaskHistory (DepId, CompanyCode, TaskId, TaskMonth, FieldName, NewValue, ChangedBy)
    VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, 'TASK_DELETED', 'Deleted', @DeletedBy);
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'TASK_DELETED',
        N'Đã xóa công việc: ' + ISNULL(@TaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20))),
        @DeletedBy, ''
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
-- 7. Api_Task_UpdateStatus: Cập nhật trạng thái (Kanban)
------------------------------------------------------------
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Task_UpdateStatus') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Task_UpdateStatus;
GO
CREATE PROCEDURE dbo.Api_Task_UpdateStatus
  @CompanyCode NVARCHAR(50),
  @yyyymm      CHAR(6),
  @TaskId      BIGINT,
  @NewStatus   NVARCHAR(30),
  @UpdatedBy   INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @DepId INT;
    DECLARE @OldStatus NVARCHAR(30);
    DECLARE @CompletedDate DATETIME = NULL;
    DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName)
    BEGIN
      SELECT N'Bảng ' + @tableName + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy giá trị cũ và DepId
    SET @sql = N'SELECT @DepId = DepId, @OldStatus = Status
    FROM dbo.' + QUOTENAME(@tableName) + '
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DepId INT OUTPUT, @OldStatus NVARCHAR(30) OUTPUT',
      @TaskId, @CompanyCode, @DepId OUTPUT, @OldStatus OUTPUT;
    
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công việc với ID: ' + CAST(@TaskId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Nếu chuyển sang COMPLETED thì set CompletedDate
    IF @NewStatus = 'COMPLETED' AND @OldStatus <> 'COMPLETED'
      SET @CompletedDate = GETDATE();
    
    BEGIN TRANSACTION;
    
    -- Update status
    IF @CompletedDate IS NOT NULL
    BEGIN
      SET @sql = N'UPDATE dbo.' + QUOTENAME(@tableName) + 
        ' SET Status = @NewStatus, CompletedDate = @CompletedDate, datetime2 = SYSDATETIME(), user_id2 = @UpdatedBy
      WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
      
      EXEC sp_executesql @sql,
        N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @NewStatus NVARCHAR(30), @CompletedDate DATETIME, @UpdatedBy INT',
        @TaskId, @CompanyCode, @NewStatus, @CompletedDate, @UpdatedBy;
    END
    ELSE IF @NewStatus <> 'COMPLETED'
    BEGIN
      SET @sql = N'UPDATE dbo.' + QUOTENAME(@tableName) + 
        ' SET Status = @NewStatus, CompletedDate = NULL, datetime2 = SYSDATETIME(), user_id2 = @UpdatedBy
      WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
      
      EXEC sp_executesql @sql,
        N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @NewStatus NVARCHAR(30), @UpdatedBy INT',
        @TaskId, @CompanyCode, @NewStatus, @UpdatedBy;
    END
    ELSE
    BEGIN
      SET @sql = N'UPDATE dbo.' + QUOTENAME(@tableName) + 
        ' SET Status = @NewStatus, datetime2 = SYSDATETIME(), user_id2 = @UpdatedBy
      WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
      
        EXEC sp_executesql @sql,
        N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @NewStatus NVARCHAR(30), @UpdatedBy INT',
        @TaskId, @CompanyCode, @NewStatus, @UpdatedBy;
    END
    
    -- Log history
    IF @OldStatus <> @NewStatus
    BEGIN
      INSERT INTO dbo.WorkflowTaskHistory (DepId, CompanyCode, TaskId, TaskMonth, FieldName, OldValue, NewValue, ChangedBy)
      VALUES (@DepId, @CompanyCode, @TaskId, @yyyymm, 'Status', @OldStatus, @NewStatus, @UpdatedBy);
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
-- ============================================================
-- FILE: CREATE_Api_TaskComments_Watchers_CRUD.sql
-- MÔ TẢ: Tạo stored procedures để quản lý bình luận và người theo dõi task
-- NGÀY: 2025-01-19
-- 
-- CÁC STORED PROCEDURES:
-- 1. Api_TaskComment_Create: Tạo bình luận mới
-- 2. Api_TaskComment_Update: Cập nhật bình luận
-- 3. Api_TaskComment_Delete: Xóa bình luận
-- 4. Api_TaskComment_List: Lấy danh sách bình luận (đã có trong Api_TaskDetail_Load, nhưng tạo riêng để có pagination)
-- 5. Api_TaskWatcher_Add: Thêm người theo dõi
-- 6. Api_TaskWatcher_Remove: Xóa người theo dõi
-- 7. Api_TaskWatcher_List: Lấy danh sách người theo dõi
-- ============================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================
-- 1. Api_TaskComment_Create: Tạo bình luận mới
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskComment_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskComment_Create;
GO

CREATE PROCEDURE [dbo].[Api_TaskComment_Create]
  @CompanyCode        NVARCHAR(50),
  @yyyymm             CHAR(6),      -- Format: 'YYYYMM'
  @TaskId             BIGINT,
  @Content            NVARCHAR(MAX),
  @ContentParent      INT = NULL,   -- ID comment cha (nếu là reply)
  @MentionsJson       NVARCHAR(MAX) = NULL,
  @CreatedBy          INT,
  @NewCommentId       INT = NULL OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra task tồn tại
    DECLARE @TaskTable NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @DepId INT;
    DECLARE @ProjectId INT;
    DECLARE @TaskName NVARCHAR(255);
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TaskTable)
    BEGIN
      SELECT N'Bảng ' + @TaskTable + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy thông tin task
    SET @sql = N'SELECT @DepIdOut = DepId, @ProjectIdOut = ProjectId, @TaskNameOut = TaskName 
    FROM dbo.' + QUOTENAME(@TaskTable) + N' 
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode AND IsDeleted = 0 AND RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DepId INT OUTPUT, @ProjectId INT OUTPUT, @TaskName NVARCHAR(255) OUTPUT',
      @TaskId, @CompanyCode, @DepId OUTPUT, @ProjectId OUTPUT, @TaskName OUTPUT;
    
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy task với ID: ' + CAST(@TaskId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra user tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowUsers WHERE Id = @CreatedBy)
    BEGIN
      SELECT N'Không tìm thấy người dùng với ID: ' + CAST(@CreatedBy AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra ContentParent nếu có (phải là comment của cùng task)
    IF @ContentParent IS NOT NULL
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM dbo.WorkflowTaskComments 
        WHERE Id = @ContentParent 
          AND TaskId = @TaskId 
          AND TaskMonth = @yyyymm
          AND CompanyCode = @CompanyCode
          AND IsDeleted = 0
      )
      BEGIN
        SELECT N'Không tìm thấy bình luận cha với ID: ' + CAST(@ContentParent AS NVARCHAR) as message, 400 as status;
        RETURN;
      END
    END
    
    BEGIN TRANSACTION;
    
    -- Insert comment vào WorkflowTaskComments
    INSERT INTO dbo.WorkflowTaskComments (
      CompanyCode, DepId, TaskId, TaskMonth, Content, ContentParent, 
      MentionsJson, CreatedBy, user_id0, RecordStatus
    )
    VALUES (
      @CompanyCode, @DepId, @TaskId, @yyyymm, @Content, @ContentParent,
      @MentionsJson, @CreatedBy, @CreatedBy, 1
    );
    
    SET @NewCommentId = SCOPE_IDENTITY();
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      DECLARE @CommentDesc NVARCHAR(MAX) = N'Đã thêm bình luận cho: ' + ISNULL(@TaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20)));
      IF @ContentParent IS NOT NULL
        SET @CommentDesc = @CommentDesc + N' (Trả lời bình luận)';
      
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'COMMENT_ADDED', @CommentDesc, @CreatedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin comment đã tạo
    SELECT 
      c.Id AS CommentId,
      c.Content,
      c.ContentParent,
      c.MentionsJson,
      c.datetime0 AS CreatedDate,
      u.FullName AS CreatedByName,
      u.Email AS CreatedByEmail
    FROM dbo.WorkflowTaskComments c
    INNER JOIN dbo.WorkflowUsers u ON c.CreatedBy = u.Id
    WHERE c.Id = @NewCommentId;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskComment_Create';
GO

-- ============================================================
-- 2. Api_TaskComment_Update: Cập nhật bình luận
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskComment_Update') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskComment_Update;
GO

CREATE PROCEDURE [dbo].[Api_TaskComment_Update]
  @CompanyCode        NVARCHAR(50),
  @CommentId          INT,
  @Content            NVARCHAR(MAX),
  @MentionsJson       NVARCHAR(MAX) = NULL,
  @UpdatedBy          INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra comment tồn tại và thuộc về user
    IF NOT EXISTS (
      SELECT 1 FROM dbo.WorkflowTaskComments 
      WHERE Id = @CommentId 
        AND CompanyCode = @CompanyCode 
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Không tìm thấy bình luận với ID: ' + CAST(@CommentId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra quyền (chỉ người tạo mới được sửa)
    IF NOT EXISTS (
      SELECT 1 FROM dbo.WorkflowTaskComments 
      WHERE Id = @CommentId 
        AND CreatedBy = @UpdatedBy
    )
    BEGIN
      SELECT N'Bạn không có quyền sửa bình luận này' as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Update comment
    UPDATE dbo.WorkflowTaskComments
    SET 
      Content = @Content,
      MentionsJson = COALESCE(@MentionsJson, MentionsJson),
      datetime2 = SYSDATETIME(),
      user_id2 = @UpdatedBy
    WHERE Id = @CommentId
      AND CompanyCode = @CompanyCode;
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã cập nhật
    SELECT 
      c.Id AS CommentId,
      c.Content,
      c.ContentParent,
      c.MentionsJson,
      c.datetime0 AS CreatedDate,
      c.datetime2 AS UpdatedDate,
      u.FullName AS CreatedByName,
      u.Email AS CreatedByEmail
    FROM dbo.WorkflowTaskComments c
    INNER JOIN dbo.WorkflowUsers u ON c.CreatedBy = u.Id
    WHERE c.Id = @CommentId;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskComment_Update';
GO

-- ============================================================
-- 3. Api_TaskComment_Delete: Xóa bình luận
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskComment_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskComment_Delete;
GO

CREATE PROCEDURE [dbo].[Api_TaskComment_Delete]
  @CompanyCode        NVARCHAR(50),
  @CommentId          INT,
  @DeletedBy          INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra comment tồn tại
    DECLARE @TaskId BIGINT;
    DECLARE @TaskMonth CHAR(6);
    DECLARE @ProjectId INT;
    
    SELECT @TaskId = TaskId, @TaskMonth = TaskMonth
    FROM dbo.WorkflowTaskComments
    WHERE Id = @CommentId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0;
    
    IF @TaskId IS NULL
    BEGIN
      SELECT N'Không tìm thấy bình luận với ID: ' + CAST(@CommentId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Lấy ProjectId từ task (nếu có)
    DECLARE @TaskTable NVARCHAR(100) = 'WorkflowTasks_' + @TaskMonth;
    DECLARE @sql NVARCHAR(MAX);
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @TaskTable)
    BEGIN
      SET @sql = N'SELECT @ProjectIdOut = ProjectId FROM dbo.' + QUOTENAME(@TaskTable) + 
                 N' WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
      EXEC sp_executesql @sql,
        N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @ProjectId INT OUTPUT',
        @TaskId, @CompanyCode, @ProjectId OUTPUT;
    END
    
    BEGIN TRANSACTION;
    
    -- Soft delete comment
    UPDATE dbo.WorkflowTaskComments
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @DeletedBy
    WHERE Id = @CommentId
      AND CompanyCode = @CompanyCode;
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'COMMENT_DELETED',
        N'Đã xóa bình luận cho task #' + CAST(@TaskId AS NVARCHAR(20)),
        @DeletedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã xóa
    SELECT 
      @CommentId AS CommentId,
      @TaskId AS TaskId,
      'DELETED' AS Status;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskComment_Delete';
GO

-- ============================================================
-- 4. Api_TaskComment_List: Lấy danh sách bình luận với pagination
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskComment_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskComment_List;
GO

CREATE PROCEDURE [dbo].[Api_TaskComment_List]
  @CompanyCode        NVARCHAR(50),
  @yyyymm             CHAR(6),
  @TaskId             BIGINT,
  @PageIndex          INT = 1,
  @PageSize           INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    -- Danh sách comments
    SELECT 
      c.Id AS CommentId,
      c.Content,
      c.ContentParent,
      c.MentionsJson,
      c.datetime0 AS CreatedDate,
      c.datetime2 AS UpdatedDate,
      c.CreatedBy,
      u.FullName AS CreatedByName,
      u.Email AS CreatedByEmail,
      u.Avatar AS CreatedByAvatar
    FROM dbo.WorkflowTaskComments c
    INNER JOIN dbo.WorkflowUsers u ON c.CreatedBy = u.Id
    WHERE c.TaskId = @TaskId
      AND c.TaskMonth = @yyyymm
      AND c.CompanyCode = @CompanyCode
      AND c.IsDeleted = 0
      AND c.RecordStatus = 1
    ORDER BY c.datetime0 DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Tổng số bình luận
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowTaskComments c
    WHERE c.TaskId = @TaskId
      AND c.TaskMonth = @yyyymm
      AND c.CompanyCode = @CompanyCode
      AND c.IsDeleted = 0
      AND c.RecordStatus = 1;
    
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskComment_List';
GO

-- ============================================================
-- 5. Api_TaskWatcher_Add: Thêm người theo dõi
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskWatcher_Add') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskWatcher_Add;
GO

CREATE PROCEDURE [dbo].[Api_TaskWatcher_Add]
  @CompanyCode        NVARCHAR(50),
  @yyyymm             CHAR(6),      -- Format: 'YYYYMM'
  @TaskId             BIGINT,
  @UserId             INT,
  @AddedBy            INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra task tồn tại
    DECLARE @TaskTable NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @DepId INT;
    DECLARE @ProjectId INT;
    DECLARE @TaskName NVARCHAR(255);
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TaskTable)
    BEGIN
      SELECT N'Bảng ' + @TaskTable + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy thông tin task
    SET @sql = N'SELECT @DepIdOut = DepId, @ProjectIdOut = ProjectId, @TaskNameOut = TaskName 
    FROM dbo.' + QUOTENAME(@TaskTable) + N' 
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode AND IsDeleted = 0 AND RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DepId INT OUTPUT, @ProjectId INT OUTPUT, @TaskName NVARCHAR(255) OUTPUT',
      @TaskId, @CompanyCode, @DepId OUTPUT, @ProjectId OUTPUT, @TaskName OUTPUT;
    
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy task với ID: ' + CAST(@TaskId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra user tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowUsers WHERE Id = @UserId)
    BEGIN
      SELECT N'Không tìm thấy người dùng với ID: ' + CAST(@UserId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra đã là watcher chưa
    IF EXISTS (
      SELECT 1 FROM dbo.WorkflowTaskAssignments
      WHERE TaskId = @TaskId
        AND TaskMonth = @yyyymm
        AND UserId = @UserId
        AND AssignmentType = 'WATCHER'
        AND CompanyCode = @CompanyCode
        AND IsDeleted = 0
    )
    BEGIN
      -- Đã là watcher rồi, trả về thông tin hiện tại
      SELECT 
        a.Id AS AssignmentId,
        a.UserId,
        u.FullName AS UserName,
        u.Email AS UserEmail,
        a.AssignedDate,
        'ALREADY_EXISTS' AS Status
      FROM dbo.WorkflowTaskAssignments a
      INNER JOIN dbo.WorkflowUsers u ON a.UserId = u.Id
      WHERE a.TaskId = @TaskId
        AND a.TaskMonth = @yyyymm
        AND a.UserId = @UserId
        AND a.AssignmentType = 'WATCHER'
        AND a.CompanyCode = @CompanyCode
        AND a.IsDeleted = 0;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Insert watcher vào WorkflowTaskAssignments
    INSERT INTO dbo.WorkflowTaskAssignments (
      CompanyCode, DepId, TaskId, TaskMonth, UserId, AssignmentType, 
      AssignedDate, user_id0, RecordStatus
    )
    VALUES (
      @CompanyCode, @DepId, @TaskId, @yyyymm, @UserId, 'WATCHER',
      GETDATE(), @AddedBy, 1
    );
    
    DECLARE @NewAssignmentId INT = SCOPE_IDENTITY();
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      DECLARE @WatcherName NVARCHAR(255);
      SELECT @WatcherName = FullName FROM dbo.WorkflowUsers WHERE Id = @UserId;
      
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'WATCHER_ADDED',
        N'Đã thêm người theo dõi: ' + ISNULL(@WatcherName, N'User #' + CAST(@UserId AS NVARCHAR(20))) + 
        N' cho: ' + ISNULL(@TaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20))),
        @AddedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin watcher đã thêm
    SELECT 
      a.Id AS AssignmentId,
      a.UserId,
      u.FullName AS UserName,
      u.Email AS UserEmail,
      u.Avatar AS UserAvatar,
      a.AssignedDate,
      'ADDED' AS Status
    FROM dbo.WorkflowTaskAssignments a
    INNER JOIN dbo.WorkflowUsers u ON a.UserId = u.Id
    WHERE a.Id = @NewAssignmentId;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskWatcher_Add';
GO

-- ============================================================
-- 6. Api_TaskWatcher_Remove: Xóa người theo dõi
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskWatcher_Remove') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskWatcher_Remove;
GO

CREATE PROCEDURE [dbo].[Api_TaskWatcher_Remove]
  @CompanyCode        NVARCHAR(50),
  @yyyymm             CHAR(6),
  @TaskId             BIGINT,
  @UserId             INT,
  @RemovedBy          INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra watcher tồn tại
    DECLARE @AssignmentId INT;
    DECLARE @ProjectId INT;
    DECLARE @TaskName NVARCHAR(255);
    DECLARE @WatcherName NVARCHAR(255);
    DECLARE @TaskTable NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;
    DECLARE @sql NVARCHAR(MAX);
    
    SELECT @AssignmentId = Id
    FROM dbo.WorkflowTaskAssignments
    WHERE TaskId = @TaskId
      AND TaskMonth = @yyyymm
      AND UserId = @UserId
      AND AssignmentType = 'WATCHER'
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0;
    
    IF @AssignmentId IS NULL
    BEGIN
      SELECT N'Không tìm thấy người theo dõi với UserId: ' + CAST(@UserId AS NVARCHAR) + N' cho task này' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy thông tin task và watcher
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @TaskTable)
    BEGIN
      SET @sql = N'SELECT @ProjectIdOut = ProjectId, @TaskNameOut = TaskName 
      FROM dbo.' + QUOTENAME(@TaskTable) + N' 
      WHERE Id = @TaskId AND CompanyCode = @CompanyCode;';
      EXEC sp_executesql @sql,
        N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @ProjectId INT OUTPUT, @TaskName NVARCHAR(255) OUTPUT',
        @TaskId, @CompanyCode, @ProjectId OUTPUT, @TaskName OUTPUT;
    END
    
    SELECT @WatcherName = FullName FROM dbo.WorkflowUsers WHERE Id = @UserId;
    
    BEGIN TRANSACTION;
    
    -- Soft delete watcher
    UPDATE dbo.WorkflowTaskAssignments
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @RemovedBy
    WHERE Id = @AssignmentId
      AND CompanyCode = @CompanyCode;
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'WATCHER_REMOVED',
        N'Đã xóa người theo dõi: ' + ISNULL(@WatcherName, N'User #' + CAST(@UserId AS NVARCHAR(20))) + 
        N' khỏi: ' + ISNULL(@TaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20))),
        @RemovedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã xóa
    SELECT 
      @AssignmentId AS AssignmentId,
      @TaskId AS TaskId,
      @UserId AS UserId,
      'REMOVED' AS Status;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskWatcher_Remove';
GO

-- ============================================================
-- 7. Api_TaskWatcher_List: Lấy danh sách người theo dõi
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskWatcher_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskWatcher_List;
GO

CREATE PROCEDURE [dbo].[Api_TaskWatcher_List]
  @CompanyCode        NVARCHAR(50),
  @yyyymm             CHAR(6),
  @TaskId             BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Danh sách watchers
    SELECT 
      a.Id AS AssignmentId,
      a.UserId,
      u.FullName AS UserName,
      u.Email AS UserEmail,
      u.Avatar AS UserAvatar,
      u.Position AS UserPosition,
      a.AssignedDate,
      a.datetime0 AS CreatedDate
    FROM dbo.WorkflowTaskAssignments a
    INNER JOIN dbo.WorkflowUsers u ON a.UserId = u.Id
    WHERE a.TaskId = @TaskId
      AND a.TaskMonth = @yyyymm
      AND a.CompanyCode = @CompanyCode
      AND a.AssignmentType = 'WATCHER'
      AND a.IsDeleted = 0
      AND a.RecordStatus = 1
    ORDER BY a.AssignedDate DESC;
    
    -- Tổng số watchers
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowTaskAssignments a
    WHERE a.TaskId = @TaskId
      AND a.TaskMonth = @yyyymm
      AND a.CompanyCode = @CompanyCode
      AND a.AssignmentType = 'WATCHER'
      AND a.IsDeleted = 0
      AND a.RecordStatus = 1;
    
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskWatcher_List';
GO

-- ============================================================
-- TÓM TẮT:
-- ============================================================
-- 1. Api_TaskComment_Create: Tạo bình luận mới (log COMMENT_ADDED)
-- 2. Api_TaskComment_Update: Cập nhật bình luận (chỉ người tạo mới được sửa)
-- 3. Api_TaskComment_Delete: Xóa bình luận (soft delete, log COMMENT_DELETED)
-- 4. Api_TaskComment_List: Lấy danh sách bình luận với pagination
-- 5. Api_TaskWatcher_Add: Thêm người theo dõi (log WATCHER_ADDED)
-- 6. Api_TaskWatcher_Remove: Xóa người theo dõi (soft delete, log WATCHER_REMOVED)
-- 7. Api_TaskWatcher_List: Lấy danh sách người theo dõi
-- ============================================================
-- LƯU Ý:
-- ============================================================
-- - Tất cả SPs sử dụng @CompanyCode (không dùng @DvcsCode)
-- - Comments hỗ trợ reply qua ContentParent
-- - Watchers lưu trong WorkflowTaskAssignments với AssignmentType='WATCHER'
-- - Tất cả đều log vào WorkflowProjectActivities nếu task có ProjectId
-- ============================================================

PRINT '========================================';
PRINT 'Hoàn tất tạo stored procedures cho Task Comments và Watchers!';
PRINT '========================================';
GO
-- ============================================================
-- FILE: CREATE_Api_TaskReminder_CRUD.sql
-- MÔ TẢ: Tạo stored procedures để quản lý nhắc việc (reminders)
-- NGÀY: 2025-01-19
-- 
-- CÁC STORED PROCEDURES:
-- 1. Api_TaskReminder_Create: Tạo nhắc việc mới
-- 2. Api_TaskReminder_Update: Cập nhật nhắc việc
-- 3. Api_TaskReminder_Delete: Xóa nhắc việc
-- 4. Api_TaskReminder_List: Lấy danh sách nhắc việc
-- 5. Api_TaskReminder_Process: Xử lý và gửi nhắc việc (cho background job)
-- ============================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================
-- 1. Api_TaskReminder_Create: Tạo nhắc việc mới
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_Create;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_Create]
  @CompanyCode        NVARCHAR(50),
  @TaskId            BIGINT,
  @TaskMonth         CHAR(6),  -- yyyymm của task
  @UserId            INT,      -- Người nhận nhắc việc
  @Channel           NVARCHAR(20),  -- EMAIL, SMS, NOTIFICATION
  @ReminderTime      DATETIME,     -- Thời gian nhắc việc
  @Frequency         NVARCHAR(20) = 'ONCE',  -- ONCE, DAILY, WEEKLY, MONTHLY
  @TriggerCondition  NVARCHAR(30) = 'BEFORE_DUE',  -- BEFORE_DUE, AT_TIME, CUSTOM
  @Message           NVARCHAR(MAX) = NULL,   -- Nội dung nhắc việc
  @IsActive          BIT = 1,
  @CreatedBy         INT,
  @NewReminderId     INT = NULL OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra task tồn tại
    DECLARE @TaskTable NVARCHAR(100) = 'WorkflowTasks_' + @TaskMonth;
    DECLARE @TaskExists BIT = 0;
    DECLARE @DepId INT;
    DECLARE @ProjectId INT;
    DECLARE @TaskName NVARCHAR(255);
    DECLARE @sql NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TaskTable)
    BEGIN
      SELECT N'Bảng ' + @TaskTable + N' không tồn tại!' as message, 400 as status;
      RETURN;
    END
    
    -- Lấy thông tin task
    SET @sql = N'SELECT @DepIdOut = DepId, @ProjectIdOut = ProjectId, @TaskNameOut = TaskName 
    FROM dbo.' + QUOTENAME(@TaskTable) + N' 
    WHERE Id = @TaskId AND CompanyCode = @CompanyCode AND IsDeleted = 0 AND RecordStatus = 1;';
    
    EXEC sp_executesql @sql,
      N'@TaskId BIGINT, @CompanyCode NVARCHAR(50), @DepId INT OUTPUT, @ProjectId INT OUTPUT, @TaskName NVARCHAR(255) OUTPUT',
      @TaskId, @CompanyCode, @DepId OUTPUT, @ProjectId OUTPUT, @TaskName OUTPUT;
    
    IF @DepId IS NULL
    BEGIN
      SELECT N'Không tìm thấy task với ID: ' + CAST(@TaskId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Kiểm tra user tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowUsers WHERE Id = @UserId)
    BEGIN
      SELECT N'Không tìm thấy người dùng với ID: ' + CAST(@UserId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Insert reminder vào WorkflowReminders
    INSERT INTO dbo.WorkflowReminders (
      CompanyCode, DepId, TargetType, TargetId, UserId, Channel, 
      Frequency, TriggerCondition, ReminderTime, IsActive, 
      IsDeleted, user_id0, RecordStatus
    )
    VALUES (
      @CompanyCode, @DepId, 'TASK', @TaskId, @UserId, @Channel,
      @Frequency, @TriggerCondition, @ReminderTime, @IsActive,
      0, @CreatedBy, 1
    );
    
    SET @NewReminderId = SCOPE_IDENTITY();
    
    -- Log activity vào WorkflowProjectActivities (nếu có ProjectId)
    IF @ProjectId IS NOT NULL
    BEGIN
      DECLARE @ChannelLabel NVARCHAR(50) = 
        CASE @Channel
          WHEN 'EMAIL' THEN N'Email'
          WHEN 'SMS' THEN N'SMS'
          WHEN 'NOTIFICATION' THEN N'Thông báo hệ thống'
          ELSE @Channel
        END;
      
      DECLARE @FrequencyLabel NVARCHAR(50) = 
        CASE @Frequency
          WHEN 'ONCE' THEN N'Một lần'
          WHEN 'DAILY' THEN N'Hàng ngày'
          WHEN 'WEEKLY' THEN N'Hàng tuần'
          WHEN 'MONTHLY' THEN N'Hàng tháng'
          ELSE @Frequency
        END;
      
      INSERT INTO dbo.WorkflowProjectActivities (
        CompanyCode, ProjectId, ActivityType, Description, TriggeredBy, DepId
      )
      VALUES (
        @CompanyCode, @ProjectId, 'REMINDER_CREATED',
        N'Đã tạo nhắc việc cho: ' + ISNULL(@TaskName, N'Task #' + CAST(@TaskId AS NVARCHAR(20))) + 
        N' (Kênh: ' + @ChannelLabel + N', Tần suất: ' + @FrequencyLabel + 
        N', Thời gian: ' + CONVERT(NVARCHAR(20), @ReminderTime, 103) + N' ' + CONVERT(NVARCHAR(20), @ReminderTime, 108) + N')',
        @CreatedBy, ''
      );
    END
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin reminder đã tạo
    SELECT 
      @NewReminderId AS ReminderId,
      @TaskId AS TaskId,
      @TaskName AS TaskName,
      @UserId AS UserId,
      @Channel AS Channel,
      @ReminderTime AS ReminderTime,
      @Frequency AS Frequency,
      'CREATED' AS Status;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskReminder_Create';
GO

-- ============================================================
-- 2. Api_TaskReminder_List: Lấy danh sách nhắc việc
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_List') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_List;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_List]
  @CompanyCode    NVARCHAR(50),
  @TaskId         BIGINT = NULL,  -- Filter theo task
  @UserId         INT = NULL,     -- Filter theo user
  @IsActive       BIT = NULL,     -- Filter theo trạng thái
  @PageIndex      INT = 1,
  @PageSize       INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    
    -- Danh sách reminders
    SELECT 
      r.Id AS ReminderId,
      r.TargetId AS TaskId,
      r.UserId,
      u.FullName AS UserName,
      u.Email AS UserEmail,
      r.Channel,
      r.Frequency,
      r.TriggerCondition,
      r.ReminderTime,
      r.IsActive,
      r.LastSent,
      r.datetime0 AS CreatedDate,
      r.datetime2 AS UpdatedDate
    FROM dbo.WorkflowReminders r
    LEFT JOIN dbo.WorkflowUsers u ON r.UserId = u.Id
    WHERE r.CompanyCode = @CompanyCode
      AND r.TargetType = 'TASK'
      AND r.IsDeleted = 0
      AND r.RecordStatus = 1
      AND (@TaskId IS NULL OR r.TargetId = @TaskId)
      AND (@UserId IS NULL OR r.UserId = @UserId)
      AND (@IsActive IS NULL OR r.IsActive = @IsActive)
    ORDER BY r.ReminderTime ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Tổng số bản ghi
    SELECT COUNT(*) AS TotalCount
    FROM dbo.WorkflowReminders r
    WHERE r.CompanyCode = @CompanyCode
      AND r.TargetType = 'TASK'
      AND r.IsDeleted = 0
      AND r.RecordStatus = 1
      AND (@TaskId IS NULL OR r.TargetId = @TaskId)
      AND (@UserId IS NULL OR r.UserId = @UserId)
      AND (@IsActive IS NULL OR r.IsActive = @IsActive);
    
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskReminder_List';
GO

-- ============================================================
-- 3. Api_TaskReminder_Update: Cập nhật nhắc việc
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_Update') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_Update;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_Update]
  @CompanyCode        NVARCHAR(50),
  @ReminderId         INT,
  @Channel            NVARCHAR(20) = NULL,
  @ReminderTime       DATETIME = NULL,
  @Frequency           NVARCHAR(20) = NULL,
  @TriggerCondition    NVARCHAR(30) = NULL,
  @IsActive            BIT = NULL,
  @UpdatedBy           INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra reminder tồn tại
    IF NOT EXISTS (
      SELECT 1 FROM dbo.WorkflowReminders 
      WHERE Id = @ReminderId 
        AND CompanyCode = @CompanyCode 
        AND IsDeleted = 0
    )
    BEGIN
      SELECT N'Không tìm thấy nhắc việc với ID: ' + CAST(@ReminderId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Update reminder
    UPDATE dbo.WorkflowReminders
    SET 
      Channel = COALESCE(@Channel, Channel),
      ReminderTime = COALESCE(@ReminderTime, ReminderTime),
      Frequency = COALESCE(@Frequency, Frequency),
      TriggerCondition = COALESCE(@TriggerCondition, TriggerCondition),
      IsActive = COALESCE(@IsActive, IsActive),
      datetime2 = SYSDATETIME(),
      user_id2 = @UpdatedBy
    WHERE Id = @ReminderId
      AND CompanyCode = @CompanyCode;
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã cập nhật
    SELECT 
      Id AS ReminderId,
      TargetId AS TaskId,
      UserId,
      Channel,
      ReminderTime,
      Frequency,
      IsActive,
      'UPDATED' AS Status
    FROM dbo.WorkflowReminders
    WHERE Id = @ReminderId;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskReminder_Update';
GO

-- ============================================================
-- 4. Api_TaskReminder_Delete: Xóa nhắc việc
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_Delete;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_Delete]
  @CompanyCode        NVARCHAR(50),
  @ReminderId         INT,
  @DeletedBy          INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    -- Kiểm tra reminder tồn tại
    DECLARE @TaskId INT;
    DECLARE @ProjectId INT;
    
    SELECT @TaskId = TargetId
    FROM dbo.WorkflowReminders
    WHERE Id = @ReminderId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0;
    
    IF @TaskId IS NULL
    BEGIN
      SELECT N'Không tìm thấy nhắc việc với ID: ' + CAST(@ReminderId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    -- Lấy ProjectId từ task (cần yyyymm, nhưng có thể lấy từ reminder hoặc query)
    -- Tạm thời bỏ qua ProjectId cho log, hoặc có thể thêm vào WorkflowReminders
    
    BEGIN TRANSACTION;
    
    -- Soft delete
    UPDATE dbo.WorkflowReminders
    SET 
      IsDeleted = 1,
      RecordStatus = 0,
      datetime2 = SYSDATETIME(),
      user_id2 = @DeletedBy
    WHERE Id = @ReminderId
      AND CompanyCode = @CompanyCode;
    
    COMMIT TRANSACTION;
    
    -- Trả về thông tin đã xóa
    SELECT 
      @ReminderId AS ReminderId,
      @TaskId AS TaskId,
      'DELETED' AS Status;
    
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskReminder_Delete';
GO

-- ============================================================
-- 5. Api_TaskReminder_Process: Xử lý và gửi nhắc việc (cho background job)
-- ============================================================
-- Stored procedure này được gọi bởi background service/job
-- để check và gửi reminders đã đến thời gian
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_Process') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_Process;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_Process]
  @CompanyCode        NVARCHAR(50) = NULL,  -- NULL = tất cả companies
  @ProcessTime        DATETIME = NULL       -- NULL = GETDATE()
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    IF @ProcessTime IS NULL
      SET @ProcessTime = GETDATE();
    
    -- Lấy danh sách reminders cần gửi
    -- Điều kiện:
    -- 1. IsActive = 1
    -- 2. ReminderTime <= @ProcessTime
    -- 3. (LastSent IS NULL OR LastSent < ReminderTime) - chưa gửi hoặc đã đến lúc gửi lại
    -- 4. Frequency = ONCE: chỉ gửi 1 lần
    -- 5. Frequency = DAILY/WEEKLY/MONTHLY: gửi theo tần suất
    
    SELECT 
      r.Id AS ReminderId,
      r.CompanyCode,
      r.TargetId AS TaskId,
      r.UserId,
      u.FullName AS UserName,
      u.Email AS UserEmail,
      r.Channel,
      r.Frequency,
      r.ReminderTime,
      r.TriggerCondition
    FROM dbo.WorkflowReminders r
    INNER JOIN dbo.WorkflowUsers u ON r.UserId = u.Id
    WHERE r.IsDeleted = 0
      AND r.RecordStatus = 1
      AND r.IsActive = 1
      AND (@CompanyCode IS NULL OR r.CompanyCode = @CompanyCode)
      AND r.ReminderTime <= @ProcessTime
      AND (
        -- Chưa gửi lần nào
        r.LastSent IS NULL
        OR
        -- Đã đến lúc gửi lại (theo frequency)
        (
          r.Frequency = 'DAILY' AND DATEDIFF(DAY, r.LastSent, @ProcessTime) >= 1
          OR
          r.Frequency = 'WEEKLY' AND DATEDIFF(WEEK, r.LastSent, @ProcessTime) >= 1
          OR
          r.Frequency = 'MONTHLY' AND DATEDIFF(MONTH, r.LastSent, @ProcessTime) >= 1
        )
      )
      AND (
        -- ONCE: chỉ gửi nếu chưa gửi
        (r.Frequency = 'ONCE' AND r.LastSent IS NULL)
        OR
        -- DAILY/WEEKLY/MONTHLY: gửi theo tần suất
        (r.Frequency IN ('DAILY', 'WEEKLY', 'MONTHLY'))
      )
    ORDER BY r.ReminderTime ASC;
    
    -- Background service sẽ:
    -- 1. Gọi stored procedure này để lấy danh sách reminders cần gửi
    -- 2. Gửi notification/email/SMS cho từng reminder
    -- 3. Cập nhật LastSent = GETDATE() sau khi gửi thành công
    -- 4. Nếu Frequency = 'ONCE', có thể set IsActive = 0 sau khi gửi
    
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

PRINT 'Đã tạo stored procedure: Api_TaskReminder_Process';
GO

-- ============================================================
-- 6. Api_TaskReminder_MarkSent: Đánh dấu reminder đã gửi
-- ============================================================
-- Background service gọi sau khi gửi thành công
-- ============================================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_TaskReminder_MarkSent') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_TaskReminder_MarkSent;
GO

CREATE PROCEDURE [dbo].[Api_TaskReminder_MarkSent]
  @CompanyCode        NVARCHAR(50),
  @ReminderId         INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    UPDATE dbo.WorkflowReminders
    SET 
      LastSent = GETDATE(),
      -- Nếu Frequency = ONCE, tắt reminder sau khi gửi
      IsActive = CASE WHEN Frequency = 'ONCE' THEN 0 ELSE IsActive END,
      datetime2 = SYSDATETIME()
    WHERE Id = @ReminderId
      AND CompanyCode = @CompanyCode
      AND IsDeleted = 0;
    
    IF @@ROWCOUNT = 0
    BEGIN
      SELECT N'Không tìm thấy reminder với ID: ' + CAST(@ReminderId AS NVARCHAR) as message, 400 as status;
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

PRINT 'Đã tạo stored procedure: Api_TaskReminder_MarkSent';
GO

-- ============================================================
-- TÓM TẮT:
-- ============================================================
-- 1. Api_TaskReminder_Create: Tạo nhắc việc mới (log REMINDER_CREATED)
-- 2. Api_TaskReminder_List: Lấy danh sách nhắc việc với filter và pagination
-- 3. Api_TaskReminder_Update: Cập nhật nhắc việc
-- 4. Api_TaskReminder_Delete: Xóa nhắc việc (soft delete)
-- 5. Api_TaskReminder_Process: Lấy danh sách reminders cần gửi (cho background job)
-- 6. Api_TaskReminder_MarkSent: Đánh dấu reminder đã gửi
-- ============================================================
-- VỀ REALTIME:
-- ============================================================
-- ❌ KHÔNG CẦN REALTIME cho việc TẠO reminder:
--    - User tạo reminder → Lưu vào DB → Xong
--    - Không cần realtime notification khi tạo
--
-- ✅ CẦN BACKGROUND JOB để XỬ LÝ reminders:
--    - Background service chạy định kỳ (mỗi phút/5 phút)
--    - Gọi Api_TaskReminder_Process để lấy reminders cần gửi
--    - Gửi notification/email/SMS
--    - Gọi Api_TaskReminder_MarkSent để đánh dấu đã gửi
--
-- ✅ CÓ THỂ DÙNG REALTIME cho NHẬN notification:
--    - Khi background job gửi notification, có thể push realtime đến frontend
--    - Frontend dùng WebSocket/SSE để nhận notification realtime
--    - Hoặc frontend polling để check notification mới
-- ============================================================
-- HƯỚNG DẪN TRIỂN KHAI:
-- ============================================================
-- 1. Backend API:
--    - Endpoint tạo reminder: Gọi Api_TaskReminder_Create
--    - Endpoint list reminders: Gọi Api_TaskReminder_List
--    - Endpoint update/delete: Gọi Api_TaskReminder_Update/Delete
--
-- 2. Background Service (Node.js/C#/Python):
--    - Chạy định kỳ (cron job hoặc scheduled task)
--    - Mỗi phút: Gọi Api_TaskReminder_Process
--    - Với mỗi reminder trả về:
--      a. Gửi notification vào WorkflowNotifications
--      b. Nếu Channel = EMAIL: Gửi email
--      c. Nếu Channel = SMS: Gửi SMS
--      d. Gọi Api_TaskReminder_MarkSent để đánh dấu đã gửi
--
-- 3. Frontend:
--    - Tạo reminder: Gọi API → Lưu vào DB → Hiển thị success
--    - Nhận notification: Polling hoặc WebSocket để nhận notification mới
--    - Hiển thị notification realtime khi có
-- ============================================================

PRINT '========================================';
PRINT 'Hoàn tất tạo stored procedures cho Task Reminders!';
PRINT '========================================';
GO
