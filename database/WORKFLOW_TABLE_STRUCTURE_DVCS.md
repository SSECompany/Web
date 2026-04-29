# FASTWORK Workflow – Bảng, cấu trúc trường, ý nghĩa & liên kết (Multi-tenant DVCS)

Nguồn: `01_tables.sql` + `workflow_schema_dvcs.sql` (SQL Server, multi-tenant theo `CompanyCode`).  
Luồng FASTWORK (phiên bản DVCS): Companies/DVCS → Master data (Org/Users/Roles) → Projects → Tasks (bảng phân kỳ theo tháng) → Requests/Approvals → Calendar/Reminders/Notifications → Time & KPI → Automation & Logging.  

Ghi chú chung:
- Mỗi bảng business đều có: `DepId` (FK → WorkflowCompanies.Id), `CompanyCode`.
- `IsDeleted` (bit, default 0) — xóa mềm bản ghi; thao tác xóa sẽ set `IsDeleted = 1`, `RecordStatus = 0`, cập nhật `datetime2/user_id2`.
- `RecordStatus` (trạng thái bản ghi logic), `datetime0/user_id0` (tạo), `datetime2/user_id2` (cập nhật).
- Các FK đã chỉ rõ `ON DELETE` nếu có.

**Mối quan hệ phân cấp tổ chức:**
```
WorkflowCompanies (Công ty)
    ↓ (DepId)
WorkflowOrgUnits (Phòng ban/Đơn vị)
    ├─ ParentId: NULL (phòng ban cấp cao nhất)
    ├─ ParentId: FK → WorkflowOrgUnits.Id (phòng ban con)
    └─ Level: cấp bậc trong cây tổ chức
        ↓ (OrgUnitId)
WorkflowUsers (Nhân viên)
    ├─ OrgUnitId: FK → WorkflowOrgUnits.Id (thuộc phòng ban)
    ├─ IsSup: BIT (Supervisor - người giám sát)
    ├─ IsAdmin: BIT (Admin - quản trị hệ thống)
    └─ Supervisor có thể quản lý nhân viên trong cùng phòng ban hoặc phòng ban con
```

**Quy tắc phân quyền:**
- **Admin (IsAdmin = 1)**: Quyền quản trị hệ thống, không phụ thuộc vào tổ chức
- **Supervisor (IsSup = 1)**: Quản lý nhân viên trong phạm vi tổ chức của mình (OrgUnitId và các đơn vị con)
- **Nhân viên thường**: Chỉ có quyền trên dữ liệu của chính mình và được phân công

**Phân kỳ theo tháng (Monthly Partitioning):**
- **Tasks**: `WorkflowTasks_yyyymm` (SP: `sp_CreateMonthlyTaskTable`)
- **ActivityLogs**: `WorkflowActivityLogs_yyyymm` (SP: `sp_CreateMonthlyActivityLogsTable`)
- **Notifications**: `WorkflowNotifications_yyyymm` (SP: `sp_CreateMonthlyNotificationsTable`)
- **Lý do phân kỳ**: Tối ưu hiệu suất truy vấn và quản lý lưu trữ khi dữ liệu tăng trưởng lớn
- **Lưu ý**: Các bảng liên quan đến Tasks có trường `TaskMonth` (CHAR(6)) để xác định bảng phân kỳ, không có FK constraint vì bảng động

**Tự động hóa tạo bảng phân kỳ:**
- **Tasks**: `sp_AutoCreateMonthlyTaskTable` — tạo bảng Tasks cho tháng hiện tại + tháng tiếp theo (chạy định kỳ mỗi tháng)
- **ActivityLogs & Notifications**: Có thể tạo riêng hoặc tích hợp vào job tự động
- **Ví dụ**: `EXEC dbo.sp_CreateMonthlyTaskTable '202512';` — tạo bảng Tasks cho tháng 12/2025
- **SQL Server Agent Jobs**: Có thể setup job tự động chạy vào đầu mỗi tháng để tạo sẵn bảng cho tháng tiếp theo

