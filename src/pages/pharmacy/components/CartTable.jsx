import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Card, Input, InputNumber, Table, Tag, Select, Spin } from "antd";
import React, { useState } from "react";
import { getLoItem } from "../../../api";
import DiscountModal from "./DiscountModal";

const CartTable = ({ cart, removeAt, updateLine }) => {
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [focusField, setFocusField] = useState(null); // Track which field to focus
  const [batchOptions, setBatchOptions] = useState({}); // options per row index
  const [batchLoading, setBatchLoading] = useState({}); // loading per row index
  const [batchOpen, setBatchOpen] = useState({}); // control dropdown open state per row

  const loadBatchOptions = async (index, record, keyword = "") => {
    try {
      setBatchLoading((prev) => ({ ...prev, [index]: true }));
      const res = await getLoItem({
        ma_vt: (record?.sku || "").toString(),
        ma_lo: "",
        ten_lo: keyword,
        ngay_hhsd_tu: null,
        ngay_hhsd_den: null,
        pageIndex: 1,
        pageSize: 10,
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((x) => {
        const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
        const label = x?.ma_lo || x?.ten_lo || x?.label || value;
        return { value, label };
      });
      setBatchOptions((prev) => ({ ...prev, [index]: options }));
    } catch (e) {
      setBatchOptions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setBatchLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountConfirm = (index, field, value) => {
    // Modal đã gửi các cập nhật cần thiết theo cặp; chỉ cần áp dụng cập nhật đơn lẻ này
    updateLine(index, field, value);
  };

  const columns = [
    {
      title: "",
      key: "delete",
      width: "50px",
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeAt(index)}
          size="small"
          style={{
            padding: "0",
            minWidth: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          TÊN SẢN PHẨM(1)
        </span>
      ),
      dataIndex: "name",
      key: "name",
      width: "40%",
      render: (text, record) => (
        <div className="product-info">
          <div className="product-name">{text}</div>
          <div
            className="product-code"
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <span
              style={{ color: "#1890ff", fontWeight: "bold", fontSize: "13px" }}
            >
              {record.sku}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          ĐVT
        </span>
      ),
      dataIndex: "unit",
      key: "unit",
      width: "8%",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          SỐ LÔ/HẠN DÙNG
        </span>
      ),
      dataIndex: "batchExpiry",
      key: "batchExpiry",
      width: "12%",
      render: (text, record, index) => {
        const isLoading = !!batchLoading[index];
        const hasOptions = (batchOptions[index] || []).length > 0;
        const isOpen = !!batchOpen[index];
        if (isOpen && isLoading && !hasOptions) {
          return (
            <div style={{ width: "100%", height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spin size="small" />
            </div>
          );
        }
        return (
          <Select
            value={text || undefined}
            showSearch
            allowClear
            placeholder="Số lô"
          size="small"
            style={{ width: "100%" }}
            filterOption={false}
            loading={isLoading}
            notFoundContent={isLoading ? <Spin size="small" /> : null}
            open={isOpen}
            onDropdownVisibleChange={(visible) => {
              setBatchOpen((prev) => ({ ...prev, [index]: visible }));
              if (visible) loadBatchOptions(index, record, "");
            }}
            onSearch={(keyword) => loadBatchOptions(index, record, keyword)}
            onChange={(val) => updateLine(index, "batchExpiry", val || "")}
            options={batchOptions[index] || []}
            dropdownClassName="vat-tu-dropdown"
            popupMatchSelectWidth={false}
        />
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          SỐ LƯỢNG
        </span>
      ),
      dataIndex: "qty",
      key: "qty",
      width: "8%",
      render: (qty, record, index) => (
        <div className="qty-control">
          <button
            className="qty-btn"
            onClick={() =>
              updateLine(index, "qty", Math.max(1, (qty || 1) - 1))
            }
          >
            -
          </button>
          <InputNumber
            value={qty || 1}
            min={1}
            size="small"
            className="qty-input"
            onChange={(value) => updateLine(index, "qty", value || 1)}
            controls={false}
          />
          <button
            className="qty-btn"
            onClick={() => updateLine(index, "qty", (qty || 1) + 1)}
          >
            +
          </button>
        </div>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          GIÁ BÁN
        </span>
      ),
      dataIndex: "price",
      key: "price",
      width: "10%",
      render: (price) => (
        <span className="price-text">
          {new Intl.NumberFormat("vi-VN").format(price)}đ
        </span>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          TỔNG TIỀN
        </span>
      ),
      key: "total",
      width: "10%",
      render: (_, record) => {
        const total = record.price * (record.qty || 1);
        return (
          <span className="total-text">
            {new Intl.NumberFormat("vi-VN").format(total)}đ
          </span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          % CK
        </span>
      ),
      dataIndex: "discountPercent",
      key: "discountPercent",
      width: "6%",
      render: (discountPercent, record, index) => {
        // Display the exact discountPercent value from modal, don't calculate from discountAmount
        const displayPercent = discountPercent || 0;

        return (
          <div
            onClick={() => {
              setSelectedItemIndex(index);
              setFocusField("percent");
              setDiscountModalVisible(true);
            }}
            className={`discount-cell ${displayPercent > 0 ? "positive" : ""}`}
          >
            {displayPercent > 0 ? `${displayPercent}%` : "-"}
          </div>
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          CK TIỀN
        </span>
      ),
      key: "discountAmountDisplay",
      width: "8%",
      render: (_, record, index) => {
        // Display the exact discountAmount value from modal, don't calculate from discountPercent
        const finalDiscount = record.discountAmount || 0;

        return (
          <div
            onClick={() => {
              setSelectedItemIndex(index);
              setFocusField("amount");
              setDiscountModalVisible(true);
            }}
            className={`discount-cell ${finalDiscount > 0 ? "positive" : ""}`}
          >
            {new Intl.NumberFormat("vi-VN").format(finalDiscount)}đ
          </div>
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          %VAT
        </span>
      ),
      dataIndex: "vatPercent",
      key: "vatPercent",
      width: "6%",
      render: (vatPercent, record, index) => (
        <InputNumber
          value={vatPercent || 0}
          min={0}
          max={100}
          size="small"
          className="vat-input"
          onChange={(value) => updateLine(index, "vatPercent", value || 0)}
          controls={false}
          suffix="%"
        />
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          VAT
        </span>
      ),
      key: "vatAmount",
      width: "8%",
      render: (_, record) => {
        const total = record.price * (record.qty || 1);
        // Phenikaa logic: Ưu tiên giảm tiền, nếu không có thì dùng giảm %
        const discountAmount =
          record.discountAmount > 0
            ? record.discountAmount
            : Math.round((total * (record.discountPercent || 0)) / 100);
        const totalAfterDiscount = total - discountAmount;
        const vatAmount = Math.round(
          (totalAfterDiscount * (record.vatPercent || 0)) / 100
        );
        return (
          <span className="vat-text">
            {new Intl.NumberFormat("vi-VN").format(vatAmount)}đ
          </span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          CÒN LẠI
        </span>
      ),
      dataIndex: "remaining",
      key: "remaining",
      width: "8%",
      render: (remaining, record, index) => (
        <InputNumber
          value={remaining || 0}
          min={0}
          size="small"
          className="remaining-input"
          onChange={(value) => updateLine(index, "remaining", value || 0)}
          controls={false}
        />
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          CHỈ DẪN
        </span>
      ),
      dataIndex: "instructions",
      key: "instructions",
      width: "12%",
      render: (text, record, index) => (
        <Input
          value={text || ""}
          size="small"
          className="instructions-input"
          placeholder="Chỉ dẫn"
          onChange={(e) => updateLine(index, "instructions", e.target.value)}
        />
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <div className="cart-title">
          <span>Giỏ hàng ({cart.length} sản phẩm)</span>
        </div>
      }
      className="cart-table-card"
    >
      {cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCartOutlined className="empty-cart-icon" />
          <div className="empty-cart-text">Trống</div>
        </div>
      ) : (
        <div className="cart-table">
          <Table
            columns={columns}
            dataSource={cart}
            rowKey={(record, index) => index}
            pagination={false}
            size="small"
            tableLayout="fixed"
            scroll={{ x: 1200, y: 300 }}
          />
        </div>
      )}

      <DiscountModal
        visible={discountModalVisible}
        onCancel={() => {
          setDiscountModalVisible(false);
          setSelectedItemIndex(null);
          setFocusField(null);
        }}
        onConfirm={handleDiscountConfirm}
        item={selectedItemIndex !== null ? cart[selectedItemIndex] : null}
        index={selectedItemIndex}
        focusField={focusField}
      />
    </Card>
  );
};

export default CartTable;
