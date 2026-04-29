# Danh sách API Workflow – Phiên bản DVCS (Multi-tenant)

Tài liệu này mapping các API ứng dụng với Stored Procedures DVCS trong database.  
Format gọi API (theo chuẩn dự án):  
- `multipleTablePutApi({ store: '<StoredProcedureName>', data: { ...params } })`

Ghi chú chung:
- Tất cả SP đều yêu cầu `@CompanyCode` (bắt buộc) để xác định tenant.
- Các API liên quan Tasks sử dụng thêm `@yyyymm` (format 'YYYYMM') để chỉ định bảng phân kỳ theo tháng `WorkflowTasks_yyyymm`.
- Bảng Tasks đã được hợp nhất thành một bảng duy nhất `WorkflowTasks_yyyymm` (không còn master/detail).
- Các bảng liên quan Tasks sử dụng `TaskId` (BIGINT) và `TaskMonth` (CHAR(6)) để tham chiếu đến task.

---

## 1. 🎯 Dashboard APIs

### 1.1. Dashboard Statistics
- **API**: `Api_Get_Workflow_Dashboard_Stats`
- **Store**: (tổng hợp từ nhiều SP, có thể kết hợp)
  - Projects: `Api_ProjectSummary_Load`
  - Tasks: `Api_ProjectTaskStats_Load` + `Api_UserDashboard_Load` (theo ngữ cảnh)
- **Mô tả**: Lấy thống kê tổng quan cho dashboard workflow (projects + tasks).
- **Tham số gợi ý**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (kỳ task hiện tại, ví dụ tháng đang xem trên dashboard, format 'YYYYMM').

### 1.2. Recent Activities
- **API**: `Api_Get_Workflow_Recent_Activities`
- **Store**: sử dụng trực tiếp bảng `WorkflowProjectActivities` & `WorkflowActivityLogs` (có thể tạo thêm SP trong phase 2).
- **Mô tả**: Lấy danh sách hoạt động gần nhất (project + task) để hiển thị feed/timeline.
- **Tham số gợi ý**:
  - `companyCode` → `@CompanyCode`
  - `limit` → số bản ghi.

---

## 2. 📁 Project Management APIs

### 2.1. Project CRUD

#### 2.1.1. Get Projects List
- **API**: `Api_Get_Projects`
- **Store**: `Api_ProjectList_Load`
- **Mô tả**: Lấy danh sách dự án theo bộ lọc (trạng thái/ưu tiên/từ khóa) và phân trang.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`
  - `searchKey` → `@SearchKey`
  - `status` → `@Status`
  - `priority` → `@Priority`
  - (có thể map thêm) `departmentId` → `@OrgUnitId`

#### 2.1.2. Get Project Detail
- **API**: `Api_Get_Project`
- **Store**: `Api_ProjectDetail_Load`
- **Mô tả**: Lấy chi tiết dự án (thông tin chung, PM, đơn vị sở hữu).
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`

#### 2.1.3. Create Project
- **API**: `Api_Create_Project`
- **Store**: `Api_Project_Create`
- **Mô tả**: Tạo mới dự án với mã dự án, cấp bậc, PM, đơn vị sở hữu.
- **Tham số → SP (gợi ý)**:
  - `companyCode` → `@CompanyCode`
  - `projectCode` → `@ProjectCode`
  - `projectName` → `@ProjectName`
  - `level` → `@Level` (cấp bậc dự án, default 1)
  - `status` → `@Status`
  - `priority` → `@Priority`
  - `projectManagerId` → `@ProjectManagerId`
  - `orgUnitId` → `@OrgUnitId`
  - `clientName` → `@ClientName`
  - `healthStatus` → `@HealthStatus`
  - `startDate` → `@StartDate`
  - `endDate` → `@EndDate`
  - `budget` → `@Budget`
  - `description` → `@Description`
  - `createdBy` → `@CreatedBy`

#### 2.1.4. Update Project
- **API**: `Api_Update_Project`
- **Store**: `Api_Project_Update`
- **Mô tả**: Cập nhật thông tin dự án (trạng thái, ưu tiên, PM, ngày bắt/đến).
- **Tham số**: map tương ứng các field cho phép cập nhật.

#### 2.1.5. Delete Project
- **API**: `Api_Delete_Project`
- **Store**: `Api_Project_Delete`
- **Mô tả**: Xóa mềm dự án, ghi nhận người thao tác.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `id` → `@ProjectId`
  - `userId`/`deletedBy` → `@DeletedBy`

### 2.2. Project Documents

