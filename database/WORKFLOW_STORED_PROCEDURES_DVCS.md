# FASTWORK Workflow – Danh sách Stored Procedures (Multi-tenant DVCS)

## Quy ước chung (đã chuẩn hóa)
- Mọi bảng business có `IsDeleted` (xóa mềm), `RecordStatus`, audit `datetime0/user_id0`, `datetime2/user_id2`.
- Khi trả ra API: `CreatedDate = datetime0`, `UpdatedDate = datetime2`.
- Truy vấn list/detail luôn lọc `IsDeleted = 0` và `RecordStatus = 1`.
- Tham số tenant dùng `@CompanyCode` (ở DB có thể vẫn là `@DvcsCode`; tầng API map sang).
- Tasks đã **hợp nhất**: chỉ còn một bảng phân kỳ theo tháng `WorkflowTasks_yyyymm` với khóa `TaskId` (BIGINT). Các bảng liên quan dùng cặp `TaskId` + `TaskMonth` (CHAR(6)).

## 1. Helper / Utility Stored Procedures

### 1.1. `sp_CreateMonthlyTaskTable`
- Tạo bảng tasks theo tháng: `WorkflowTasks_yyyymm` (duy nhất, không master/detail).
- Input: `@yyyymm` (CHAR(6), bắt buộc, format `YYYYMM`).
- Xử lý: kiểm tra tồn tại, sinh `CREATE TABLE` + `CREATE INDEX`, thực thi bằng dynamic SQL.

### 1.2. `sp_AutoCreateMonthlyTaskTable`
- Tự động tạo/kiểm tra bảng tasks cho tháng hiện tại và tháng kế tiếp (gọi `sp_CreateMonthlyTaskTable`, bỏ qua lỗi “đã tồn tại”).

### 1.3. `sp_GetProjects`
- Danh sách projects theo tenant với filter & phân trang; trả về list + `TotalCount`.
- Bảng: `WorkflowProjects`, `WorkflowUsers`, `WorkflowOrgUnits`.

### 1.4. `sp_GetTasks`
- Danh sách tasks từ bảng phân kỳ `WorkflowTasks_yyyymm` với filter `Status/ProjectId/AssignedTo` và phân trang; trả về list + `TotalCount`.
- Bảng: `WorkflowTasks_yyyymm`, `WorkflowProjects`, `WorkflowUsers`.

### 1.5. `fn_GetTaskTableName`
- Helper trả về tên bảng tasks theo datetime (`WorkflowTasks_yyyymm`).

## 2. Module Quản lý Dự án – Project Management (16 SPs)

**File**: `06_stored_procedures_projects.sql`  
**Bảng chính**: `WorkflowProjects`, `WorkflowProjectMembers`, `WorkflowProjectDocuments`, `WorkflowProjectPosts`, `WorkflowProjectActivities`.

### 2.1. Danh sách & Tìm kiếm

#### 2.1.1. `Api_ProjectList_Load`
- Danh sách dự án với filter, phân trang; trả PM, OrgUnit, `MemberCount`, `TaskCount` (từ `WorkflowTaskAssignments` + `TaskId/TaskMonth`), `TotalCount`.

#### 2.1.2. `Api_ProjectSummary_Load`
- Thống kê tổng hợp dự án theo tenant (Total/Active/Completed/OnHold/Cancelled, Health, AvgProgress, Budget, Overdue).

#### 2.1.3. `Api_ProjectList_ByStatus`
- Danh sách dự án theo 1 trạng thái, có phân trang + `TotalCount`.

### 2.2. Chi tiết & Dashboard

#### 2.2.1. `Api_ProjectDashboard_Load`
- Dashboard nhanh dự án: thông tin dự án, `TotalMembers`, `TotalDocuments`, `TotalPosts`, top 10 activities.

#### 2.2.2. `Api_ProjectDetail_Load`
- Chi tiết đầy đủ dự án (PM, OrgUnit, thông tin cơ bản).

### 2.3. CRUD Dự án

#### 2.3.1. `Api_Project_Create`
- Tạo dự án, sinh `ProjectCode = PRJyyyyMMddNNNN`, insert project, thêm PM vào members, log activity `PROJECT_CREATED`. Output: `@NewProjectId`, `@ProjectCode`.

#### 2.3.2. `Api_Project_Update`
- Cập nhật dự án (set các field không null), nếu đổi `Status` thì log activity `STATUS_CHANGED`.

#### 2.3.3. `Api_Project_Delete`
- Xóa mềm dự án, log `PROJECT_DELETED`.

### 2.4. Quản lý Thành viên

#### 2.4.1. `Api_ProjectMember_Add`
- Upsert thành viên dự án bằng `MERGE` theo `(ProjectId, UserId)`.

#### 2.4.2. `Api_ProjectMember_Remove`
- Xóa logic member (`RecordStatus = 0`).

#### 2.4.3. `Api_ProjectMember_List`
- Danh sách thành viên dự án (User + Role + Allocation + Dates).

### 2.5. Quản lý Tài liệu

#### 2.5.1. `Api_ProjectDocument_Upload`
- Upload tài liệu dự án, output `@NewDocumentId`.

#### 2.5.2. `Api_ProjectDocument_Delete`
- Xóa mềm tài liệu.

#### 2.5.3. `Api_ProjectDocument_List`
- Danh sách tài liệu dự án kèm người upload.

### 2.6. Quản lý Bài đăng

#### 2.6.1. `Api_ProjectPost_Create`
- Tạo bài đăng (Mentions optional), output `@NewPostId`.
- **Logging**: Tự động log vào `WorkflowProjectActivities` với `ActivityType = 'POST_CREATED'`.

