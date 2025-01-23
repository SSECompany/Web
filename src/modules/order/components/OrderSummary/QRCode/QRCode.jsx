import { Button } from "antd";
import React, { useEffect, useState } from "react";

const QRCodeComponent = ({ activeTab, userId, storeId, unitId, onGenerateSuccess }) => {
    const [paymentQR, setPaymentQR] = useState("");
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const generateQRCode = async () => {
        if (!activeTab || !activeTab.master?.tong_tien) return;

        setIsGeneratingQR(true);

        // try {
        //     const response = await multipleTablePutApi({
        //         store: "GetTblSoCt",
        //         param: { so_ct: "", userId, storeId, unitId },
        //         data: {},
        //     });

        //     const soCt = response?.listObject?.[0]?.[0]?.so_ct || "";

        //     if (soCt) {
        //         const qrUrl = `https://img.vietqr.io/image/${storeId}-12345678-EEmxQTR.jpg?amount=${activeTab.master.tong_tien}&addInfo=${soCt}&accountName=DemoAccount`;
        //         setPaymentQR(qrUrl);

        //         if (onGenerateSuccess) onGenerateSuccess(qrUrl);
        //     }
        // } catch (error) {
        //     console.error("Failed to generate QR Code:", error);
        // } finally {
        //     setIsGeneratingQR(false);
        // }
    };

    useEffect(() => {
        if (activeTab) generateQRCode();
    }, [activeTab]);

    return (
        <Button onClick={generateQRCode} className="qr-code-button">
            QRCode
        </Button>
    );
};

export default QRCodeComponent;