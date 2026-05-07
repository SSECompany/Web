import React from 'react';
import dayjs from 'dayjs';
import './PrintPhieuXuatKhoBanHang.css'; // We will create this CSS file

const PrintPhieuXuatKhoBanHang = React.forwardRef((props, ref) => {
  const { phieuData, dataSource, maKhachList } = props;

  if (!phieuData || !dataSource) return null;

  const ngayCt = phieuData.ngay_ct ? dayjs(phieuData.ngay_ct) : dayjs();
  
  // Find customer info
  const customer = maKhachList?.find(kh => kh.value === phieuData.ma_kh);
  const customerDisplay = customer 
    ? customer.label 
    : (phieuData.ten_kh ? `${phieuData.ma_kh} - ${phieuData.ten_kh}` : phieuData.ma_kh);

  const totalYeuCau = dataSource.reduce((sum, item) => sum + (Number(item.so_luong) || 0), 0);
  const totalThucXuat = dataSource.reduce((sum, item) => sum + (Number(item.sl_td3) || 0), 0);

  return (
    <div ref={ref} className="print-phieu-container">
      <div className="print-header">
        <div className="company-info">
          <div className="company-name">CÔNG TY CP SẢN XUẤT THƯƠNG MẠI VIKOSAN</div>
          <div>CCN Hà Bình Phương - Thường Tín - Hà Nội</div>
          <div>024.33.766.777</div>
        </div>
      </div>

      <div className="print-title-section">
        <h2 className="print-title">PHIẾU XUẤT KHO</h2>
        <div className="print-date-container">
          <div className="print-date">
            Ngày {ngayCt.format('DD')} tháng {ngayCt.format('MM')} năm {ngayCt.format('YYYY')}
          </div>
          <div className="print-order-no">Số đơn hàng: {phieuData.so_ct}</div>
        </div>
      </div>

      <div className="print-info">
        <div className="info-row">
          <span className="info-label">Đơn vị</span>
          <span className="info-value">{customerDisplay}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Địa chỉ</span>
          <span className="info-value">{phieuData.dia_chi || phieuData.dia_chi_kh || ''}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Nơi giao</span>
          <span className="info-value">{phieuData.noi_giao || ''}</span>
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th rowSpan="2" className="col-stt">STT</th>
            <th rowSpan="2" className="col-vattu">Vật tư</th>
            <th rowSpan="2" className="col-ghichu">Ghi chú</th>
            <th rowSpan="2" className="col-dvt">Đvt</th>
            <th colSpan="2" className="col-soluong">Số lượng</th>
          </tr>
          <tr>
            <th className="col-yeucau">Yêu cầu</th>
            <th className="col-thucxuat">Thực xuất</th>
          </tr>
        </thead>
        <tbody>
          {dataSource.map((item, index) => {
            const vatTuDisplay = item.maHang || item.ma_vt 
              ? `${item.maHang || item.ma_vt} - ${item.ten_mat_hang}` 
              : item.ten_mat_hang;
            
            return (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td>{vatTuDisplay}</td>
                <td>{item.ghi_chu || ''}</td>
                <td className="text-center">{item.dvt}</td>
                <td className="text-right">{Number(item.so_luong || 0).toLocaleString()}</td>
                <td className="text-right">{Number(item.sl_td3 || 0).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="text-center font-bold">Tổng cộng</td>
            <td className="text-right font-bold">{totalYeuCau.toLocaleString()}</td>
            <td className="text-right font-bold">{totalThucXuat.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div className="print-footer">
        <div className="footer-date">
          Ngày........tháng........năm...........
        </div>
        <div className="signatures">
          <div className="signature-box">
            <strong>KẾ TOÁN BÁN HÀNG</strong>
          </div>
          <div className="signature-box">
            <strong>THỦ KHO</strong>
          </div>
          <div className="signature-box">
            <strong>GIÁM SÁT</strong>
          </div>
          <div className="signature-box">
            <strong>LÁI XE</strong>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintPhieuXuatKhoBanHang;
