import { QRCodeCanvas } from "qrcode.react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


const GenerateQR = () => {
    const generateRandomNumbers = () => Array.from({ length: 10 }, () => Math.floor(10000 + Math.random() * 90000));

    const { orderId } = useParams();
    const [orderIds, setOrderIds] = useState([]);

    useEffect(() => {
        setOrderIds(generateRandomNumbers());
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
            <button className="bg-yellow-500 text-white px-4 py-2 rounded">
                {orderId ? `Bàn ${orderId}` : "Đơn mới"}
            </button>
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