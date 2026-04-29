// Import workflow APIs
import {
  getWorkflowProjectsList,
  createWorkflowProject,
  getWorkflowProjectDetail,
  updateWorkflowProject,
  deleteWorkflowProject,
  getWorkflowProjectDashboard,
  getWorkflowProjectDocuments,
  createWorkflowProjectDocument,
  deleteWorkflowProjectDocument,
  getWorkflowProjectPosts,
  createWorkflowProjectPost,
  getWorkflowProjectMembers,
  createWorkflowProjectMember,
  deleteWorkflowProjectMember,
} from "../../WorkflowApp/API/workflowApi";

// ============================================
// PROJECT MANAGEMENT APIs - Sử dụng Workflow API
// ============================================

/**
 * Lấy danh sách dự án
 * @param {Object} data - Tham số
 * @param {string} data.companyCode - Mã công ty
 * @param {number} [data.pageIndex] - Số trang
 * @param {number} [data.pageSize] - Số lượng bản ghi mỗi trang
 * @param {string} [data.searchKey] - Từ khóa tìm kiếm
 * @param {string} [data.status] - Trạng thái dự án
 * @param {string} [data.priority] - Độ ưu tiên
 * @param {number} [data.orgUnitId] - ID đơn vị tổ chức
 * @returns {Promise} Promise trả về danh sách dự án
 */