## Companies / DVCS

- `WorkflowCompanies` — danh mục công ty/tenant, gốc cho `CompanyCode` và `DepId`.
  - Id (PK, int identity) — định danh công ty (được dùng làm `DepId` trong các bảng khác).
  - CompanyCode (nvarchar(16), unique, not null) — mã công ty (tenant key).
  - Name (nvarchar(255), not null) — tên công ty.
  - Domain (nvarchar(255), null) — domain truy cập (nếu có).
  - IsActive (bit, default 1) — trạng thái kích hoạt.
  - CreatedBy (nvarchar(255), null) — người khởi tạo.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.

## Master data & Security

- `WorkflowOrgUnits` — cấu trúc tổ chức/phòng ban, nền tảng phân quyền/ủy quyền.
  - Id (PK, int identity) — định danh đơn vị/phòng ban.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty (tham chiếu đến WorkflowCompanies.Id).
  - CompanyCode (nvarchar(16), not null) — mã công ty (duplicated cho filter nhanh, đồng bộ với WorkflowCompanies.CompanyCode).
  - ParentId (int, FK → WorkflowOrgUnits.Id, null) — đơn vị cha (NULL nếu là phòng ban cấp cao nhất).
  - UnitCode (nvarchar(50), not null) — mã đơn vị chuẩn (unique theo CompanyCode).
  - UnitName (nvarchar(255), not null) — tên đơn vị/phòng ban.
  - Level (int, not null, default 1) — cấp bậc trong cây tổ chức (1 = cấp cao nhất).
  - IsActive (bit, not null, default 1) — trạng thái hoạt động.
  - CreatedBy (nvarchar(255), null) — người khởi tạo.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, UnitCode) — không trùng đơn vị trong cùng công ty.
  - **Lưu ý**: Cấu trúc cây phân cấp, Supervisor có thể quản lý nhân viên trong đơn vị của mình và các đơn vị con.

- `WorkflowUsers` — hồ sơ nhân sự/người dùng, gắn với đơn vị & công ty.
  - Id (PK, int identity) — định danh user.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty (tham chiếu đến WorkflowCompanies.Id).
  - CompanyCode (nvarchar(16), not null) — mã công ty (duplicated cho filter nhanh).
  - EmployeeCode (nvarchar(50), not null) — mã nhân sự (unique theo CompanyCode).
  - FullName (nvarchar(255), not null) — họ tên.
  - Email (nvarchar(255), not null) — email chuẩn/đăng nhập (unique theo CompanyCode).
  - Phone (nvarchar(20), null) — số liên hệ.
  - OrgUnitId (int, FK → WorkflowOrgUnits.Id, not null) — đơn vị/phòng ban trực thuộc.
  - Level (int, not null, default 1) — cấp bậc trong tổ chức (lấy từ WorkflowOrgUnits.Level để filter nhanh).
  - Title (nvarchar(255), null) — chức danh.
  - Status (nvarchar(20), default 'ACTIVE') — trạng thái tài khoản.
  - AvatarUrl (nvarchar(500), null) — ảnh đại diện.
  - IsAdmin (bit, default 0) — Admin (Yes/no) — quyền quản trị hệ thống.
  - IsSup (bit, default 0) — SUP (Supervisor) — quyền giám sát/quản lý nhân viên trong phạm vi tổ chức.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, EmployeeCode).
  - UNIQUE (CompanyCode, Email).
  - **Quyền Supervisor (IsSup = 1)**: Có thể quản lý nhân viên trong cùng OrgUnitId và các đơn vị con (theo cây ParentId).
  - **Quyền Admin (IsAdmin = 1)**: Quyền quản trị hệ thống, không bị giới hạn bởi tổ chức.

