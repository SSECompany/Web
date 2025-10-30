import {
  DownOutlined,
  IdcardOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AutoComplete, Button, Card, Input, Modal, notification } from "antd";
import React, { useMemo, useRef, useState } from "react";
import { createCustomer, searchCustomer } from "../../../api";

const CustomerInfo = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tempCustomer, setTempCustomer] = useState({
    phone: "",
    name: "",
    idNumber: "",
    patientName: "",
  });
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef();

  const isCreateDisabled = useMemo(() => {
    return !tempCustomer.name?.trim() || !tempCustomer.phone?.trim();
  }, [tempCustomer]);

  const handleOpenCreate = () => {
    setTempCustomer({
      phone: customer?.phone || "",
      name: customer?.name || "",
      idNumber: customer?.idNumber || "",
      patientName: customer?.patientName || "",
    });
    setIsCreateOpen(true);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchCustomer(value.trim());
        const list = res?.listObject?.[0] || [];
        const mapped = list.map((c) => ({
          value: c?.value || c?.phone || c?.id || Math.random().toString(),
          label: `${c?.label || c?.name || "Khách hàng"} • ${c?.phone || ""}`,
          raw: c,
        }));
        setOptions(mapped);
      } catch (e) {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = (_value, option) => {
    const raw = option?.raw || {};
    setCustomer({
      phone: raw.phone || raw.so_dt || "",
      name: raw.name || raw.ong_ba || raw.label || "",
      idNumber: raw.idNumber || raw.cccd || "",
      patientName: raw.patientName || "",
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Gọi API lưu khách hàng nếu backend hỗ trợ, nếu lỗi vẫn set local state
      const res = await createCustomer({
        phone: tempCustomer.phone?.trim(),
        name: tempCustomer.name?.trim(),
        idNumber: tempCustomer.idNumber?.trim(),
        patientName: tempCustomer.patientName?.trim(),
      });

      setCustomer({ ...tempCustomer });

      if (res?.responseModel?.isSucceded) {
        notification.success({ message: "Đã thêm khách hàng" });
      } else if (res?.success) {
        notification.success({ message: "Đã lưu khách hàng" });
      } else {
        notification.info({
          message: "Đã cập nhật thông tin KH trên đơn",
          description: res?.responseModel?.message,
        });
      }
      setIsCreateOpen(false);
    } catch (e) {
      setCustomer({ ...tempCustomer });
      notification.warning({
        message: "Không thể lưu lên máy chủ",
        description: "Đã dùng thông tin KH cục bộ cho đơn hàng",
      });
      setIsCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Thẻ Thông tin khách hàng - có thể ẩn/hiện */}
      <Card
        size="small"
        title={
          <div className="customer-title">
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              Thông tin khách hàng
            </span>
            <Button
              type="text"
              size="small"
              onClick={() => setCustomerOpen(!customerOpen)}
              className="toggle-btn"
              icon={
                customerOpen ? (
                  <UpOutlined style={{ fontSize: "11px" }} />
                ) : (
                  <DownOutlined style={{ fontSize: "11px" }} />
                )
              }
            />
          </div>
        }
        className="customer-info-card"
        headStyle={{ padding: "8px 12px", minHeight: "auto" }}
        bodyStyle={{ padding: "8px 12px" }}
      >
        {customerOpen && (
          <div style={{ fontSize: "12px" }}>
            {/* Dòng 0: Tìm KH + Thêm mới */}
            <div
              className="customer-actions-row"
              style={{ display: "flex", gap: 8, marginBottom: 8 }}
            >
              <AutoComplete
                value={searchValue}
                onChange={setSearchValue}
                onSearch={handleSearch}
                options={options}
                onSelect={handleSelect}
                className="customer-search-input"
                popupMatchSelectWidth={500}
                allowClear
              >
                <Input
                  placeholder={
                    searching ? "Đang tìm..." : "Tìm KH theo SĐT/Tên"
                  }
                  size="small"
                  prefix={<SearchOutlined style={{ fontSize: "11px" }} />}
                />
              </AutoComplete>
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                onClick={handleOpenCreate}
                className="add-customer-btn"
              />
            </div>
            {/* Dòng 1: Số điện thoại */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Số điện thoại"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                size="small"
                prefix={<PhoneOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* Dòng 2: Tên khách hàng */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Tên khách hàng"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                size="small"
                prefix={<UserOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* Dòng 3: CMND/CCCD */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="CMND/CCCD"
                value={customer.idNumber}
                onChange={(e) =>
                  setCustomer({ ...customer, idNumber: e.target.value })
                }
                size="small"
                prefix={<IdcardOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* Dòng 4: Họ tên người bệnh */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Họ tên người bệnh"
                value={customer.patientName}
                onChange={(e) =>
                  setCustomer({ ...customer, patientName: e.target.value })
                }
                size="small"
                prefix={<UserOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>
        )}
      </Card>

      <Modal
        title="Thêm mới khách hàng"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        okText="Lưu"
        onOk={handleCreate}
        confirmLoading={creating}
        okButtonProps={{ disabled: isCreateDisabled }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input
            placeholder="Số điện thoại"
            value={tempCustomer.phone}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, phone: e.target.value })
            }
            size="middle"
            prefix={<PhoneOutlined style={{ fontSize: "12px" }} />}
          />
          <Input
            placeholder="Tên khách hàng"
            value={tempCustomer.name}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, name: e.target.value })
            }
            size="middle"
            prefix={<UserOutlined style={{ fontSize: "12px" }} />}
          />
          <Input
            placeholder="CMND/CCCD"
            value={tempCustomer.idNumber}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, idNumber: e.target.value })
            }
            size="middle"
            prefix={<IdcardOutlined style={{ fontSize: "12px" }} />}
          />
          <Input
            placeholder="Họ tên người bệnh"
            value={tempCustomer.patientName}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, patientName: e.target.value })
            }
            size="middle"
            prefix={<UserOutlined style={{ fontSize: "12px" }} />}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomerInfo;
