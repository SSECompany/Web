import React from 'react';
import './PrintLabelTemplate.css';

const PrintLabelTemplate = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    // Mapping fields based on common naming or screenshot
    // The API api_get_print_data_don_hang likely returns these fields
    const senderName = data.ten_dvcs || "Công ty CP XNK DP TAPMED (DP HẢ THANH)";
    const senderPhone = data.dien_thoai_dvcs || "0963.74.4567";
    const senderAddr = data.dia_chi_dvcs || "Q441, TT Thuốc Hapulico, 85 Vũ Trọng Phụng, Thanh Xuân, Hà Nội";
    
    const receiverName = data.ten_kh || data.ong_ba || "";
    const receiverPhone = data.so_dien_thoai || data.dien_thoai || "";
    const receiverAddr = data.dia_chi_nhan || data.dia_chi || "";
    const orderNo = data.so_ct || "";
    const transportInfo = data.ten_vc || data.ma_vc || "";
    const transportPhone = data.sdt_nha_xe || "";
    const transportTime = data.gio_xe_chay || "";
    const collectionAmount = data.t_tt_nt || data.t_tt || 0;
    const paymentStatus = data.phuong_thuc_thanh_toan || data.ten_tt || "CHƯA THANH TOÁN CƯỚC";

    const transportDisplay = [
        transportInfo,
        transportPhone,
        transportTime
    ].filter(Boolean).join('; ');

    return (
        <div ref={ref} className="print-label-container">
            <div className="print-label-card">
                {/* Header */}
                <div className="label-header">
                    <div className="label-logo">
                        <img src="/logo-tapmed.png" alt="TapMed" style={{ height: '100px' }} />
                    </div>
                    <div className="label-title">
                        Số đơn hàng: <strong>{orderNo}</strong>
                    </div>
                </div>

                {/* Sender section */}
                <div className="label-section">
                    <div className="label-row">
                        <span className="label-item-title">Người gửi:</span>
                        <span className="label-item-value">{senderName}</span>
                    </div>
                    <div className="label-row">
                        <span className="label-item-title">Số điện thoại:</span>
                        <span className="label-item-value">{senderPhone}</span>
                    </div>
                    <div className="label-row">
                        <span className="label-item-title">Địa chỉ:</span>
                        <span className="label-item-value">{senderAddr}</span>
                    </div>
                </div>

                {/* Receiver section */}
                <div className="label-section section-receiver">
                    <div className="label-row">
                        <span className="label-item-title">Người nhận:</span>
                        <span className="label-item-value highlight">{receiverName}</span>
                    </div>
                    <div className="label-row">
                        <span className="label-item-title">Số điện thoại:</span>
                        <span className="label-item-value highlight">{receiverPhone}</span>
                    </div>
                    <div className="label-row">
                        <span className="label-item-title">Địa chỉ nhận:</span>
                        <span className="label-item-value">{receiverAddr}</span>
                    </div>
                </div>

                {/* Payment box */}
                <div className="label-payment-box">
                    <div className="payment-status">
                        {paymentStatus.toUpperCase()}
                    </div>
                    <div className="payment-collection">
                        <span className="collection-title">Thu hộ:</span>
                        <span className="collection-value">
                            {collectionAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Transport Info */}
                <div className="label-transport">
                    Nhà xe: <strong>{transportDisplay}</strong>
                </div>

                {/* Warning Footer */}
                <div className="label-footer">
                    HÀNG DỄ VỠ XIN NHẸ TAY
                </div>
            </div>
        </div>
    );
});

export default PrintLabelTemplate;