- `WorkflowUserRoles` — cấp quyền theo phạm vi (ORG/PROJECT...), phục vụ kiểm soát truy cập.
  - Id (PK, int identity) — định danh cấp quyền.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty (tham chiếu đến WorkflowCompanies.Id).
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - UserId (int, FK → WorkflowUsers.Id, cascade delete) — người được cấp.
  - RoleCode (nvarchar(50), not null) — mã vai trò.
  - ScopeType (nvarchar(20), default 'ORG') — loại phạm vi (ORG/PROJECT/TASK...).
  - ScopeId (int, null) — định danh phạm vi cụ thể (OrgUnitId nếu ScopeType = 'ORG', ProjectId nếu ScopeType = 'PROJECT'...).
  - GrantedDate (datetime, default getdate) — thời điểm cấp quyền.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, UserId, RoleCode, ScopeType, ScopeId) — không trùng quyền cùng phạm vi trong 1 công ty.

## Project Management

- `WorkflowCustomers` — quản lý thông tin khách hàng.
  - Id (PK, int identity) — định danh khách hàng.
  - CompanyId (int, FK → WorkflowCompanies.Id, not null) — công ty (giữ lại để tương thích FK).
  - CompanyCode (nvarchar(50), not null) — mã công ty.
  - CustomerCode (nvarchar(50), not null) — mã khách hàng (auto-generate: CUS-00001, unique theo CompanyCode).
  - CustomerName (nvarchar(255), not null) — tên khách hàng.
  - ContactName (nvarchar(255), null) — tên người liên hệ.
  - Email (nvarchar(255), null) — email.
  - Phone (nvarchar(50), null) — số điện thoại.
  - Address (nvarchar(500), null) — địa chỉ.
  - TaxCode (nvarchar(50), null) — mã số thuế.
  - Status (nvarchar(20), default 'ACTIVE') — trạng thái.
  - Notes (nvarchar(max), null) — ghi chú.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, CustomerCode) — không trùng mã khách hàng trong cùng công ty.

- `WorkflowProjects` — hồ sơ dự án; trung tâm của luồng triển khai và báo cáo.
  - Id (PK, int identity) — định danh dự án.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - ProjectCode (nvarchar(50), not null) — mã dự án (unique theo CompanyCode).
  - ProjectName (nvarchar(255), not null) — tên dự án.
  - Level (int, not null, default 1) — cấp bậc dự án (1 = dự án chính, >1 = dự án con/phụ thuộc).
  - Status (nvarchar(30), default 'PLANNING') — trạng thái vận hành.
  - Priority (nvarchar(20), default 'MEDIUM') — ưu tiên thực thi.
  - ProjectManagerId (int, FK → WorkflowUsers.Id, not null) — PM phụ trách.
  - OrgUnitId (int, FK → WorkflowOrgUnits.Id, not null) — đơn vị sở hữu.
  - ClientName (nvarchar(255), null) — khách hàng/đối tác.
  - HealthStatus (nvarchar(20), default 'GOOD') — sức khỏe dự án.
  - Progress (decimal(5,2), default 0) — % tiến độ.
  - StartDate (datetime, not null) — ngày khởi động.
  - EndDate (datetime, not null) — ngày kết thúc kế hoạch.
  - Budget (decimal(18,2), null) — ngân sách cam kết.
  - BudgetUsed (decimal(18,2), default 0) — ngân sách đã sử dụng.
  - Description (nvarchar(max), null) — mô tả/ghi chú chính.
  - CreatedBy (int, FK → WorkflowUsers.Id, not null) — người khởi tạo.
  - UpdatedBy (int, FK → WorkflowUsers.Id, null) — người cập nhật.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, ProjectCode).

- `WorkflowProjectMembers` — phân bổ nguồn lực dự án (vai trò, % allocation).
  - Id (PK, int identity) — định danh tham gia.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - ProjectId (int, FK → WorkflowProjects.Id, cascade delete) — dự án.
  - UserId (int, FK → WorkflowUsers.Id) — nhân sự.
  - Level (int, not null, default 1) — cấp bậc trong dự án (1 = thành viên chính, >1 = thành viên phụ).
  - Role (nvarchar(50), default 'MEMBER') — vai trò trong dự án (PROJECT_MANAGER/MEMBER/...).
  - Allocation (decimal(5,2), default 100) — % phân bổ công suất.
  - StartDate (datetime, not null) — ngày vào dự án.
  - EndDate (datetime, null) — ngày rời dự án (nếu có).
  - JoinedDate (datetime, default getdate) — thời điểm ghi nhận.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - UNIQUE (ProjectId, UserId).

