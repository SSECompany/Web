/*
  Workflow Multi-Tenant Database - CREATE TABLES, INDEXES, FUNCTIONS & SECURITY
  File này bao gồm:
  - Tất cả các bảng cơ sở dữ liệu
  - Tất cả indexes để tối ưu hiệu suất
  - Functions hỗ trợ Row-Level Security
  - Security Policies (RLS) để bảo vệ dữ liệu đa tenant
  
  LƯU Ý:
  - Bảng Tasks Master và Detail được tạo theo tháng (sử dụng SP sp_CreateMonthlyTaskTables)
  - Tất cả bảng đều có CompanyId và DvcsCode để hỗ trợ multi-tenant
  - Indexes đều bắt đầu bằng DvcsCode để tối ưu filter theo tenant
*/

------------------------------------------------------------
-- Companies / DVCS
------------------------------------------------------------
CREATE TABLE dbo.WorkflowCompanies (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  DvcsCode     NVARCHAR(50) NOT NULL UNIQUE,
  Name         NVARCHAR(255) NOT NULL,
  Domain       NVARCHAR(255) NULL,
  IsActive     BIT NOT NULL DEFAULT(1),
  CreatedBy    NVARCHAR(255) NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL
);

------------------------------------------------------------
-- Customers (Khách hàng)
------------------------------------------------------------
CREATE TABLE dbo.WorkflowCustomers (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,  -- Giữ lại để tương thích FK, nhưng không dùng trong stored procedures
  CompanyCode  NVARCHAR(50) NOT NULL,
  CustomerCode NVARCHAR(50) NOT NULL,  -- Auto-generate: CUS-00001
  CustomerName NVARCHAR(255) NOT NULL,
  ContactName  NVARCHAR(255) NULL,  -- Tên người liên hệ
  Email        NVARCHAR(255) NULL,
  Phone        NVARCHAR(50) NULL,
  Address      NVARCHAR(500) NULL,  -- Địa chỉ
  TaxCode      NVARCHAR(50) NULL,  -- Mã số thuế
  Status       NVARCHAR(20) NOT NULL DEFAULT('ACTIVE'),
  Notes        NVARCHAR(MAX) NULL,  -- Ghi chú
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowCustomers_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowCustomers_Code UNIQUE (CompanyCode, CustomerCode)
);

CREATE INDEX IX_WorkflowCustomers_CompanyCode ON dbo.WorkflowCustomers(CompanyCode, Status);
CREATE INDEX IX_WorkflowCustomers_Name ON dbo.WorkflowCustomers(CustomerName);
GO

------------------------------------------------------------
-- Master data & security
------------------------------------------------------------
CREATE TABLE dbo.WorkflowOrgUnits (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  ParentId     INT NULL,
  UnitCode     NVARCHAR(50) NOT NULL,
  UnitName     NVARCHAR(255) NOT NULL,
  Level        INT NOT NULL DEFAULT(1),
  IsActive     BIT NOT NULL DEFAULT(1),
  CreatedBy    NVARCHAR(255) NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowOrgUnits_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT FK_WorkflowOrgUnits_Parent  FOREIGN KEY (ParentId) REFERENCES dbo.WorkflowOrgUnits(Id),
  CONSTRAINT UQ_WorkflowOrgUnits UNIQUE (DvcsCode, UnitCode)
);

CREATE TABLE dbo.WorkflowUsers (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  EmployeeCode NVARCHAR(50) NOT NULL,
  FullName     NVARCHAR(255) NOT NULL,
  Email        NVARCHAR(255) NOT NULL,
  Phone        NVARCHAR(20) NULL,
  OrgUnitId    INT NOT NULL,
  Title        NVARCHAR(255) NULL,
  Status       NVARCHAR(20) NOT NULL DEFAULT('ACTIVE'),
  AvatarUrl    NVARCHAR(500) NULL,
  IsAdmin      BIT NOT NULL DEFAULT(0),  -- Trường mới: Admin (Yes/no)
  IsSup        BIT NOT NULL DEFAULT(0),  -- Trường mới: SUP (Supervisor)
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowUsers_Company  FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT FK_WorkflowUsers_OrgUnit  FOREIGN KEY (OrgUnitId) REFERENCES dbo.WorkflowOrgUnits(Id),
  CONSTRAINT UQ_WorkflowUsers_EmpCode  UNIQUE (DvcsCode, EmployeeCode),
  CONSTRAINT UQ_WorkflowUsers_Email    UNIQUE (DvcsCode, Email)
);

