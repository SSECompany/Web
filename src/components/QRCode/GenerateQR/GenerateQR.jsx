import { QRCodeCanvas } from "qrcode.react";
import React, { useEffect, useState } from "react";


const GenerateQR = () => {
    const generateRandomNumbers = () => Array.from({ length: 10 }, () => Math.floor(10000 + Math.random() * 90000));

    const [orderIds, setOrderIds] = useState([]);

    useEffect(() => {
        setOrderIds(generateRandomNumbers());
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
            {orderIds.map((orderId, index) => (
                <div
                    key={index}
                    className="flex flex-col items-center space-y-2 border-2 border-blue-500 p-4 rounded-lg shadow-md bg-white text-center w-[220px]"
                >
                    <QRCodeCanvas value={`https://phenikaa-banhang.sse.net.vn/order/${orderId}`} size={200} />
                </div>
            ))}
        </div>
    );
};

export default GenerateQR;