#### 2.6.2. `Api_ProjectPost_List`
- Danh sách bài đăng dự án (phân trang) + `TotalCount`.

## 3. Module Quản lý Công việc – Task Management (7 SPs)

**File**: `07_stored_procedures_tasks.sql`  
**Bảng chính**: `WorkflowTasks_yyyymm` + các bảng liên quan (`WorkflowTaskAssignments`, `WorkflowTaskChecklist`, `WorkflowTaskComments`, `WorkflowTaskAttachments`, `WorkflowTaskHistory`, `WorkflowTaskFlows`, …).

### 3.1. Danh sách & Tìm kiếm

#### 3.1.1. `Api_TaskList_Load`
- Danh sách tasks có filter (Status/Priority/Project/AssignedTo, SearchKey) + phân trang; trả `TotalCount`. Truy vấn trên `WorkflowTasks_yyyymm`.

#### 3.1.2. `Api_TaskList_ByProject`
- Danh sách tasks của một Project, filter Status + phân trang; trả `TotalCount`.

### 3.2. Chi tiết

#### 3.2.1. `Api_TaskDetail_Load`
- Chi tiết 1 task (Task + Project + Assigned/Reviewer), kèm Checklist, Comments (có `ContentParent`), Attachments, History, TaskFlows. Tham số: `@yyyymm`, `@TaskId`.

### 3.3. CRUD Công việc

#### 3.3.1. `Api_Task_Create`
- Tạo task mới, sinh `TaskCode = TASKyyyyMMddNNNN`, insert vào `WorkflowTasks_yyyymm`, log `WorkflowTaskHistory` (`TASK_CREATED`). Output: `@NewTaskId`, `@TaskCode`.
- **Logging**: Tự động log vào `WorkflowProjectActivities` với `ActivityType = 'TASK_CREATED'` (nếu task có `ProjectId`).
- **Tham số**: Sử dụng `@CompanyCode` và `DepId` (không dùng `@DvcsCode` và `CompanyId`).

#### 3.3.2. `Api_Task_Update`
- Cập nhật task (các field không null), cập nhật audit, log khi đổi `Status/Priority/Progress`.
- **Logging**: Tự động log vào `WorkflowProjectActivities` với `ActivityType = 'TASK_UPDATED'` khi có thay đổi quan trọng (Status/Priority) và task có `ProjectId`.
- **Tham số**: Sử dụng `@CompanyCode` và `DepId` (không dùng `@DvcsCode` và `CompanyId`).

#### 3.3.3. `Api_Task_Delete`
- Xóa mềm task, log `TASK_DELETED`.
- **Logging**: Tự động log vào `WorkflowProjectActivities` với `ActivityType = 'TASK_DELETED'` (nếu task có `ProjectId`).
- **Tham số**: Sử dụng `@CompanyCode` và `DepId` (không dùng `@DvcsCode` và `CompanyId`).

#### 3.3.4. `Api_Task_UpdateStatus`
- Cập nhật trạng thái (Kanban), tự set `CompletedDate` nếu chuyển sang `COMPLETED`, log History.

## 4. Module Liên kết Logic – Cross-Module Relationships (9 SPs)

**File**: `08_stored_procedures_relationships.sql`

### 4.1. User-Project Relationships

#### 4.1.1. `Api_UserProjects_Load`
- Danh sách dự án mà user tham gia; filter Status; phân trang; trả `TotalCount`.

#### 4.1.2. `Api_ProjectUsers_Load`
- Danh sách user trong dự án; nếu có `@yyyymm` và tồn tại `WorkflowTasks_yyyymm` thì thống kê `TaskCount`, `CompletedTaskCount` từ `WorkflowTasks_yyyymm` theo `ProjectId`, `AssignedTo`.

#### 4.1.3. `Api_UserProjectStats_Load`
- Thống kê dự án của user: Total/Active/Completed/Managed/AvgProgress/Overdue.

### 4.2. Task-Project Relationships

#### 4.2.1. `Api_ProjectTasks_Load`
- Danh sách tasks của 1 dự án (trên `WorkflowTasks_yyyymm`), filter Status, phân trang; trả `TotalCount` và thống kê tổng hợp (Total/Pending/InProgress/Completed/Overdue/AvgProgress/Hours).

#### 4.2.2. `Api_ProjectTaskStats_Load`
- Thống kê chi tiết tasks của dự án trong tháng: Total/Pending/InProgress/Completed/Cancelled/AvgProgress/EstimatedHours/ActualHours/Overdue + phân bổ Priority.

#### 4.2.3. `Api_UserProjectTasks_Load`
- Danh sách tasks thuộc `ProjectId` được giao cho `UserId` (trên `WorkflowTasks_yyyymm`), filter Status.

### 4.3. Dashboards

#### 4.3.1. `Api_UserDashboard_Load`
- Dashboard user: thông tin user, thống kê projects, (nếu có `@yyyymm`) thống kê tasks của user trên `WorkflowTasks_yyyymm`, top 5 projects gần đây.

#### 4.3.2. `Api_ProjectDashboard_Comprehensive`
- Dashboard dự án đầy đủ: thông tin project + members/documents/posts, top 10 activities, (nếu có `@yyyymm`) thống kê tasks trên `WorkflowTasks_yyyymm`.

### 4.4. Search

#### 4.4.1. `Api_Search_ProjectsAndTasks`
- Tìm kiếm Projects + Tasks theo `SearchKey`; dùng `WorkflowTasks_yyyymm` cho phần Tasks; kết hợp kết quả, phân trang, trả `TotalCount`.

