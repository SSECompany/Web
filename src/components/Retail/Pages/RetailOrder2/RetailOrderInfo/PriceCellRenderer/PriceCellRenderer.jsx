import { formatterNumber, parserNumber } from "@/../../src/app/regex/regex";
import { Button, Form, InputNumber, Popover } from "antd";
import { useRef, useState } from "react";

const PriceCellRenderer = ({ rowKey, column, cellData, handleChangePriceCellRender, numberCap }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [value, setValue] = useState(cellData);
    const [discountType, setDiscountType] = useState("%");
    const [discountValue, setDiscountValue] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);
    const DiscontInputRef = useRef(null);

    const handleDiscountChange = (newDiscountValue) => {
        setDiscountValue(newDiscountValue);
    };

    const handleDiscountTypeChange = (type) => {
        setDiscountType(type);
    };

    const handleConfirm = () => {
        handleChangePriceCellRender(discountType, discountValue, finalPrice);
        setFinalPrice(0)
        setDiscountValue(0)
        setValue(finalPrice);
        setIsPopupVisible(false);
        resetDiscountValue();
    };

    const handlePopupClose = () => {
        setIsPopupVisible(false);
        resetDiscountValue();
    };

    const resetDiscountValue = () => {
        setDiscountValue(0);
    };


    const renderPopupContent = () => (
        <div style={{ padding: 10, width: 250 }}>
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
                        onClick={() => handleDiscountTypeChange("%")}
                    >
                        %
                    </Button>
                    <Button
                        type={discountType === "VND" ? "primary" : "default"}
                        onClick={() => handleDiscountTypeChange("VND")}
                    >
                        VND
                    </Button>
                </div>
            </div>
            <div style={{ marginTop: 10 }}>
                <label>Giá bán:</label>
                <InputNumber
                    style={{ width: "100%" }}
                    controls={false}
                    value={finalPrice}
                    formatter={(value) => formatterNumber(value)}
                    parser={(value) => parserNumber(value)}
                    placeholder="0"
                    min="0"
                    onChange={(newValue) => {
                        setFinalPrice(newValue);
                    }}


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
            onDoubleClick={() => {
                setIsPopupVisible(true);
                setFinalPrice(0)
            }}
            style={{ position: "relative", cursor: "pointer" }}
        >
            <Form.Item
                initialValue={cellData || null}
                name={`${rowKey}_${column.key}`}
            >
                <InputNumber
                    controls={false}
                    formatter={(value) => formatterNumber(value)}
                    parser={(value) => parserNumber(value)}
                    placeholder="0"
                    min="0"
                    max={numberCap || Number.MAX_SAFE_INTEGER}
                    className="w-full"
                    value={value}
                    onChange={(newValue) => {
                        handleChangePriceCellRender(newValue);
                        setValue(newValue);
                        resetDiscountValue();
                    }}
                />
            </Form.Item>

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
