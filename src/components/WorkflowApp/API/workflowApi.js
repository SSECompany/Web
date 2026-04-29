import axiosInstanceRootApi from "../../../utils/axiosInstanceRootApi";
import axios from "axios";

/**
 * API service cho Workflow sử dụng REACT_APP_ROOT_API
 */

const buildQueryUrl = (endpoint, params = {}) => {
  const baseURL = axiosInstanceRootApi.defaults.baseURL;
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();
  return `${baseURL}${endpoint}${queryString ? `?${queryString}` : ""}`;
};

const postJsonWithoutAuth = async (fullURL) => {
  const response = await fetch(fullURL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Lấy thống kê dashboard workflow
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {string} [params.yyyymm] - Kỳ tháng (format YYYYMM)
 * @param {number} [params.userId] - ID người dùng
 * @param {number} [params.projectId] - ID dự án
 * @returns {Promise} Promise trả về dữ liệu dashboard stats
 */
export const getWorkflowDashboardStats = async (params = {}) => {
  try {
    const endpoint = "workflow/dashboard/stats";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách hoạt động gần đây
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} [params.limit] - Số lượng bản ghi
 * @returns {Promise} Promise trả về danh sách hoạt động
 */
export const getWorkflowRecentActivities = async (params = {}) => {
  try {
    const endpoint = "workflow/dashboard/recent-activities";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thống kê dự án từ dashboard
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} [params.userId] - ID người dùng
 * @returns {Promise} Promise trả về thống kê dự án
 */
export const getWorkflowProjectStats = async (params = {}) => {
  try {
    const endpoint = "workflow/dashboard/project-stats";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo dự án mới
 * @param {Object} projectData - Dữ liệu dự án
 * @param {string} projectData.companyCode - Mã công ty
 * @param {string} projectData.projectName - Tên dự án
 * @param {string} [projectData.status] - Trạng thái dự án
 * @param {string} [projectData.priority] - Độ ưu tiên
 * @param {number} projectData.projectManagerId - ID người quản lý dự án
 * @param {number} projectData.orgUnitId - ID đơn vị tổ chức
 * @param {string} projectData.clientName - Tên khách hàng
 * @param {string} [projectData.healthStatus] - Tình trạng sức khỏe dự án
 * @param {string} projectData.startDate - Ngày bắt đầu (ISO format)
 * @param {string} projectData.endDate - Ngày kết thúc (ISO format)
 * @param {number} projectData.budget - Ngân sách
 * @param {string} [projectData.description] - Mô tả
 * @param {number} projectData.createdBy - ID người tạo
 * @returns {Promise} Promise trả về dữ liệu dự án đã tạo
 */
/**
 * Lấy danh sách dự án cho dropdown
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về danh sách dự án cho dropdown
 */
export const getWorkflowDropdownProjects = async (params = {}) => {
  try {
    const endpoint = "workflow/dropdowns/projects";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách project managers cho dropdown
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về danh sách project managers cho dropdown
 */
export const getWorkflowDropdownProjectManagers = async (params = {}) => {
  try {
    const endpoint = "workflow/dropdowns/project-managers";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách dự án workflow
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} [params.pageIndex] - Số trang (mặc định: 1)
 * @param {number} [params.pageSize] - Số lượng bản ghi mỗi trang (mặc định: 20)
 * @param {string} [params.searchKey] - Từ khóa tìm kiếm
 * @param {string} [params.status] - Trạng thái dự án
 * @param {string} [params.priority] - Độ ưu tiên
 * @param {number} [params.orgUnitId] - ID đơn vị tổ chức
 * @returns {Promise} Promise trả về danh sách dự án
 */
export const getWorkflowProjectsList = async (params = {}) => {
  try {
    const endpoint = "workflow/projects/list";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thống kê tổng hợp dự án
 * @param {Object} params - Tham số query
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về thống kê tổng hợp dự án
 */
export const getWorkflowProjectSummary = async (params = {}) => {
  try {
    const endpoint = "workflow/projects/summary";
    const fullURL = buildQueryUrl(endpoint, params);
    return await postJsonWithoutAuth(fullURL);
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo dự án mới
 * @param {Object} projectData - Dữ liệu dự án
 * @param {string} projectData.companyCode - Mã công ty
 * @param {string} projectData.projectName - Tên dự án
 * @param {string} [projectData.status] - Trạng thái dự án
 * @param {string} [projectData.priority] - Độ ưu tiên
 * @param {number} projectData.projectManagerId - ID người quản lý dự án
 * @param {number} projectData.orgUnitId - ID đơn vị tổ chức
 * @param {string} projectData.clientName - Tên khách hàng
 * @param {string} [projectData.healthStatus] - Tình trạng sức khỏe dự án
 * @param {string} projectData.startDate - Ngày bắt đầu (ISO format)
 * @param {string} projectData.endDate - Ngày kết thúc (ISO format)
 * @param {number} projectData.budget - Ngân sách
 * @param {string} [projectData.description] - Mô tả
 * @param {number} [projectData.estimatedHours] - Số giờ ước tính
 * @param {number} [projectData.actualHours] - Số giờ thực tế
 * @param {string} [projectData.notes] - Ghi chú
 * @param {number} projectData.createdBy - ID người tạo
 * @returns {Promise} Promise trả về dữ liệu dự án đã tạo
 */
export const createWorkflowProject = async (projectData) => {
  try {
    const endpoint = "workflow/projects";
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    const fullURL = `${baseURL}${endpoint}`;
    
    // Tạm thời sử dụng axios trực tiếp không có authorization
    const response = await axios.post(fullURL, projectData, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        // Không thêm Authorization header
      },
      timeout: 20000,
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * ==========================
 *  RELATIONS API
 * ==========================
 */

/**
 * Lấy danh sách dự án theo user (user-projects)
 */
export const getWorkflowUserProjects = async (params = {}) => {
  const endpoint = "workflow/relations/user-projects";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Lấy danh sách users của 1 project (project-users)
 */
export const getWorkflowProjectUsers = async (params = {}) => {
  const endpoint = "workflow/relations/project-users";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Thống kê dự án theo user (user-project-stats)
 */
export const getWorkflowUserProjectStats = async (params = {}) => {
  const endpoint = "workflow/relations/user-project-stats";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Lấy danh sách tasks theo project (project-tasks)
 */
export const getWorkflowProjectTasks = async (params = {}) => {
  const endpoint = "workflow/relations/project-tasks";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Thống kê tasks của project (project-task-stats)
 */
export const getWorkflowProjectTaskStats = async (params = {}) => {
  const endpoint = "workflow/relations/project-task-stats";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Lấy danh sách tasks của user trong 1 project (user-project-tasks)
 */
export const getWorkflowUserProjectTasks = async (params = {}) => {
  const endpoint = "workflow/relations/user-project-tasks";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Dashboard cho user (user-dashboard)
 */
export const getWorkflowUserDashboard = async (params = {}) => {
  const endpoint = "workflow/relations/user-dashboard";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Dashboard theo project (project-dashboard relations)
 */
export const getWorkflowRelationsProjectDashboard = async (params = {}) => {
  const endpoint = "workflow/relations/project-dashboard";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Search nâng cao (relations/search)
 */
export const searchWorkflowRelations = async (params = {}) => {
  const endpoint = "workflow/relations/search";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * ==========================
 *  TASKS API
 * ==========================
 */

/**
 * Lấy danh sách tasks theo kỳ (tasks/list)
 */
export const getWorkflowTasksList = async (params = {}) => {
  const endpoint = "workflow/tasks/list";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Lấy chi tiết 1 task (tasks/{yyyymm}/{taskId}/detail)
 */
export const getWorkflowTaskDetail = async (params = {}) => {
  const { yyyymm, taskId, companyCode } = params;
  if (!yyyymm || !taskId || !companyCode) {
    throw new Error("yyyymm, taskId, companyCode are required");
  }
  const endpoint = `workflow/tasks/${yyyymm}/${taskId}/detail`;
  const fullURL = buildQueryUrl(endpoint, { companyCode });
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Tạo task mới (workflow/tasks)
 */
export const createWorkflowTask = async (taskData) => {
  const endpoint = "workflow/tasks";
  const baseURL = axiosInstanceRootApi.defaults.baseURL;
  const fullURL = `${baseURL}${endpoint}`;

  const response = await axios.post(fullURL, taskData, {
    headers: {
      accept: "text/plain",
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  return response.data;
};

/**
 * Cập nhật task (tasks/{yyyymm}/{taskId}/update)
 */
export const updateWorkflowTask = async (taskData) => {
  const { yyyymm, taskId } = taskData;
  if (!yyyymm || !taskId) {
    throw new Error("yyyymm and taskId are required");
  }
  const endpoint = `workflow/tasks/${yyyymm}/${taskId}/update`;
  const baseURL = axiosInstanceRootApi.defaults.baseURL;
  const fullURL = `${baseURL}${endpoint}`;

  const response = await axios.post(fullURL, taskData, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  return response.data;
};

/**
 * Cập nhật trạng thái task (tasks/{yyyymm}/{taskId}/status)
 * @param {Object} payload - Payload chứa companyCode, yyyymm, taskId, newStatus, updatedBy
 */
export const updateWorkflowTaskStatus = async (payload) => {
  const { yyyymm, taskId, newStatus } = payload;
  if (!yyyymm || !taskId || !newStatus) {
    throw new Error("yyyymm, taskId and newStatus are required");
  }
  const endpoint = `workflow/tasks/${yyyymm}/${taskId}/status`;
  const baseURL = axiosInstanceRootApi.defaults.baseURL;
  const fullURL = `${baseURL}${endpoint}`;

  // Đảm bảo payload đúng format API yêu cầu
  const apiPayload = {
    companyCode: payload.companyCode,
    yyyymm: yyyymm,
    taskId: taskId,
    newStatus: newStatus, // Sử dụng newStatus thay vì status
    updatedBy: payload.updatedBy || 1,
  };

  const response = await axios.post(fullURL, apiPayload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  return response.data;
};

/**
 * Xóa task (tasks/{yyyymm}/{taskId}/delete)
 */
export const deleteWorkflowTask = async (params = {}) => {
  const { yyyymm, taskId, companyCode, deletedBy } = params;
  if (!yyyymm || !taskId || !companyCode || !deletedBy) {
    throw new Error("yyyymm, taskId, companyCode, deletedBy are required");
  }
  const endpoint = `workflow/tasks/${yyyymm}/${taskId}/delete`;
  const fullURL = buildQueryUrl(endpoint, { companyCode, deletedBy });
  const response = await axios.post(
    fullURL,
    {},
    {
      headers: {
        accept: "*/*",
      },
      timeout: 20000,
    }
  );
  return response.data;
};

/**
 * Lấy tasks theo project (tasks/by-project)
 */
export const getWorkflowTasksByProject = async (params = {}) => {
  const endpoint = "workflow/tasks/by-project";
  const fullURL = buildQueryUrl(endpoint, params);
  return await postJsonWithoutAuth(fullURL);
};

/**
 * Lấy chi tiết dự án workflow
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về chi tiết dự án
 */
export const getWorkflowProjectDetail = async (params = {}) => {
  try {
    const { projectId, companyCode } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/detail`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    // Tạo query string từ params
    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);

    // POST nhưng params truyền vào query string (URL)
    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // API trả về array, lấy phần tử đầu tiên
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật dự án workflow
 * @param {Object} projectData - Dữ liệu dự án
 * @param {number} projectData.projectId - ID dự án
 * @param {string} projectData.companyCode - Mã công ty
 * @param {string} [projectData.projectName] - Tên dự án
 * @param {string} [projectData.status] - Trạng thái dự án
 * @param {string} [projectData.priority] - Độ ưu tiên
 * @param {number} [projectData.projectManagerId] - ID người quản lý dự án
 * @param {number} [projectData.orgUnitId] - ID đơn vị tổ chức
 * @param {string} [projectData.clientName] - Tên khách hàng
 * @param {string} [projectData.healthStatus] - Tình trạng sức khỏe dự án
 * @param {string} [projectData.startDate] - Ngày bắt đầu (ISO format)
 * @param {string} [projectData.endDate] - Ngày kết thúc (ISO format)
 * @param {number} [projectData.budget] - Ngân sách
 * @param {number} [projectData.budgetUsed] - Ngân sách đã sử dụng
 * @param {number} [projectData.progress] - Tiến độ
 * @param {string} [projectData.description] - Mô tả
 * @param {number} [projectData.estimatedHours] - Số giờ ước tính
 * @param {number} [projectData.actualHours] - Số giờ thực tế
 * @param {string} [projectData.notes] - Ghi chú
 * @param {number} projectData.updatedBy - ID người cập nhật
 * @returns {Promise} Promise trả về dữ liệu dự án đã cập nhật
 */
export const updateWorkflowProject = async (projectData) => {
  try {
    const { projectId } = projectData;
    if (!projectId) {
      throw new Error("projectId is required");
    }

    const endpoint = `workflow/projects/${projectId}/update`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    const fullURL = `${baseURL}${endpoint}`;
    
    const response = await axios.post(fullURL, projectData, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      timeout: 20000,
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa dự án workflow
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} params.deletedBy - ID người xóa (bắt buộc)
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteWorkflowProject = async (params = {}) => {
  try {
    const { projectId, companyCode, deletedBy } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    if (!deletedBy) {
      throw new Error("deletedBy is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/delete`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);
    queryParams.append("deletedBy", deletedBy);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await axios.post(fullURL, {}, {
      headers: {
        'accept': '*/*',
      },
      timeout: 20000,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy dashboard dự án workflow
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về dashboard dự án
 */
export const getWorkflowProjectDashboard = async (params = {}) => {
  try {
    const { projectId, companyCode } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/dashboard`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách documents của dự án
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về danh sách documents
 */
export const getWorkflowProjectDocuments = async (params = {}) => {
  try {
    const { projectId, companyCode } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/documents/list`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo document mới cho dự án
 * @param {Object} documentData - Dữ liệu document
 * @param {string} documentData.companyCode - Mã công ty
 * @param {number} documentData.projectId - ID dự án
 * @param {string} documentData.fileName - Tên file
 * @param {string} documentData.filePath - Đường dẫn file
 * @param {string} documentData.fileType - Loại file
 * @param {number} documentData.fileSize - Kích thước file
 * @param {string} [documentData.tags] - Tags
 * @param {number} documentData.uploadedBy - ID người upload
 * @returns {Promise} Promise trả về document đã tạo
 */
export const createWorkflowProjectDocument = async (documentData) => {
  try {
    const endpoint = `workflow/projects/${documentData.projectId}/documents`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    const fullURL = `${baseURL}${endpoint}`;
    
    const response = await axios.post(fullURL, documentData, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      timeout: 20000,
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa document của dự án
 * @param {Object} params - Tham số
 * @param {number} params.documentId - ID document (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} params.deletedBy - ID người xóa (bắt buộc)
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteWorkflowProjectDocument = async (params = {}) => {
  try {
    const { documentId, companyCode, deletedBy } = params;
    
    if (!documentId) {
      throw new Error("documentId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    if (!deletedBy) {
      throw new Error("deletedBy is required");
    }
    
    const endpoint = `workflow/projects/documents/${documentId}/delete`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);
    queryParams.append("deletedBy", deletedBy);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await axios.post(fullURL, {}, {
      headers: {
        'accept': '*/*',
      },
      timeout: 20000,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tải xuống document của dự án
 * @param {Object} params - Tham số
 * @param {number} params.documentId - ID document (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {string} params.filePath - Đường dẫn file (bắt buộc)
 * @param {string} params.fileName - Tên file để download (bắt buộc)
 * @returns {Promise} Promise trả về blob data
 */
export const downloadWorkflowProjectDocument = async (params = {}) => {
  try {
    const { documentId, companyCode, filePath, fileName } = params;
    
    if (!documentId) {
      throw new Error("documentId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    let downloadURL;
    let response;

    // Thử dùng API endpoint trước
    try {
      const endpoint = `workflow/projects/documents/${documentId}/download`;
      const queryParams = new URLSearchParams();
      queryParams.append("companyCode", companyCode);
      downloadURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

      response = await axios.get(downloadURL, {
        responseType: 'blob',
        headers: {
          'accept': '*/*',
        },
        timeout: 60000, // 60s cho file lớn
      });
    } catch (apiError) {
      // Fallback: Sử dụng FilePath trực tiếp nếu API endpoint không tồn tại
      if (filePath) {
        // Nếu filePath là đường dẫn tuyệt đối (bắt đầu bằng http/https), dùng trực tiếp
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          downloadURL = filePath;
        } else {
          // Nếu là đường dẫn tương đối, ghép với baseURL
          downloadURL = `${baseURL}${filePath.startsWith('/') ? filePath : '/' + filePath}`;
        }
        
        response = await axios.get(downloadURL, {
          responseType: 'blob',
          headers: {
            'accept': '*/*',
          },
          timeout: 60000,
        });
      } else {
        throw new Error("Không tìm thấy đường dẫn file để tải xuống");
      }
    }

    // Tạo blob URL và download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `document_${documentId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách hoạt động của dự án
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} [params.pageIndex] - Số trang
 * @param {number} [params.pageSize] - Số lượng bản ghi mỗi trang
 * @param {string} [params.activityType] - Lọc theo loại hoạt động
 * @param {string} [params.startDate] - Ngày bắt đầu
 * @param {string} [params.endDate] - Ngày kết thúc
 * @returns {Promise} Promise trả về danh sách hoạt động
 */
export const getWorkflowProjectActivities = async (params = {}) => {
  try {
    const { projectId, companyCode, pageIndex = 1, pageSize = 50, activityType, startDate, endDate } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/activities`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);
    queryParams.append("pageIndex", pageIndex);
    queryParams.append("pageSize", pageSize);
    if (activityType) {
      queryParams.append("activityType", activityType);
    }
    if (startDate) {
      queryParams.append("startDate", startDate);
    }
    if (endDate) {
      queryParams.append("endDate", endDate);
    }

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách posts của dự án
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} [params.pageIndex] - Số trang
 * @param {number} [params.pageSize] - Số lượng bản ghi mỗi trang
 * @returns {Promise} Promise trả về danh sách posts
 */
export const getWorkflowProjectPosts = async (params = {}) => {
  try {
    const { projectId, companyCode, pageIndex = 1, pageSize = 20 } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/posts/list`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);
    queryParams.append("pageIndex", pageIndex);
    queryParams.append("pageSize", pageSize);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo post mới cho dự án
 * @param {Object} postData - Dữ liệu post
 * @param {string} postData.companyCode - Mã công ty
 * @param {number} postData.projectId - ID dự án
 * @param {string} postData.content - Nội dung post
 * @param {boolean} [postData.isPinned] - Có ghim không
 * @param {string} [postData.mentionsJson] - JSON mentions
 * @param {number} postData.createdBy - ID người tạo
 * @returns {Promise} Promise trả về post đã tạo
 */
export const createWorkflowProjectPost = async (postData) => {
  try {
    const endpoint = `workflow/projects/${postData.projectId}/posts`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    const fullURL = `${baseURL}${endpoint}`;
    
    const response = await axios.post(fullURL, postData, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      timeout: 20000,
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách members của dự án
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @returns {Promise} Promise trả về danh sách members
 */
export const getWorkflowProjectMembers = async (params = {}) => {
  try {
    const { projectId, companyCode } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/members/list`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(fullURL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Thêm member vào dự án
 * @param {Object} memberData - Dữ liệu member
 * @param {string} memberData.companyCode - Mã công ty
 * @param {number} memberData.projectId - ID dự án
 * @param {number} memberData.userId - ID người dùng
 * @param {string} [memberData.role] - Vai trò
 * @param {number} [memberData.allocation] - Phân bổ
 * @param {string} [memberData.startDate] - Ngày bắt đầu (ISO format)
 * @param {string} [memberData.endDate] - Ngày kết thúc (ISO format)
 * @param {number} memberData.createdBy - ID người tạo
 * @returns {Promise} Promise trả về member đã thêm
 */
export const createWorkflowProjectMember = async (memberData) => {
  try {
    const endpoint = `workflow/projects/${memberData.projectId}/members`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;
    const fullURL = `${baseURL}${endpoint}`;
    
    const response = await axios.post(fullURL, memberData, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      timeout: 20000,
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa member khỏi dự án
 * @param {Object} params - Tham số
 * @param {number} params.projectId - ID dự án (bắt buộc)
 * @param {number} params.memberId - ID member (bắt buộc)
 * @param {string} params.companyCode - Mã công ty (bắt buộc)
 * @param {number} params.removedBy - ID người xóa (bắt buộc)
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteWorkflowProjectMember = async (params = {}) => {
  try {
    const { projectId, memberId, companyCode, removedBy } = params;
    
    if (!projectId) {
      throw new Error("projectId is required");
    }
    
    if (!memberId) {
      throw new Error("memberId is required");
    }
    
    if (!companyCode) {
      throw new Error("companyCode is required");
    }
    
    if (!removedBy) {
      throw new Error("removedBy is required");
    }
    
    const endpoint = `workflow/projects/${projectId}/members/${memberId}/delete`;
    const baseURL = axiosInstanceRootApi.defaults.baseURL;

    const queryParams = new URLSearchParams();
    queryParams.append("companyCode", companyCode);
    queryParams.append("removedBy", removedBy);

    const fullURL = `${baseURL}${endpoint}?${queryParams.toString()}`;

    console.log("[deleteWorkflowProjectMember] Calling API:", fullURL);
    console.log("[deleteWorkflowProjectMember] Params:", { projectId, memberId, companyCode, removedBy });

    const response = await axios.post(fullURL, {}, {
      headers: {
        'accept': '*/*',
      },
      timeout: 20000,
    });

    console.log("[deleteWorkflowProjectMember] API response:", response.data);

    return response.data;
  } catch (error) {
    console.error("[deleteWorkflowProjectMember] API error:", error);
    console.error("[deleteWorkflowProjectMember] Error response:", error?.response);
    throw error;
  }
};

