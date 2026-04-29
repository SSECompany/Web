# FASTWORK Workflow – Thiết kế mở rộng Stored Procedures (DVCS, bổ sung đủ theo API list)

File này **bổ sung** cho `WORKFLOW_STORED_PROCEDURES_DVCS.md`:
- Core 37 SP (Helper + Project + Task + Relationships) đã code giữ nguyên.
- Ở đây thiết kế thêm **nhóm SP mới** để cover gần đủ các API trong:
  - `FASTWORK_WORKFLOW_STORED_PROCEDURES_LIST.md`
  - `WORKFLOW_API_LIST.md`
theo **schema DVCS mới** (CompanyId, DvcsCode, Task master/detail theo tháng).

Nguyên tắc:
- Tất cả SP đều có `@DvcsCode`.
- SP liên quan Task có thêm `@yyyymm` khi đọc/ghi vào `WorkflowTasksMaster_yyyymm` / `WorkflowTasksDetail_yyyymm`.
- Không cần tạo 1 SP cho 1 endpoint; nhiều API có thể dùng **1 SP family với `@Action`**.
- Bảng/record dùng xóa mềm: `IsDeleted = 0`, `RecordStatus = 1`; 

---

## 1. Dashboard & Reports

### 1.1. `Api_WorkflowDashboard_Stats`

- **Chức năng**: Tổng hợp nhanh số liệu cho Dashboard Workflow.
- **Liên quan API**:
  - `Api_Get_Workflow_Dashboard_Stats`
- **Input (đề xuất)**:
  - `@DvcsCode NVARCHAR(50)`
  - `@OrgUnitId INT = NULL` — filter theo phòng ban.
  - `@StartDate DATETIME = NULL`
  - `@EndDate DATETIME = NULL`
  - `@yyyymm CHAR(6) = NULL`
- **Output chính**:
  - Projects:
    - `TotalProjects`, `ActiveProjects`, `CompletedProjects`, `OverdueProjects`.
  - Tasks (kỳ `@yyyymm`):
    - `TotalTasks`, `CompletedTasks`, `InProgressTasks`, `OverdueTasks`.
- **Bảng dùng**:
  - `WorkflowProjects`
  - `WorkflowTasksMaster_yyyymm`, `WorkflowTasksDetail_yyyymm`

### 1.2. `Api_WorkflowDashboard_Reports`

- **Chức năng**: Trả dữ liệu chi tiết cho các report trong dashboard.
- **Liên quan API**:
  - `Api_Get_Workflow_Dashboard_Reports`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@ReportType NVARCHAR(50)` — `PROJECT_PROGRESS`, `PROJECT_VOLUME`, `PROJECT_COST`, `PROJECT_KPI`, `TASK_PROGRESS`, `TASK_KPI`, `TREND_ANALYSIS`, `PERIOD_COMPARISON`.
  - `@OrgUnitId INT = NULL`
  - `@StartDate DATETIME = NULL`
  - `@EndDate DATETIME = NULL`
  - `@yyyymm CHAR(6) = NULL`
- **Logic**:
  - CASE theo `@ReportType`.
  - Dữ liệu lấy chủ yếu từ:
    - `WorkflowProjects`
    - `WorkflowTasksMaster_yyyymm`, `WorkflowTasksDetail_yyyymm`
    - `WorkflowTimeEntries`, `WorkflowKpiResults`

### 1.3. `Api_Workflow_Recent_Activities`

- **Chức năng**: Lấy danh sách hoạt động gần đây (project, task, automation).
- **Liên quan API**:
  - `Api_Get_Workflow_Recent_Activities`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@OrgUnitId INT = NULL`
  - `@Limit INT = 10`
- **Bảng dùng**:
  - `WorkflowProjectActivities`
  - `WorkflowActivityLogs`

---

## 2. Task Comments, Attachments, History, Reminders, Watchers

### 2.1. `Api_TaskComments_CRUD`