#### 2.2.1. Get Project Documents
- **API**: `Api_Get_Project_Documents`
- **Store**: `Api_ProjectDocument_List`
- **Mô tả**: Lấy danh sách tài liệu của dự án.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`

#### 2.2.2. Create Project Document
- **API**: `Api_Create_Project_Document`
- **Store**: `Api_ProjectDocument_Upload`
- **Mô tả**: Upload/ghi nhận tài liệu vào dự án.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `name` → `@FileName`
  - `filePath` (sau upload) → `@FilePath`
  - `fileType` → `@FileType`
  - `fileSize` → `@FileSize`
  - `tags` → `@Tags`
  - `uploadedBy` → `@UploadedBy`

### 2.3. Project Communications (Posts)

#### 2.3.1. Get Project Communications
- **API**: `Api_Get_Project_Communications`
- **Store**: `Api_ProjectPost_List`
- **Mô tả**: Lấy danh sách bài viết/thông báo nội bộ của dự án.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`
  - (Filter ALL/PINNED có thể bổ sung thêm param sau).

#### 2.3.2. Create Project Communication
- **API**: `Api_Create_Project_Communication`
- **Store**: `Api_ProjectPost_Create`
- **Mô tả**: Tạo bài viết/ghi chú nội bộ trong dự án (hỗ trợ mentions, pin). Tự động log vào `WorkflowProjectActivities`.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `content` → `@Content`
  - `isPinned` → `@IsPinned`
  - `mentions` (JSON) → `@MentionsJson`
  - `userId` → `@CreatedBy`
- **Logging**: Tự động log `POST_CREATED` vào `WorkflowProjectActivities`

### 2.4. Project Resources

#### 2.4.1. Get Project Resources
- **API**: `Api_Get_Project_Resources`
- **Store**: `Api_ProjectMember_List`
- **Mô tả**: Lấy danh sách thành viên và vai trò trong dự án.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`

#### 2.4.2. Assign Project Resource
- **API**: `Api_Assign_Project_Resource`
- **Store**: `Api_ProjectMember_Add`
- **Mô tả**: Thêm/thay đổi thành viên dự án, vai trò và % allocation.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `userId` → `@UserId`
  - `level` → `@Level` (cấp bậc trong dự án, default 1)
  - `role` → `@Role`
  - `allocation` → `@Allocation`
  - `startDate` → `@StartDate`
  - `endDate` → `@EndDate`
  - `createdBy` → `@CreatedBy`

---

## 3. ✅ Task Management APIs (theo bảng phân kỳ tháng)

### 3.1. Task CRUD

#### 3.1.1. Get Tasks List
- **API**: `Api_Get_Tasks`
- **Store**: `Api_TaskList_Load`
- **Mô tả**: Lấy danh sách task của kỳ tháng theo bộ lọc (status/priority/assigned).
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM', ví dụ '202512')
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`
  - `searchKey` → `@SearchKey`
  - `status` → `@Status`
  - `priority` → `@Priority`
  - `assignedTo` → `@AssignedTo`
  - `projectId` → `@ProjectId`
  - `level` → `@Level` (cấp bậc task, optional)

#### 3.1.2. Create Task
- **API**: `Api_Create_Task`
- **Store**: `Api_Task_Create`
- **Mô tả**: Tạo mới task trong bảng phân kỳ tháng; hỗ trợ parent task, assignee, reviewer. Tự động log vào `WorkflowProjectActivities` nếu có `projectId`.
- **Tham số → SP (gợi ý)**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM', ví dụ '202512')
  - `taskCode` → `@TaskCode` (mã task, sinh tự động)
  - `taskName` → `@TaskName`
  - `projectId` → `@ProjectId` (optional)
  - `parentTaskId` → `@ParentTaskId` (optional, task cha trong cùng tháng)
  - `level` → `@Level` (cấp bậc task, default 1)
  - `status` → `@Status` (default 'PENDING')
  - `priority` → `@Priority` (default 'MEDIUM')
  - `mode` → `@Mode` (default 'INTERNAL')
  - `category` → `@Category` (default 'TASK')
  - `formTemplate` → `@FormTemplate` (optional)
  - `estimatedHours` → `@EstimatedHours` (optional)
  - `startDate` → `@StartDate` (optional, ngày bắt đầu)
  - `endDate` → `@EndDate` (optional, ngày kết thúc)
  - `dueDate` → `@DueDate` (optional, hạn hoàn thành)
  - `assignedBy` → `@AssignedBy` (optional, người giao việc)
  - `assignedTo` → `@AssignedTo` (optional, người thực hiện)
  - `reviewerId` → `@ReviewerId` (optional, người review)
  - `description` → `@Description` (optional)
  - `createdBy` → `@CreatedBy`
- **Logging**: Tự động log `TASK_CREATED` vào `WorkflowProjectActivities` (nếu có `projectId`)