- `WorkflowProjectDocuments` — kho tài liệu dự án, phục vụ cộng tác và truy vết.
  - Id (PK, int identity) — định danh tài liệu.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - ProjectId (int, FK → WorkflowProjects.Id, cascade delete) — dự án.
  - FileName (nvarchar(255), not null) — tên hiển thị.
  - FilePath (nvarchar(500), not null) — đường dẫn lưu trữ.
  - FileType (nvarchar(20), null) — loại file.
  - FileSize (bigint, not null) — kích thước (byte).
  - UploadedBy (int, FK → WorkflowUsers.Id, not null) — người tải lên.
  - UploadedDate (datetime, default getdate) — thời điểm tải lên.
  - Tags (nvarchar(255), null) — nhãn/metadata.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.

- `WorkflowProjectPosts` — truyền thông nội bộ dự án (thông báo, note).
  - Id (PK, int identity) — định danh bài viết.
  - CompanyId (int, not null) — công ty (không có FK constraint, đã xóa `FK_WorkflowProjectPosts_Company`).
  - DvcsCode (nvarchar(50), not null) — mã công ty.
  - ProjectId (int, FK → WorkflowProjects.Id, cascade delete) — dự án.
  - Content (nvarchar(max), not null) — nội dung bài đăng.
  - CreatedBy (int, FK → WorkflowUsers.Id, not null) — người tạo.
  - CreatedDate (datetime, default getdate) — thời điểm tạo.
  - IsPinned (bit, default 0) — ghim bài.
  - MentionsJson (nvarchar(max), null) — nhắc tên người liên quan.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.
  - **Lưu ý**: Foreign key constraint `FK_WorkflowProjectPosts_Company` đã được xóa để tránh lỗi khi insert dữ liệu. Trường `CompanyId` vẫn tồn tại nhưng không có ràng buộc FK.

- `WorkflowProjectActivities` — nhật ký/mốc quan trọng của dự án.
  - Id (PK, int identity) — định danh log.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - ProjectId (int, FK → WorkflowProjects.Id, cascade delete) — dự án.
  - ActivityType (nvarchar(50), not null) — loại hoạt động/mốc.
  - Description (nvarchar(max), not null) — mô tả chi tiết.
  - TriggeredBy (int, FK → WorkflowUsers.Id, not null) — người thực hiện.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
  - datetime2 (datetime2(0), null) — dấu vết cập nhật.
  - user_id0 (int, null) — user tạo.
  - user_id2 (int, null) — user cập nhật.

## Task Management

Trong schema DVCS, dữ liệu task được phân kỳ theo tháng:
- Bảng phân kỳ theo tháng: `WorkflowTasks_yyyymm` (tạo bằng SP `sp_CreateMonthlyTaskTable`).

### `WorkflowTasks_yyyymm` (bảng phân kỳ theo tháng)

Được tạo tự động cho từng kỳ tháng (vd: `WorkflowTasks_202512`) với cấu trúc:

