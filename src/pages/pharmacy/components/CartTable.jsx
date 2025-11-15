import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Card, Input, InputNumber, Select, Spin, Table, Tag } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { api_getTaxInfo, getItemPriceAndUnit, getLoItem } from "../../../api";
import DiscountModal from "./DiscountModal";

const CartTable = ({ cart, removeAt, updateLine, currentOrderSttRec = "" }) => {
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [focusField, setFocusField] = useState(null); // Track which field to focus
  const [batchOptions, setBatchOptions] = useState({}); // options per row index
  const [batchLoading, setBatchLoading] = useState({}); // loading per row index
  const [batchOpen, setBatchOpen] = useState({}); // control dropdown open state per row
  const [unitOptions, setUnitOptions] = useState({}); // unit options per row index
  const [unitLoading, setUnitLoading] = useState({}); // loading per row index
  const [unitOpen, setUnitOpen] = useState({}); // control unit dropdown open state per row
  const [taxOptions, setTaxOptions] = useState([]); // tax rate options from API
  const [taxLoading, setTaxLoading] = useState(false); // loading tax options
  const [taxSearchKeyword, setTaxSearchKeyword] = useState(""); // search keyword for tax
  const [taxDropdownOpen, setTaxDropdownOpen] = useState({}); // control dropdown open state per row
  const taxSearchDebounceRef = useRef(null);

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

  const loadUnitOptions = async (index, record) => {
    try {
      setUnitLoading((prev) => ({ ...prev, [index]: true }));
      const res = await getItemPriceAndUnit((record?.sku || "").toString());
      const data = res?.listObject?.[0] || [];
      const options = data.map((x) => {
        const dvt = (x?.dvt || x?.unit || x?.value || "").toString();
        const gia = Number(x?.gia || x?.price || 0);
        return {
          value: dvt,
          label: dvt ? `${dvt}` : "",
          price: gia,
        };
      });
      setUnitOptions((prev) => ({ ...prev, [index]: options }));
    } catch (e) {
      setUnitOptions((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setUnitLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const loadTaxOptions = async (ten_thue = "") => {
    try {
      setTaxLoading(true);
      const res = await api_getTaxInfo(ten_thue);
      if (res?.responseModel?.isSucceded) {
        const data = res?.listObject?.[0] || [];

        const options = data.map((x) => {
          const thue_suat = Number(x.thue_suat) || 0;
          const ma_thue = (x.ma_thue || "").trim();
          const ten_thue_item = (x.ten_thue || "").trim();
          const label = `${thue_suat}%${
            ten_thue_item ? ` - ${ten_thue_item}` : ""
          }`;
          return {
            value: ma_thue,
            label: label,
            shortLabel: ma_thue, // Chỉ hiển thị ma_thue sau khi chọn
            thue_suat: thue_suat,
            raw: x,
          };
        });
        setTaxOptions(options);
      }
    } catch (e) {
      console.error("Error loading tax options:", e);
      setTaxOptions([]);
    } finally {
      setTaxLoading(false);
    }
  };

  const handleTaxSearch = (value) => {
    setTaxSearchKeyword(value);
    if (taxSearchDebounceRef.current) {
      clearTimeout(taxSearchDebounceRef.current);
    }
    taxSearchDebounceRef.current = setTimeout(() => {
      loadTaxOptions(value);
    }, 300);
  };

  useEffect(() => {
    loadTaxOptions();
  }, []);

  const handleDiscountConfirm = (index, updatedFields) => {
    if (
      index === null ||
      index === undefined ||
      !updatedFields ||
      typeof updatedFields !== "object"
    ) {
      return;
    }

    Object.entries(updatedFields).forEach(([field, value]) => {
      updateLine(index, field, value);
    });
  };

  const recomputeLineTotals = (index, record, overrides = {}) => {
    const price = Number(
      overrides.price !== undefined ? overrides.price : record.price || 0
    );
    const qtySource =
      overrides.qty !== undefined ? overrides.qty : record.qty || 1;
    const parsedQty = Number(qtySource);
    const qty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
    const discountPercentNum = Number(
      overrides.discountPercent !== undefined
        ? overrides.discountPercent
        : record.discountPercent || 0
    );
    let discountAmountValue = Number(
      overrides.discountAmount !== undefined
        ? overrides.discountAmount
        : record.discountAmount || 0
    );
    const newTotal = Math.max(0, Math.round(price * qty));

    if (discountPercentNum > 0) {
      const recalculatedDiscount = Math.round(
        (newTotal * discountPercentNum) / 100
      );
      if (discountAmountValue !== recalculatedDiscount) {
        updateLine(index, "discountAmount", recalculatedDiscount);
      }
      discountAmountValue = recalculatedDiscount;
    } else {
      const cappedManualDiscount = Math.min(discountAmountValue, newTotal);
      if (discountAmountValue !== cappedManualDiscount) {
        updateLine(index, "discountAmount", cappedManualDiscount);
      }
      discountAmountValue = cappedManualDiscount;
    }

    const totalAfterDiscount = Math.max(
      0,
      newTotal - Math.round(discountAmountValue)
    );

    let effectiveVatPercent = Number(
      overrides.thue_suat !== undefined
        ? overrides.thue_suat
        : overrides.vatPercent !== undefined
        ? overrides.vatPercent
        : record.thue_suat !== undefined
        ? record.thue_suat
        : record.vatPercent || 0
    );

    if (!effectiveVatPercent) {
      const maThueValue = (
        overrides.ma_thue !== undefined ? overrides.ma_thue : record.ma_thue
      )
        ? (overrides.ma_thue !== undefined ? overrides.ma_thue : record.ma_thue)
            .toString()
            .trim()
        : "";
      if (maThueValue) {
        const optByMaThue = (taxOptions || []).find(
          (o) => o?.value === maThueValue
        );
        if (optByMaThue?.thue_suat !== undefined) {
          effectiveVatPercent = Number(optByMaThue.thue_suat) || 0;
        }
      }
    }

    const recomputedVat = Math.round(
      (totalAfterDiscount * Math.max(0, effectiveVatPercent)) / 100
    );
    if (Number(record.thue_nt) !== recomputedVat) {
      updateLine(index, "thue_nt", recomputedVat);
    }
  };

  const handleQtyChange = (index, record, nextQtyRaw) => {
    const parsedQty = Number(nextQtyRaw);
    const safeQty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
    updateLine(index, "qty", safeQty);
    recomputeLineTotals(index, record, { qty: safeQty });
  };

  const columns = [
    {
      title: "",
      key: "delete",
      width: 50,
      fixed: "left",
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
          TÊN SẢN PHẨM
        </span>
      ),
      dataIndex: "name",
      key: "name",
      width: 280,
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
      width: 120,
      render: (text, record, index) => {
        const loading = !!unitLoading[index];
        const options = unitOptions[index] || [];
        const isOpen = !!unitOpen[index];
        const hasOptions = options.length > 0;
        if (isOpen && loading && !hasOptions) {
          return (
            <div
              style={{
                width: "100%",
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin size="small" />
            </div>
          );
        }
        return (
          <Select
            value={text || undefined}
            placeholder="ĐVT"
            size="small"
            style={{ width: "100%" }}
            loading={loading && hasOptions}
            onDropdownVisibleChange={(visible) => {
              setUnitOpen((prev) => ({ ...prev, [index]: visible }));
              if (visible && options.length === 0) {
                loadUnitOptions(index, record);
              }
            }}
            onChange={(val) => {
              const opt = (unitOptions[index] || []).find(
                (o) => o.value === val
              );
              const newPrice =
                typeof opt?.price === "number" ? opt.price : record.price;
              updateLine(index, "unit", val);
              updateLine(index, "price", newPrice);
              recomputeLineTotals(index, record, { price: newPrice });
            }}
            options={options.map((o) => ({ value: o.value, label: o.label }))}
            dropdownMatchSelectWidth={false}
            notFoundContent={
              loading ? (
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
              ) : (
                "Không tìm thấy"
              )
            }
            open={isOpen}
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
          SỐ LÔ/HẠN DÙNG
        </span>
      ),
      dataIndex: "batchExpiry",
      key: "batchExpiry",
      width: 180,
      render: (text, record, index) => {
        const isLoading = !!batchLoading[index];
        const hasOptions = (batchOptions[index] || []).length > 0;
        const isOpen = !!batchOpen[index];
        if (isOpen && isLoading && !hasOptions) {
          return (
            <div
              style={{
                width: "100%",
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
      width: 120,
      render: (qty, record, index) => (
        <div className="qty-control">
          <button
            className="qty-btn"
            onClick={() => handleQtyChange(index, record, (qty || 1) - 1)}
          >
            -
          </button>
          <InputNumber
            value={qty || 1}
            min={1}
            size="small"
            className="qty-input"
            onChange={(value) => handleQtyChange(index, record, value || 1)}
            controls={false}
          />
          <button
            className="qty-btn"
            onClick={() => handleQtyChange(index, record, (qty || 1) + 1)}
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
      width: 120,
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
      width: 120,
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
      width: 90,
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
      width: 110,
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
      width: 120,
      render: (vatPercent, record, index) => {
        const currentThueSuat =
          record.thue_suat !== undefined
            ? Number(record.thue_suat)
            : vatPercent || 0;
        const currentMaThue = (record.ma_thue || "").trim();

        let currentValue = null;
        if (currentMaThue) {
          const optionByMaThue = taxOptions.find(
            (opt) => opt.value === currentMaThue
          );
          if (optionByMaThue) {
            currentValue = optionByMaThue.value;
          }
        }

        if (!currentValue && currentThueSuat !== undefined) {
          const optionByThueSuat = taxOptions.find(
            (opt) => opt.thue_suat === currentThueSuat
          );
          if (optionByThueSuat) {
            currentValue = optionByThueSuat.value;
          }
        }

        const displayOptions = currentValue
          ? taxOptions
          : currentThueSuat > 0
          ? [
              ...taxOptions,
              {
                value: `custom_${currentThueSuat}`,
                label: `${currentThueSuat}%`,
                shortLabel: `${currentThueSuat}%`, // Custom VAT hiển thị phần trăm
                thue_suat: currentThueSuat,
              },
            ]
          : taxOptions;

        if (!currentValue && currentThueSuat > 0) {
          currentValue = `custom_${currentThueSuat}`;
        }

        return (
          <Select
            value={currentValue}
            size="small"
            className="vat-input"
            onChange={(selectedMaThue) => {
              const selectedOption = taxOptions.find(
                (opt) => opt.value === selectedMaThue
              );
              if (selectedOption) {
                const thue_suat = selectedOption.thue_suat;
                const ma_thue = selectedOption.value;
                updateLine(index, "vatPercent", thue_suat);
                updateLine(index, "thue_suat", thue_suat);
                updateLine(index, "ma_thue", ma_thue);
                // Clear thue_nt so UI recalculates VAT/remaining using new %VAT
                updateLine(index, "thue_nt", 0);
              } else if (
                selectedMaThue &&
                selectedMaThue.startsWith("custom_")
              ) {
                const customThueSuat =
                  Number(selectedMaThue.replace("custom_", "")) || 0;
                updateLine(index, "vatPercent", customThueSuat);
                updateLine(index, "thue_suat", customThueSuat);
                // Clear thue_nt so UI recalculates VAT/remaining using new %VAT
                updateLine(index, "thue_nt", 0);
              }
            }}
            loading={taxLoading}
            showSearch
            filterOption={false}
            onSearch={handleTaxSearch}
            open={taxDropdownOpen[index]}
            onDropdownVisibleChange={(open) => {
              setTaxDropdownOpen((prev) => ({ ...prev, [index]: open }));
              if (open) {
                if (taxOptions.length === 0) {
                  loadTaxOptions("");
                }
              } else {
                if (taxSearchDebounceRef.current) {
                  clearTimeout(taxSearchDebounceRef.current);
                }
              }
            }}
            style={{ width: "100%", minWidth: "100px" }}
            placeholder="Chọn %VAT"
            notFoundContent={
              taxLoading ? <Spin size="small" /> : "Không tìm thấy"
            }
            options={displayOptions}
            optionLabelProp="shortLabel" // Hiển thị shortLabel (ma_thue) trong input sau khi chọn
            suffixIcon={null}
            allowClear
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ minWidth: "300px" }}
            onClear={() => {
              updateLine(index, "vatPercent", 0);
              updateLine(index, "thue_suat", 0);
              updateLine(index, "ma_thue", "");
            }}
            mode={undefined}
            dropdownRender={(menu) => {
              let customValue = null;
              return (
                <>
                  {menu}
                  <div
                    style={{
                      padding: "4px 8px",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <InputNumber
                      size="small"
                      placeholder="Nhập %VAT tùy chỉnh"
                      min={0}
                      max={100}
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        customValue = value;
                      }}
                      onPressEnter={() => {
                        if (customValue !== null && customValue !== undefined) {
                          const numValue = Number(customValue) || 0;
                          if (numValue >= 0 && numValue <= 100) {
                            updateLine(index, "vatPercent", numValue);
                            updateLine(index, "thue_suat", numValue);
                            updateLine(index, "ma_thue", "");
                            // Clear thue_nt so UI recalculates VAT/remaining using new %VAT
                            updateLine(index, "thue_nt", 0);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (customValue !== null && customValue !== undefined) {
                          const numValue = Number(customValue) || 0;
                          if (numValue >= 0 && numValue <= 100) {
                            updateLine(index, "vatPercent", numValue);
                            updateLine(index, "thue_suat", numValue);
                            updateLine(index, "ma_thue", "");
                            // Clear thue_nt so UI recalculates VAT/remaining using new %VAT
                            updateLine(index, "thue_nt", 0);
                          }
                        }
                      }}
                    />
                  </div>
                </>
              );
            }}
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
          VAT
        </span>
      ),
      key: "vatAmount",
      width: 110,
      render: (_, record) => {
        const total = record.price * (record.qty || 1);
        const discountAmount =
          record.discountAmount > 0
            ? record.discountAmount
            : Math.round((total * (record.discountPercent || 0)) / 100);
        const totalAfterDiscount = total - discountAmount;
        let effectiveVatPercent = 0;
        if (Number(record.thue_suat) > 0) {
          effectiveVatPercent = Number(record.thue_suat) || 0;
        } else if (Number(record.vatPercent) > 0) {
          effectiveVatPercent = Number(record.vatPercent) || 0;
        } else if ((record.ma_thue || "").trim()) {
          const opt = (taxOptions || []).find(
            (o) => o?.value === (record.ma_thue || "").trim()
          );
          if (opt?.thue_suat !== undefined) {
            effectiveVatPercent = Number(opt.thue_suat) || 0;
          }
        }
        const vatAmount =
          Number(record.thue_nt) > 0
            ? Math.round(Number(record.thue_nt))
            : Math.round((totalAfterDiscount * effectiveVatPercent) / 100);
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
      width: 110,
      render: (_, record) => {
        const total = record.price * (record.qty || 1);
        const discountAmount =
          record.discountAmount > 0
            ? record.discountAmount
            : Math.round((total * (record.discountPercent || 0)) / 100);
        const totalAfterDiscount = total - discountAmount;
        let effectiveVatPercent = 0;
        if (Number(record.thue_suat) > 0) {
          effectiveVatPercent = Number(record.thue_suat) || 0;
        } else if (Number(record.vatPercent) > 0) {
          effectiveVatPercent = Number(record.vatPercent) || 0;
        } else if ((record.ma_thue || "").trim()) {
          const opt = (taxOptions || []).find(
            (o) => o?.value === (record.ma_thue || "").trim()
          );
          if (opt?.thue_suat !== undefined) {
            effectiveVatPercent = Number(opt.thue_suat) || 0;
          }
        }
        const vatAmount =
          Number(record.thue_nt) > 0
            ? Math.round(Number(record.thue_nt))
            : Math.round((totalAfterDiscount * effectiveVatPercent) / 100);
        const remaining = Math.max(0, total - discountAmount + vatAmount);
        return (
          <span className="remaining-text">
            {new Intl.NumberFormat("vi-VN").format(remaining)}đ
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
          CHỈ DẪN
        </span>
      ),
      dataIndex: "instructions",
      key: "instructions",
      width: 180,
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

  const isEditingOrder = Boolean((currentOrderSttRec || "").trim());

  return (
    <Card
      size="small"
      title={
        <div className="cart-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Giỏ hàng ({cart.length} sản phẩm)</span>
          {isEditingOrder ? (
            <Tag 
              color="orange" 
              style={{ margin: 0, fontSize: "12px", fontWeight: 500 }}
            >
              Đang sửa đơn
            </Tag>
          ) : (
            <Tag 
              color="blue" 
              style={{ margin: 0, fontSize: "12px", fontWeight: 500 }}
            >
              Đơn mới
            </Tag>
          )}
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
            scroll={{ x: "max-content", y: 300 }}
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
