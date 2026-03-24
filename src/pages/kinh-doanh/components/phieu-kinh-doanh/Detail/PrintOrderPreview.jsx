import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import vnNum2words from 'vn-num2words';
import { numFmt } from '../Detail/constants';
import VietQR from '../../../../../components/common/GenerateQR/VietQR';
import './PrintOrderPreview.css';

const PrintOrderTemplate = React.forwardRef(({ data, details, totals, bankInfo }, ref) => {
    if (!data) return null;

    const totalAmount = parseFloat(String(totals?.tong_cong || 0).replace(/,/g, ''));
    const amountInWords = totalAmount ? vnNum2words(totalAmount) : "";
    const formattedAmountInWords = amountInWords ? amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1) + " đồng chẵn" : "Không đồng chẵn";

    return (
        <div ref={ref} className="print-template">
            {/* Header */}
            <div className="print-header">
                <div className="print-header-left">
                    <div className="print-header__logo">
                        <div className="logo-main">
                            <div className="logo-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="9" y="4" width="6" height="16" rx="1" fill="#00a651"/>
                                    <rect x="4" y="9" width="16" height="6" rx="1" fill="#00a651"/>
                                </svg>
                            </div>
                            <div className="logo-text-group">
                                <div className="logo-brand">SIDUOC.VN</div>
                                <div className="logo-tagline">Giữ trọn niềm tin</div>
                            </div>
                        </div>
                    </div>
                    <div className="print-header__company">
                        <h2 className="company-name">CÔNG TY CP XNK DƯỢC PHẨM TAPMED</h2>
                        <p className="company-addr"><strong>Địa chỉ:</strong> CT1-CT2, khu nhà ở CBNV viên bỏng Lê Hữu Trác, phường Hà Đông, Hà Nội</p>
                    </div>
                </div>
                <div className="print-header__qr">
                    {bankInfo && bankInfo[0] ? (
                        <VietQR 
                            amount={totalAmount} 
                            soChungTu={data.so_ct} 
                            bankId={bankInfo[0].BinBank} 
                            account={bankInfo[0].BankAccount}
                            size={80} 
                        />
                    ) : (
                        <QRCodeSVG value={`https://tapmed.vn/pay/${data.so_ct || ''}`} size={80} />
                    )}
                    <div className="qr-text">
                        <p className="qr-note-italic">QR để thanh toán</p>
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="print-title">
                <h1 className="main-title">ĐƠN ĐẶT HÀNG</h1>
                <p className="order-date"><em>Ngày {data.ngay_ct ? dayjs(data.ngay_ct).format('DD') : '...'} tháng {data.ngay_ct ? dayjs(data.ngay_ct).format('MM') : '...'} năm {data.ngay_ct ? dayjs(data.ngay_ct).format('YYYY') : '...'}</em></p>
                <p className="order-no"><strong><em>Số: {data.so_ct || '.........'}</em></strong></p>
            </div>

            {/* Customer Info */}
            <div className="print-info">
                <div className="info-row font-bold">
                    <span className="info-label">Khách hàng:</span>
                    <span className="info-value">{data.ma_kh || '.........'} - {data.ten_kh || '....................................................................'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Điện thoại:</span>
                    <span className="info-value">{data.so_dien_thoai || data.dien_thoai || data.sdt || data.phone || data.tel || data.phone_number || '....................................................................'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Địa chỉ giao:</span>
                    <span className="info-value">{data.dia_chi || '....................................................................'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Giao nhà xe:</span>
                    <span className="info-value">{data.ten_vc || data.ma_vc || '....................................................................'}</span>
                </div>
            </div>

            {/* Table */}
            <table className="print-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>STT</th>
                        <th>Tên mặt hàng</th>
                        <th style={{ width: '60px' }}>ĐVT</th>
                        <th style={{ width: '50px' }}>SL</th>
                        <th style={{ width: '100px' }}>Đơn giá</th>
                        <th style={{ width: '120px' }}>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {details && details.map((item, index) => {
                        const listedPrice = item.gia_ban_nt || item.gia_nt2 || item.gia_nt || 0;
                        const listedTotal = item.so_luong * listedPrice;
                        return (
                            <tr key={index}>
                                <td className="text-center">{index + 1}</td>
                                <td>{item.ten_vt}</td>
                                <td className="text-center">{item.dvt}</td>
                                <td className="text-right">{numFmt(item.so_luong)}</td>
                                <td className="text-right">{numFmt(listedPrice)}</td>
                                <td className="text-right">{numFmt(listedTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Totals Section */}
            {(() => {
                const totalListedTienHang = details?.reduce((sum, item) => 
                    sum + (item.so_luong * (item.gia_ban_nt || item.gia_nt2 || item.gia_nt || 0)), 0
                ) || 0;
                const finalPayment = parseFloat(String(totals?.tong_cong || 0).replace(/,/g, ''));
                const totalDiscount = totalListedTienHang - finalPayment;
                
                return (
                    <div className="print-totals-container">
                        <div className="total-row">
                            <div className="total-spacer" />
                            <div className="total-label">Tổng tiền hàng</div>
                            <div className="total-value">{numFmt(totalListedTienHang)}</div>
                        </div>
                        <div className="total-row">
                            <div className="total-spacer" />
                            <div className="total-label">Chiết khấu/ Phụ thu</div>
                            <div className="total-value">{numFmt(totalDiscount)}</div>
                        </div>
                        <div className="total-row">
                            <div className="total-spacer" />
                            <div className="total-label">Tổng thanh toán</div>
                            <div className="total-value">{numFmt(finalPayment)}</div>
                        </div>
                    </div>
                );
            })()}

            {/* Amount in words */}
            <div className="print-amount-words">
                <p>- Tổng bằng chữ: <strong className="font-bold">{formattedAmountInWords}</strong></p>
            </div>

            {/* Policy */}
            <div className="print-policy">
                <p>Tất cả các khiếu nại kính mong quý khách thông báo cho chúng tôi trong vòng 72 giờ kể từ thời điểm nhận được đơn hàng</p>
                <p>Chúng tôi xin phép được từ chối hỗ trợ khiếu nại trong trường hợp quý khách thông báo sau thời gian trên</p>
            </div>
        </div>
    );
});

export default PrintOrderTemplate;