- Id (PK, bigint identity) — định danh task.
- DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
- CompanyCode (nvarchar(16), not null) — mã công ty.
- ProjectId (int, FK → WorkflowProjects.Id, on delete set null) — dự án liên kết.
- ParentTaskId (bigint, FK → WorkflowTasks_yyyymm.Id, null) — task cha (trong cùng bảng phân kỳ).
- TaskCode (nvarchar(50), not null) — mã task (unique theo DvcsCode).
- TaskName (nvarchar(255), not null) — tiêu đề task.
- Level (int, default 1) — Bậc công việc.
- Status (nvarchar(30), default 'PENDING') — trạng thái xử lý.
- Priority (nvarchar(20), default 'MEDIUM') — ưu tiên.
- Mode (nvarchar(20), default 'INTERNAL') — chế độ (INTERNAL/EXTERNAL).
- Category (nvarchar(50), null) — phân loại.
- FormTemplate (nvarchar(50), null) — mẫu form.
- EstimatedHours (decimal(10,2), null) — giờ ước lượng.
- ActualHours (decimal(10,2), default 0) — giờ thực tế.
- Progress (decimal(5,2), default 0) — % hoàn thành.
- StartDate (datetime, null) — Ngày bắt đầu.
- EndDate (datetime, null) — Ngày kết thúc.
- DueDate (datetime, null) — hạn hoàn thành.
- CompletedDate (datetime, null) — ngày hoàn tất.
- AssignedBy (int, FK → WorkflowUsers.Id, null) — Người giao việc.
- AssignedTo (int, FK → WorkflowUsers.Id, null) — người thực hiện.
- ReviewerId (int, FK → WorkflowUsers.Id, null) — người review.
- Description (nvarchar(max), null) — mô tả chi tiết.
- CreatedBy (int, FK → WorkflowUsers.Id, not null) — người tạo.
- IsDeleted (bit, default 0) — xóa mềm.
- RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
- datetime0 (datetime2(0), default sysdatetime) — dấu vết tạo.
- datetime2 (datetime2(0), null) — dấu vết cập nhật.
- user_id0 (int, null) — user tạo.
- user_id2 (int, null) — user cập nhật.
  - UNIQUE (CompanyCode, TaskCode).
- FK tới: `WorkflowCompanies`, `WorkflowProjects`, chính nó (ParentTaskId), `WorkflowUsers` (AssignedBy, AssignedTo, ReviewerId, CreatedBy).

### Các bảng task liên quan (không phân kỳ theo tháng, nhưng có TaskMonth để xác định bảng phân kỳ)

**Lưu ý quan trọng**: Các bảng này không có FK constraint cho `TaskId` vì bảng Tasks phân kỳ là động. Cần validate ở application level.

- `WorkflowTaskAssignments` — phân công thực thi/giám sát task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm (không có FK constraint).
  - TaskMonth (char(6), not null) — Format 'YYYYMM' để xác định bảng phân kỳ.
  - UserId (int, FK → WorkflowUsers.Id).
  - Level (int, not null, default 1) — cấp bậc phân công (1 = phân công chính, >1 = phân công phụ).
  - AssignmentType (nvarchar(20), default 'EXECUTOR') — EXECUTOR/WATCHER.
  - AssignedDate (datetime, default getdate).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - UNIQUE (TaskId, TaskMonth, UserId, AssignmentType).

- `WorkflowTaskDependencies` — ràng buộc trình tự giữa các task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - DependsOnTaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - DependsOnMonth (char(6), not null) — Format 'YYYYMM'.
  - DependencyType (nvarchar(30), default 'FINISH_TO_START').
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - CHECK (TaskId <> DependsOnTaskId OR TaskMonth <> DependsOnMonth).

- `WorkflowTaskChecklist` — danh sách kiểm tra chi tiết cho task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - ItemOrder (int, not null).
  - ItemText (nvarchar(255), not null).
  - IsDone (bit, default 0).
  - DoneBy (int, FK → WorkflowUsers.Id, null).
  - DoneDate (datetime, null).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.

- `WorkflowTaskComments` — trao đổi/bình luận trong task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - Content (nvarchar(max), not null).
  - ContentParent (int, FK → WorkflowTaskComments.Id, null) — Comment cha (để hỗ trợ reply).
  - CreatedBy (int, FK → WorkflowUsers.Id, not null).
  - MentionsJson (nvarchar(max), null).
  - IsDeleted (bit, default 0).
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.

- `WorkflowTaskAttachments` — hồ sơ tệp hỗ trợ xử lý task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - FileName (nvarchar(255), not null).
  - FilePath (nvarchar(500), not null).
  - FileType (nvarchar(20), null).
  - FileSize (bigint, not null).
  - UploadedBy (int, FK → WorkflowUsers.Id, not null).
  - UploadedDate (datetime, default getdate).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.

