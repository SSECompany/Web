/**
 * Script test để gọi API tạo dự án
 * Có thể import và chạy từ console hoặc component
 */

import { createWorkflowProject } from './workflowApi';

/**
 * Test tạo dự án với dữ liệu mẫu
 */
export const testCreateProject = async () => {
  const projectData = {
    companyCode: "DVCS01",
    projectName: "test-02",
    status: "",
    priority: "",
    projectManagerId: 1,
    orgUnitId: 1,
    clientName: "test",
    healthStatus: "",
    startDate: "2025-12-25T08:55:06.475Z",
    endDate: "2025-12-28T08:55:06.475Z",
    budget: 100000,
    description: "",
    createdBy: 1
  };

  try {
    console.log('🚀 Bắt đầu test tạo dự án...');
    console.log('📋 Dữ liệu dự án:', projectData);
    
    const result = await createWorkflowProject(projectData);
    
    console.log('✅ Tạo dự án thành công!');
    console.log('📦 Kết quả:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Lỗi khi tạo dự án:', error);
    if (error.response) {
      console.error('📄 Chi tiết lỗi:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    throw error;
  }
};

// Export để có thể gọi từ console: testCreateProject()
export default testCreateProject;

