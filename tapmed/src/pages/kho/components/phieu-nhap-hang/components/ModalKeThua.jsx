import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Table,
  Input,
  DatePicker,
  Button,
  Space,
  message,
  Tag,
  Spin,
} from "antd";
import { SearchOutlined, ReloadOutlined, LinkOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchDonHangKeThua, fetchDonHangKeThuaDetail } from "../utils/phieuNhapHangApi";
import ModalChonVatTuKeThua from "./ModalChonVatTuKeThua";

const { RangePicker } = DatePicker;

const ModalKeThua = ({ open, onCancel, onSelect, maKhach = "" }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    so_ct: "",
    dateRange: [dayjs().subtract(3, "month"), dayjs()],
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState({ master: null, detail: [], originalRecord: null });

  const userStr = localStorage.getItem("user");
  const unitsResponseStr = localStorage.getItem("unitsResponse");
  const user = userStr ? JSON.parse(userStr) : {};
  const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};
  const ma_dvcs = user.unitId || unitsResponse.unitId || "TAPMED";

  const fetchData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const params = {
          ma_dvcs,
          ma_kh: maKhach,
          so_ct: filters.so_ct,
          status: "2,3",
          DateFrom: filters.dateRange?.[0]
            ? filters.dateRange[0].format("YYYY-MM-DD")
            : null,
          DateTo: filters.dateRange?.[1]
            ? filters.dateRange[1].format("YYYY-MM-DD")
            : null,
          PageIndex: page,
          PageSize: pageSize,
        };

        const result = await fetchDonHangKeThua(params);

        if (result.success) {
          setData(result.data);
          setPagination({
            current: page,
            pageSize,
            total: result.pagination.totalRecord || result.data.length,
          });
        } else {
          message.error("Không thể tải danh sách đơn hàng");
        }
      } catch (error) {
        console.error("Error fetching don hang ke thua:", error);
        message.error("Lỗi khi tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    },
    [ma_dvcs, maKhach, filters]
  );

  useEffect(() => {
    if (open) {
      fetchData(1, pagination.pageSize);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
  };

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const handleRowSelect = async (record) => {
    setLoading(true);
    try {
      const result = await fetchDonHangKeThuaDetail(record.stt_rec);
      if (result.success && (result.master || (result.detail && result.detail.length > 0))) {
        setDetailData({
          master: result.master,
          detail: result.detail,
          originalRecord: record
        });
        setShowDetailModal(true);
      } else {
        message.error("Không thể lấy thông tin chi tiết đơn hàng hoặc đơn hàng không có vật tư");
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
      message.error("Lỗi khi tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDetail = (selectedItems) => {
    if (onSelect) {
      onSelect({
        master: detailData.master || detailData.originalRecord,
        detail: selectedItems,
        originalRecord: detailData.originalRecord
      });
    }
    setShowDetailModal(false);
    onCancel(); // Close the main ModalKeThua as well
  };

  const columns = [
    {
      title: "Số CT",
      dataIndex: "so_ct",
      key: "so_ct",
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 700, color: "#2563eb" }}>
          {text?.trim()}
        </span>
      ),
    },
    {
      title: "Ngày CT",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      width: 120,
      render: (text) => (
        <span style={{ color: "#64748b", fontSize: '13px' }}>
          {text ? dayjs(text).format("DD/MM/YYYY") : ""}
        </span>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "t_tt_nt",
      key: "t_tt_nt",
      align: "right",
      render: (val) => {
        const num = parseFloat(val || 0);
        return (
          <span style={{ fontWeight: 700, color: "#16a34a", fontSize: '15px' }}>
            {num.toLocaleString("vi-VN")}
          </span>
        );
      },
    },
    {
      title: "Tiền tệ",
      dataIndex: "ma_nt",
      key: "ma_nt",
      width: 90,
      align: "center",
      render: (text) => (
        <Tag color="default" style={{ borderRadius: "4px", border: "none", background: "#f1f5f9", color: "#64748b" }}>
          {text || "VND"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (val, record) => {
        const s = String(val).trim();
        const label = record.statusname || s;
        const colorMap = {
          "0": "orange",
          "1": "magenta",
          "2": "blue",
          "3": "purple",
          "4": "green",
          "5": "cyan",
          "6": "red",
          "9": "green",
        };
        const color = colorMap[s] || "default";
        return <Tag color={color} style={{ borderRadius: "12px", padding: "2px 12px", border: 'none', fontSize: '11px' }}>{label}</Tag>;
      },
    },
    {
      title: "",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          onClick={(e) => {
            e.stopPropagation();
            handleRowSelect(record);
          }}
          style={{ 
            borderRadius: "6px", 
            fontSize: "13px", 
            fontWeight: 600,
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)" 
          }}
        >
          Chọn
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          📋 Kế thừa đơn hàng mua
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      styles={{
        body: { padding: "16px 24px" },
      }}
      destroyOnClose
    >
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="Tìm số chứng từ..."
          value={filters.so_ct}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, so_ct: e.target.value }))
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          allowClear
        />
        <RangePicker
          value={filters.dateRange}
          onChange={(dates) =>
            setFilters((prev) => ({ ...prev, dateRange: dates }))
          }
          format="DD/MM/YYYY"
          style={{ width: 260 }}
        />
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setFilters({
                so_ct: "",
                dateRange: [dayjs().subtract(3, "month"), dayjs()],
              });
              setTimeout(() => fetchData(1, pagination.pageSize), 100);
            }}
          >
            Đặt lại
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.stt_rec || record.so_ct || Math.random()}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            size: "small",
          }}
          onChange={handleTableChange}
          size="small"
          scroll={{ x: 600 }}
          onRow={(record) => ({
            onClick: () => handleRowSelect(record),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: "Không tìm thấy đơn hàng nào",
          }}
          style={{ 
            borderRadius: 8,
            overflow: "hidden",
          }}
        />
      </Spin>

      <ModalChonVatTuKeThua
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        onConfirm={handleConfirmDetail}
        data={detailData.detail}
      />
    </Modal>
  );
};

export default ModalKeThua;
