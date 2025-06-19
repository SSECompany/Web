import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Input,
  message,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import "./phieu-xuat-kho-ban-hang.css";

const { Title } = Typography;

const ListPhieuXuatKhoBanHang = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_kh: "",
    ten_kh: "",
    ngay_ct: "",
    status: "",
  });

  const pageSize = 20;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allData.slice(startIndex, endIndex);

  const fetchPhieuXuatKhoBanHang = async (filterParams = filters) => {
    const body = {
      DateFrom: dayjs().startOf("month").format("YYYY-MM-DD"),
      DateTo: dayjs().endOf("month").format("YYYY-MM-DD"),
      PageIndex: 1,
      PageSize: 50,
      ...filterParams,
    };
    if (filterParams.ngay_ct) {
      body.ngay_ct = filterParams.ngay_ct.format("DD/MM/YYYY");
    }
    try {
      const res = await https.get(
        "v1/web/danh-sach-chung-tu-xuat-kho-ban-hang",
        body,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );
      setAllData(res.data.data || []);
      setTotalRecords((res.data.data || []).length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu xuất kho bán hàng:", err);
    }
  };

  useEffect(() => {
    fetchPhieuXuatKhoBanHang();
  }, []);

  const handleDelete = async (stt_rec) => {
    Modal.confirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const response = await https.post(
            "v1/web/xoa-ct-kho-hang-ban",
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              params: {
                sctRec: stt_rec,
              },
            }
          );

          if (response.data && response.data.statusCode === 200) {
            setAllData(allData.filter((item) => item.stt_rec !== stt_rec));
            message.success("Xóa phiếu thành công");
          } else {
            message.error(
              response.data?.message || "Có lỗi xảy ra khi xóa phiếu"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu:", error);
          message.error("Không thể xóa phiếu. Vui lòng thử lại sau.");
        }
      },
    });
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
      align: "center",
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            inputReadOnly
            value={
              selectedKeys[0] ? dayjs(selectedKeys[0], "DD/MM/YYYY") : null
            }
            onChange={(date) => {
              if (date) {
                setSelectedKeys([date.format("DD/MM/YYYY")]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: "block" }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày CT"
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = {
                ...filters,
                ngay_ct: selectedKeys[0]
                  ? dayjs(selectedKeys[0], "DD/MM/YYYY")
                  : null,
              };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.ngay_ct
        ? [filters.ngay_ct.format("DD/MM/YYYY")]
        : null,
      render: (text) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: () => (
        <div style={{ width: 120 }}>
          Số chứng từ{" "}
          {filters.so_ct ? <Tag color="blue">{filters.so_ct}</Tag> : null}
        </div>
      ),
      dataIndex: "so_ct",
      key: "so_ct",
      width: 150,
      align: "center",
      render: (text) => (text ? text.trim() : ""),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm Số CT"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.so_ct ? [filters.so_ct] : null,
    },
    {
      title: () => (
        <div style={{ width: 120 }}>
          Mã khách{" "}
          {filters.ma_kh ? <Tag color="blue">{filters.ma_kh}</Tag> : null}
        </div>
      ),
      dataIndex: "ma_kh",
      key: "ma_kh",
      width: 150,
      align: "center",
      render: (text) => (text ? text.trim() : ""),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm Mã khách"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, ma_kh: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, ma_kh: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.ma_kh ? [filters.ma_kh] : null,
    },
    {
      title: () => (
        <div style={{ width: 180 }}>
          Tên khách{" "}
          {filters.ten_kh ? <Tag color="blue">{filters.ten_kh}</Tag> : null}
        </div>
      ),
      dataIndex: "ten_kh",
      key: "ten_kh",
      width: 250,
      align: "left",
      render: (text) => (text ? text.trim() : ""),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm Tên khách"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              const newFilters = { ...filters, ten_kh: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => {
              confirm();
              const newFilters = { ...filters, ten_kh: selectedKeys[0] || "" };
              setFilters(newFilters);
              fetchPhieuXuatKhoBanHang(newFilters);
            }}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: 120,
      align: "center",
      render: (statusname, record) => {
        // Xác định màu dựa trên status
        let color = "default";
        switch (record.status) {
          case "0":
            color = "orange";
            break;
          case "4":
            color = "green";
            break;
          case "5":
            color = "blue";
            break;
          case "6":
            color = "purple";
            break;
          case "2":
            color = "cyan";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{statusname}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`${record.stt_rec}`)}
            className="phieu-action-btn phieu-view-btn"
          />
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`edit/${record.stt_rec}`)}
            className="phieu-action-btn phieu-edit-btn"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.stt_rec)}
            className="phieu-action-btn phieu-delete-btn"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="phieu-container">
      <Row justify="space-between" align="middle" className="phieu-header">
        <Col>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate("..")}
            className="phieu-back-button"
          >
            Trở về
          </Button>
        </Col>
        <Col>
          <Title level={3} className="phieu-title">
            DANH SÁCH PHIẾU XUẤT KHO BÁN HÀNG
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("add")}
            className="phieu-add-button"
          >
            Thêm mới
          </Button>
        </Col>
      </Row>

      <div className="phieu-table-container">
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            onChange: (page) => setCurrentPage(page),
          }}
          bordered
          rowKey="stt_rec"
          scroll={{ x: true, y: 600 }}
          className="phieu-data-table"
        />
      </div>
    </div>
  );
};

export default ListPhieuXuatKhoBanHang;
