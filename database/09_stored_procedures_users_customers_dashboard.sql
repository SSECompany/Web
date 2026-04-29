/*
  Workflow Multi-Tenant Database - USERS, CUSTOMERS, DASHBOARD & DROPDOWN STORED PROCEDURES
  File này bao gồm các stored procedures cho:
  - Users: Quản lý người dùng
  - Customers: CRUD khách hàng
  - Dashboard: Thống kê
  - Dropdown: Dữ liệu cho dropdown/select
  
  LƯU Ý:
  - Tất cả SPs đều yêu cầu @CompanyCode để filter theo công ty
  - Không sử dụng CompanyId, chỉ dùng CompanyCode
*/

------------------------------------------------------------
-- USERS STORED PROCEDURES
------------------------------------------------------------

-- 1. Api_UsersList_Load: Lấy danh sách users với phân trang, tìm kiếm
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UsersList_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UsersList_Load;
GO
CREATE PROCEDURE dbo.Api_UsersList_Load
  @CompanyCode   NVARCHAR(50),
  @OrgUnitId  INT = NULL,
  @Status     NVARCHAR(20) = 'ACTIVE',
  @SearchKey  NVARCHAR(255) = NULL,
  @PageIndex  INT = 1,
  @PageSize   INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
  
  SELECT
    u.Id,
    u.EmployeeCode,
    u.FullName,
    u.Email,
    u.Phone,
    u.Title,
    u.OrgUnitId,
    org.UnitName AS OrgUnitName,
    u.Status,
    u.IsAdmin,
    u.IsSup,
    u.AvatarUrl
  FROM dbo.WorkflowUsers u
  LEFT JOIN dbo.WorkflowOrgUnits org ON u.OrgUnitId = org.Id
  WHERE u.CompanyCode = @CompanyCode
    AND u.IsDeleted = 0
    AND u.RecordStatus = 1
    AND (@Status IS NULL OR u.Status = @Status)
    AND (@OrgUnitId IS NULL OR u.OrgUnitId = @OrgUnitId)
    AND (@SearchKey IS NULL OR u.FullName LIKE '%' + @SearchKey + '%' OR u.EmployeeCode LIKE '%' + @SearchKey + '%' OR u.Email LIKE '%' + @SearchKey + '%')
  ORDER BY u.FullName
  OFFSET @Offset ROWS
  FETCH NEXT @PageSize ROWS ONLY;
  
  SELECT COUNT(*) AS TotalCount
  FROM dbo.WorkflowUsers u
  WHERE u.CompanyCode = @CompanyCode
    AND u.IsDeleted = 0
    AND u.RecordStatus = 1
    AND (@Status IS NULL OR u.Status = @Status)
    AND (@OrgUnitId IS NULL OR u.OrgUnitId = @OrgUnitId)
    AND (@SearchKey IS NULL OR u.FullName LIKE '%' + @SearchKey + '%' OR u.EmployeeCode LIKE '%' + @SearchKey + '%' OR u.Email LIKE '%' + @SearchKey + '%');
END;
GO

-- 2. Api_UserDetail_Load: Lấy chi tiết user
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserDetail_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserDetail_Load;
GO
CREATE PROCEDURE dbo.Api_UserDetail_Load
  @CompanyCode NVARCHAR(50),
  @UserId   INT
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    u.Id,
    u.EmployeeCode,
    u.FullName,
    u.Email,
    u.Phone,
    u.Title,
    u.OrgUnitId,
    org.UnitName AS OrgUnitName,
    u.Status,
    u.IsAdmin,
    u.IsSup,
    u.AvatarUrl,
    u.datetime0 AS CreatedDate,
    u.datetime2 AS UpdatedDate
  FROM dbo.WorkflowUsers u
  LEFT JOIN dbo.WorkflowOrgUnits org ON u.OrgUnitId = org.Id
  WHERE u.CompanyCode = @CompanyCode
    AND u.Id = @UserId
    AND u.IsDeleted = 0;
END;
GO

------------------------------------------------------------
-- CUSTOMERS STORED PROCEDURES
------------------------------------------------------------