- **Chức năng**: Gom list/add/update/delete comment task vào 1 SP.
- **Liên quan API**:
  - `Api_Get_Task_Comments`
  - `Api_Add_Task_Comment`
  - `Api_Update_Task_Comment`
  - `Api_Delete_Task_Comment`
- **Input (đề xuất)**:
  - `@DvcsCode NVARCHAR(50)`
  - `@TaskMasterId BIGINT`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `UPDATE` | `DELETE`
  - `@CommentId INT = NULL`
  - `@Content NVARCHAR(MAX) = NULL`
  - `@UserId INT = NULL`
- **Bảng**:
  - `WorkflowTaskComments`

### 2.2. `Api_TaskAttachments_CRUD`

- **Chức năng**: CRUD file đính kèm task.
- **Liên quan API**:
  - `Api_Get_Task_Attachments`
  - `Api_Upload_Task_Attachment`
  - `Api_Delete_Task_Attachment`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@TaskMasterId BIGINT`
  - `@Action NVARCHAR(20)` — `LIST` | `UPLOAD` | `DELETE`
  - `@AttachmentId INT = NULL`
  - `@FileName NVARCHAR(255) = NULL`
  - `@FilePath NVARCHAR(500) = NULL`
  - `@FileType NVARCHAR(20) = NULL`
  - `@FileSize BIGINT = NULL`
  - `@UserId INT = NULL`
- **Bảng**:
  - `WorkflowTaskAttachments`

### 2.3. `Api_TaskHistory_List`

- **Chức năng**: Lấy lịch sử thay đổi của 1 task.
- **Liên quan API**:
  - `Api_Get_Task_History`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@TaskMasterId BIGINT`
  - `@Limit INT = 100`
- **Bảng**:
  - `WorkflowTaskHistory`
- **Ghi chú**:
  - Ghi log đã được thực hiện ngay trong các SP core (`Api_Task_Create`, `Api_Task_Update`, `Api_Task_UpdateStatus`, `Api_Task_Delete`).

### 2.4. `Api_TaskReminders_CRUD`

- **Chức năng**: Quản lý nhắc việc cho task.
- **Liên quan API**:
  - `Api_Create_Task_Reminder`
  - `Api_Get_Task_Reminders`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `UPDATE` | `DELETE`
  - `@ReminderId INT = NULL`
  - `@TargetType NVARCHAR(20) = 'TASK'`
  - `@TargetId INT = NULL` — map `TaskMasterId`
  - `@UserId INT = NULL`
  - `@Channel NVARCHAR(20) = NULL`
  - `@Frequency NVARCHAR(20) = NULL`
  - `@TriggerCondition NVARCHAR(30) = NULL`
  - `@ReminderTime DATETIME = NULL`
- **Bảng**:
  - `WorkflowReminders`

### 2.5. `Api_TaskWatchers_CRUD`

- **Chức năng**: Quản lý người theo dõi task (watcher).
- **Liên quan API**:
  - `Api_Get_Task_Watchers`
  - `Api_Add_Task_Watcher`
  - `Api_Remove_Task_Watcher`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@TaskMasterId BIGINT`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `REMOVE`
  - `@UserId INT = NULL`
- **Bảng**:
  - `WorkflowTaskAssignments` với `AssignmentType='WATCHER'`

---

## 3. Task Relations, Subtasks, Dependencies, TimeEntries

### 3.1. `Api_TaskRelations_CRUD`

- **Chức năng**: Quan hệ logic giữa các task (liên kết chéo, không phải dependency).
- **Liên quan API**:
  - `Api_Get_Task_Relations`
  - `Api_Add_Task_Relation`
  - `Api_Remove_Task_Relation`
- **Thiết kế**:
  - Thêm bảng `WorkflowTaskRelations`:
    - `Id`, `CompanyId`, `DvcsCode`, `TaskMasterId`, `RelatedTaskMasterId`, `RelationType`, audit fields.
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `REMOVE`
  - `@TaskMasterId BIGINT`
  - `@RelatedTaskMasterId BIGINT = NULL`
  - `@RelationType NVARCHAR(30) = NULL`

### 3.2. `Api_TaskSubtasks_CRUD`

- **Chức năng**: Quản lý subtasks thông qua parent/child trong master theo tháng.
- **Liên quan API**:
  - `Api_Get_Task_Subtasks`
  - `Api_Add_Task_Subtask`
  - `Api_Update_Task_Subtask`
  - `Api_Delete_Task_Subtask`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@yyyymm CHAR(6)`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `UPDATE` | `DELETE`
  - `@ParentTaskMasterId BIGINT`
  - `@SubTaskMasterId BIGINT = NULL`
  - Các trường giống `Api_Task_Create`/`Api_Task_Update` để tạo/cập nhật subtask.

