import React, { useState, useEffect } from "react";
import { Modal, Table, Button, Checkbox, InputNumber, message, Tag } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";

const ModalChonVatTuKeThua = ({ open, onCancel, onConfirm, data = [] }) => {
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    if (open) {
      // Initialize with all items deselected by default and pre-filled with order quantity
      setSelectedRows(data.map(item => ({ 
        ...item, 
        selected: false,
        so_luong0: item.so_luong || 0
      })));
    }
  }, [open, data]);

  const columns = [
    {
      title: (
        <Checkbox
          indeterminate={
            selectedRows.some((i) => i.selected) &&
            !selectedRows.every((i) => i.selected)
          }
          checked={selectedRows.length > 0 && selectedRows.every((i) => i.selected)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedRows(selectedRows.map((i) => ({ ...i, selected: checked })));
          }}
        />
      ),
      dataIndex: "selected",
      key: "selected",
      width: 60,
      align: "center",
      render: (val, record, index) => (
        <Checkbox
          checked={record.selected}
          onChange={(e) => {
            const newList = [...selectedRows];
            newList[index].selected = e.target.checked;
            setSelectedRows(newList);
          }}
        />
      ),
    },
    {
      title: "Sản phẩm",
      key: "san_pham",
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', lineHeight: '1.4', display: 'block' }}>
              {record.ten_vt}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '2px 8px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 700 }}>{record.ma_vt}</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ fontWeight: 500 }}>{record.dvt}</span>
          </div>
        </div>
      )
    },
    {
      title: "Số lượng nhận",
      dataIndex: "so_luong0",
      key: "so_luong0",
      width: 140,
      render: (val, record, index) => (
        <InputNumber
          min={0}
          value={record.so_luong0}
          onChange={(newVal) => {
            const newList = [...selectedRows];
            newList[index].so_luong0 = newVal;
            if (newVal > 0) {
              newList[index].selected = true;
            } else {
              newList[index].selected = false;
            }
            setSelectedRows(newList);
          }}
          size="middle"
          style={{ width: "100%", borderRadius: "8px" }}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: "SL đặt",
      dataIndex: "so_luong",
      key: "so_luong",
      width: 100,
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: '14px' }}>
          {val?.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "gia_nt",
      key: "gia_nt",
      width: 130,
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 600, color: "#059669", fontSize: '14px' }}>
          {val?.toLocaleString("vi-VN")}
        </span>
      ),
    },
  ];

  const handleConfirm = () => {
    const chosenItems = selectedRows.filter(item => item.selected && (item.so_luong0 || 0) > 0);
    if (chosenItems.length === 0) {
      message.warning("Vui lòng chọn ít nhất một vật tư với số lượng > 0");
      return;
    }
    onConfirm(chosenItems);
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
          }}>
            <ShoppingCartOutlined style={{ color: "#fff", fontSize: "16px" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
            Chọn chi tiết vật tư kế thừa
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={1000}
      onOk={handleConfirm}
      okText="Xác nhận kế thừa"
      cancelText="Hủy"
      okButtonProps={{
        style: { borderRadius: "8px", height: "38px", padding: "0 24px", fontWeight: 600 }
      }}
      cancelButtonProps={{
        style: { borderRadius: "8px", height: "38px" }
      }}
      styles={{
        body: { padding: "12px 24px 24px" },
        content: { borderRadius: "16px", overflow: "hidden" }
      }}
      destroyOnClose
    >
      <div style={{ marginBottom: "16px", padding: "10px 16px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>
        <span style={{ fontSize: "13px", color: "#166534" }}>
          💡 <b>Mẹo:</b> Nhập số lượng nhận cho từng món hàng. Hệ thống sẽ tự động tick chọn các hàng có số lượng lớn hơn 0.
        </span>
      </div>
      <Table
        dataSource={selectedRows}
        columns={columns}
        pagination={false}
        rowKey={(record) => record.stt_rec0 || record.ma_vt}
        size="middle"
        scroll={{ y: 400 }}
        style={{ 
          borderRadius: "8px", 
          border: "1px solid #f1f5f9",
          overflow: "hidden"
        }}
      />
    </Modal>
  );
};

export default ModalChonVatTuKeThua;