#### 3.1.3. Update Task
- **API**: `Api_Update_Task`
- **Store**: `Api_Task_Update`
- **Mô tả**: Cập nhật thông tin task (status, priority, dates, assignees…). Tự động log vào `WorkflowProjectActivities` khi có thay đổi quan trọng.
- **Tham số**: map tương ứng các field cập nhật; cần thêm `companyCode` → `@CompanyCode`, `yyyymm` → `@yyyymm`, `taskId` → `@TaskId` (BIGINT).
- **Logging**: Tự động log `TASK_UPDATED` vào `WorkflowProjectActivities` khi thay đổi Status/Priority (nếu có `projectId`)

#### 3.1.4. Delete Task
- **API**: `Api_Delete_Task`
- **Store**: `Api_Task_Delete`
- **Mô tả**: Xóa mềm task trong kỳ tháng, ghi nhận người xóa. Tự động log vào `WorkflowProjectActivities`.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `id` → `@TaskId` (BIGINT)
  - `userId`/`deletedBy` → `@DeletedBy`

### 3.2. Task Status

#### 3.2.1. Update Task Status
- **API**: `Api_Update_Task_Status`
- **Store**: `Api_Task_UpdateStatus`
- **Mô tả**: Đổi trạng thái task (workflow đơn giản), ghi nhận người cập nhật.
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `taskId` → `@TaskId` (BIGINT)
  - `status` → `@NewStatus`
  - `userId` → `@UpdatedBy`

### 3.3. Task Detail & Relations (phase 2+)

- **Task Detail**: dùng `Api_TaskDetail_Load` (SP).
  - **Tham số**: `companyCode` → `@CompanyCode`, `yyyymm` → `@yyyymm`, `taskId` → `@TaskId` (BIGINT).
  - **Trả về**: Thông tin task kèm comments (có hỗ trợ reply qua `ContentParent`), attachments, history, checklist, assignments.
- **Task Comments, Attachments, History**:
  - Các API tương ứng có thể map trực tiếp vào bảng `WorkflowTaskComments` (có `ContentParent` cho reply), `WorkflowTaskAttachments`, `WorkflowTaskHistory` (có thể tạo thêm SP riêng trong phase 2).
  - **Lưu ý**: Tất cả các bảng này đều có `TaskId` (BIGINT) và `TaskMonth` (CHAR(6)) để tham chiếu đến task trong bảng phân kỳ.

---

## 4. 🔗 Relationship APIs (User ↔ Project ↔ Task)

### 4.1. User-Project

#### 4.1.1. `Api_UserProjects_Load`
- **API**: `Api_UserProjects_Load`
- **Store**: `Api_UserProjects_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `userId` → `@UserId`
  - `status` → `@Status`
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`

#### 4.1.2. `Api_ProjectUsers_Load`
- **API**: `Api_ProjectUsers_Load`
- **Store**: `Api_ProjectUsers_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `yyyymm` → `@yyyymm` (optional để có thống kê tasks, format 'YYYYMM').

#### 4.1.3. `Api_UserProjectStats_Load`
- **API**: `Api_UserProjectStats_Load`
- **Store**: `Api_UserProjectStats_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `userId` → `@UserId`

### 4.2. Project-Task

#### 4.2.1. `Api_ProjectTasks_Load`
- **API**: `Api_ProjectTasks_Load`
- **Store**: `Api_ProjectTasks_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `projectId` → `@ProjectId`
  - `status` → `@Status`
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`

#### 4.2.2. `Api_ProjectTaskStats_Load`
- **API**: `Api_ProjectTaskStats_Load`
- **Store**: `Api_ProjectTaskStats_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `projectId` → `@ProjectId`

#### 4.2.3. `Api_UserProjectTasks_Load`
- **API**: `Api_UserProjectTasks_Load`
- **Store**: `Api_UserProjectTasks_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `projectId` → `@ProjectId`
  - `userId` → `@UserId`
  - `status` → `@Status`

### 4.3. Dashboards & Search

#### 4.3.1. User Dashboard
- **API**: `Api_UserDashboard_Load`
- **Store**: `Api_UserDashboard_Load`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `userId` → `@UserId`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')

#### 4.3.2. Project Dashboard
- **API**: `Api_ProjectDashboard_Comprehensive`
- **Store**: `Api_ProjectDashboard_Comprehensive`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `projectId` → `@ProjectId`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')

#### 4.3.3. Search Projects & Tasks
- **API**: `Api_Search_ProjectsAndTasks`
- **Store**: `Api_Search_ProjectsAndTasks`
- **Tham số → SP**:
  - `companyCode` → `@CompanyCode`
  - `yyyymm` → `@yyyymm` (format 'YYYYMM')
  - `searchKey` → `@SearchKey`
  - `pageindex` → `@PageIndex`
  - `pageSize` → `@PageSize`

---