### 3.3. `Api_TaskDependencies_CRUD`

- **Chức năng**: CRUD phụ thuộc (dependency) giữa các task.
- **Liên quan API**:
  - `Api_Get_Task_Dependencies`
  - `Api_Add_Task_Dependency`
  - `Api_Remove_Task_Dependency`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `REMOVE`
  - `@TaskMasterId BIGINT`
  - `@DependsOnTaskMasterId BIGINT = NULL`
  - `@DependencyType NVARCHAR(30) = NULL`
- **Bảng**:
  - `WorkflowTaskDependencies`

### 3.4. `Api_TaskTimeEntries_CRUD`

- **Chức năng**: Quản lý chấm công/ghi nhận thời gian theo task.
- **Liên quan API**:
  - `Api_Get_Task_Time_Entries`
  - `Api_Add_Task_Time_Entry`
  - `Api_Update_Task_Time_Entry`
  - `Api_Delete_Task_Time_Entry`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `ADD` | `UPDATE` | `DELETE`
  - `@TimeEntryId INT = NULL`
  - `@TaskMasterId BIGINT = NULL`
  - `@UserId INT = NULL`
  - `@EntryDate DATE = NULL`
  - `@Hours DECIMAL(5,2) = NULL`
  - `@Description NVARCHAR(255) = NULL`
- **Bảng**:
  - `WorkflowTimeEntries` (trong DVCS, `TaskId` map với `TaskMasterId`)

---

## 4. Task Templates, Bulk Operations, Saved Filters

### 4.1. `Api_TaskTemplates_CRUD`

- **Chức năng**: Quản lý template công việc.
- **Liên quan API**:
  - `Api_Get_Task_Templates`
  - `Api_Create_Task_Template`
  - `Api_Update_Task_Template`
  - `Api_Delete_Task_Template`
  - `Api_Use_Task_Template`
- **Thiết kế**:
  - Bổ sung bảng `WorkflowTaskTemplates`:
    - Các trường giống `WorkflowTasks` cơ bản (không phân kỳ tháng, không bắt buộc ProjectId).
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `CREATE` | `UPDATE` | `DELETE` | `USE`
  - `@TemplateId INT = NULL`
  - Thông tin template (name, default fields, v.v.).

### 4.2. `Api_Tasks_Bulk_Operations`

