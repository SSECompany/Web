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
import "./PrescriptionModal.css";

const { Title, Text } = Typography;

const PrescriptionModal = ({ isOpen, onClose, onApplyPrescription }) => {
  // Get user info from Redux
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [prescriptionCode, setPrescriptionCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [medicines, setMedicines] = useState([]);

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
  const mockPrescriptionData = {
    customerInfo:
      "Tên khách hàng: SDGDG - Ngày sinh: 12-06-2002 - Địa chỉ: FGFG",
    doctorInfo: "Nguyễn Văn Ngọ - Cơ sở khám chữa bệnh: Bệnh viện Bưu điện",
    diagnosisInfo:
      "Bệnh tả - abc Bệnh thương hàn và phó thương hàn - aaaaaaa - Ngày kê đơn: 04-09-2025",
  };

  const mockMedicines = [
    {
      id: 1,
      maThuoc: "00000000002",
      tenThuoc: "Sintrom 4mg - VIEN",
      hoatChat: "Viên uống (Oral tablet)",
      dvt: "",
      slDuocBan: -4,
      slKeDon: 1,
      slDaBan: 5,
      cachDung: "gfgfgf",
      gia: 50000,
      selected: false,
      searchInput: "",
    },
    {
      id: 2,
      maThuoc: "00000000001",
      tenThuoc: "Glucobay 50mg - VIEN",
      hoatChat:
        "Hộp 10 vỉ x 10 viên, Viên nén (Box of 10 blisters x 10 tablets, Film-coated tablet)",
      dvt: "",
      slDuocBan: -9,
      slKeDon: 1,
      slDaBan: 10,
      cachDung: "ggfgfgffg",
      gia: 75000,
      selected: false,
      searchInput: "",
    },
  ];

  const handleSearch = async () => {
    if (!prescriptionCode.trim()) {
      notification.warning({
        message: "Vui lòng nhập mã đơn thuốc",
      });
      return;
    }

    setSearching(true);

    // Simulate API call with mock data
    setTimeout(() => {
      setPrescriptionData(mockPrescriptionData);
      setMedicines(mockMedicines);
      setSelectedMedicines([]);
      setSearching(false);

      notification.success({
        message: "Tìm thấy đơn thuốc",
        description: `Đã tìm thấy ${mockMedicines.length} loại thuốc trong đơn`,
      });
    }, 1000);
  };

  const handleMedicineSelect = (medicineId, checked) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === medicineId ? { ...med, selected: checked } : med
      )
    );

    if (checked) {
      setSelectedMedicines((prev) => [...prev, medicineId]);
    } else {
      setSelectedMedicines((prev) => prev.filter((id) => id !== medicineId));
    }
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
        // Cập nhật thông tin thuốc đã chọn từ danh mục (không thay đổi tenThuoc - tên thuốc trên đơn)
        const updatedMedicine = {
          ...record,
          selectedMedicineCode: selectedItem.item.sku, // Mã thuốc đã chọn
          selectedMedicineName: selectedItem.item.name, // Tên thuốc đã chọn
          selectedMedicineUnit: selectedItem.item.unit, // ĐVT đã chọn
          selectedMedicinePrice: selectedItem.item.price, // Giá đã chọn
          searchInput: "", // Clear search input
        };

        // Cập nhật dòng trong danh sách
        setMedicines((prev) =>
          prev.map((med) => (med.id === record.id ? updatedMedicine : med))
        );

        notification.success({
          message: "Đã chọn thuốc",
          description: `Đã chọn ${selectedItem.item.name}`,
        });

        return true;
      } else {
        notification.error("Không tìm thấy thuốc");
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi chọn thuốc:", error);
      notification.error("Có lỗi xảy ra khi chọn thuốc");
      return false;
    }
  };

  const handleApplyPrescription = () => {
    if (medicines.length === 0) {
      notification.warning({
        message: "Vui lòng chọn ít nhất một loại thuốc",
      });
      return;
    }

    onApplyPrescription(medicines);

    notification.success({
      message: "Áp dụng đơn thuốc thành công",
      description: `Đã thêm ${medicines.length} loại thuốc vào giỏ hàng`,
    });

    onClose();
  };

  const handleClose = () => {
    setPrescriptionCode("");
    setPrescriptionData(null);
    setMedicines([]);
    setSelectedMedicines([]);
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
      title: "Chọn thuốc từ danh mục",
      key: "select",
      width: 320,
      minWidth: 280,
      render: (_, record) => (
        <VatTuSelectFullPOS
          isEditMode={true}
          barcodeEnabled={barcodeEnabled}
          setBarcodeEnabled={setBarcodeEnabled}
          setBarcodeJustEnabled={setBarcodeJustEnabled}
          vatTuInput={record.selectedMedicineName || record.searchInput || ""}
          setVatTuInput={(value) => {
            // Nếu user xóa selectedMedicineName (value rỗng và trước đó có selectedMedicineName)
            if (!value && record.selectedMedicineName) {
              setMedicines((prev) =>
                prev.map((med) =>
                  med.id === record.id
                    ? {
                        ...med,
                        searchInput: "",
                        selectedMedicineName: "",
                        selectedMedicineCode: "",
                        selectedMedicineUnit: "",
                        selectedMedicinePrice: 0,
                      }
                    : med
                )
              );
            } else {
              // Cập nhật searchInput để tìm kiếm
              setMedicines((prev) =>
                prev.map((med) =>
                  med.id === record.id ? { ...med, searchInput: value } : med
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
      title: "Mã thuốc",
      dataIndex: "maThuoc",
      key: "maThuoc",
      width: 140,
      minWidth: 120,
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Tên thuốc trên đơn",
      dataIndex: "tenThuoc",
      key: "tenThuoc",
      width: 250,
      minWidth: 220,
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Hoạt chất",
      dataIndex: "hoatChat",
      key: "hoatChat",
      width: 320,
      minWidth: 280,
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
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
      title: "SL được bán",
      dataIndex: "slDuocBan",
      key: "slDuocBan",
      width: 110,
      minWidth: 90,
    },
    {
      title: "SL kê đơn",
      dataIndex: "slKeDon",
      key: "slKeDon",
      width: 110,
      minWidth: 90,
    },
    {
      title: "SL đã bán",
      dataIndex: "slDaBan",
      key: "slDaBan",
      width: 110,
      minWidth: 90,
    },
    {
      title: "Cách dùng",
      dataIndex: "cachDung",
      key: "cachDung",
      width: 220,
      minWidth: 180,
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={1600}
      className="prescription-modal"
      centered
    >
      <div className="prescription-modal-content" style={{ height: "85vh" }}>
        {/* Scrollable Content Area */}
        <div className="prescription-scrollable-content">
          {/* Header */}
          <div className="prescription-header">
            <Title level={5} className="prescription-title">
              Thông tin đơn thuốc
            </Title>
          </div>

          {/* Search Section */}
          <div className="prescription-search">
            <div className="search-input-group">
              <Input
                placeholder="Mã đơn thuốc"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                className="prescription-input"
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
          {prescriptionData && (
            <div className="prescription-info">
              <div className="info-section">
                <Text className="info-label">Thông tin khách hàng:</Text>
                <Text className="info-value">
                  {prescriptionData.customerInfo}
                </Text>
              </div>
              <div className="info-section">
                <Text className="info-label">Thông tin bác sĩ:</Text>
                <Text className="info-value">
                  {prescriptionData.doctorInfo}
                </Text>
              </div>
              <div className="info-section">
                <Text className="info-label">Thông tin chẩn đoán:</Text>
                <Text className="info-value">
                  {prescriptionData.diagnosisInfo}
                </Text>
              </div>
            </div>
          )}

          {/* Medicine Table - Only show after search */}
          {medicines.length > 0 && (
            <div className="medicine-table-section">
              <div className="medicine-table-wrapper">
                <Table
                  columns={columns}
                  dataSource={medicines.filter(
                    (med) => med && med.id && med.maThuoc && med.tenThuoc
                  )}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="medicine-table"
                  scroll={{ x: "max-content" }}
                  style={{ fontSize: "16px", minHeight: "100%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions - Only show after search */}
        {prescriptionData && (
          <div className="prescription-footer">
            <div className="action-buttons">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApplyPrescription}
                disabled={medicines.length === 0}
                className="apply-button"
              >
                Áp dụng đơn thuốc
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

export default PrescriptionModal;
