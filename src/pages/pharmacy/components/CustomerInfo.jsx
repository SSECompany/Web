import {
  DownOutlined,
  IdcardOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  UpOutlined,
  UserOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Modal, Select, notification, DatePicker, Tooltip, Spin } from "antd";
import React, { useMemo, useRef, useState, useEffect } from "react";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { createCustomer, searchKhachHang, updateKhachHang } from "../../../api";

const CustomerInfo = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { id: userId } = useSelector((state) => state.claims?.userInfo || {});
  const [tempCustomer, setTempCustomer] = useState({
    phone: "",
    name: "",
    birthday: "",
    address: "",
    note: "",
  });
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const debounceRef = useRef();
  const [phoneExistsError, setPhoneExistsError] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const isPhoneValid = useMemo(() => {
    return /^\d{10}$/.test((tempCustomer.phone || "").trim());
  }, [tempCustomer.phone]);

  const isCreateDisabled = useMemo(() => {
    return !tempCustomer.name?.trim() || !isPhoneValid;
  }, [tempCustomer.name, isPhoneValid]);

  // Clear search value when customer is selected
  useEffect(() => {
    if (customer?.code) {
      setSearchValue("");
    }
  }, [customer?.code]);

  const handlePhoneChange = (e) => {
    const onlyDigits = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setPhoneExistsError(false);
    setTempCustomer({ ...tempCustomer, phone: onlyDigits });
  };

  const handleOpenCreate = () => {
    setTempCustomer({
      phone: "",
      name: "",
      birthday: "",
      address: "",
      note: "",
    });
    setPhoneExistsError(false);
    setIsCreateOpen(true);
  };

  const handleOpenUpdate = () => {
    setTempCustomer({
      phone: customer.phone || "",
      name: customer.name || "",
      birthday: customer.birthday || "",
      address: customer.address || "",
      note: customer.note || "",
    });
    setIsUpdateOpen(true);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const keyword = (value || "").trim();
        const res = await searchKhachHang(keyword, 1, 10);
        const data = res?.listObject?.[0] || [];
        const paginationInfo = res?.listObject?.[1]?.[0] || {};
        const pageSize = 10;
        const totalRecord =
          paginationInfo.totalrecord ??
          paginationInfo.totalRecord ??
          paginationInfo.TotalRecord ??
          paginationInfo.Totalrecord;
        let metaTotalPage =
          paginationInfo.totalpage ??
          paginationInfo.totalPage ??
          paginationInfo.TotalPage ??
          paginationInfo.Totalpage;
        if (!metaTotalPage) {
          if (typeof totalRecord === "number") {
            metaTotalPage = Math.max(1, Math.ceil(totalRecord / pageSize));
          } else {
            metaTotalPage = data.length < pageSize ? 1 : 2; // minimal fallback
          }
        }
        const mapped = data.map((c) => {
          const code = c?.ma_kh || c?.value || c?.id || Math.random().toString();
          const name = c?.ten_kh || c?.label || c?.name || "";
          return {
            value: code,
            label: `${code} - ${name}`.trim(),
            raw: c,
          };
        });
        setOptions(mapped);
        setPageIndex(1);
        setTotalPage(metaTotalPage || 1);
        setCurrentKeyword(keyword);
      } catch (e) {
        setOptions([]);
        setPageIndex(1);
        setTotalPage(1);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handlePopupScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20 && pageIndex < totalPage && !searching) {
      setSearching(true);
      try {
        const nextPage = pageIndex + 1;
        const res = await searchKhachHang(currentKeyword, nextPage, 10);
        const data = res?.listObject?.[0] || [];
        const paginationInfo = res?.listObject?.[1]?.[0] || {};
        const mapped = data.map((c) => {
          const code = c?.ma_kh || c?.value || c?.id || Math.random().toString();
          const name = c?.ten_kh || c?.label || c?.name || "";
          return {
            value: code,
            label: `${code} - ${name}`.trim(),
            raw: c,
          };
        });
        // Append and deduplicate by value
        setOptions((prev) => {
          const seen = new Set(prev.map((o) => o.value));
          const appended = mapped.filter((o) => !seen.has(o.value));
          return [...prev, ...appended];
        });
        setPageIndex(nextPage);
        const newTotalPage =
          paginationInfo.totalpage ??
          paginationInfo.totalPage ??
          paginationInfo.TotalPage ??
          paginationInfo.Totalpage ??
          totalPage;
        if (newTotalPage && newTotalPage !== totalPage) {
          setTotalPage(newTotalPage);
        }
      } catch (e) {
        // ignore scroll errors
      } finally {
        setSearching(false);
      }
    }
  };

  const handleSelect = (_value, option) => {
    const raw = option?.raw || {};
    setCustomer({
      code: raw.ma_kh || raw.code || "",
      phone: raw.dien_thoai || raw.phone || raw.so_dt || "",
      name: raw.ten_kh || raw.name || raw.ong_ba || raw.label || "",
      birthday: raw.ngay_sinh || raw.birthday || "",
      address: raw.dia_chi || raw.address || "",
      note: raw.ghi_chu || raw.note || "",
    });
    setSearchValue(""); // Clear search input after selection
    setCustomerDropdownOpen(false); // Close dropdown after selection
  };

  const handleCreate = async () => {
    setCreating(true);
    setPhoneExistsError(false);
    try {
      // Gọi API lưu khách hàng nếu backend hỗ trợ, nếu lỗi vẫn set local state
      const res = await createCustomer({
        phone: tempCustomer.phone?.trim(),
        name: tempCustomer.name?.trim(),
        birthday: tempCustomer.birthday?.trim(),
        address: tempCustomer.address?.trim(),
        note: tempCustomer.note?.trim(),
        userId: userId,
      });

      const responseMessage = res?.responseModel?.message || "";
      const normalizedMessage = responseMessage.toLowerCase();
      const isDuplicatePhone = normalizedMessage.includes("đã có mã khách");
      const createdRaw =
        res?.listObject?.[0]?.[0] ||
        res?.data ||
        res ||
        {};

      if (res?.responseModel?.isSucceded) {
        setCustomer({
          code: createdRaw.ma_kh || createdRaw.code || customer.code || "",
          phone: tempCustomer.phone?.trim(),
          name: tempCustomer.name?.trim(),
          birthday: tempCustomer.birthday?.trim(),
          address: tempCustomer.address?.trim(),
          note: tempCustomer.note?.trim(),
        });
        notification.success({ message: "Đã thêm khách hàng" });
        setIsCreateOpen(false);
        setTempCustomer({
          phone: "",
          name: "",
          birthday: "",
          address: "",
          note: "",
        });
      } else if (res?.success) {
        setCustomer({
          code: createdRaw.ma_kh || createdRaw.code || customer.code || "",
          phone: tempCustomer.phone?.trim(),
          name: tempCustomer.name?.trim(),
          birthday: tempCustomer.birthday?.trim(),
          address: tempCustomer.address?.trim(),
          note: tempCustomer.note?.trim(),
        });
        notification.success({ message: "Đã lưu khách hàng" });
        setIsCreateOpen(false);
        setTempCustomer({
          phone: "",
          name: "",
          birthday: "",
          address: "",
          note: "",
        });
      } else if (isDuplicatePhone) {
        notification.info({
          message: "Đã cập nhật thông tin KH trên đơn",
          description: responseMessage,
        });
        setPhoneExistsError(true);
      } else {
        setCustomer({
          code: createdRaw.ma_kh || createdRaw.code || customer.code || "",
          phone: tempCustomer.phone?.trim(),
          name: tempCustomer.name?.trim(),
          birthday: tempCustomer.birthday?.trim(),
          address: tempCustomer.address?.trim(),
          note: tempCustomer.note?.trim(),
        });
        notification.info({
          message: "Đã cập nhật thông tin KH trên đơn",
          description: responseMessage,
        });
        setIsCreateOpen(false);
        setTempCustomer({
          phone: "",
          name: "",
          birthday: "",
          address: "",
          note: "",
        });
      }
    } catch (e) {
      notification.warning({
        message: "Không thể lưu lên máy chủ",
        description: "Đã dùng thông tin KH cục bộ cho đơn hàng",
      });
      setIsCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!customer.code?.trim()) {
      notification.warning({ message: "Vui lòng nhập Mã KH để cập nhật" });
      return;
    }
    setUpdating(true);
    try {
      const res = await updateKhachHang({
        code: customer.code?.trim(),
        phone: tempCustomer.phone?.trim(),
        name: tempCustomer.name?.trim(),
        birthday: tempCustomer.birthday?.trim(),
        address: tempCustomer.address?.trim(),
        note: tempCustomer.note?.trim(),
        userId: userId,
      });

      const updatedRaw =
        res?.listObject?.[0]?.[0] ||
        res?.data ||
        res ||
        {};

      setCustomer({
        code: updatedRaw.ma_kh || customer.code,
        phone: updatedRaw.dien_thoai || tempCustomer.phone?.trim(),
        name: updatedRaw.ten_kh || tempCustomer.name?.trim(),
        birthday: updatedRaw.ngay_sinh || tempCustomer.birthday?.trim(),
        address: updatedRaw.dia_chi || tempCustomer.address?.trim(),
        note: updatedRaw.ghi_chu || tempCustomer.note?.trim(),
      });

      if (res?.responseModel?.isSucceded) {
        notification.success({ message: "Đã cập nhật khách hàng" });
      } else if (res?.success) {
        notification.success({ message: "Đã lưu thông tin khách hàng" });
      } else {
        notification.info({
          message: "Đã cập nhật thông tin KH trên đơn",
          description: res?.responseModel?.message,
        });
      }
      setIsUpdateOpen(false);
    } catch (e) {
      notification.error({ message: "Cập nhật thất bại", description: "Không thể kết nối máy chủ" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Thẻ Thông tin khách hàng - luôn hiển thị, bỏ toggle ẩn/hiện */}
      <Card
        size="small"
        title={
          <div className="customer-title">
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              Thông tin khách hàng
            </span>
          </div>
        }
        className="customer-info-card"
        styles={{
          header: { padding: "8px 12px", minHeight: "auto" },
          body: { padding: "8px 12px" },
        }}
      >
        <div style={{ fontSize: "12px" }}>
          {/* Dòng 0: Tìm KH + Thêm mới */}
          <div
            className="customer-actions-row"
            style={{ display: "flex", gap: 8, marginBottom: 8 }}
          >
            <Select
              key={customer?.code || "search"} // Force re-render when customer changes
              showSearch
              value={searchValue || undefined}
              onSearch={handleSearch}
              onChange={(v) => {
                // Clear searchValue immediately when a value is selected
                // This prevents the selected value from showing in the input
                setSearchValue("");
              }}
              onSelect={(v, option) => handleSelect(v, option)}
              onOpenChange={(open) => {
                setCustomerDropdownOpen(open);
                if (open) {
                  handleSearch(searchValue || "");
                } else if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                }
              }}
              onPopupScroll={handlePopupScroll}
              options={options}
              className="customer-search-input"
              popupMatchSelectWidth={400}
              allowClear
              placeholder={
                searching ? "Đang tìm..." : "Tìm KH theo SĐT/Tên"
              }
              size="small"
              filterOption={false}
              style={{ width: "100%" }}
              optionLabelProp="label"
              optionFilterProp="label"
              suffixIcon={<SearchOutlined style={{ fontSize: "11px" }} />}
              styles={{
                popup: {
                  root: { maxHeight: 300, overflow: "auto" },
                },
              }}
              notFoundContent={
                searching ? (
                  <div
                    style={{
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Spin size="small" />
                  </div>
                ) : null
              }
              open={customerDropdownOpen}
              loading={searching && options.length > 0}
            />
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined style={{ fontSize: 12 }} />}
              onClick={handleOpenCreate}
              className="add-customer-btn"
            />
            <Tooltip title="Cập nhật" placement="top">
              <Button
                size="small"
                icon={<EditOutlined style={{ fontSize: 12 }} />}
                onClick={handleOpenUpdate}
                disabled={!customer.code}
                className="update-customer-btn"
              />
            </Tooltip>
          </div>
          {/* Dòng 0.5: Mã KH */}
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="Mã KH"
              value={customer.code}
              onChange={(e) => setCustomer({ ...customer, code: e.target.value })}
              size="small"
              prefix={<IdcardOutlined style={{ fontSize: "11px" }} />}
              style={{ fontSize: "12px" }}
              disabled={!!customer.code}
            />
          </div>
          {/* Dòng 1: Số điện thoại */}
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="Số điện thoại"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              size="small"
              prefix={<PhoneOutlined style={{ fontSize: "11px" }} />}
              style={{ fontSize: "12px" }}
              disabled={!!customer.code}
            />
          </div>
          {/* Dòng 2: Tên khách hàng */}
          <div style={{ marginBottom: "8px" }}>
            <Input
              placeholder="Tên khách hàng"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              size="small"
              prefix={<UserOutlined style={{ fontSize: "11px" }} />}
              style={{ fontSize: "12px" }}
              disabled={!!customer.code}
            />
          </div>
          {/* Bỏ các dòng CMND/CCCD và Họ tên người bệnh theo yêu cầu */}
        </div>
      </Card>

      <Modal
        title="Thêm mới khách hàng"
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false);
          setPhoneExistsError(false);
        }}
        okText="Lưu"
        onOk={handleCreate}
        confirmLoading={creating}
        okButtonProps={{ disabled: isCreateDisabled }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input
            placeholder="Số điện thoại"
            value={tempCustomer.phone}
            onChange={handlePhoneChange}
            size="middle"
            prefix={<PhoneOutlined style={{ fontSize: "12px" }} />}
            status={!isPhoneValid || phoneExistsError ? "error" : ""}
          />
          <Input
            placeholder="Tên khách hàng"
            value={tempCustomer.name}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, name: e.target.value })
            }
            size="middle"
            prefix={<UserOutlined style={{ fontSize: "12px" }} />}
            status={!tempCustomer.name?.trim() ? "error" : ""}
          />
          <DatePicker
            placeholder="Ngày sinh (dd/mm/yyyy)"
            value={
              tempCustomer.birthday
                ? dayjs(tempCustomer.birthday, ["YYYY-MM-DD", "DD/MM/YYYY"])
                : null
            }
            onChange={(d) =>
              setTempCustomer({
                ...tempCustomer,
                // Lưu theo chuẩn YYYY-MM-DD, hiển thị dd/mm/yyyy
                birthday: d ? d.format("YYYY-MM-DD") : "",
              })
            }
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            size="middle"
          />
          <Input
            placeholder="Địa chỉ"
            value={tempCustomer.address}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, address: e.target.value })
            }
            size="middle"
          />
          <Input
            placeholder="Ghi chú"
            value={tempCustomer.note}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, note: e.target.value })
            }
            size="middle"
          />
        </div>
      </Modal>

      <Modal
        title="Cập nhật khách hàng"
        open={isUpdateOpen}
        onCancel={() => setIsUpdateOpen(false)}
        okText="Lưu"
        onOk={handleUpdate}
        confirmLoading={updating}
        okButtonProps={{ disabled: !customer.code?.trim() }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input
            placeholder="Mã KH"
            value={customer.code}
            disabled
            size="middle"
            prefix={<IdcardOutlined style={{ fontSize: "12px" }} />}
          />
          <Input
            placeholder="Số điện thoại"
            value={tempCustomer.phone}
            onChange={handlePhoneChange}
            size="middle"
            prefix={<PhoneOutlined style={{ fontSize: "12px" }} />}
            status={!isPhoneValid ? "error" : ""}
          />
          <Input
            placeholder="Tên khách hàng"
            value={tempCustomer.name}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, name: e.target.value })
            }
            size="middle"
            prefix={<UserOutlined style={{ fontSize: "12px" }} />}
            status={!tempCustomer.name?.trim() ? "error" : ""}
          />
          <DatePicker
            placeholder="Ngày sinh (dd/mm/yyyy)"
            value={
              tempCustomer.birthday
                ? dayjs(tempCustomer.birthday, ["YYYY-MM-DD", "DD/MM/YYYY"])
                : null
            }
            onChange={(d) =>
              setTempCustomer({
                ...tempCustomer,
                birthday: d ? d.format("YYYY-MM-DD") : "",
              })
            }
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            size="middle"
          />
          <Input
            placeholder="Địa chỉ"
            value={tempCustomer.address}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, address: e.target.value })
            }
            size="middle"
          />
          <Input
            placeholder="Ghi chú"
            value={tempCustomer.note}
            onChange={(e) =>
              setTempCustomer({ ...tempCustomer, note: e.target.value })
            }
            size="middle"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomerInfo;