- **Chức năng**: Bulk update/delete/assign/status cho nhiều tasks.
- **Liên quan API**:
  - `Api_Bulk_Update_Tasks`
  - `Api_Bulk_Delete_Tasks`
  - `Api_Bulk_Assign_Tasks`
  - `Api_Bulk_Update_Task_Status`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@yyyymm CHAR(6)`
  - `@Action NVARCHAR(30)` — `BULK_UPDATE` | `BULK_DELETE` | `BULK_ASSIGN` | `BULK_UPDATE_STATUS`
  - `@TaskIds NVARCHAR(MAX)` — list Ids (JSON/CSV).
  - `@AssignedTo INT = NULL`
  - `@Status NVARCHAR(30) = NULL`
  - `@UpdateJson NVARCHAR(MAX) = NULL`

### 4.3. `Api_TaskSavedFilters_CRUD`

- **Chức năng**: Lưu và lấy filter danh sách tasks.
- **Liên quan API**:
  - `Api_Get_Saved_Filters`
  - `Api_Save_Filter`
  - `Api_Delete_Saved_Filter`
- **Thiết kế**:
  - Bổ sung bảng `WorkflowSavedFilters` (UserId, Name, FiltersJson).
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `SAVE` | `DELETE`
  - `@FilterId INT = NULL`
  - `@UserId INT = NULL`
  - `@Name NVARCHAR(255) = NULL`
  - `@FiltersJson NVARCHAR(MAX) = NULL`

---

## 5. Notifications, Approvals, Calendar, Roadmap, Finance (High Level)

### 5.1. Notifications – `Api_TaskNotifications_CRUD`

- **Liên quan API**:
  - `Api_Get_Task_Notifications`
  - `Api_Mark_Notification_Read`
  - `Api_Delete_Notification`
  - `Api_Mark_All_Notifications_Read`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `MARK_READ` | `DELETE` | `MARK_ALL_READ`
  - `@UserId INT`
  - `@NotificationId INT = NULL`
  - `@UnreadOnly BIT = 0`
- **Bảng**:
  - `WorkflowNotifications`

### 5.2. Task Approval (gợi ý)

- **Liên quan nhóm API**:
  - `Api_Get_Task_Approval`
  - `Api_Approve_Task`
  - `Api_Reject_Task`
  - `Api_Request_Task_Revision`
  - `Api_Submit_Task_For_Approval`
- **Đề xuất**:
  - Dùng lại `WorkflowRequests` + `WorkflowRequestApprovals` với `RequestType='TASK_APPROVAL'`.
  - Các SP family: `Api_TaskApproval_CRUD` (LIST/APPROVE/REJECT/REQUEST_REVISION/SUBMIT).

### 5.3. Calendar – `Api_CalendarEvents_CRUD`

- **Liên quan API**:
  - `Api_Get_Calendar_Events`
  - `Api_Create_Calendar_Event`
  - `Api_Update_Calendar_Event`
  - `Api_Delete_Calendar_Event`
- **Input**:
  - `@DvcsCode NVARCHAR(50)`
  - `@Action NVARCHAR(20)` — `LIST` | `CREATE` | `UPDATE` | `DELETE`
  - `@EventId INT = NULL`
  - Các trường event (SourceType/SourceId/Title/StartDate/EndDate/OwnerId/Visibility…).
- **Bảng**:
  - `WorkflowCalendarEvents`

### 5.4. Roadmap, Finance & Proposal (gợi ý tổng quan)

- **Roadmap**:
  - SP `Api_Roadmap_Get`, `Api_RoadmapVersions_Get`, `Api_RoadmapMilestones_Get` đọc từ các bảng roadmap (khi bổ sung vào schema).
- **Proposal & Finance**:
  - SP `Api_Proposals_CRUD`, `Api_FinanceTransactions_CRUD`, `Api_Finance_Statistics` thao tác trên các bảng đề xuất & ledger tài chính (mô tả trong `WORKFLOW_API_LIST.md`).

---

## 6. Tổng kết

- **Core đã có code**: 37 SP trong `WORKFLOW_STORED_PROCEDURES_DVCS.md`.
- **File này** thiết kế thêm:
  - Nhóm SP Comments/Attachments/History/Reminders/Watchers.
  - Nhóm Relations/Subtasks/Dependencies/TimeEntries.
  - Nhóm Templates/Bulk/SavedFilters.
  - Nhóm Notifications/Approvals/Calendar/Roadmap/Finance.
- Từ đây có thể lần lượt:
  1. Chốt thêm bảng còn thiếu (TaskRelations, TaskTemplates, SavedFilters, Proposal, FinanceLedger…).
  2. Viết code SQL cho từng SP theo chữ ký đã thiết kế.
  3. Cập nhật lại `WORKFLOW_API_LIST_DVCS.md` để mapping API ↔ SP 1 cách đầy đủ.