-- 3. Api_CustomersList_Load: Lấy danh sách khách hàng
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_CustomersList_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_CustomersList_Load;
GO
CREATE PROCEDURE dbo.Api_CustomersList_Load
  @CompanyCode   NVARCHAR(50),
  @Status     NVARCHAR(20) = NULL,
  @SearchKey  NVARCHAR(255) = NULL,
  @PageIndex  INT = 1,
  @PageSize   INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
  
  SELECT
    Id,
    CustomerCode,
    CustomerName,
    ContactName,
    Email,
    Phone,
    Address,
    TaxCode,
    Status,
    Notes,
    datetime0 AS CreatedDate
  FROM dbo.WorkflowCustomers
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND RecordStatus = 1
    AND (@Status IS NULL OR Status = @Status)
    AND (@SearchKey IS NULL OR CustomerName LIKE '%' + @SearchKey + '%' OR CustomerCode LIKE '%' + @SearchKey + '%' OR ContactName LIKE '%' + @SearchKey + '%')
  ORDER BY CustomerName
  OFFSET @Offset ROWS
  FETCH NEXT @PageSize ROWS ONLY;
  
  SELECT COUNT(*) AS TotalCount
  FROM dbo.WorkflowCustomers
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND RecordStatus = 1
    AND (@Status IS NULL OR Status = @Status)
    AND (@SearchKey IS NULL OR CustomerName LIKE '%' + @SearchKey + '%' OR CustomerCode LIKE '%' + @SearchKey + '%' OR ContactName LIKE '%' + @SearchKey + '%');
END;
GO

-- 4. Api_Customer_Create: Tạo khách hàng mới (auto-generate CustomerCode)
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Customer_Create') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Customer_Create;
GO
CREATE PROCEDURE dbo.Api_Customer_Create
  @CompanyCode     NVARCHAR(50),
  @CustomerCode NVARCHAR(50) = NULL,  -- Optional: NULL = auto-generate
  @CustomerName NVARCHAR(255),
  @ContactName  NVARCHAR(255) = NULL,
  @Email        NVARCHAR(255) = NULL,
  @Phone        NVARCHAR(50) = NULL,
  @Address      NVARCHAR(500) = NULL,
  @TaxCode      NVARCHAR(50) = NULL,
  @Notes        NVARCHAR(MAX) = NULL,
  @CreatedBy    INT,
  @NewCustomerId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    DECLARE @CompanyId INT;
    
    SELECT @CompanyId = Id FROM dbo.WorkflowCompanies WHERE CompanyCode = @CompanyCode;
    IF @CompanyId IS NULL
    BEGIN
      SELECT N'Không tìm thấy công ty với mã: ' + @CompanyCode as message, 400 as status;
      RETURN;
    END
    
    IF @CustomerCode IS NULL OR @CustomerCode = ''
    BEGIN
      DECLARE @MaxSeq INT = 0;
      SELECT @MaxSeq = ISNULL(MAX(CAST(SUBSTRING(CustomerCode, 5, 10) AS INT)), 0)
      FROM dbo.WorkflowCustomers
      WHERE CompanyCode = @CompanyCode
        AND CustomerCode LIKE 'CUS-%';
      
      SET @CustomerCode = 'CUS-' + RIGHT('00000' + CAST(@MaxSeq + 1 AS NVARCHAR), 5);
    END
    
    INSERT INTO dbo.WorkflowCustomers (
      CompanyId, CompanyCode, CustomerCode, CustomerName, ContactName,
      Email, Phone, Address, TaxCode, Notes, user_id0
    )
    VALUES (
      @CompanyId, @CompanyCode, @CustomerCode, @CustomerName, @ContactName,
      @Email, @Phone, @Address, @TaxCode, @Notes, @CreatedBy
    );
    
    SET @NewCustomerId = SCOPE_IDENTITY();
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

-- 5. Api_Customer_Update: Cập nhật khách hàng
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Customer_Update') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Customer_Update;
GO
CREATE PROCEDURE dbo.Api_Customer_Update
  @CompanyCode     NVARCHAR(50),
  @CustomerId   INT,
  @CustomerName NVARCHAR(255) = NULL,
  @ContactName  NVARCHAR(255) = NULL,
  @Email        NVARCHAR(255) = NULL,
  @Phone        NVARCHAR(50) = NULL,
  @Address      NVARCHAR(500) = NULL,
  @TaxCode      NVARCHAR(50) = NULL,
  @Status       NVARCHAR(20) = NULL,
  @Notes        NVARCHAR(MAX) = NULL,
  @UpdatedBy    INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowCustomers WHERE Id = @CustomerId AND CompanyCode = @CompanyCode AND IsDeleted = 0)
    BEGIN
      SELECT N'Không tìm thấy khách hàng với ID: ' + CAST(@CustomerId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    UPDATE dbo.WorkflowCustomers
    SET
      CustomerName = ISNULL(@CustomerName, CustomerName),
      ContactName = ISNULL(@ContactName, ContactName),
      Email = ISNULL(@Email, Email),
      Phone = ISNULL(@Phone, Phone),
      Address = ISNULL(@Address, Address),
      TaxCode = ISNULL(@TaxCode, TaxCode),
      Status = ISNULL(@Status, Status),
      Notes = ISNULL(@Notes, Notes),
      datetime2 = SYSDATETIME(),
      user_id2 = @UpdatedBy
    WHERE Id = @CustomerId AND CompanyCode = @CompanyCode;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

-- 6. Api_Customer_Delete: Xóa mềm khách hàng
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Customer_Delete') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Customer_Delete;
GO
CREATE PROCEDURE dbo.Api_Customer_Delete
  @CompanyCode   NVARCHAR(50),
  @CustomerId INT,
  @DeletedBy  INT
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM dbo.WorkflowCustomers WHERE Id = @CustomerId AND CompanyCode = @CompanyCode AND IsDeleted = 0)
    BEGIN
      SELECT N'Không tìm thấy khách hàng với ID: ' + CAST(@CustomerId AS NVARCHAR) as message, 400 as status;
      RETURN;
    END
    
    UPDATE dbo.WorkflowCustomers
    SET IsDeleted = 1, RecordStatus = 0, datetime2 = SYSDATETIME(), user_id2 = @DeletedBy
    WHERE Id = @CustomerId AND CompanyCode = @CompanyCode;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    SELECT @ErrorMessage as message, 400 as status;
    RETURN;
  END CATCH
