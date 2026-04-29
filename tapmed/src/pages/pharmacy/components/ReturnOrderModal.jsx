import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Table, Typography, notification } from "antd";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { searchVatTu } from "../../../api";
import VatTuSelectFullPOS from "../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import "./ReturnOrderModal.css";

const { Title, Text } = Typography;

const ReturnOrderModal = ({ isOpen, onClose, onApplyReturnOrder }) => {
  // Get user info from Redux
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [orderCode, setOrderCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  // States for VatTuSelectFullPOS
  const [vatTuInput, setVatTuInput] = useState("");
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  // Mock data for demonstration
  const mockOrderData = {
    orderInfo: "Mã đơn: ORD001 - Ngày: 15-01-2025 - Khách hàng: Nguyễn Văn A",
    customerInfo: "SĐT: 0123456789 - Địa chỉ: 123 Đường ABC",
    totalAmount: "Tổng tiền: 500,000đ",
  };

  const mockOrderItems = [
    {
      id: 1,
      maVt: "00000000002",
      tenVt: "Sintrom 4mg - VIEN",
      dvt: "viên",
      soLuongBan: 5,
      donGia: 50000,
      thanhTien: 250000,
      soLuongTra: 0,
      selected: false,
      searchInput: "",
    },
    {
      id: 2,
      maVt: "00000000001",
      tenVt: "Glucobay 50mg - VIEN",
      dvt: "viên",
      soLuongBan: 10,
      donGia: 75000,
      thanhTien: 750000,
      soLuongTra: 0,
      selected: false,
      searchInput: "",
    },
  ];

  const handleSearch = async () => {
    if (!orderCode.trim()) {
      notification.warning({
        message: "Vui lòng nhập mã đơn hàng",
      });
      return;
    }

    setSearching(true);

    // Simulate API call with mock data
    setTimeout(() => {
      setOrderData(mockOrderData);
      setOrderItems(mockOrderItems);
      setSelectedItems([]);
      setSearching(false);

      notification.success({
        message: "Tìm thấy đơn hàng",
        description: `Đã tìm thấy ${mockOrderItems.length} sản phẩm trong đơn`,
      });
    }, 1000);
  };

  const handleItemSelect = (itemId, checked) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selected: checked } : item
      )
    );

    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleReturnQuantityChange = (itemId, quantity) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, soLuongTra: quantity } : item
      )
    );
  };

  // Real API function for fetching medicine list (same as POS)
  const fetchVatTuList = async (keyword = "", page = 1, append = false) => {
    setLoadingVatTu(true);
    setCurrentKeyword(keyword);

    try {
      const response = await searchVatTu(keyword, page, 20, unitId, userId);

      // Kiểm tra response success - sử dụng cấu trúc API mới
      if (response?.responseModel?.isSucceded) {
        const listObject = response.listObject;

        // listObject[0] chứa array các items
        const data = listObject?.[0] || [];
        // listObject[1] chứa array thông tin pagination
        const paginationInfo = listObject?.[1]?.[0] || {};

        // Transform API data to match ProductSelectFull format
        const transformedData = data.map((item) => ({
          value: item.value || `ITEM${Math.random()}`,
          label: item.label || `Sản phẩm - ${item.value || "N/A"}`,
          item: {
            sku: item.value || `ITEM${Math.random()}`,
            name: item.label || `Sản phẩm`,
            price: item.gia || 0,
            unit: item.dvt || "viên",
            stock: 0, // API không trả về stock
          },
        }));

        if (append) {
          setVatTuList((prev) => [...prev, ...transformedData]);
        } else {
          setVatTuList(transformedData);
        }

        setPageIndex(page);
        setTotalPage(paginationInfo.totalpage || 1);
      } else {
        // Hiển thị error message từ API
        const errorMessage =
          response?.responseModel?.message || "Không thể tải danh sách vật tư";
        notification.error({
          message: "Lỗi tải dữ liệu",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error fetching medicine list:", error);
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: "Có lỗi xảy ra khi tải danh sách thuốc",
      });
    } finally {
      setLoadingVatTu(false);
    }
  };

  const handleVatTuSelectForRow = async (value, record) => {
    try {
      // Tìm item trong danh sách hiện tại
      const selectedItem = vatTuList.find((item) => item.value === value);

      if (selectedItem) {
        // Cập nhật thông tin sản phẩm đã chọn từ danh mục
        const updatedItem = {
          ...record,
          selectedProductCode: selectedItem.item.sku, // Mã sản phẩm đã chọn
          selectedProductName: selectedItem.item.name, // Tên sản phẩm đã chọn
          selectedProductUnit: selectedItem.item.unit, // ĐVT đã chọn
          selectedProductPrice: selectedItem.item.price, // Giá đã chọn
          searchInput: "", // Clear search input
        };

        // Cập nhật dòng trong danh sách
        setOrderItems((prev) =>
          prev.map((item) => (item.id === record.id ? updatedItem : item))
        );

        notification.success({
          message: "Đã chọn sản phẩm",
          description: `Đã chọn ${selectedItem.item.name}`,
        });

        return true;
      } else {
        notification.error("Không tìm thấy sản phẩm");
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi chọn sản phẩm:", error);
      notification.error("Có lỗi xảy ra khi chọn sản phẩm");
      return false;
    }
  };

  const handleApplyReturnOrder = () => {
    const selectedItemsToReturn = orderItems.filter(
      (item) => item.selected && item.soLuongTra > 0
    );

    if (selectedItemsToReturn.length === 0) {
      notification.warning({
        message: "Vui lòng chọn ít nhất một sản phẩm và nhập số lượng trả",
      });
      return;
    }

    // Transform data for cart
    const returnItems = selectedItemsToReturn.map((item) => ({
      sku: item.selectedProductCode || item.maVt,
      name: item.selectedProductName || item.tenVt,
      price: item.selectedProductPrice || item.donGia,
      unit: item.selectedProductUnit || item.dvt,
      qty: -item.soLuongTra, // Negative quantity for return
      batchExpiry: "",
      vatPercent: 0,
      discountPercent: 0,
      discountAmount: 0,
      remaining: 0,
      instructions: "",
    }));

    onApplyReturnOrder(returnItems);

    notification.success({
      message: "Áp dụng đơn trả thành công",
      description: `Đã thêm ${returnItems.length} sản phẩm vào giỏ hàng`,
    });

    onClose();
  };

  const handleClose = () => {
    setOrderCode("");
    setOrderData(null);
    setOrderItems([]);
    setSelectedItems([]);
    setVatTuInput("");
    setBarcodeEnabled(false);
    setBarcodeJustEnabled(false);
    setVatTuList([]);
    setLoadingVatTu(false);
    setPageIndex(1);
    setTotalPage(1);
    setCurrentKeyword("");
    onClose();
  };

  const columns = [
    {
      title: "Chọn sản phẩm từ danh mục",
      key: "select",
      width: 320,
      minWidth: 280,
      render: (_, record) => (
        <VatTuSelectFullPOS
          isEditMode={true}
          barcodeEnabled={barcodeEnabled}
          setBarcodeEnabled={setBarcodeEnabled}
          setBarcodeJustEnabled={setBarcodeJustEnabled}
          vatTuInput={record.selectedProductName || record.searchInput || ""}
          setVatTuInput={(value) => {
            // Nếu user xóa selectedProductName (value rỗng và trước đó có selectedProductName)
            if (!value && record.selectedProductName) {
              setOrderItems((prev) =>
                prev.map((item) =>
                  item.id === record.id
                    ? {
                        ...item,
                        searchInput: "",
                        selectedProductName: "",
                        selectedProductCode: "",
                        selectedProductUnit: "",
                        selectedProductPrice: 0,
                      }
                    : item
                )
              );
            } else {
              // Cập nhật searchInput để tìm kiếm
              setOrderItems((prev) =>
                prev.map((item) =>
                  item.id === record.id ? { ...item, searchInput: value } : item
                )
              );
            }
          }}
          vatTuSelectRef={vatTuSelectRef}
          loadingVatTu={loadingVatTu}
          vatTuList={vatTuList}
          searchTimeoutRef={searchTimeoutRef}
          fetchVatTuList={fetchVatTuList}
          handleVatTuSelect={(value) => handleVatTuSelectForRow(value, record)}
          totalPage={totalPage}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          setVatTuList={setVatTuList}
          currentKeyword={currentKeyword}
        />
      ),
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "maVt",
      key: "maVt",
      width: 140,
      minWidth: 120,
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "tenVt",
      key: "tenVt",
      width: 250,
      minWidth: 220,
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
          }}
          title={text}
        >
          {text}
        </div>
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "dvt",
      key: "dvt",
      width: 80,
      minWidth: 70,
    },
    {
      title: "SL đã bán",
      dataIndex: "soLuongBan",
      key: "soLuongBan",
      width: 110,
      minWidth: 90,
    },
    {
      title: "Đơn giá",
      dataIndex: "donGia",
      key: "donGia",
      width: 120,
      minWidth: 100,
      render: (price) => (
        <span style={{ color: "#059669", fontWeight: "600" }}>
          {new Intl.NumberFormat("vi-VN").format(price)}đ
        </span>
      ),
    },
    {
      title: "SL trả",
      dataIndex: "soLuongTra",
      key: "soLuongTra",
      width: 100,
      minWidth: 80,
      render: (quantity, record) => (
        <Input
          type="number"
          min={0}
          max={record.soLuongBan}
          value={quantity}
          onChange={(e) =>
            handleReturnQuantityChange(record.id, parseInt(e.target.value) || 0)
          }
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "12px",
            height: "28px",
          }}
        />
      ),
    },
    {
      title: "Chọn",
      key: "action",
      width: 80,
      minWidth: 70,
      render: (_, record) => (
        <Button
          type={record.selected ? "primary" : "default"}
          size="small"
          onClick={() => handleItemSelect(record.id, !record.selected)}
          style={{
            fontSize: "12px",
            height: "28px",
            padding: "0 8px",
          }}
        >
          {record.selected ? "Đã chọn" : "Chọn"}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={1600}
      className="return-order-modal"
      centered
    >
      <div className="return-order-modal-content" style={{ height: "85vh" }}>
        {/* Scrollable Content Area */}
        <div className="return-order-scrollable-content">
          {/* Header */}
          <div className="return-order-header">
            <Title level={5} className="return-order-title">
              Thông tin đơn hàng trả
            </Title>
          </div>

          {/* Search Section */}
          <div className="return-order-search">
            <div className="search-input-group">
              <Input
                placeholder="Mã đơn hàng hoặc SĐT khách hàng"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="return-order-input"
                onPressEnter={handleSearch}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searching}
                className="search-button"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          {/* Information Display - Only show after search */}
          {orderData && (
            <div className="return-order-info">
              <div className="info-section">
                <Text className="info-label">Thông tin đơn hàng:</Text>
                <Text className="info-value">{orderData.orderInfo}</Text>
              </div>
              <div className="info-section">
                <Text className="info-label">Thông tin khách hàng:</Text>
                <Text className="info-value">{orderData.customerInfo}</Text>
              </div>
              <div className="info-section">
                <Text className="info-label">Tổng tiền:</Text>
                <Text className="info-value">{orderData.totalAmount}</Text>
              </div>
            </div>
          )}

          {/* Order Items Table - Only show after search */}
          {orderItems.length > 0 && (
            <div className="order-items-table-section">
              <div className="order-items-table-wrapper">
                <Table
                  columns={columns}
                  dataSource={orderItems.filter(
                    (item) => item && item.id && item.maVt && item.tenVt
                  )}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="order-items-table"
                  tableLayout="fixed"
                  scroll={{ x: 1100 }}
                  style={{ fontSize: "16px", minHeight: "100%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions - Only show after search */}
        {orderData && (
          <div className="return-order-footer">
            <div className="action-buttons">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApplyReturnOrder}
                disabled={orderItems.length === 0}
                className="apply-button"
              >
                Áp dụng đơn trả
              </Button>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
                className="exit-button"
              >
                Thoát
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReturnOrderModal;