export const apiGetProjects = async (data) => {
  try {
    const result = await getWorkflowProjectsList({
      companyCode: data.companyCode || "DVCS01",
      pageIndex: data.pageIndex || data.pageindex || 1,
      pageSize: data.pageSize || 20,
      searchKey: data.searchKey,
      status: data.status,
      priority: data.priority,
      orgUnitId: data.orgUnitId,
    });
    
    // Map response về format cũ nếu cần
    return {
      status: 200,
      data: {
        items: Array.isArray(result) ? result : [],
        totalCount: Array.isArray(result) ? result.length : 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy chi tiết dự án
 * @param {Object} data - Tham số
 * @param {number} data.projectId - ID dự án
 * @param {string} [data.companyCode] - Mã công ty
 * @returns {Promise} Promise trả về chi tiết dự án
 */
export const apiGetProject = async (data) => {
  try {
    const result = await getWorkflowProjectDetail({
      projectId: data.projectId || data.id,
      companyCode: data.companyCode || "DVCS01",
    });
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo dự án mới
 * @param {Object} data - Dữ liệu dự án
 * @returns {Promise} Promise trả về dự án đã tạo
 */
export const apiCreateProject = async (data) => {
  try {
    const projectData = {
      companyCode: data.companyCode || "DVCS01",
      projectName: data.projectName || "",
      status: data.status || "",
      priority: data.priority || "",
      projectManagerId: data.projectManagerId || 1,
      orgUnitId: data.orgUnitId || 1,
      clientName: data.clientName || data.customerName || "",
      healthStatus: data.healthStatus || "",
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : new Date().toISOString(),
      budget: data.budget || 0,
      description: data.description || "",
      createdBy: data.createdBy || data.userid || 1,
    };
    
    const result = await createWorkflowProject(projectData);
    
    return {
      status: 200,
      data: true,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật dự án
 * @param {Object} data - Dữ liệu dự án
 * @returns {Promise} Promise trả về kết quả cập nhật
 */
export const apiUpdateProject = async (data) => {
  try {
    const projectData = {
      projectId: data.id || data.projectId,
      companyCode: data.companyCode || "DVCS01",
      projectName: data.projectName || "",
      status: data.status || "",
      priority: data.priority || "",
      projectManagerId: data.projectManagerId,
      orgUnitId: data.orgUnitId,
      clientName: data.clientName || data.customerName || "",
      healthStatus: data.healthStatus || "",
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      budget: data.budget,
      budgetUsed: data.budgetUsed,
      progress: data.progress,
      description: data.description || "",
      updatedBy: data.updatedBy || data.userid || 1,
    };
    
    const result = await updateWorkflowProject(projectData);
    
    return {
      status: 200,
      data: true,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa dự án
 * @param {Object} data - Tham số
 * @param {number} data.id - ID dự án
 * @param {string} [data.companyCode] - Mã công ty
 * @param {number} [data.deletedBy] - ID người xóa
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const apiDeleteProject = async (data) => {
  try {
    const result = await deleteWorkflowProject({
      projectId: data.id || data.projectId,
      companyCode: data.companyCode || "DVCS01",
      deletedBy: data.deletedBy || data.userid || 1,
    });
    
    return {
      status: 200,
      data: true,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// PROJECT DOCUMENTS APIs
// ============================================

/**
 * Lấy danh sách documents của dự án
 * @param {Object} data - Tham số
 * @param {number} data.projectId - ID dự án
 * @param {string} [data.companyCode] - Mã công ty
 * @returns {Promise} Promise trả về danh sách documents
 */
export const apiGetProjectDocuments = async (data) => {
  try {
    const result = await getWorkflowProjectDocuments({
      projectId: data.projectId || data.id,
      companyCode: data.companyCode || "DVCS01",
    });
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo document mới cho dự án
 * @param {Object} data - Dữ liệu document
 * @returns {Promise} Promise trả về document đã tạo
 */
export const apiCreateProjectDocument = async (data) => {
  try {
    const documentData = {
      companyCode: data.companyCode || "DVCS01",
      projectId: data.projectId || data.id,
      fileName: data.fileName || "",
      filePath: data.filePath || "",
      fileType: data.fileType || "",
      fileSize: data.fileSize || 0,
      tags: data.tags || "",
      uploadedBy: data.uploadedBy || data.userid || 1,
    };
    
    const result = await createWorkflowProjectDocument(documentData);
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// PROJECT COMMUNICATIONS/POSTS APIs
// ============================================

/**
 * Lấy danh sách posts/communications của dự án
 * @param {Object} data - Tham số
 * @param {number} data.projectId - ID dự án
 * @param {string} [data.companyCode] - Mã công ty
 * @returns {Promise} Promise trả về danh sách posts
 */
export const apiGetProjectCommunications = async (data) => {
  try {
    const result = await getWorkflowProjectPosts({
      projectId: data.projectId || data.id,
      companyCode: data.companyCode || "DVCS01",
      pageIndex: data.pageIndex || 1,
      pageSize: data.pageSize || 20,
    });
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo post/communication mới cho dự án
 * @param {Object} data - Dữ liệu post
 * @returns {Promise} Promise trả về post đã tạo
 */
export const apiCreateProjectCommunication = async (data) => {
  try {
    const postData = {
      companyCode: data.companyCode || "DVCS01",
      projectId: data.projectId || data.id,
      content: data.content || data.message || "",
      isPinned: data.isPinned || false,
      mentionsJson: data.mentionsJson || "[]",
      createdBy: data.createdBy || data.userid || 1,
    };
    
    const result = await createWorkflowProjectPost(postData);
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// PROJECT RESOURCES/MEMBERS APIs
// ============================================

/**
 * Lấy danh sách members/resources của dự án
 * @param {Object} data - Tham số
 * @param {number} data.projectId - ID dự án
 * @param {string} [data.companyCode] - Mã công ty
 * @returns {Promise} Promise trả về danh sách members
 */
export const apiGetProjectResources = async (data) => {
  try {
    const result = await getWorkflowProjectMembers({
      projectId: data.projectId || data.id,
      companyCode: data.companyCode || "DVCS01",
    });
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Thêm member/resource vào dự án
 * @param {Object} data - Dữ liệu member
 * @returns {Promise} Promise trả về member đã thêm
 */
export const apiAssignProjectResource = async (data) => {
  try {
    const memberData = {
      companyCode: data.companyCode || "DVCS01",
      projectId: data.projectId || data.id,
      userId: data.userId || data.memberId,
      role: data.role || "MEMBER",
      allocation: data.allocation || 100,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      createdBy: data.createdBy || data.userid || 1,
    };
    
    const result = await createWorkflowProjectMember(memberData);
    
    return {
      status: 200,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// PROJECT REPORTS APIs (Giữ lại để tương thích, có thể implement sau)
// ============================================

/**
 * Lấy báo cáo tiến độ dự án
 * @param {Object} data - Tham số
 * @returns {Promise} Promise trả về báo cáo
 */
export const apiGetProjectProgressReport = async (data) => {
  // TODO: Implement sau nếu cần
  return {
    status: 200,
    data: [],
  };
};

/**
 * Lấy báo cáo khối lượng dự án
 * @param {Object} data - Tham số
 * @returns {Promise} Promise trả về báo cáo
 */
export const apiGetProjectVolumeReport = async (data) => {
  // TODO: Implement sau nếu cần
  return {
    status: 200,
    data: [],
  };
};

/**
 * Lấy báo cáo chi phí dự án
 * @param {Object} data - Tham số
 * @returns {Promise} Promise trả về báo cáo
 */
export const apiGetProjectCostReport = async (data) => {
  // TODO: Implement sau nếu cần
  return {
    status: 200,
    data: [],
  };
};

/**
 * Lấy báo cáo KPI dự án
 * @param {Object} data - Tham số
 * @returns {Promise} Promise trả về báo cáo
 */
export const apiGetProjectKPIReport = async (data) => {
  // TODO: Implement sau nếu cần
  return {
    status: 200,
    data: [],
  };
};

// ============================================
// EXPORT THÊM CÁC API MỚI
// ============================================

export {
  getWorkflowProjectDashboard,
  deleteWorkflowProjectDocument,
  deleteWorkflowProjectMember,
};