- `WorkflowTaskHistory` — audit trail các thay đổi trường của task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - FieldName (nvarchar(100), not null).
  - OldValue (nvarchar(max), null).
  - NewValue (nvarchar(max), null).
  - ChangedBy (int, FK → WorkflowUsers.Id, not null).
  - ChangedDate (datetime, default getdate).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.

- `WorkflowTaskFlows` — Danh sách người flow (nhiều người có thể flow một task).
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm.
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - UserId (int, FK → WorkflowUsers.Id, not null).
  - Level (int, not null, default 1) — cấp bậc trong flow (1 = flow đầu tiên, >1 = flow tiếp theo).
  - FlowOrder (int, default 1) — Thứ tự flow.
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - UNIQUE (TaskId, TaskMonth, UserId, FlowOrder).

## Request / Approval

- `WorkflowRequests` — yêu cầu nghiệp vụ cần phê duyệt, gắn với dự án/task.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - RequestCode (nvarchar(50), not null) — mã yêu cầu (unique theo DvcsCode).
  - RequestType (nvarchar(50), not null).
  - ProjectId (int, FK → WorkflowProjects.Id, null).
  - TaskId (bigint, null) — FK đến WorkflowTasks_yyyymm (không có FK constraint).
  - TaskMonth (char(6), null) — Format 'YYYYMM'.
  - ApplicantId (int, FK → WorkflowUsers.Id, not null).
  - Status (nvarchar(30), default 'PENDING').
  - PayloadJson (nvarchar(max), null).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - UNIQUE (CompanyCode, RequestCode).

- `WorkflowRequestApprovals` — các bước phê duyệt/approver trong quy trình.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - RequestId (int, FK → WorkflowRequests.Id, cascade delete).
  - ApproverId (int, FK → WorkflowUsers.Id, not null).
  - Level (int, not null, default 1) — cấp bậc phê duyệt (1 = cấp đầu tiên, >1 = cấp tiếp theo).
  - StepOrder (int, not null).
  - Status (nvarchar(20), default 'WAITING').
  - Comment (nvarchar(max), null).
  - ActionDate (datetime, null).
  - IsDeleted (bit, default 0) — xóa mềm.
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - UNIQUE (RequestId, ApproverId, StepOrder).

## Calendar, Reminders & Notifications

- `WorkflowCalendarEvents` — lịch làm việc/hẹn được sinh ra từ các đối tượng nghiệp vụ (project, task, request...).
  - Id (PK, int identity) — định danh event.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - SourceType (nvarchar(20), not null) — loại nguồn (TASK/PROJECT/REQUEST/...).
  - SourceId (int, not null) — Id của bản ghi nguồn (TaskId, ProjectId...).
  - Title (nvarchar(255), not null) — tiêu đề event hiển thị trên lịch.
  - StartDate (datetime, not null) — thời điểm bắt đầu.
  - EndDate (datetime, not null) — thời điểm kết thúc.
  - OwnerId (int, FK → WorkflowUsers.Id, not null) — người sở hữu/sẽ thấy event này.
  - Visibility (nvarchar(20), default 'INTERNAL') — phạm vi hiển thị (INTERNAL/PRIVATE/PUBLIC...).
  - CreatedDate (datetime, default getdate) — thời điểm tạo.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0, datetime2, user_id0, user_id2 — audit chuẩn.