CREATE TABLE dbo.WorkflowUserRoles (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  UserId       INT NOT NULL,
  RoleCode     NVARCHAR(50) NOT NULL,
  ScopeType    NVARCHAR(20) NOT NULL DEFAULT('ORG'),
  ScopeId      INT NULL,
  GrantedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowUserRoles_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowUserRoles_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowUserRoles UNIQUE (DvcsCode, UserId, RoleCode, ScopeType, ScopeId)
);

------------------------------------------------------------
-- Projects
------------------------------------------------------------
CREATE TABLE dbo.WorkflowProjects (
  Id               INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId        INT NOT NULL,  -- Giữ lại để tương thích FK, nhưng không dùng trong stored procedures
  CompanyCode      NVARCHAR(50) NOT NULL,  -- Đổi từ DvcsCode thành CompanyCode
  ProjectCode      NVARCHAR(50) NOT NULL,
  ProjectName      NVARCHAR(255) NOT NULL,
  Status           NVARCHAR(30) NOT NULL DEFAULT('PLANNING'),
  Priority         NVARCHAR(20) NOT NULL DEFAULT('MEDIUM'),
  ProjectManagerId INT NOT NULL,
  OrgUnitId        INT NOT NULL,
  ClientName       NVARCHAR(255) NULL,
  HealthStatus     NVARCHAR(20) NOT NULL DEFAULT('GOOD'),
  Progress         DECIMAL(5,2) NOT NULL DEFAULT(0),
  StartDate        DATETIME NOT NULL,
  EndDate          DATETIME NOT NULL,
  Budget           DECIMAL(18,2) NULL,
  BudgetUsed       DECIMAL(18,2) NOT NULL DEFAULT(0),
  Description      NVARCHAR(MAX) NULL,
  EstimatedHours   DECIMAL(10,2) NULL,  -- Số giờ ước tính
  ActualHours      DECIMAL(10,2) NULL DEFAULT(0),  -- Số giờ thực tế
  Notes            NVARCHAR(MAX) NULL,  -- Ghi chú dự án
  CustomerId       INT NULL,  -- Liên kết đến WorkflowCustomers
  CreatedBy        INT NOT NULL,
  UpdatedBy        INT NULL,
  IsDeleted        BIT NOT NULL DEFAULT(0),
  RecordStatus     TINYINT NOT NULL DEFAULT(1),
  datetime0        DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2        DATETIME2(0) NULL,
  user_id0         INT NULL,
  user_id2         INT NULL,
  CONSTRAINT FK_WorkflowProjects_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT FK_WorkflowProjects_PM       FOREIGN KEY (ProjectManagerId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowProjects_OrgUnit  FOREIGN KEY (OrgUnitId) REFERENCES dbo.WorkflowOrgUnits(Id),
  CONSTRAINT FK_WorkflowProjects_Customer FOREIGN KEY (CustomerId) REFERENCES dbo.WorkflowCustomers(Id),
  CONSTRAINT UQ_WorkflowProjects_Code UNIQUE (CompanyCode, ProjectCode)  -- Đổi từ DvcsCode thành CompanyCode
);

CREATE TABLE dbo.WorkflowProjectMembers (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,  -- Giữ lại để tương thích FK, nhưng không dùng trong stored procedures
  CompanyCode  NVARCHAR(50) NOT NULL,  -- Đổi từ DvcsCode thành CompanyCode
  DepId        NVARCHAR(50) NULL,  -- Thêm DepId để tương thích với stored procedures mới
  ProjectId    INT NOT NULL,
  UserId       INT NOT NULL,
  Role         NVARCHAR(50) NOT NULL DEFAULT('MEMBER'),  -- Hỗ trợ: PROJECT_MANAGER, CO_PROJECT_MANAGER, MEMBER
  Allocation   DECIMAL(5,2) NOT NULL DEFAULT(100),
  StartDate    DATETIME NOT NULL,
  EndDate      DATETIME NULL,
  JoinedDate   DATETIME NOT NULL DEFAULT(GETDATE()),
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowProjectMembers_Project FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowProjectMembers_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowProjectMembers_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowProjectMembers UNIQUE (ProjectId, UserId)
);

CREATE TABLE dbo.WorkflowProjectDocuments (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  ProjectId    INT NOT NULL,
  FileName     NVARCHAR(255) NOT NULL,
  FilePath     NVARCHAR(500) NOT NULL,
  FileType     NVARCHAR(20) NULL,
  FileSize     BIGINT NOT NULL,
  UploadedBy   INT NOT NULL,
  UploadedDate DATETIME NOT NULL DEFAULT(GETDATE()),
  Tags         NVARCHAR(255) NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowProjectDocuments_Project FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowProjectDocuments_User    FOREIGN KEY (UploadedBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowProjectDocuments_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowProjectPosts (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  ProjectId    INT NOT NULL,
  Content      NVARCHAR(MAX) NOT NULL,
  CreatedBy    INT NOT NULL,
  CreatedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  IsPinned     BIT NOT NULL DEFAULT(0),
  MentionsJson NVARCHAR(MAX) NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowProjectPosts_Project FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowProjectPosts_User    FOREIGN KEY (CreatedBy) REFERENCES dbo.WorkflowUsers(Id)
);

CREATE TABLE dbo.WorkflowProjectActivities (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  ProjectId    INT NOT NULL,
  ActivityType NVARCHAR(50) NOT NULL,
  Description  NVARCHAR(MAX) NOT NULL,
  TriggeredBy  INT NOT NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowProjectActivities_Project FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowProjectActivities_User    FOREIGN KEY (TriggeredBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowProjectActivities_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

------------------------------------------------------------
-- Tasks - PHÂN KỲ THEO THÁNG (không chia master/detail)
-- Bảng sẽ được tạo theo tháng: WorkflowTasks_yyyymm (ví dụ: WorkflowTasks_202512)
-- Sử dụng stored procedure sp_CreateMonthlyTaskTable để tạo bảng mới mỗi tháng
------------------------------------------------------------
/*
  LƯU Ý: 
  - Bảng WorkflowTasks được tạo theo tháng bằng SP sp_CreateMonthlyTaskTable
  - Dữ liệu thực tế sẽ lưu trong các bảng WorkflowTasks_yyyymm
  - Các FK trong bảng liên quan không thể tham chiếu đến bảng động, 
    nên sẽ không có FK constraint cho TaskId, chỉ validate ở application level
*/

-- Bảng lưu người flow (nhiều người có thể flow một task)
CREATE TABLE dbo.WorkflowTaskFlows (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  TaskId       BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  UserId       INT NOT NULL,
  FlowOrder    INT NOT NULL DEFAULT(1),
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowTaskFlows_User FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskFlows_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowTaskFlows UNIQUE (TaskId, TaskMonth, UserId, FlowOrder)
);


CREATE TABLE dbo.WorkflowTaskAssignments (
  Id             INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId      INT NOT NULL,
  DvcsCode       NVARCHAR(50) NOT NULL,
  TaskId         BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm (không có FK constraint vì bảng động)
  TaskMonth      CHAR(6) NOT NULL,  -- Format: 'YYYYMM' để xác định bảng phân kỳ
  UserId         INT NOT NULL,
  AssignmentType NVARCHAR(20) NOT NULL DEFAULT('EXECUTOR'),
  AssignedDate   DATETIME NOT NULL DEFAULT(GETDATE()),
  IsDeleted      BIT NOT NULL DEFAULT(0),
  RecordStatus   TINYINT NOT NULL DEFAULT(1),
  datetime0      DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2      DATETIME2(0) NULL,
  user_id0       INT NULL,
  user_id2       INT NULL,
  CONSTRAINT FK_WorkflowTaskAssignments_User FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskAssignments_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowTaskAssignments UNIQUE (TaskId, TaskMonth, UserId, AssignmentType)
);

CREATE TABLE dbo.WorkflowTaskDependencies (
  Id              INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId       INT NOT NULL,
  DvcsCode        NVARCHAR(50) NOT NULL,
  TaskId          BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth       CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  DependsOnTaskId BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  DependsOnMonth  CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  DependencyType  NVARCHAR(30) NOT NULL DEFAULT('FINISH_TO_START'),
  IsDeleted       BIT NOT NULL DEFAULT(0),
  RecordStatus    TINYINT NOT NULL DEFAULT(1),
  datetime0       DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2       DATETIME2(0) NULL,
  user_id0        INT NULL,
  user_id2        INT NULL,
  CONSTRAINT FK_WorkflowTaskDependencies_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT CHK_WorkflowTaskDependencies_NoSelf CHECK (TaskId <> DependsOnTaskId OR TaskMonth <> DependsOnMonth)
);

CREATE TABLE dbo.WorkflowTaskChecklist (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  TaskId       BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  ItemOrder    INT NOT NULL,
  ItemText     NVARCHAR(255) NOT NULL,
  IsDone       BIT NOT NULL DEFAULT(0),
  DoneBy       INT NULL,
  DoneDate     DATETIME NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowTaskChecklist_DoneBy  FOREIGN KEY (DoneBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskChecklist_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowTaskComments (
  Id            INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId     INT NOT NULL,
  DvcsCode      NVARCHAR(50) NOT NULL,
  TaskId        BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth     CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  Content       NVARCHAR(MAX) NOT NULL,
  ContentParent INT NULL,  -- Trường mới: comment cha (để hỗ trợ reply)
  CreatedBy     INT NOT NULL,
  MentionsJson  NVARCHAR(MAX) NULL,
  IsDeleted     BIT NOT NULL DEFAULT(0),
  RecordStatus  TINYINT NOT NULL DEFAULT(1),
  datetime0     DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2     DATETIME2(0) NULL,
  user_id0      INT NULL,
  user_id2      INT NULL,
  CONSTRAINT FK_WorkflowTaskComments_Parent  FOREIGN KEY (ContentParent) REFERENCES dbo.WorkflowTaskComments(Id),
  CONSTRAINT FK_WorkflowTaskComments_User    FOREIGN KEY (CreatedBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskComments_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowTaskAttachments (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  TaskId       BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  FileName     NVARCHAR(255) NOT NULL,
  FilePath     NVARCHAR(500) NOT NULL,
  FileType     NVARCHAR(20) NULL,
  FileSize     BIGINT NOT NULL,
  UploadedBy   INT NOT NULL,
  UploadedDate DATETIME NOT NULL DEFAULT(GETDATE()),
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowTaskAttachments_User    FOREIGN KEY (UploadedBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskAttachments_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowTaskHistory (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  TaskId       BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  FieldName    NVARCHAR(100) NOT NULL,
  OldValue     NVARCHAR(MAX) NULL,
  NewValue     NVARCHAR(MAX) NULL,
  ChangedBy    INT NOT NULL,
  ChangedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowTaskHistory_User    FOREIGN KEY (ChangedBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskHistory_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

------------------------------------------------------------
-- Requests / Approvals
------------------------------------------------------------
CREATE TABLE dbo.WorkflowRequests (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  RequestCode  NVARCHAR(50) NOT NULL,
  RequestType  NVARCHAR(50) NOT NULL,
  ProjectId    INT NULL,
  TaskId       BIGINT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NULL,  -- Format: 'YYYYMM'
  ApplicantId  INT NOT NULL,
  Status       NVARCHAR(30) NOT NULL DEFAULT('PENDING'),
  PayloadJson  NVARCHAR(MAX) NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowRequests_Company   FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT FK_WorkflowRequests_Project   FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id),
  CONSTRAINT FK_WorkflowRequests_Applicant FOREIGN KEY (ApplicantId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT UQ_WorkflowRequests_Code UNIQUE (DvcsCode, RequestCode)
);

CREATE TABLE dbo.WorkflowRequestApprovals (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  RequestId    INT NOT NULL,
  ApproverId   INT NOT NULL,
  StepOrder    INT NOT NULL,
  Status       NVARCHAR(20) NOT NULL DEFAULT('WAITING'),
  Comment      NVARCHAR(MAX) NULL,
  ActionDate   DATETIME NULL,
  IsDeleted    BIT NOT NULL DEFAULT(0),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowRequestApprovals_Request FOREIGN KEY (RequestId) REFERENCES dbo.WorkflowRequests(Id) ON DELETE CASCADE,
  CONSTRAINT FK_WorkflowRequestApprovals_User    FOREIGN KEY (ApproverId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowRequestApprovals_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowRequestApprovals UNIQUE (RequestId, ApproverId, StepOrder)
);

------------------------------------------------------------
-- Calendar / Reminders / Notifications
------------------------------------------------------------
CREATE TABLE dbo.WorkflowCalendarEvents (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  SourceType   NVARCHAR(20) NOT NULL,
  SourceId     INT NOT NULL,
  Title        NVARCHAR(255) NOT NULL,
  StartDate    DATETIME NOT NULL,
  EndDate      DATETIME NOT NULL,
  OwnerId      INT NOT NULL,
  Visibility   NVARCHAR(20) NOT NULL DEFAULT('INTERNAL'),
  CreatedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowCalendarEvents_User    FOREIGN KEY (OwnerId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowCalendarEvents_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowReminders (
  Id               INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId        INT NOT NULL,
  DvcsCode         NVARCHAR(50) NOT NULL,
  TargetType       NVARCHAR(20) NOT NULL,
  TargetId         INT NOT NULL,
  UserId           INT NOT NULL,
  Channel          NVARCHAR(20) NOT NULL,
  Frequency        NVARCHAR(20) NOT NULL DEFAULT('ONCE'),
  TriggerCondition NVARCHAR(30) NOT NULL DEFAULT('BEFORE_DUE'),
  ReminderTime     DATETIME NOT NULL,
  IsActive         BIT NOT NULL DEFAULT(1),
  LastSent         DATETIME NULL,
  IsDeleted        BIT NOT NULL DEFAULT(0),
  RecordStatus     TINYINT NOT NULL DEFAULT(1),
  datetime0        DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2        DATETIME2(0) NULL,
  user_id0         INT NULL,
  user_id2         INT NULL,
  CONSTRAINT FK_WorkflowReminders_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowReminders_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowNotifications (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  UserId       INT NOT NULL,
  Title        NVARCHAR(255) NOT NULL,
  Message      NVARCHAR(MAX) NOT NULL,
  Link         NVARCHAR(500) NULL,
  IsRead       BIT NOT NULL DEFAULT(0),
  CreatedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowNotifications_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowNotifications_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

------------------------------------------------------------
-- Time tracking & KPI
------------------------------------------------------------
CREATE TABLE dbo.WorkflowTimeEntries (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  TaskId       BIGINT NOT NULL,  -- FK đến WorkflowTasks_yyyymm
  TaskMonth    CHAR(6) NOT NULL,  -- Format: 'YYYYMM'
  UserId       INT NOT NULL,
  EntryDate    DATE NOT NULL,
  Hours        DECIMAL(5,2) NOT NULL,
  Description  NVARCHAR(255) NULL,
  CreatedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowTimeEntries_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTimeEntries_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

CREATE TABLE dbo.WorkflowKpiResults (
  Id             INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId      INT NOT NULL,
  DvcsCode       NVARCHAR(50) NOT NULL,
  UserId         INT NOT NULL,
  Period         NVARCHAR(20) NOT NULL,
  CompletedTasks INT NOT NULL DEFAULT(0),
  OnTimeRate     DECIMAL(5,2) NOT NULL DEFAULT(0),
  OverdueTasks   INT NOT NULL DEFAULT(0),
  Workload       DECIMAL(5,2) NOT NULL DEFAULT(0),
  CreatedDate    DATETIME NOT NULL DEFAULT(GETDATE()),
  RecordStatus   TINYINT NOT NULL DEFAULT(1),
  datetime0      DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2      DATETIME2(0) NULL,
  user_id0       INT NULL,
  user_id2       INT NULL,
  CONSTRAINT FK_WorkflowKpiResults_User    FOREIGN KEY (UserId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowKpiResults_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id),
  CONSTRAINT UQ_WorkflowKpiResults UNIQUE (DvcsCode, UserId, Period)
);

------------------------------------------------------------
-- Automation & logging
------------------------------------------------------------
CREATE TABLE dbo.WorkflowActivityLogs (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  EntityType   NVARCHAR(20) NOT NULL,
  EntityId     INT NOT NULL,
  ActivityType NVARCHAR(50) NOT NULL,
  Description  NVARCHAR(MAX) NULL,
  ActorId      INT NOT NULL,
  CreatedDate  DATETIME NOT NULL DEFAULT(GETDATE()),
  RecordStatus TINYINT NOT NULL DEFAULT(1),
  datetime0    DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2    DATETIME2(0) NULL,
  user_id0     INT NULL,
  user_id2     INT NULL,
  CONSTRAINT FK_WorkflowActivityLogs_User    FOREIGN KEY (ActorId) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowActivityLogs_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);

-- ============================================================
-- WORKFLOW USER LAYOUTS TABLE
-- Mô tả: Lưu cấu hình layout của user (drag-and-drop modules)
-- Sử dụng cho: Task Detail, Project Detail, và các entity khác
-- ============================================================
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
  datetime0           DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
  datetime2           DATETIME2(0) NULL,
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

PRINT 'Đã tạo tất cả bảng thành công!';

------------------------------------------------------------
-- CREATE INDEXES - Tối ưu hiệu suất truy vấn
------------------------------------------------------------
PRINT 'Đang tạo indexes...';

-- Master data & security indexes
CREATE INDEX IX_WorkflowOrgUnits_Dvcs ON dbo.WorkflowOrgUnits(DvcsCode, ParentId);
CREATE INDEX IX_WorkflowUsers_Dvcs_Org ON dbo.WorkflowUsers(DvcsCode, OrgUnitId, Status);
CREATE INDEX IX_WorkflowUserRoles_Dvcs ON dbo.WorkflowUserRoles(DvcsCode, RoleCode);

-- Projects indexes
CREATE INDEX IX_WorkflowProjects_Dvcs_Status ON dbo.WorkflowProjects(DvcsCode, Status, OrgUnitId);
CREATE INDEX IX_WorkflowProjectMembers_Dvcs ON dbo.WorkflowProjectMembers(DvcsCode, Role);
CREATE INDEX IX_WorkflowProjectDocuments_Dvcs ON dbo.WorkflowProjectDocuments(DvcsCode, ProjectId);
CREATE INDEX IX_WorkflowProjectPosts_Dvcs ON dbo.WorkflowProjectPosts(DvcsCode, ProjectId, IsPinned);
CREATE INDEX IX_WorkflowProjectActivities_Dvcs ON dbo.WorkflowProjectActivities(DvcsCode, ProjectId, datetime0);

-- Tasks indexes (sẽ được tạo trong stored procedure sp_CreateMonthlyTaskTable)
-- Indexes cho các bảng liên quan đến Tasks
CREATE INDEX IX_WorkflowTaskAssignments_Task ON dbo.WorkflowTaskAssignments(TaskId, TaskMonth);
CREATE INDEX IX_WorkflowTaskDependencies_Task ON dbo.WorkflowTaskDependencies(TaskId, TaskMonth);
CREATE INDEX IX_WorkflowTaskFlows_Dvcs ON dbo.WorkflowTaskFlows(DvcsCode, TaskId, TaskMonth);
CREATE INDEX IX_WorkflowUsers_Dvcs_Admin ON dbo.WorkflowUsers(DvcsCode, IsAdmin, IsSup);
CREATE INDEX IX_WorkflowTaskAssignments_Dvcs ON dbo.WorkflowTaskAssignments(DvcsCode, AssignmentType);
CREATE INDEX IX_WorkflowTaskDependencies_Dvcs ON dbo.WorkflowTaskDependencies(DvcsCode, DependencyType);
CREATE INDEX IX_WorkflowTaskChecklist_Dvcs ON dbo.WorkflowTaskChecklist(DvcsCode, TaskId, TaskMonth, IsDone);
CREATE INDEX IX_WorkflowTaskComments_Dvcs ON dbo.WorkflowTaskComments(DvcsCode, TaskId, TaskMonth, datetime0);
CREATE INDEX IX_WorkflowTaskComments_Parent ON dbo.WorkflowTaskComments(ContentParent);
CREATE INDEX IX_WorkflowTaskAttachments_Dvcs ON dbo.WorkflowTaskAttachments(DvcsCode, TaskId, TaskMonth);
CREATE INDEX IX_WorkflowTaskHistory_Dvcs ON dbo.WorkflowTaskHistory(DvcsCode, TaskId, TaskMonth, ChangedDate);
CREATE INDEX IX_WorkflowRequests_Task ON dbo.WorkflowRequests(TaskId, TaskMonth);
CREATE INDEX IX_WorkflowTimeEntries_Task ON dbo.WorkflowTimeEntries(TaskId, TaskMonth);

-- Requests / Approvals indexes
CREATE INDEX IX_WorkflowRequests_Dvcs_Status ON dbo.WorkflowRequests(DvcsCode, Status, RequestType);
CREATE INDEX IX_WorkflowRequestApprovals_Dvcs ON dbo.WorkflowRequestApprovals(DvcsCode, Status, StepOrder);

-- Calendar / Reminders / Notifications indexes
CREATE INDEX IX_WorkflowCalendarEvents_Dvcs ON dbo.WorkflowCalendarEvents(DvcsCode, StartDate, EndDate);
CREATE INDEX IX_WorkflowReminders_Dvcs ON dbo.WorkflowReminders(DvcsCode, TargetType, TargetId);
CREATE INDEX IX_WorkflowNotifications_Dvcs ON dbo.WorkflowNotifications(DvcsCode, UserId, IsRead, CreatedDate);

-- Time tracking & KPI indexes
CREATE INDEX IX_WorkflowTimeEntries_Dvcs ON dbo.WorkflowTimeEntries(DvcsCode, UserId, EntryDate);
CREATE INDEX IX_WorkflowKpiResults_Dvcs ON dbo.WorkflowKpiResults(DvcsCode, Period);

CREATE INDEX IX_WorkflowActivityLogs_Dvcs ON dbo.WorkflowActivityLogs(DvcsCode, EntityType, EntityId, CreatedDate);

PRINT 'Đã tạo tất cả indexes thành công!';

------------------------------------------------------------
-- CREATE FUNCTIONS - Hỗ trợ Row-Level Security
------------------------------------------------------------
PRINT 'Đang tạo functions...';

GO
CREATE FUNCTION dbo.fn_SecurityPredicate_DvcsCode(@DvcsCode AS NVARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_securitypredicate_result
WHERE @DvcsCode = CAST(SESSION_CONTEXT(N'DvcsCode') AS NVARCHAR(50))
   OR SESSION_CONTEXT(N'DvcsCode') IS NULL;  -- Cho phép query khi chưa set (admin)
GO

PRINT 'Đã tạo functions thành công!';

------------------------------------------------------------
-- CREATE SECURITY POLICIES - Row-Level Security (RLS)
------------------------------------------------------------
/*
  RLS tự động filter dữ liệu theo DvcsCode từ SESSION_CONTEXT.
  Sử dụng sp_SetUserDvcsContext để set DvcsCode khi user đăng nhập.
*/
PRINT 'Đang tạo security policies...';

-- Policy cho Projects
CREATE SECURITY POLICY dbo.SecurityPolicy_Projects
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_DvcsCode(DvcsCode)
ON dbo.WorkflowProjects
WITH (STATE = ON);

-- Policy cho Users
CREATE SECURITY POLICY dbo.SecurityPolicy_Users
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_DvcsCode(DvcsCode)
ON dbo.WorkflowUsers
WITH (STATE = ON);

-- Policy cho OrgUnits
CREATE SECURITY POLICY dbo.SecurityPolicy_OrgUnits
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_DvcsCode(DvcsCode)
ON dbo.WorkflowOrgUnits
WITH (STATE = ON);

-- Helper procedure: Set DvcsCode vào session context (gọi khi user đăng nhập)
GO
CREATE PROCEDURE dbo.sp_SetUserDvcsContext
  @UserId INT,
  @DvcsCode NVARCHAR(50) OUTPUT
AS
BEGIN
  -- Lấy DvcsCode từ User
  SELECT @DvcsCode = DvcsCode 
  FROM dbo.WorkflowUsers 
  WHERE Id = @UserId AND RecordStatus = 1;
  
  IF @DvcsCode IS NULL
  BEGIN
    SELECT N'Không tìm thấy user hoặc DvcsCode!' as message, 400 as status;
    RETURN;
  END
  
  -- Set vào session context để RLS sử dụng
  EXEC sp_set_session_context @key = 'DvcsCode', @value = @DvcsCode;
  
  PRINT 'Đã set DvcsCode vào session: ' + @DvcsCode;
END;
GO

PRINT 'Đã tạo security policies thành công!';
PRINT 'Hoàn thành tạo tất cả bảng, indexes, functions và security policies!';
GO

------------------------------------------------------------
-- Script xóa Foreign Key Constraints với CompanyId
-- Chuyển sang chỉ dùng CompanyCode để tham chiếu
------------------------------------------------------------
PRINT '';
PRINT '=== XÓA FOREIGN KEY CONSTRAINTS VỚI CompanyId ===';
GO

-- 1. Xóa FK trong WorkflowProjectMembers
DECLARE @FKName1 NVARCHAR(128);
DECLARE @SQL1 NVARCHAR(MAX);
DECLARE @Count1 INT = 0;

DECLARE FK_Cursor1 CURSOR FOR
SELECT fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('dbo.WorkflowProjectMembers')
  AND c.name = 'CompanyId';

OPEN FK_Cursor1;
FETCH NEXT FROM FK_Cursor1 INTO @FKName1;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL1 = 'ALTER TABLE [dbo].[WorkflowProjectMembers] DROP CONSTRAINT [' + @FKName1 + ']';
    EXEC sp_executesql @SQL1;
    PRINT '✓ Đã xóa: ' + @FKName1;
    SET @Count1 = @Count1 + 1;
    FETCH NEXT FROM FK_Cursor1 INTO @FKName1;
END;

CLOSE FK_Cursor1;
DEALLOCATE FK_Cursor1;

IF @Count1 = 0
BEGIN
    PRINT 'Không tìm thấy foreign key constraint nào với CompanyId trong WorkflowProjectMembers';
END
GO

-- 2. Xóa FK trong WorkflowProjectActivities
DECLARE @FKName2 NVARCHAR(128);
DECLARE @SQL2 NVARCHAR(MAX);
DECLARE @Count2 INT = 0;

DECLARE FK_Cursor2 CURSOR FOR
SELECT fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('dbo.WorkflowProjectActivities')
  AND c.name = 'CompanyId';

OPEN FK_Cursor2;
FETCH NEXT FROM FK_Cursor2 INTO @FKName2;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL2 = 'ALTER TABLE [dbo].[WorkflowProjectActivities] DROP CONSTRAINT [' + @FKName2 + ']';
    EXEC sp_executesql @SQL2;
    PRINT '✓ Đã xóa: ' + @FKName2;
    SET @Count2 = @Count2 + 1;
    FETCH NEXT FROM FK_Cursor2 INTO @FKName2;
END;

CLOSE FK_Cursor2;
DEALLOCATE FK_Cursor2;

IF @Count2 = 0
BEGIN
    PRINT 'Không tìm thấy foreign key constraint nào với CompanyId trong WorkflowProjectActivities';
END
GO

-- 3. Kiểm tra lại
PRINT '';
PRINT '=== KIỂM TRA LẠI ===';
GO

DECLARE @RemainingFKs INT = 0;

SELECT @RemainingFKs = COUNT(*)
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
WHERE c.name = 'CompanyId'
  AND (c.object_id = OBJECT_ID('dbo.WorkflowProjectMembers')
       OR c.object_id = OBJECT_ID('dbo.WorkflowProjectActivities'));

IF @RemainingFKs = 0
BEGIN
    PRINT '✓ Hoàn tất! Đã xóa tất cả foreign key constraints với CompanyId.';
    PRINT 'Bây giờ có thể dùng CompanyCode để tham chiếu thay vì CompanyId.';
END
ELSE
BEGIN
    PRINT '✗ CẢNH BÁO: Vẫn còn ' + CAST(@RemainingFKs AS NVARCHAR(10)) + ' foreign key constraint(s)!';
END
GO

PRINT '';
PRINT 'Hoàn thành tất cả scripts!';

