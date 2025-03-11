import { QRCodeCanvas } from "qrcode.react";
import React, { useState } from "react";

const GenerateQR = () => {
    const [orderId, setOrderId] = useState("1");

    const qrUrl = `https://phenika-banhang.sse.net.vn/order/${orderId}`;

    return (
        <div className="flex flex-col items-center space-y-4">
            <QRCodeCanvas value={qrUrl} size={200} />

        </div>
    );
};

export default GenerateQR;