- `WorkflowReminders` — cấu hình lịch nhắc cho user theo từng đối tượng.
  - Id (PK, int identity) — định danh reminder.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - TargetType (nvarchar(20), not null) — loại đối tượng (TASK/REQUEST/PROJECT/...).
  - TargetId (int, not null) — Id đối tượng (map TaskId/RequestId...).
  - UserId (int, FK → WorkflowUsers.Id, not null) — người được nhắc.
  - Channel (nvarchar(20), not null) — kênh nhắc (IN_APP/EMAIL/SMS/...).
  - Frequency (nvarchar(20), default 'ONCE') — tần suất nhắc (ONCE/DAILY/WEEKLY/...).
  - TriggerCondition (nvarchar(30), default 'BEFORE_DUE') — điều kiện kích hoạt (trước hạn, sau hạn...).
  - ReminderTime (datetime, not null) — thời điểm cơ sở để tính nhắc (giờ cụ thể, hoặc mốc phụ thuộc).
  - IsActive (bit, default 1) — reminder còn hiệu lực hay không.
  - LastSent (datetime, null) — lần gửi gần nhất (nếu có).
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0, datetime2, user_id0, user_id2 — audit chuẩn.

- `WorkflowNotifications` — thông báo vận hành gửi tới người dùng (in-app/push...).
  - Id (PK, int identity) — định danh notification.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - UserId (int, FK → WorkflowUsers.Id, not null) — người nhận thông báo.
  - Title (nvarchar(255), not null) — tiêu đề ngắn.
  - Message (nvarchar(max), not null) — nội dung chi tiết (plain text/HTML).
  - Link (nvarchar(500), null) — URL/route điều hướng đến màn hình chi tiết.
  - IsRead (bit, default 0) — trạng thái đã đọc.
  - CreatedDate (datetime, default getdate) — thời điểm tạo/gửi.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0, datetime2, user_id0, user_id2 — audit chuẩn.
  - **Phân kỳ theo tháng**: `WorkflowNotifications_yyyymm` (ví dụ: `WorkflowNotifications_202512`).
  - **Stored Procedure**: `sp_CreateMonthlyNotificationsTable @yyyymm`.
  - **Lý do**: Volume lớn, truy vấn thường filter theo user + thời gian (inbox/unread gần đây).
  - **Bảng gốc**: `WorkflowNotifications` có thể giữ làm template hoặc bảng tháng hiện tại tùy cách triển khai.


## Time Tracking & KPI

- `WorkflowTimeEntries` — chấm công theo task để tính effort thực tế.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - TaskId (bigint, not null) — FK đến WorkflowTasks_yyyymm (không có FK constraint).
  - TaskMonth (char(6), not null) — Format 'YYYYMM'.
  - UserId (int, FK → WorkflowUsers.Id, not null).
  - EntryDate (date, not null).
  - Hours (decimal(5,2), not null).
  - Description (nvarchar(255), null).
  - CreatedDate (datetime, default getdate).
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.

- `WorkflowKpiResults` — kết quả KPI theo kỳ, phục vụ đánh giá hiệu suất.
  - Id (PK, int identity).
  - DepId, CompanyCode.
  - UserId (int, FK → WorkflowUsers.Id, not null).
  - Period (nvarchar(20), not null) — kỳ KPI (ví dụ: '2025-01').
  - CompletedTasks (int, default 0).
  - OnTimeRate (decimal(5,2), default 0).
  - OverdueTasks (int, default 0).
  - Workload (decimal(5,2), default 0).
  - CreatedDate (datetime, default getdate).
  - RecordStatus, datetime0, datetime2, user_id0, user_id2.
  - UNIQUE (CompanyCode, UserId, Period).

## Automation & Logging

