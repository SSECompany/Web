import { useState } from "react";
import { useSelector } from "react-redux";
import { Modal, Input, DatePicker, InputNumber, notification } from "antd";
import dayjs from "dayjs";
import https from "../../../../../utils/https";
import { getLoItem } from "../../../../../api";
import { VatTuTable, phieuNhapHangConfig } from "../../common/VatTuTable";

const VatTuNhapHangTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleSelectChange,
  handleDeleteItem,
  handleDvtChange,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
  fetchDonViTinh,
  fetchViTriList,
  onDataSourceUpdate,
  onLoOptionsUpdate,
}) => {
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
  const token = localStorage.getItem("access_token");
  const currentUserId = userInfo?.id || userInfo?.userId || 1;

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newLotModalVisible, setNewLotModalVisible] = useState(false);
  const [newLotForm, setNewLotForm] = useState({ maLo: "", tenLo: "", hsd: null, soLuong: 0 });

  const fetchLoList = async (keyword = "", record = {}, page = 1) => {
    try {
      const response = await getLoItem({
        ma_vt: (record?.maHang || record?.ma_vt || "").toString(),
        ma_lo: "",
        ten_lo: keyword,
        ngay_hhsd_tu: null,
        ngay_hhsd_den: null,
        pageIndex: page,
        pageSize: 10,
      });

      const data = response?.listObject?.[0] || [];
      const totalPage = response?.listObject?.[1]?.[0]?.totalPage ?? 1;

      const options = data.map((x) => {
        const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
        let label = value;
        if (x?.ngay_hhsd) {
          const d = dayjs(x.ngay_hhsd);
          const ngayHHSD = d.isValid() ? d.format("DD/MM/YYYY") : x.ngay_hhsd;
          label = `${value}-${ngayHHSD}`;
        } else {
          label = x?.ma_lo || x?.ten_lo || x?.label || value;
        }
        return { value, label };
      });
      return { options, totalPage };
    } catch (e) {
      console.error("fetchLoList (detail) error", e);
      return [];
    }
  };

  const handleAddLotClick = (record) => {
    setSelectedRecord(record);
    const typedLot = (record.ma_lo || "").trim();
    setNewLotForm({
      maLo: typedLot,
      tenLo: typedLot,
      hsd: record.ngay_hh ? dayjs(record.ngay_hh) : null,
      soLuong: record.so_luong || record.soLuong || 0,
    });
    setNewLotModalVisible(true);
  };

  const handleModalOk = async () => {
    const maLo = newLotForm.maLo.trim();
    if (!maLo) {
      notification.warning({ message: "Vui lòng nhập mã lô" });
      return;
    }
    const tenLo = maLo;
    const hsdStr = newLotForm.hsd ? newLotForm.hsd.format("YYYY-MM-DD") : null;
    const soLuong = parseFloat(newLotForm.soLuong);
    if (isNaN(soLuong) || soLuong <= 0) {
      notification.warning({ message: "Vui lòng nhập số lượng cho lô mới (> 0)" });
      return;
    }

    try {
      const body = {
        store: "api_create_new_lot",
        param: {
          ma_vt: selectedRecord?.maHang?.trim() || selectedRecord?.ma_vt?.trim() || "",
          ma_lo: maLo,
          ngay_hhsd: hsdStr || "",
          ten_lo: tenLo,
          UserId: currentUserId,
        },
        data: {},
      };

      const res = await https.post("User/AddData", body, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      const isSuccess = res?.data?.responseModel?.isSucceded === true || res?.data?.statusCode === 200;
      if (!isSuccess) {
        notification.error({ message: res?.data?.responseModel?.message || "Tạo lô mới thất bại" });
        return;
      }

      notification.success({ message: `Tạo lô "${maLo}" thành công` });

      // Update the row in dataSource and trigger calculations
      const updatedDataSource = dataSource.map((item) => {
        if (item.key === selectedRecord.key) {
          const qty = soLuong;
          const priceNt = parseFloat(item.gia_nt || 0);
          const price = parseFloat(item.gia || priceNt || 0);
          const taxRate = parseFloat(item.thue_suat || 0);

          let soLuongGoc = item.soLuong_goc;
          if (item.dvt?.trim() === item.dvt_goc?.trim()) {
            soLuongGoc = Math.round((qty / (item.he_so_goc ?? 1)) * 1000) / 1000;
          } else {
            soLuongGoc = qty;
          }

          const amountNt = Math.round(priceNt * qty * 100) / 100;
          const amount = Math.round(price * qty * 100) / 100;
          const taxNt = Math.round((amountNt * taxRate / 100) * 100) / 100;
          const tax = Math.round((amount * taxRate / 100) * 100) / 100;

          return {
            ...item,
            ma_lo: maLo,
            ngay_hh: hsdStr,
            so_luong: qty,
            soLuong: qty,
            sl_td3: qty,
            soLuong_goc: soLuongGoc,
            tien_nt: amountNt,
            tien: amount,
            tien_nt0: amountNt,
            tien0: amount,
            tien_hang_nt: amountNt,
            tien_hang: amount,
            thue_nt: taxNt,
            thue: tax,
            tt_nt: amountNt + taxNt,
            tt: amount + tax,
            _lastUpdated: Date.now(),
          };
        }
        return item;
      });

      // Tự động load danh sách lô mới của vật tư để dropdown cập nhật options
      const updatedRecord = updatedDataSource.find((item) => item.key === selectedRecord.key);
      if (updatedRecord) {
        try {
          const result = await fetchLoList("", updatedRecord, 1);
          const loOptions = Array.isArray(result) ? result : (result?.options || []);
          if (loOptions && loOptions.length > 0) {
            updatedDataSource.forEach((item) => {
              if (item.maHang === updatedRecord.maHang) {
                item.loOptions = loOptions;
                item._loTotalPage = result?.totalPage || 1;
              }
            });
          }
        } catch (e) {
          console.error("fetchLoList after lot creation error", e);
        }
      }

      if (onDataSourceUpdate) {
        onDataSourceUpdate(updatedDataSource);
      }

      setNewLotModalVisible(false);
    } catch (err) {
      console.error("Lỗi tạo lô mới:", err);
      notification.error({ message: "Lỗi khi tạo lô mới" });
    }
  };

  return (
    <>
      <VatTuTable
        dataSource={dataSource}
        isEditMode={isEditMode}
        onQuantityChange={handleQuantityChange}
        onSelectChange={handleSelectChange}
        onDeleteItem={handleDeleteItem}
        onDvtChange={handleDvtChange}
        onDataSourceUpdate={onDataSourceUpdate}
        columnConfig={phieuNhapHangConfig}
        onAddLotClick={handleAddLotClick}
        apiHandlers={{
          fetchMaKhoList,
          fetchMaKhoListDebounced,
          fetchDonViTinh,
          fetchLoList,
          fetchViTriList,
        }}
        selectData={{
          maKhoList,
        }}
        onLoOptionsUpdate={onLoOptionsUpdate}
        loadingStates={{
          maKho: loadingMaKho,
        }}
      />

      {/* Modal Thêm Lô Mới */}
      <Modal
        title="Nhập thông tin lô mới"
        open={newLotModalVisible}
        onCancel={() => setNewLotModalVisible(false)}
        maskClosable={false}
        onOk={handleModalOk}
        okText="Xác nhận"
        cancelText="Hủy"
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Mã lô <span style={{ color: 'red' }}>*</span></div>
          <Input
            value={newLotForm.maLo}
            onChange={(e) => setNewLotForm({ ...newLotForm, maLo: e.target.value })}
            placeholder="Nhập mã lô"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Hạn sử dụng</div>
          <DatePicker
            format={["DD/MM/YYYY", "DDMMYYYY"]}
            style={{ width: "100%" }}
            value={newLotForm.hsd}
            onChange={(date) => setNewLotForm({ ...newLotForm, hsd: date })}
            placeholder="VD: 10032026 hoặc 10/03/2026"
            onFocus={(e) => {
              if (e.target && e.target.setAttribute) {
                e.target.setAttribute("inputmode", "numeric");
                e.target.setAttribute("pattern", "[0-9]*");
              }
            }}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Số lượng</div>
          <InputNumber
            inputMode="decimal"
            min={0}
            style={{ width: "100%" }}
            value={newLotForm.soLuong}
            onChange={(val) => setNewLotForm({ ...newLotForm, soLuong: val || 0 })}
            placeholder="Nhập số lượng"
            onFocus={(e) => e.target.select()}
            controls={false}
          />
        </div>
      </Modal>
    </>
  );
};

export default VatTuNhapHangTable;
