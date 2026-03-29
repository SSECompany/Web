import React from "react";
import { Button, Form, Select } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./FormTemplate.css";

/**
 * FormTemplate — wrapper chuẩn cho tất cả trang Add / Edit / Detail phiếu.
 *
 * Nó render:
 *  1. Header sticky (nút Back, Badge trạng thái, metadata, nút phải)
 *  2. Body: children (caller tự layout bên trong)
 *  3. Footer cố định (nếu có fixedFooterActions)
 *
 * Lưu ý: FormTemplate KHÔNG tạo <Form> bao ngoài.
 * Các trang con tự quản lý <Form> bên trong children để kiểm soát
 * disabled / layout / initialValues riêng.
 */
const FormTemplate = ({
  form,          // Antd form instance — dùng để đọc giá trị status
  onFinish,
  onBack,

  // Header Meta
  badgeText = "CHI TIẾT PHIẾU",
  badgeColor = "blue", // green, blue, orange, red
  metaOrder,
  metaDate = dayjs().format("DD/MM/YYYY"),
  statusValue,
  statusOptions = [
    { value: "0", label: "Lập chứng từ" },
    { value: "1", label: "Chờ duyệt" },
    { value: "2", label: "Duyệt" },
  ],
  showStatusSelect = false,
  headerRightSpan = null,

  // Content
  children,

  // Footer Actions
  fixedFooterActions = [],
}) => {
  return (
    <>
    <div className="phieu-container">
      {/* ===== HEADER ===== */}
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={onBack}
          className="phieu-back-button"
        />

        <div className="phieu-header-info">
          <div className="phieu-header-tags">
            <span
              className={`phieu-header-badge phieu-header-badge--${badgeColor}`}
            >
              {badgeText}
            </span>
          </div>

          <div className="phieu-header-meta-stack">
            {metaOrder !== undefined && metaOrder !== null && (
              <div className="phieu-header-meta-item">
                ĐƠN HÀNG:{" "}
                <span className="phieu-header-meta-value">
                  {metaOrder || "........."}
                </span>
              </div>
            )}

            <div className="phieu-header-meta-item">
              NGÀY:{" "}
              <span className="phieu-header-meta-value">{metaDate}</span>
            </div>

            {showStatusSelect && (
              <div className="phieu-header-status-row">
                <span className="phieu-header-status-label">TRẠNG THÁI:</span>
                {form ? (
                  <Form form={form} component={false}>
                    <Form.Item
                      name="trangThai"
                      noStyle
                      initialValue={statusValue || "0"}
                    >
                      <Select
                        size="small"
                        className="phieu-header-status-select"
                        popupMatchSelectWidth={false}
                        options={statusOptions}
                      />
                    </Form.Item>
                  </Form>
                ) : (
                  <Select
                    size="small"
                    className="phieu-header-status-select"
                    popupMatchSelectWidth={false}
                    options={statusOptions}
                    value={statusValue || "0"}
                    disabled
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="phieu-header-right">
          {headerRightSpan || <div style={{ width: 40 }} />}
        </div>
      </div>

      {/* ===== BODY ===== */}
      {children}

      {/* ===== SPACER cho Fixed Footer ===== */}
      {fixedFooterActions && fixedFooterActions.length > 0 && (
        <div className="phieu-form-fixed-footer-spacer" />
      )}
    </div>

    {/* ===== FIXED FOOTER (ngoài container, position fixed) ===== */}
    {fixedFooterActions && fixedFooterActions.length > 0 && (
      <div className="phieu-form-fixed-footer">
        <div className="phieu-form-fixed-footer__buttons">
          {fixedFooterActions.map((action, idx) => (
            <Button
              key={action.key || idx}
              type={action.type || "default"}
              danger={action.danger}
              icon={action.icon}
              onClick={action.onClick}
              loading={action.loading}
              disabled={action.disabled}
              className={action.className || ""}
              style={action.style}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    )}
    </>
  );
};

export default FormTemplate;
