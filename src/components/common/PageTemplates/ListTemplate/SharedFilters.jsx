import React from "react";
import { Checkbox, Button } from "antd";

// Common component for status filtering in Desktop table columns
export const FilterStatusDropdown = ({ 
    selectedKeys, 
    setSelectedKeys, 
    confirm, 
    handleFilter, 
    options, // e.g., [{ value: "0", label: "Lập ctừ"}, ...]
    title = "Trạng thái đơn hàng:"
}) => {
    return (
        <div className="status-filter-dropdown">
            <div className="status-filter-dropdown__title">
                {title}
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '8px', paddingRight: '4px' }}>
                <Checkbox.Group
                    value={selectedKeys}
                    onChange={value => {
                        setSelectedKeys(value || []);
                    }}
                    className="status-filter-dropdown__checkbox-group"
                >
                    {options.map(opt => (
                        <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
                    ))}
                </Checkbox.Group>
            </div>
            <div className="status-filter-dropdown__actions">
                <Button
                    size="small"
                    style={{ flex: 1 }}
                    onClick={() => {
                        setSelectedKeys([]);
                        handleFilter("status", [], confirm);
                    }}
                >
                    Xóa
                </Button>
                <Button
                    type="primary"
                    size="small"
                    className="status-filter-dropdown__confirm-btn"
                    style={{ flex: 1 }}
                    onClick={() => {
                        handleFilter("status", selectedKeys, confirm);
                    }}
                >
                    Xác nhận
                </Button>
            </div>
        </div>
    );
};
