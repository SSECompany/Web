/*
  Workflow multi-tenant schema (SQL Server)
  - DVCS (company code) enforced on all business tables.
  - Tasks are split into master + monthly detail tables (table-per-month).
  - Indexes include DVCS first for fast tenant filtering.
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
CREATE INDEX IX_WorkflowOrgUnits_Dvcs ON dbo.WorkflowOrgUnits(DvcsCode, ParentId);

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
CREATE INDEX IX_WorkflowUsers_Dvcs_Org ON dbo.WorkflowUsers(DvcsCode, OrgUnitId, Status);
CREATE INDEX IX_WorkflowUsers_Dvcs_Admin ON dbo.WorkflowUsers(DvcsCode, IsAdmin, IsSup);

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
CREATE INDEX IX_WorkflowUserRoles_Dvcs ON dbo.WorkflowUserRoles(DvcsCode, RoleCode);

------------------------------------------------------------
-- Projects
------------------------------------------------------------
CREATE TABLE dbo.WorkflowProjects (
  Id               INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId        INT NOT NULL,
  DvcsCode         NVARCHAR(50) NOT NULL,
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
  CONSTRAINT UQ_WorkflowProjects_Code UNIQUE (DvcsCode, ProjectCode)
);
CREATE INDEX IX_WorkflowProjects_Dvcs_Status ON dbo.WorkflowProjects(DvcsCode, Status, OrgUnitId);

CREATE TABLE dbo.WorkflowProjectMembers (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  CompanyId    INT NOT NULL,
  DvcsCode     NVARCHAR(50) NOT NULL,
  ProjectId    INT NOT NULL,
  UserId       INT NOT NULL,
  Role         NVARCHAR(50) NOT NULL DEFAULT('MEMBER'),
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
CREATE INDEX IX_WorkflowProjectMembers_Dvcs ON dbo.WorkflowProjectMembers(DvcsCode, Role);

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
CREATE INDEX IX_WorkflowProjectDocuments_Dvcs ON dbo.WorkflowProjectDocuments(DvcsCode, ProjectId);

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
CREATE INDEX IX_WorkflowProjectPosts_Dvcs ON dbo.WorkflowProjectPosts(DvcsCode, ProjectId, IsPinned);

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
CREATE INDEX IX_WorkflowProjectActivities_Dvcs ON dbo.WorkflowProjectActivities(DvcsCode, ProjectId, datetime0);

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
CREATE INDEX IX_WorkflowTaskFlows_Dvcs ON dbo.WorkflowTaskFlows(DvcsCode, TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowTaskAssignments_Dvcs ON dbo.WorkflowTaskAssignments(DvcsCode, AssignmentType);
CREATE INDEX IX_WorkflowTaskAssignments_Task ON dbo.WorkflowTaskAssignments(TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowTaskDependencies_Dvcs ON dbo.WorkflowTaskDependencies(DvcsCode, DependencyType);
CREATE INDEX IX_WorkflowTaskDependencies_Task ON dbo.WorkflowTaskDependencies(TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowTaskChecklist_Dvcs ON dbo.WorkflowTaskChecklist(DvcsCode, TaskId, TaskMonth, IsDone);

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
  user_id2       INT NULL,
  CONSTRAINT FK_WorkflowTaskComments_Parent  FOREIGN KEY (ContentParent) REFERENCES dbo.WorkflowTaskComments(Id),
  CONSTRAINT FK_WorkflowTaskComments_User    FOREIGN KEY (CreatedBy) REFERENCES dbo.WorkflowUsers(Id),
  CONSTRAINT FK_WorkflowTaskComments_Company FOREIGN KEY (CompanyId) REFERENCES dbo.WorkflowCompanies(Id)
);
CREATE INDEX IX_WorkflowTaskComments_Dvcs ON dbo.WorkflowTaskComments(DvcsCode, TaskId, TaskMonth, datetime0);
CREATE INDEX IX_WorkflowTaskComments_Parent ON dbo.WorkflowTaskComments(ContentParent);

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
CREATE INDEX IX_WorkflowTaskAttachments_Dvcs ON dbo.WorkflowTaskAttachments(DvcsCode, TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowTaskHistory_Dvcs ON dbo.WorkflowTaskHistory(DvcsCode, TaskId, TaskMonth, ChangedDate);

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
CREATE INDEX IX_WorkflowRequests_Dvcs_Status ON dbo.WorkflowRequests(DvcsCode, Status, RequestType);
CREATE INDEX IX_WorkflowRequests_Task ON dbo.WorkflowRequests(TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowRequestApprovals_Dvcs ON dbo.WorkflowRequestApprovals(DvcsCode, Status, StepOrder);

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
CREATE INDEX IX_WorkflowCalendarEvents_Dvcs ON dbo.WorkflowCalendarEvents(DvcsCode, StartDate, EndDate);

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
CREATE INDEX IX_WorkflowReminders_Dvcs ON dbo.WorkflowReminders(DvcsCode, TargetType, TargetId);

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
CREATE INDEX IX_WorkflowNotifications_Dvcs ON dbo.WorkflowNotifications(DvcsCode, UserId, IsRead, CreatedDate);

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
CREATE INDEX IX_WorkflowTimeEntries_Dvcs ON dbo.WorkflowTimeEntries(DvcsCode, UserId, EntryDate);
CREATE INDEX IX_WorkflowTimeEntries_Task ON dbo.WorkflowTimeEntries(TaskId, TaskMonth);

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
CREATE INDEX IX_WorkflowKpiResults_Dvcs ON dbo.WorkflowKpiResults(DvcsCode, Period);

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
CREATE INDEX IX_WorkflowActivityLogs_Dvcs ON dbo.WorkflowActivityLogs(DvcsCode, EntityType, EntityId, CreatedDate);


------------------------------------------------------------
-- STORED PROCEDURES MẪU: Tự động filter theo DVCS
-- Tất cả SP đều yêu cầu @DvcsCode để đảm bảo dữ liệu chỉ hiển thị theo công ty
------------------------------------------------------------

-- 1. Lấy danh sách Projects theo DVCS
GO
CREATE PROCEDURE dbo.sp_GetProjects
  @DvcsCode    NVARCHAR(50),
  @PageIndex   INT = 1,
  @PageSize    INT = 20,
  @SearchKey   NVARCHAR(255) = NULL,
  @Status      NVARCHAR(30) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
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
  WHERE p.DvcsCode = @DvcsCode
    AND p.IsDeleted = 0
    AND p.RecordStatus = 1
    AND (@SearchKey IS NULL OR p.ProjectName LIKE '%' + @SearchKey + '%' OR p.ProjectCode LIKE '%' + @SearchKey + '%')
    AND (@Status IS NULL OR p.Status = @Status)
    ORDER BY p.datetime0 DESC
  OFFSET @Offset ROWS
  FETCH NEXT @PageSize ROWS ONLY;
  
  -- Tổng số bản ghi
  SELECT COUNT(*) AS TotalCount
  FROM dbo.WorkflowProjects p
  WHERE p.DvcsCode = @DvcsCode
    AND p.IsDeleted = 0
    AND p.RecordStatus = 1
    AND (@SearchKey IS NULL OR p.ProjectName LIKE '%' + @SearchKey + '%' OR p.ProjectCode LIKE '%' + @SearchKey + '%')
    AND (@Status IS NULL OR p.Status = @Status);
END;
GO

-- 2. Lấy danh sách Tasks theo DVCS và tháng
GO
CREATE PROCEDURE dbo.sp_GetTasks
  @DvcsCode    NVARCHAR(50),
  @yyyymm      CHAR(6),  -- Format: 'YYYYMM'
  @PageIndex   INT = 1,
  @PageSize    INT = 20,
  @SearchKey   NVARCHAR(255) = NULL,
  @Status      NVARCHAR(30) = NULL,
  @ProjectId   INT = NULL,
  @AssignedTo  INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
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
    u1.FullName AS AssignedByName,
    u2.FullName AS AssignedToName,
    u3.FullName AS ReviewerName,
    p.ProjectName
  FROM dbo.' + QUOTENAME(@tableName) + ' t
  LEFT JOIN dbo.WorkflowUsers u1 ON t.AssignedBy = u1.Id
  LEFT JOIN dbo.WorkflowUsers u2 ON t.AssignedTo = u2.Id
  LEFT JOIN dbo.WorkflowUsers u3 ON t.ReviewerId = u3.Id
  LEFT JOIN dbo.WorkflowProjects p ON t.ProjectId = p.Id
  WHERE t.DvcsCode = @DvcsCode
    AND t.IsDeleted = 0
    AND t.RecordStatus = 1
    AND (@SearchKey IS NULL OR t.TaskName LIKE ''%'' + @SearchKey + ''%'' OR t.TaskCode LIKE ''%'' + @SearchKey + ''%'')
    AND (@Status IS NULL OR t.Status = @Status)
    AND (@ProjectId IS NULL OR t.ProjectId = @ProjectId)
    AND (@AssignedTo IS NULL OR t.AssignedTo = @AssignedTo)
  ORDER BY t.datetime2 DESC
  OFFSET @Offset ROWS
  FETCH NEXT @PageSize ROWS ONLY;';
  
  EXEC sp_executesql @sql, 
    N'@DvcsCode NVARCHAR(50), @SearchKey NVARCHAR(255), @Status NVARCHAR(30), @ProjectId INT, @AssignedTo INT, @Offset INT, @PageSize INT',
    @DvcsCode, @SearchKey, @Status, @ProjectId, @AssignedTo, @Offset, @PageSize;
  
  -- Tổng số bản ghi
  SET @sql = N'
  SELECT COUNT(*) AS TotalCount
  FROM dbo.' + QUOTENAME(@tableName) + ' t
  WHERE t.DvcsCode = @DvcsCode
    AND t.IsDeleted = 0
    AND t.RecordStatus = 1
    AND (@SearchKey IS NULL OR t.TaskName LIKE ''%'' + @SearchKey + ''%'' OR t.TaskCode LIKE ''%'' + @SearchKey + ''%'')
    AND (@Status IS NULL OR t.Status = @Status)
    AND (@ProjectId IS NULL OR t.ProjectId = @ProjectId)
    AND (@AssignedTo IS NULL OR t.AssignedTo = @AssignedTo);';
  
  EXEC sp_executesql @sql,
    N'@DvcsCode NVARCHAR(50), @SearchKey NVARCHAR(255), @Status NVARCHAR(30), @ProjectId INT, @AssignedTo INT',
    @DvcsCode, @SearchKey, @Status, @ProjectId, @AssignedTo;
END;
GO

-- 3. Tạo Task mới (sử dụng Api_Task_Create trong file 07_stored_procedures_tasks.sql)
-- 4. Cập nhật Task (sử dụng Api_Task_Update trong file 07_stored_procedures_tasks.sql)

------------------------------------------------------------
-- STORED PROCEDURE: Tạo bảng Tasks phân kỳ theo tháng
------------------------------------------------------------
GO
CREATE PROCEDURE dbo.sp_CreateMonthlyTaskTable
  @yyyymm CHAR(6)  -- Format: 'YYYYMM' (ví dụ: '202512')
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @sql NVARCHAR(MAX);
  DECLARE @tableName NVARCHAR(100) = 'WorkflowTasks_' + @yyyymm;

  -- Nếu @tableName vô tình có kèm 'dbo.' thì bỏ phần schema ra, chỉ giữ tên bảng
  SET @tableName = PARSENAME(@tableName, 1);
  
  -- Kiểm tra bảng đã tồn tại chưa (schema dbo)
  IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName AND schema_id = SCHEMA_ID('dbo'))
  BEGIN
    SELECT N'Bảng ' + @tableName + N' đã tồn tại!' as message, 400 as status;
    RETURN;
  END
  
  -- Tạo bảng Tasks theo tháng
  SET @sql = N'
  CREATE TABLE dbo.' + QUOTENAME(@tableName) + ' (
    Id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    DepId          INT NULL,
    CompanyCode    NVARCHAR(50) NOT NULL,
    DvcsCode       NVARCHAR(50) NOT NULL,
    ProjectId      INT NULL,
    ParentTaskId   BIGINT NULL,
    TaskCode       NVARCHAR(50) NOT NULL,
    TaskName       NVARCHAR(255) NOT NULL,
    Level          INT NOT NULL DEFAULT(1),
    Status         NVARCHAR(30) NOT NULL DEFAULT(''PENDING''),
    Priority       NVARCHAR(20) NOT NULL DEFAULT(''MEDIUM''),
    Mode           NVARCHAR(20) NOT NULL DEFAULT(''INTERNAL''),
    Category       NVARCHAR(50) NULL,
    FormTemplate   NVARCHAR(50) NULL,
    EstimatedHours DECIMAL(10,2) NULL,
    ActualHours    DECIMAL(10,2) NOT NULL DEFAULT(0),
    Progress       DECIMAL(5,2) NOT NULL DEFAULT(0),
    StartDate      DATETIME NULL,
    EndDate        DATETIME NULL,
    DueDate        DATETIME NULL,
    CompletedDate  DATETIME NULL,
    AssignedBy     INT NULL,
    AssignedTo     INT NULL,
    ReviewerId     INT NULL,
    Description    NVARCHAR(MAX) NULL,
    CreatedBy      INT NOT NULL,
    IsDeleted      BIT NOT NULL DEFAULT(0),
    RecordStatus   TINYINT NOT NULL DEFAULT(1),
    datetime0      DATETIME2(0) NOT NULL DEFAULT(SYSDATETIME()),
    datetime2      DATETIME2(0) NULL,
    user_id0       INT NULL,
    user_id2       INT NULL,
    CONSTRAINT FK_WT' + @yyyymm + '_Project FOREIGN KEY (ProjectId) REFERENCES dbo.WorkflowProjects(Id) ON DELETE SET NULL,
    CONSTRAINT FK_WT' + @yyyymm + '_Parent  FOREIGN KEY (ParentTaskId) REFERENCES dbo.' + QUOTENAME(@tableName) + '(Id),
    CONSTRAINT FK_WT' + @yyyymm + '_Creator FOREIGN KEY (CreatedBy) REFERENCES dbo.WorkflowUsers(Id),
    CONSTRAINT FK_WT' + @yyyymm + '_AssignedBy FOREIGN KEY (AssignedBy) REFERENCES dbo.WorkflowUsers(Id),
    CONSTRAINT FK_WT' + @yyyymm + '_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES dbo.WorkflowUsers(Id),
    CONSTRAINT FK_WT' + @yyyymm + '_Reviewer FOREIGN KEY (ReviewerId) REFERENCES dbo.WorkflowUsers(Id),
    CONSTRAINT UQ_WT' + @yyyymm + '_Code UNIQUE (DvcsCode, TaskCode)
  );
  CREATE INDEX IX_WT' + @yyyymm + '_Dvcs_Project ON dbo.' + QUOTENAME(@tableName) + '(DvcsCode, ProjectId);
  CREATE INDEX IX_WT' + @yyyymm + '_Dvcs_Status ON dbo.' + QUOTENAME(@tableName) + '(DvcsCode, Status, DueDate);
  CREATE INDEX IX_WT' + @yyyymm + '_Dvcs_AssignedTo ON dbo.' + QUOTENAME(@tableName) + '(DvcsCode, AssignedTo, Status);
  CREATE INDEX IX_WT' + @yyyymm + '_Dvcs_Code ON dbo.' + QUOTENAME(@tableName) + '(DvcsCode, TaskCode);';
  
  EXEC sp_executesql @sql;
  PRINT 'Đã tạo bảng Tasks: ' + @tableName;
  PRINT 'Hoàn thành tạo bảng cho tháng: ' + @yyyymm;
END;
GO

-- Ví dụ sử dụng:
-- EXEC dbo.sp_CreateMonthlyTaskTable '202512';  -- Tạo bảng cho tháng 12/2025
-- EXEC dbo.sp_CreateMonthlyTaskTable '202601';  -- Tạo bảng cho tháng 1/2026

------------------------------------------------------------
-- STORED PROCEDURE TỰ ĐỘNG: Tạo bảng phân kỳ cho tháng hiện tại và tháng tiếp theo
------------------------------------------------------------
GO
CREATE PROCEDURE dbo.sp_AutoCreateMonthlyTaskTable
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @CurrentMonth CHAR(6) = FORMAT(GETDATE(), 'yyyyMM');
  DECLARE @NextMonth CHAR(6) = FORMAT(DATEADD(MONTH, 1, GETDATE()), 'yyyyMM');
  DECLARE @ErrorCount INT = 0;
  
  -- Tạo bảng cho tháng hiện tại
  BEGIN TRY
    EXEC dbo.sp_CreateMonthlyTaskTable @yyyymm = @CurrentMonth;
    PRINT 'Đã tạo/kiểm tra bảng Tasks cho tháng: ' + @CurrentMonth;
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() != 50000  -- Bỏ qua lỗi "đã tồn tại"
    BEGIN
      PRINT 'Lỗi khi tạo bảng Tasks cho tháng ' + @CurrentMonth + ': ' + ERROR_MESSAGE();
      SET @ErrorCount = @ErrorCount + 1;
    END
  END CATCH
  
  -- Tạo bảng cho tháng tiếp theo
  BEGIN TRY
    EXEC dbo.sp_CreateMonthlyTaskTable @yyyymm = @NextMonth;
    PRINT 'Đã tạo/kiểm tra bảng Tasks cho tháng: ' + @NextMonth;
  END TRY
  BEGIN CATCH
    IF ERROR_NUMBER() != 50000
    BEGIN
      PRINT 'Lỗi khi tạo bảng Tasks cho tháng ' + @NextMonth + ': ' + ERROR_MESSAGE();
      SET @ErrorCount = @ErrorCount + 1;
    END
  END CATCH
  
  IF @ErrorCount = 0
    PRINT 'Hoàn thành tự động tạo bảng phân kỳ. Không có lỗi.';
  ELSE
    PRINT 'Hoàn thành với ' + CAST(@ErrorCount AS NVARCHAR(10)) + ' lỗi.';
END;
GO

------------------------------------------------------------
-- HELPER FUNCTION: Tự động xác định tên bảng phân kỳ dựa trên datetime
------------------------------------------------------------
GO
CREATE FUNCTION dbo.fn_GetTaskTableName(@Date DATETIME2(0))
RETURNS NVARCHAR(100)
AS
BEGIN
  DECLARE @yyyymm CHAR(6) = FORMAT(@Date, 'yyyyMM');
  RETURN 'WorkflowTasks_' + @yyyymm;
END;
GO

------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) - Bảo vệ dữ liệu đa tenant
------------------------------------------------------------
/*
  GIẢI THÍCH RLS (Row-Level Security):
  
  RLS là tính năng của SQL Server cho phép tự động lọc dữ liệu dựa trên điều kiện.
  Thay vì phải nhớ thêm "WHERE DvcsCode = @DvcsCode" vào mọi query,
  RLS sẽ TỰ ĐỘNG thêm điều kiện này vào mọi SELECT/UPDATE/DELETE.
  
  CÁCH HOẠT ĐỘNG:
  1. Tạo Security Policy (chính sách bảo mật) cho mỗi bảng
  2. Policy sẽ kiểm tra SESSION_CONTEXT('DvcsCode') - giá trị được set khi user đăng nhập
  3. Chỉ hiển thị/cập nhật dữ liệu có DvcsCode khớp với giá trị trong session
  
  LỢI ÍCH:
  - Tự động bảo vệ dữ liệu, không cần nhớ filter trong mọi query
  - Tránh lỗi quên filter dẫn đến lộ dữ liệu công ty khác
  - Code đơn giản hơn (không cần truyền @DvcsCode vào mọi SP)
  
  LƯU Ý:
  - Phải set SESSION_CONTEXT('DvcsCode') khi user đăng nhập
  - Có thể tắt RLS nếu cần query toàn bộ dữ liệu (admin)
*/