END;
GO

-- 7. Api_CustomerDetail_Load: Lấy chi tiết khách hàng
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_CustomerDetail_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_CustomerDetail_Load;
GO
CREATE PROCEDURE dbo.Api_CustomerDetail_Load
  @CompanyCode   NVARCHAR(50),
  @CustomerId INT
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    Id,
    CustomerCode,
    CustomerName,
    ContactName,
    Email,
    Phone,
    Address,
    TaxCode,
    Status,
    Notes,
    datetime0 AS CreatedDate,
    datetime2 AS UpdatedDate
  FROM dbo.WorkflowCustomers
  WHERE CompanyCode = @CompanyCode
    AND Id = @CustomerId
    AND IsDeleted = 0;
END;
GO

------------------------------------------------------------
-- DASHBOARD STORED PROCEDURES
------------------------------------------------------------

-- 8. Api_Dashboard_ProjectStats: Thống kê dự án cho dashboard
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dashboard_ProjectStats') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dashboard_ProjectStats;
GO
CREATE PROCEDURE dbo.Api_Dashboard_ProjectStats
  @CompanyCode NVARCHAR(50),
  @UserId   INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Tổng quan dự án
  SELECT
    COUNT(*) AS TotalProjects,
    SUM(CASE WHEN Status = 'PLANNING' THEN 1 ELSE 0 END) AS Planning,
    SUM(CASE WHEN Status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS InProgress,
    SUM(CASE WHEN Status = 'ON_HOLD' THEN 1 ELSE 0 END) AS OnHold,
    SUM(CASE WHEN Status = 'COMPLETED' THEN 1 ELSE 0 END) AS Completed,
    SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS Cancelled,
    SUM(CASE WHEN HealthStatus = 'GOOD' THEN 1 ELSE 0 END) AS HealthGood,
    SUM(CASE WHEN HealthStatus = 'AT_RISK' THEN 1 ELSE 0 END) AS HealthAtRisk,
    SUM(CASE WHEN HealthStatus = 'CRITICAL' THEN 1 ELSE 0 END) AS HealthCritical,
    SUM(ISNULL(Budget, 0)) AS TotalBudget,
    SUM(ISNULL(BudgetUsed, 0)) AS TotalBudgetUsed,
    AVG(ISNULL(Progress, 0)) AS AvgProgress
  FROM dbo.WorkflowProjects
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND (@UserId IS NULL OR ProjectManagerId = @UserId OR Id IN (
      SELECT ProjectId FROM dbo.WorkflowProjectMembers WHERE UserId = @UserId AND IsDeleted = 0
    ));
  
  -- Dự án sắp đến hạn (7 ngày tới)
  SELECT
    Id,
    ProjectCode,
    ProjectName,
    Status,
    Priority,
    Progress,
    EndDate,
    DATEDIFF(DAY, GETDATE(), EndDate) AS DaysRemaining
  FROM dbo.WorkflowProjects
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND Status NOT IN ('COMPLETED', 'CANCELLED')
    AND EndDate BETWEEN GETDATE() AND DATEADD(DAY, 7, GETDATE())
    AND (@UserId IS NULL OR ProjectManagerId = @UserId OR Id IN (
      SELECT ProjectId FROM dbo.WorkflowProjectMembers WHERE UserId = @UserId AND IsDeleted = 0
    ))
  ORDER BY EndDate;
  
  -- Dự án quá hạn
  SELECT
    Id,
    ProjectCode,
    ProjectName,
    Status,
    Priority,
    Progress,
    EndDate,
    DATEDIFF(DAY, EndDate, GETDATE()) AS DaysOverdue
  FROM dbo.WorkflowProjects
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND Status NOT IN ('COMPLETED', 'CANCELLED')
    AND EndDate < GETDATE()
    AND (@UserId IS NULL OR ProjectManagerId = @UserId OR Id IN (
      SELECT ProjectId FROM dbo.WorkflowProjectMembers WHERE UserId = @UserId AND IsDeleted = 0
    ))
  ORDER BY EndDate;
END;
GO

-- 9. Api_Dashboard_RecentActivities: Lấy hoạt động gần đây
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dashboard_RecentActivities') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dashboard_RecentActivities;
GO
CREATE PROCEDURE dbo.Api_Dashboard_RecentActivities
  @CompanyCode NVARCHAR(50),
  @UserId   INT = NULL,
  @Limit    INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT TOP (@Limit)
    'PROJECT' AS EntityType,
    a.ProjectId AS EntityId,
    p.ProjectCode AS EntityCode,
    p.ProjectName AS EntityName,
    a.ActivityType,
    a.Description,
    a.TriggeredBy,
    u.FullName AS TriggeredByName,
    u.AvatarUrl,
    a.datetime0 AS ActivityDate
  FROM dbo.WorkflowProjectActivities a
  INNER JOIN dbo.WorkflowProjects p ON a.ProjectId = p.Id
  LEFT JOIN dbo.WorkflowUsers u ON a.TriggeredBy = u.Id
  WHERE a.CompanyCode = @CompanyCode
    AND (@UserId IS NULL OR a.TriggeredBy = @UserId OR p.ProjectManagerId = @UserId)
  ORDER BY a.datetime0 DESC;
END;
GO

------------------------------------------------------------
-- DROPDOWN STORED PROCEDURES
------------------------------------------------------------

-- 10. Api_Dropdown_ProjectManagers: Lấy danh sách quản lý dự án cho dropdown
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dropdown_ProjectManagers') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dropdown_ProjectManagers;
GO
CREATE PROCEDURE dbo.Api_Dropdown_ProjectManagers
  @CompanyCode NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    Id AS value,
    FullName AS label,
    Email,
    AvatarUrl
  FROM dbo.WorkflowUsers
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND RecordStatus = 1
    AND Status = 'ACTIVE'
  ORDER BY FullName;
END;
GO

-- 11. Api_Dropdown_Customers: Lấy danh sách khách hàng cho dropdown
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dropdown_Customers') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dropdown_Customers;
GO
CREATE PROCEDURE dbo.Api_Dropdown_Customers
  @CompanyCode NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    Id AS value,
    CustomerName AS label,
    CustomerCode,
    ContactName,
    Email,
    Phone
  FROM dbo.WorkflowCustomers
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND RecordStatus = 1
    AND Status = 'ACTIVE'
  ORDER BY CustomerName;
END;
GO

-- 12. Api_Dropdown_OrgUnits: Lấy danh sách phòng ban cho dropdown
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dropdown_OrgUnits') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dropdown_OrgUnits;
GO
CREATE PROCEDURE dbo.Api_Dropdown_OrgUnits
  @CompanyCode NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    Id AS value,
    UnitName AS label,
    UnitCode,
    ParentId,
    Level
  FROM dbo.WorkflowOrgUnits
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND IsActive = 1
  ORDER BY Level, UnitName;
END;
GO

-- 13. Api_Dropdown_Projects: Lấy danh sách dự án cho dropdown
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_Dropdown_Projects') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_Dropdown_Projects;
GO
CREATE PROCEDURE dbo.Api_Dropdown_Projects
  @CompanyCode NVARCHAR(50),
  @Status   NVARCHAR(30) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT
    Id AS value,
    ProjectName AS label,
    ProjectCode,
    Status,
    Priority
  FROM dbo.WorkflowProjects
  WHERE CompanyCode = @CompanyCode
    AND IsDeleted = 0
    AND (@Status IS NULL OR Status = @Status)
  ORDER BY ProjectName;
END;
GO

------------------------------------------------------------
-- USER PROJECT TASKS STORED PROCEDURES
------------------------------------------------------------

-- 14. Api_UserProjectTasks_Load: Lấy danh sách công việc của user trong project
GO
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Api_UserProjectTasks_Load') AND type in (N'P', N'PC'))
  DROP PROCEDURE dbo.Api_UserProjectTasks_Load;
GO
CREATE PROCEDURE [dbo].[Api_UserProjectTasks_Load]
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
