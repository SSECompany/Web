import React from "react";
import { Button } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import CommonPhieuList from "../../../../pages/kho/components/CommonPhieuList";
import FilterChips from "./FilterChips";

const DesktopLayout = ({
    title,
    columns,
    data,
    loading,
    onBack,
    onAdd,
    onRefresh,
    rowKey,
    selectedRowKeys,
    setSelectedRowKeys,
    setSelectedRowsData,
    pagination,
    tableProps,
    
    // Filters
    activeChips,
    onRemoveFilter,
    onClearAllFilters,
    
    // Extensible desktop actions
    desktopActions, // Array of { key, icon, label, onClick, disabled, type, danger, ghost, loading, render }
}) => {
    
    const extraHeader = (
        <>
            <FilterChips 
                activeChips={activeChips} 
                onRemoveFilter={onRemoveFilter}
                onClearAllFilters={onClearAllFilters}
            />
            
            <div className={`list-template-extra-actions ${activeChips?.length > 0 ? 'has-chips' : ''}`}>
                {onAdd && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                        style={{ background: '#1d4ed8', borderColor: '#1d4ed8' }}
                    >
                        Tạo mới
                    </Button>
                )}
                
                {onAdd && desktopActions?.length > 0 && (
                    <div style={{ borderLeft: '1px solid #e5e7eb', height: '24px', margin: '0 4px' }} />
                )}
                
                {desktopActions && desktopActions.map((action, idx) => {
                    if (action.render) return <React.Fragment key={action.key || idx}>{action.render()}</React.Fragment>;
                    return (
                        <Button
                            key={action.key || idx}
                            icon={action.icon}
                            type={action.type || "default"}
                            danger={action.danger}
                            ghost={action.ghost}
                            disabled={action.disabled}
                            onClick={action.onClick}
                            loading={action.loading}
                        >
                            {action.label}
                        </Button>
                    );
                })}

                {selectedRowKeys?.length > 0 && (
                    <Button onClick={() => {
                        setSelectedRowKeys([]);
                        if(setSelectedRowsData) setSelectedRowsData([]);
                    }}>
                        Bỏ chọn
                    </Button>
                )}
                
                <div style={{ flex: 1 }} />
                
                {onRefresh && (
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        title="Làm tươi"
                    >
                        Làm tươi
                    </Button>
                )}
            </div>
        </>
    );

    const mergedTableProps = {
        rowSelection: selectedRowKeys ? {
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys, rows) => {
                setSelectedRowKeys(keys);
                if (setSelectedRowsData) {
                    setSelectedRowsData(prev => {
                        const nextData = prev ? prev.filter(item => keys.includes(item[rowKey])) : [];
                        rows.forEach(row => {
                            if (row && !nextData.find(f => f[rowKey] === row[rowKey])) {
                                nextData.push(row);
                            }
                        });
                        return nextData;
                    });
                }
            },
        } : undefined,
        scroll: { x: 1300 },
        ...tableProps,
    };

    return (
        <div className="desktop-layout">
            <CommonPhieuList
                title={title}
                columns={columns}
                data={data}
                loading={loading}
                onBack={onBack}
                rowKey={rowKey}
                extraButtons={null}
                extraHeader={extraHeader}
                tableProps={mergedTableProps}
                pagination={pagination}
            />
        </div>
    );
};

export default DesktopLayout;
