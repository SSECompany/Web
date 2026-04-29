import React from "react";
import { Tag, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";

const FilterChips = ({ activeChips, onRemoveFilter, onClearAllFilters }) => {
    if (!activeChips || activeChips.length === 0) return null;

    return (
        <div className="filter-chips-container">
            <div className="filter-chips-left">
                <FilterOutlined className="filter-chips-icon" />
                <span className="filter-chips-title">Bộ lọc đang áp dụng:</span>
                <div className="filter-chips-list">
                    {activeChips.map(chip => (
                        <Tag 
                            key={chip.key} 
                            closable 
                            onClose={(e) => { 
                                e.preventDefault(); 
                                onRemoveFilter(chip.key, chip);
                            }}
                            className={`filter-chip ${chip.className || "filter-chip--blue"}`}
                            color={chip.color}
                        >
                            {chip.label}: {chip.value}
                        </Tag>
                    ))}
                </div>
            </div>
            <div className="filter-chips-right">
                <Button size="small" type="text" onClick={onClearAllFilters}>
                    Xóa lọc
                </Button>
            </div>
        </div>
    );
};

export default FilterChips;
