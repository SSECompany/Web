import { Modal, Select } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";

const { Option } = Select;

const SelectTableModal = ({ visible, onCancel, onConfirm }) => {
    const [selectedTable, setSelectedTable] = useState(null);

    const tables = useSelector((state) => state.orders.listOrderTable);

    const handleOk = () => {
        if (selectedTable) {
            const selectedData = tables.find((table) => table.id === selectedTable);
            onConfirm(selectedData); 
            setSelectedTable(null);
        }
    };

    return (
        <Modal
            title="Chọn bàn"
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okButtonProps={{ disabled: !selectedTable }}
        >
            <Select
                style={{ width: "100%" }}
                placeholder="Chọn bàn"
                value={selectedTable}
                onChange={(value) => setSelectedTable(value)}
            >
                {tables.map((table) => (
                    <Option key={table.id} value={table.id}>
                        {table.name}
                    </Option>
                ))}
            </Select>
        </Modal>
    );
};

export default SelectTableModal;
