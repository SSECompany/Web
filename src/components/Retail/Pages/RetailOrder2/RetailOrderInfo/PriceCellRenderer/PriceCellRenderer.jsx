import { formatterNumber, parserNumber } from "@/../../src/app/regex/regex";
import { Button, InputNumber, Popover } from "antd";
import { useState } from "react";

const PriceCellRenderer = ({ rowKey, column, cellData, handleChangePriceCellRender, numberCap }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [value, setValue] = useState(cellData);
    const [discountType, setDiscountType] = useState("%");
    const [discountValue, setDiscountValue] = useState(0);
    const [finalPrice, setFinalPrice] = useState(cellData);

    const calculateFinalPrice = (basePrice, discountType, discountValue) => {
        if (discountType === "%") {
            const discountAmount = (basePrice * discountValue) / 100;
            return basePrice - discountAmount;
        }
        return basePrice;
    };

    const handleDiscountChange = (newDiscountValue) => {
        setDiscountValue(newDiscountValue);
        const newFinalPrice = calculateFinalPrice(value, discountType, newDiscountValue);
        setFinalPrice(newFinalPrice);
    };

    const handleDiscountTypeChange = () => {
        setDiscountType("%");
        const newFinalPrice = calculateFinalPrice(value, "%", discountValue);
        setFinalPrice(newFinalPrice);
    };

    const handleConfirm = () => {
        handleChangePriceCellRender(finalPrice)
        setValue(finalPrice)
        setIsPopupVisible(false);
    };

    const handlePopupClose = () => {
        setIsPopupVisible(false);
    };

    const renderPopupContent = () => (
        <div style={{ padding: 10, width: 250 }}>
            <div>
                <label>Đơn giá:</label>
                <InputNumber
                    value={value}
                    style={{ width: "100%" }}
                    controls={false}
                    formatter={(value) => formatterNumber(value)}
                    parser={(value) => parserNumber(value)}
                    disabled={true}
                />
            </div>
            <div style={{ marginTop: 10 }}>
                <label>Giảm giá:</label>
                <div style={{ display: "flex", gap: 5 }}>
                    <InputNumber
                        value={discountValue}
                        onChange={handleDiscountChange}
                        placeholder="Số tiền giảm"
                        style={{ flex: 1 }}
                        controls={false}
                        formatter={(value) => formatterNumber(value)}
                        parser={(value) => parserNumber(value)}
                    />
                    <Button
                        type={discountType === "%" ? "primary" : "default"}
                        onClick={handleDiscountTypeChange}
                    >
                        %
                    </Button>
                </div>
            </div>
            <div style={{ marginTop: 10 }}>
                <label>Giá bán:</label>
                <InputNumber
                    value={finalPrice}
                    style={{ width: "100%" }}
                    controls={false}
                    disabled={true}
                    formatter={(value) => formatterNumber(value)}
                    parser={(value) => parserNumber(value)}
                />
            </div>
            <Button
                type="primary"
                style={{ marginTop: 10, width: "100%" }}
                onClick={handleConfirm}
            >
                Xác nhận
            </Button>
        </div>
    );

    return (
        <div
            onClick={() => setIsEditing(true)}
            onDoubleClick={() => setIsPopupVisible(true)}
            style={{ position: "relative", cursor: "pointer" }}
        >
            <InputNumber
                name={`${rowKey}_${column.key}`}
                controls={false}
                formatter={(value) => formatterNumber(value)}
                parser={(value) => parserNumber(value)}
                placeholder="0"
                min="0"
                max={numberCap || Number.MAX_SAFE_INTEGER}
                className="w-full"
                value={value}
                onChange={(newValue) => {
                    handleChangePriceCellRender(newValue)
                    setValue(newValue)
                }}

            />

            <Popover
                content={renderPopupContent()}
                trigger="click"
                open={isPopupVisible}
                onOpenChange={handlePopupClose}
            />
        </div>
    );
};

export default PriceCellRenderer;
