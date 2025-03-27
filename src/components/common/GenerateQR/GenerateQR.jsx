import { QRCodeCanvas } from "qrcode.react";
import React from "react";
import { tableData } from "./tableDataQR";

const GenerateQR = () => {

    return (
        <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
            {tableData.map((table, index) => (
                <div
                    key={index}
                    className="flex flex-col items-center space-y-2 border-2 border-blue-500 p-4 rounded-lg shadow-md bg-white text-center w-[220px]"
                >
                    <QRCodeCanvas
                        value={`https://phenikaa-banhang.sse.net.vn/order/${table.value}?ma_qr=${table.ma_qr}`}
                        size={200}
                    />
                </div>
            ))}
        </div>
    );
};

export default GenerateQR;