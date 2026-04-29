# Hướng dẫn Mapping Status sang số (0-6)

## Mapping Status
```
0 = PLANNING
1 = ACTIVE
2 = IN_PROGRESS
3 = COMPLETED
4 = ON_HOLD
5 = PAUSED
6 = CANCELLED
```

## Các file cần sửa

### 1. Database Stored Procedures

#### ✅ Đã sửa:
- **`FIX_Api_ProjectSummary_Load_StatusMapping.sql`** - SP mới với mapping status sang số

#### ⚠️ Cần sửa thêm:
- **`06_stored_procedures_projects.sql`**
  - `Api_ProjectList_Load` - Dòng 93, 109: Filter `@Status`
  - `Api_ProjectSummary_Load` - Dòng 138-141: SUM CASE WHEN Status = ...
  - `Api_ProjectList_ByStatus` - Dòng 190: WHERE Status = @Status
  - `Api_Project_Create` - Dòng 362: Default status 'PLANNING'
  - `Api_Project_Update` - Dòng 522, 603: Update Status

- **`09_stored_procedures_users_customers_dashboard.sql`**
  - Dòng 351-355: SUM CASE WHEN Status = ...
  - Dòng 468, 495: WHERE Status = 'ACTIVE'

- **`08_stored_procedures_relationships.sql`**
  - Dòng 205-206: SUM CASE WHEN p.Status = ...
  - Các chỗ khác check Status

### 2. Frontend Files

#### ⚠️ Cần sửa:
- **`src/components/ProjectManagement/Pages/ProjectList/ProjectList.jsx`**
  - Dòng 54-60: `STATUS_META` - Có thể giữ nguyên (dùng key string)
  - Dòng 75-82: `projectStatusOptions` - Có thể giữ nguyên (dùng value string)
  - Dòng 138, 189: Check status trong logic
  - Dòng 320-350: Mapping status từ API (đã OK, không cần sửa vì API trả về tên field)

- **`src/components/ProjectManagement/Modals/ModalAddProject/ModalAddProject.jsx`**
  - Check xem có set status mặc định không

- **`src/components/ProjectManagement/Pages/ProjectDetail/ProjectDetail.jsx`**
  - Check xem có xử lý status không

### 3. Logic Mapping trong SP

SP mới (`FIX_Api_ProjectSummary_Load_StatusMapping.sql`) đã xử lý:
- Status là số (0-6): dùng trực tiếp
- Status là string ('PLANNING', 'ACTIVE', ...): convert sang số
- Status NULL: coi như 0 (PLANNING)

## Cách áp dụng

### Bước 1: Chạy SP mới
```sql
-- Chạy file: FIX_Api_ProjectSummary_Load_StatusMapping.sql
```

### Bước 2: Sửa các SP khác (nếu cần)
Nếu muốn các SP khác cũng hỗ trợ cả số và string, thêm logic tương tự:

```sql
-- Ví dụ trong Api_ProjectList_Load
WHERE (
  -- Nếu @Status là số
  (ISNUMERIC(@Status) = 1 AND CAST(@Status AS INT) = CASE 
    WHEN ISNUMERIC(Status) = 1 THEN CAST(Status AS INT)
    WHEN UPPER(LTRIM(RTRIM(Status))) = 'PLANNING' THEN 0
    WHEN UPPER(LTRIM(RTRIM(Status))) = 'ACTIVE' THEN 1
    -- ... các status khác
    ELSE 0
  END)
  OR
  -- Nếu @Status là string
  (@Status IS NOT NULL AND UPPER(LTRIM(RTRIM(@Status))) = UPPER(LTRIM(RTRIM(Status))))
  OR
  -- Nếu @Status là NULL (lấy tất cả)
  (@Status IS NULL)
)
```

### Bước 3: Frontend (tùy chọn)
Frontend có thể giữ nguyên vì:
- API trả về field names (PlanningProjects, ActiveProjects, ...)
- Frontend map theo field names, không cần biết status trong DB là số hay string

## Lưu ý

1. **Tương thích ngược**: SP mới hỗ trợ cả status là số (0-6) và string ('PLANNING', ...)
2. **NULL handling**: Status NULL được coi như 0 (PLANNING)
3. **Case insensitive**: String comparison dùng UPPER() để không phân biệt hoa/thường
4. **Trim spaces**: Dùng LTRIM(RTRIM()) để loại bỏ khoảng trắng
