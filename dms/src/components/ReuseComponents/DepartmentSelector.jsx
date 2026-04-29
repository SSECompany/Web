import { Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../store/selectors/Selectors";
import checkPermission from "../../utils/permission";

const { Option } = Select;
const { Text } = Typography;

const DepartmentSelector = ({
  value,
  onChange,
  placeholder = "Chọn phòng ban",
  allowAll = false,
  style = {},
  size = "middle",
}) => {
  const userInfo = useSelector(getUserInfo);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data - sẽ thay bằng API call thực tế
  const mockDepartments = [
    { id: "IT", name: "Phòng Công nghệ thông tin", code: "IT" },
    { id: "HR", name: "Phòng Nhân sự", code: "HR" },
    { id: "SALE", name: "Phòng Kinh doanh", code: "SALE" },
    { id: "MARKETING", name: "Phòng Marketing", code: "MKT" },
    { id: "FINANCE", name: "Phòng Tài chính", code: "FIN" },
    { id: "ADMIN", name: "Phòng Hành chính", code: "ADM" },
    { id: "PRODUCTION", name: "Phòng Sản xuất", code: "PROD" },
    { id: "QC", name: "Phòng Kiểm tra chất lượng", code: "QC" },
  ];

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiGetDepartments();
      // setDepartments(response.data);

      // For now, use mock data
      let availableDepartments = [...mockDepartments];

      // If user doesn't have admin permission, only show their department
      const canViewAllDepartments = checkPermission(
        "WORKFLOW_VIEW_ALL_DEPARTMENTS"
      );

      if (!canViewAllDepartments && userInfo.unitId) {
        availableDepartments = mockDepartments.filter(
          (dept) => dept.id === userInfo.unitId || dept.code === userInfo.unitId
        );
      }

      setDepartments(availableDepartments);
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (selectedValue) => {
    if (onChange) {
      const selectedDept = departments.find(
        (dept) => dept.id === selectedValue
      );
      onChange(selectedValue, selectedDept);
    }
  };

  return (
    <Space
      direction="vertical"
      size="small"
      style={{ width: "100%", ...style }}
    >
      <Select
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ width: "100%" }}
        size={size}
        loading={loading}
        allowClear
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {allowAll && (
          <Option value="ALL">
            <Text strong>Tất cả phòng ban</Text>
          </Option>
        )}
        {departments.map((dept) => (
          <Option key={dept.id} value={dept.id}>
            <Space>
              <Text code>{dept.code}</Text>
              <Text>{dept.name}</Text>
            </Space>
          </Option>
        ))}
      </Select>

      {userInfo.unitName && (
        <Text type="secondary" style={{ fontSize: "12px" }}>
          Phòng ban hiện tại: <Text strong>{userInfo.unitName}</Text>
        </Text>
      )}
    </Space>
  );
};

export default DepartmentSelector;

