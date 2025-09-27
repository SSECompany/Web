import { Button, notification, Table, Tag, Space, Input, Select, DatePicker } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, TeamOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import OperationColumn from "../../../../app/hooks/operationColumn";
import renderColumns from "../../../../app/hooks/renderColumns";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import TableLocale from "../../../../Context/TableLocale";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { apiGetProjects, apiDeleteProject } from "../../API";
import { setProjectsList, setLoading, setError, setPagination, setFilters } from "../../Store/Slices/ProjectSlice";
import ModalAddProject from "../../Modals/ModalAddProject/ModalAddProject";
import "./ProjectList.css";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { projectsList, loading, pagination, filters } = useSelector(state => state.projects);
  
  // Local state
  const [tableColumns, setTableColumns] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [openModalType, setOpenModalType] = useState("Add");
  const [currentRecord, setCurrentRecord] = useState(null);
  const [openModalAddProjectState, setOpenModalAddProjectState] = useState(false);
  const [isOpenModalDeleteProject, setIsOpenModalDeleteProject] = useState(false);
  const [currentItemSelected, setCurrentItemSelected] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Project status options
  const projectStatusOptions = [
    { value: "", label: "Tất cả" },
    { value: "PLANNING", label: "Lập kế hoạch" },
    { value: "IN_PROGRESS", label: "Đang thực hiện" },
    { value: "ON_HOLD", label: "Tạm dừng" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" }
  ];

  // Project priority options
  const priorityOptions = [
    { value: "", label: "Tất cả" },
    { value: "LOW", label: "Thấp" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HIGH", label: "Cao" },
    { value: "URGENT", label: "Khẩn cấp" }
  ];

  // Table columns configuration
  const getTableColumns = () => {
    return [
      {
        title: "Mã dự án",
        dataIndex: "projectCode",
        key: "projectCode",
        width: 120,
        fixed: "left",
        sorter: true,
      },
      {
        title: "Tên dự án",
        dataIndex: "projectName",
        key: "projectName",
        width: 200,
        fixed: "left",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => {
          const statusColors = {
            PLANNING: "blue",
            IN_PROGRESS: "processing",
            ON_HOLD: "warning",
            COMPLETED: "success",
            CANCELLED: "error"
          };
          const statusLabels = {
            PLANNING: "Lập kế hoạch",
            IN_PROGRESS: "Đang thực hiện",
            ON_HOLD: "Tạm dừng",
            COMPLETED: "Hoàn thành",
            CANCELLED: "Đã hủy"
          };
          return <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>;
        },
      },
      {
        title: "Độ ưu tiên",
        dataIndex: "priority",
        key: "priority",
        width: 100,
        render: (priority) => {
          const priorityColors = {
            LOW: "default",
            MEDIUM: "blue",
            HIGH: "orange",
            URGENT: "red"
          };
          const priorityLabels = {
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            URGENT: "Khẩn cấp"
          };
          return <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>;
        },
      },
      {
        title: "Quản lý dự án",
        dataIndex: "projectManager",
        key: "projectManager",
        width: 150,
      },
      {
        title: "Ngày bắt đầu",
        dataIndex: "startDate",
        key: "startDate",
        width: 120,
        render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "",
      },
      {
        title: "Ngày kết thúc",
        dataIndex: "endDate",
        key: "endDate",
        width: 120,
        render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "",
      },
      {
        title: "Tiến độ (%)",
        dataIndex: "progress",
        key: "progress",
        width: 100,
        render: (progress) => `${progress || 0}%`,
      },
      {
        title: "Ngân sách",
        dataIndex: "budget",
        key: "budget",
        width: 150,
        render: (budget) => budget ? budget.toLocaleString("vi-VN") + " VNĐ" : "",
      },
      {
        title: "Thao tác",
        key: "action",
        width: 200,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              title="Xem chi tiết"
            />
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Chỉnh sửa"
            />
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => handleViewDocuments(record)}
              title="Tài liệu"
            />
            <Button
              type="link"
              icon={<TeamOutlined />}
              onClick={() => handleViewResources(record)}
              title="Nguồn lực"
            />
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleOpenDeleteDialog(record)}
              title="Xóa"
            />
          </Space>
        ),
      },
    ];
  };

  // Functions
  const refreshData = () => {
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, filters);
  };

  const fetchProjects = async (paginationData = pagination, filterData = filters) => {
    try {
      dispatch(setLoading(true));
      const response = await apiGetProjects({
        pageindex: paginationData.pageindex,
        pageSize: paginationData.pageSize,
        searchKey: filterData.searchKey,
        status: filterData.status,
        startDate: filterData.startDate,
        endDate: filterData.endDate,
        projectManager: filterData.projectManager,
      });

      if (response.status === 200) {
        dispatch(setProjectsList(response.data.items || []));
        setTotalResults(response.data.totalCount || 0);
        dispatch(setPagination({ 
          ...paginationData, 
          total: response.data.totalCount || 0 
        }));
      } else {
        dispatch(setError("Có lỗi xảy ra khi tải dữ liệu"));
        notification.error({
          message: "Lỗi",
          description: "Có lỗi xảy ra khi tải dữ liệu dự án",
        });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      dispatch(setError(error.message));
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu dự án",
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setOpenModalAddProjectState(true);
    setOpenModalType("EDIT");
  };

  const handleViewDetail = (record) => {
    navigate(`/project-management/project/${record.id}`);
  };

  const handleViewDocuments = (record) => {
    navigate(`/project-management/project/${record.id}/documents`);
  };

  const handleViewResources = (record) => {
    navigate(`/project-management/project/${record.id}/resources`);
  };

  const handleOpenDeleteDialog = (record) => {
    setCurrentItemSelected(record);
    setIsOpenModalDeleteProject(true);
  };

  const handleDeleteProject = async () => {
    try {
      const response = await apiDeleteProject({
        id: currentItemSelected.id,
        action: "DELETE"
      });

      if (response.status === 200 && response.data === true) {
        notification.success({
          message: "Thành công",
          description: "Xóa dự án thành công",
        });
        refreshData();
      } else {
        notification.error({
          message: "Lỗi",
          description: "Có lỗi xảy ra khi xóa dự án",
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      notification.error({
        message: "Lỗi",
        description: "Có lỗi xảy ra khi xóa dự án",
      });
    } finally {
      setIsOpenModalDeleteProject(false);
      setCurrentItemSelected({});
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const newPagination = {
      pageindex: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, filters);
  };

  const handleSearch = (value) => {
    const newFilters = { ...filters, searchKey: value };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, newFilters);
  };

  const handleStatusChange = (value) => {
    const newFilters = { ...filters, status: value };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, newFilters);
  };

  const handleDateRangeChange = (dates) => {
    const newFilters = { 
      ...filters, 
      startDate: dates ? dates[0].format('YYYY-MM-DD') : null,
      endDate: dates ? dates[1].format('YYYY-MM-DD') : null
    };
    dispatch(setFilters(newFilters));
    const newPagination = { ...pagination, pageindex: 1, current: 1 };
    dispatch(setPagination(newPagination));
    fetchProjects(newPagination, newFilters);
  };

  // Effects
  useEffect(() => {
    setTableColumns(getTableColumns());
    fetchProjects();
  }, []);

  return (
    <div className="project-list-container">
      {/* Header */}
      <HeaderTableBar
        title="Danh sách dự án"
        buttonTitle="Thêm dự án mới"
        buttonIcon={<PlusOutlined />}
        onButtonClick={() => {
          setOpenModalAddProjectState(true);
          setOpenModalType("Add");
          setCurrentRecord(null);
        }}
      />

      {/* Filters */}
      <div className="project-filters" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Tìm kiếm dự án..."
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            value={filters.searchKey}
            onChange={(e) => dispatch(setFilters({ ...filters, searchKey: e.target.value }))}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={filters.status}
            onChange={handleStatusChange}
          >
            {projectStatusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            format="DD/MM/YYYY"
            onChange={handleDateRangeChange}
          />
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={tableColumns}
        dataSource={projectsList}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.pageindex,
          pageSize: pagination.pageSize,
          total: totalResults,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} dự án`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1500, y: 600 }}
        locale={TableLocale}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      {/* Add/Edit Modal */}
      <ModalAddProject
        openModalAddProjectState={openModalAddProjectState}
        handleCloseModal={() => {
          setOpenModalAddProjectState(false);
          setCurrentRecord(null);
        }}
        openModalType={openModalType}
        currentRecord={currentRecord}
        refreshData={refreshData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isOpenModalDeleteProject}
        title="Xác nhận xóa dự án"
        message={`Bạn có chắc chắn muốn xóa dự án "${currentItemSelected.projectName}"?`}
        onConfirm={handleDeleteProject}
        onCancel={() => {
          setIsOpenModalDeleteProject(false);
          setCurrentItemSelected({});
        }}
      />
    </div>
  );
};

export default ProjectList;









