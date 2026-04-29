import React, { useState } from 'react';
import { Button, Card, message, Space, Typography } from 'antd';
import { createWorkflowProject } from './API/workflowApi';

const { Title, Text } = Typography;

/**
 * Component test để gọi API tạo dự án
 */
const TestCreateProject = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateProject = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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
      console.log('🚀 Bắt đầu tạo dự án...');
      console.log('📋 Dữ liệu dự án:', projectData);

      const response = await createWorkflowProject(projectData);

      console.log('✅ Tạo dự án thành công!');
      console.log('📦 Kết quả:', response);

      setResult(response);
      message.success('Tạo dự án thành công!');
    } catch (err) {
      console.error('❌ Lỗi khi tạo dự án:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo dự án';
      setError(errorMessage);
      message.error(errorMessage);

      if (err.response) {
        console.error('📄 Chi tiết lỗi:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ margin: '20px', maxWidth: '800px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Test API Tạo Dự Án</Title>
          <Text type="secondary">
            Component này dùng để test API tạo dự án workflow
          </Text>
        </div>

        <Button
          type="primary"
          onClick={handleCreateProject}
          loading={loading}
          size="large"
        >
          {loading ? 'Đang tạo dự án...' : 'Tạo Dự Án Test'}
        </Button>

        {result && (
          <Card type="inner" title="✅ Kết quả thành công" style={{ background: '#f6ffed' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}

        {error && (
          <Card type="inner" title="❌ Lỗi" style={{ background: '#fff2f0' }}>
            <Text type="danger">{error}</Text>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default TestCreateProject;