-- Bước 1: Tạo function để kiểm tra DvcsCode
GO
CREATE FUNCTION dbo.fn_SecurityPredicate_DvcsCode(@DvcsCode AS NVARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_securitypredicate_result
WHERE @DvcsCode = CAST(SESSION_CONTEXT(N'DvcsCode') AS NVARCHAR(50))
   OR SESSION_CONTEXT(N'DvcsCode') IS NULL;  -- Cho phép query khi chưa set (admin)
GO

-- Bước 2: Tạo Security Policy cho các bảng chính
-- Lưu ý: Chỉ áp dụng cho các bảng quan trọng, không áp dụng cho bảng lookup nhỏ

-- Policy cho Projects
CREATE SECURITY POLICY dbo.SecurityPolicy_Projects
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_DvcsCode(DvcsCode)
ON dbo.WorkflowProjects
WITH (STATE = ON);  -- Bật RLS

-- Policy cho Tasks (áp dụng cho tất cả bảng WorkflowTasks_yyyymm)
-- Lưu ý: Vì bảng phân kỳ theo tháng, cần tạo policy động hoặc dùng view
-- Có thể tạo view union tất cả các bảng phân kỳ và áp dụng RLS trên view

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

/*
  CÁCH SỬ DỤNG RLS:
  
  1. Khi user đăng nhập, set session context:
     EXEC sp_set_session_context @key = 'DvcsCode', @value = 'DVCS001';
  
  2. Sau đó mọi query sẽ tự động filter:
     SELECT * FROM WorkflowProjects;  -- Chỉ trả về projects của DVCS001
     SELECT * FROM WorkflowUsers;     -- Chỉ trả về users của DVCS001
     
  3. Tắt RLS tạm thời (nếu cần admin query toàn bộ):
     ALTER SECURITY POLICY dbo.SecurityPolicy_Projects WITH (STATE = OFF);
     -- Query toàn bộ dữ liệu
     ALTER SECURITY POLICY dbo.SecurityPolicy_Projects WITH (STATE = ON);
  
  4. Xóa session context khi logout:
     EXEC sp_set_session_context @key = 'DvcsCode', @value = NULL;
*/

------------------------------------------------------------
-- HELPER: Set DvcsCode vào session context (gọi khi user đăng nhập)
------------------------------------------------------------
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

/*
  VÍ DỤ SỬ DỤNG HOÀN CHỈNH:
  
  -- 1. User đăng nhập
  DECLARE @DvcsCode NVARCHAR(50);
  EXEC dbo.sp_SetUserDvcsContext @UserId = 123, @DvcsCode = @DvcsCode OUTPUT;
  
  -- 2. Query dữ liệu (RLS tự động filter)
  SELECT * FROM WorkflowProjects;  -- Chỉ thấy projects của công ty user
  SELECT * FROM WorkflowUsers;     -- Chỉ thấy users của công ty user
  
  -- 3. Sử dụng Stored Procedure (vẫn cần truyền @DvcsCode để đảm bảo)
  EXEC dbo.sp_GetProjects @DvcsCode = @DvcsCode, @PageIndex = 1, @PageSize = 20;
*/

