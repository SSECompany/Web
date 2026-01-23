import { DeleteOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, InputNumber, Select, Table } from "antd";
import dayjs from "dayjs";
import React from "react";

const VatTuGiaoHangTable = ({
  dataSource,
  onQuantityChange,
  onSelectChange,
  onDeleteItem,
  maKhoList,
  loadingMaKho,
  onMaKhoSearch,
  isEditMode,
}) => {
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã vật tư",
      dataIndex: "ma_vt",
      key: "ma_vt",
      width: 120,
      align: "center",
    },
    {
      title: "Tên vật tư",
      dataIndex: "ten_vt",
      key: "ten_vt",
      width: 200,
    },
    {
      title: "ĐVT",
      dataIndex: "dvt",
      key: "dvt",
      width: 80,
      align: "center",
    },
    {
      title: "Số lượng",
      dataIndex: "so_luong",
      key: "so_luong",
      width: 100,
      align: "center",
      render: (value, record) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => onQuantityChange(record.key, val)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Kho",
      dataIndex: "ma_kho",
      key: "ma_kho",
      width: 150,
      render: (value, record) => (
        <Select
          showSearch
          value={value}
          placeholder="Chọn kho"
          loading={loadingMaKho}
          onSearch={onMaKhoSearch}
          onChange={(val) => onSelectChange(record.key, "ma_kho", val)}
          filterOption={false}
          options={maKhoList}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Mã lô",
      dataIndex: "ma_lo",
      key: "ma_lo",
      width: 120,
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) =>
            onSelectChange(record.key, "ma_lo", e.target.value)
          }
          placeholder="Nhập mã lô"
        />
      ),
    },
    {
      title: "Hạn dùng",
      dataIndex: "han_dung",
      key: "han_dung",
      width: 130,
      render: (value, record) => (
        <DatePicker
          value={value ? dayjs(value) : null}
          onChange={(date) =>
            onSelectChange(record.key, "han_dung", date ? date.format("YYYY-MM-DD") : "")
          }
          format="DD/MM/YYYY"
          placeholder="Chọn hạn dùng"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "ghi_chu",
      key: "ghi_chu",
      width: 150,
      render: (value, record) => (
        <Input
          value={value}
          onChange={(e) =>
            onSelectChange(record.key, "ghi_chu", e.target.value)
          }
          placeholder="Nhập ghi chú"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDeleteItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      scroll={{ x: 1200, y: 400 }}
      bordered
      size="small"
      rowKey="key"
    />
  );
};

export default VatTuGiaoHangTable;