- `WorkflowActivityLogs` — nhật ký hoạt động hợp nhất, nguồn audit/observability (audit trail mức hệ thống, phục vụ dashboard & phân tích).
  - Id (PK, int identity) — định danh log.
  - DepId (int, FK → WorkflowCompanies.Id, not null) — công ty.
  - CompanyCode (nvarchar(16), not null) — mã công ty.
  - EntityType (nvarchar(20), not null) — loại entity (PROJECT/TASK/REQUEST/USER/...).
  - EntityId (int, not null) — Id entity tương ứng (ProjectId, TaskId...). **Lưu ý**: Với Task, cần kết hợp với TaskMonth để xác định bảng phân kỳ.
  - ActivityType (nvarchar(50), not null) — loại hoạt động (CREATED/UPDATED/DELETED/STATUS_CHANGED/...).
  - Description (nvarchar(max), null) — mô tả chi tiết (tùy chọn).
  - ActorId (int, FK → WorkflowUsers.Id, not null) — người/thực thể thực hiện hành động.
  - CreatedDate (datetime, default getdate) — thời điểm ghi nhận.
  - RecordStatus (tinyint, default 1) — trạng thái bản ghi logic.
  - datetime0, datetime2, user_id0, user_id2 — audit chuẩn.
  - **Phân kỳ theo tháng**: `WorkflowActivityLogs_yyyymm` (ví dụ: `WorkflowActivityLogs_202512`).
  - **Stored Procedure**: `sp_CreateMonthlyActivityLogsTable @yyyymm`.
  - **Lý do**: Volume rất lớn (ghi mọi hoạt động), truy vấn chủ yếu theo thời gian (recent activities, dashboard).
  - **Bảng gốc**: `WorkflowActivityLogs` có thể dùng làm template hoặc bảng tháng hiện tại.

## Phân quyền hệ thống

### 1. Phân quyền menu chức năng
- Menu tổ chức hình cây
- Function: Edit/new/del/View
- Phụ thuộc vào vai trò (Admin/Supervisor/Nhân viên)

### 2. Phân quyền dự án
- ProjectManagerId: Người quản lý dự án có quyền cao nhất
- WorkflowProjectMembers: Phân quyền theo vai trò trong dự án
- ScopeType = 'PROJECT' trong WorkflowUserRoles

### 3. Phân quyền task: Giao việc & Flow
- AssignedBy: Người giao việc
- AssignedTo: Người thực hiện
- WorkflowTaskFlows: Danh sách người flow (nhiều người)
- Supervisor có thể giao việc cho nhân viên trong phạm vi quản lý

### 4. Phân quyền tổ chức: Supervisor
- **IsSup = 1**: Supervisor chịu tác động phân quyền theo tổ chức
- **Phạm vi quản lý**: 
  - Nhân viên trong cùng OrgUnitId
  - Nhân viên trong các đơn vị con (theo cây ParentId)
- **Quyền của Supervisor**:
  - Thêm mới, sửa, xóa nhân viên trong phạm vi quản lý
  - Phân quyền cho user dưới quyền của mình
  - Giao việc và quản lý task của nhân viên
  - Xem báo cáo và KPI của nhân viên trong phạm vi

### 5. Quyền Admin
- **IsAdmin = 1**: Quyền quản trị hệ thống
- Không bị giới hạn bởi tổ chức
- Có thể quản lý tất cả công ty, phòng ban, nhân viên
- Cấu hình hệ thống và phân quyền toàn cục

## Tóm tắt mối quan hệ

**Công ty (WorkflowCompanies)**
- `Id` → được dùng làm `DepId` trong tất cả các bảng business
- `CompanyCode` → mã định danh công ty (duplicated trong các bảng để filter nhanh)

**Phòng ban (WorkflowOrgUnits)**
- `DepId` → FK đến WorkflowCompanies.Id
- `ParentId` → FK đến WorkflowOrgUnits.Id (cấu trúc cây)
- `Level` → cấp bậc trong cây tổ chức

**Nhân viên (WorkflowUsers)**
- `DepId` → FK đến WorkflowCompanies.Id
- `OrgUnitId` → FK đến WorkflowOrgUnits.Id (thuộc phòng ban)
- `Level` → cấp bậc trong tổ chức (lấy từ WorkflowOrgUnits.Level để filter nhanh)
- `IsSup` → Supervisor (quản lý nhân viên trong phạm vi tổ chức)
- `IsAdmin` → Admin (quản trị hệ thống)

**Quy tắc phân cấp:**
- Công ty → Phòng ban (cấp 1) → Phòng ban con (cấp 2, 3...) → Nhân viên
- Supervisor quản lý nhân viên trong cùng phòng ban và các phòng ban con
- Admin có quyền toàn hệ thống, không bị giới hạn bởi tổ chức



