import React, { useState } from "react";
import { Button, Row, Col, Typography, Input, Tooltip, List, Spin, Empty, Table } from "antd";
import { LeftOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const MobileLayout = ({
    title,
    data,
    loading,
    onBack,
    onAdd,
    onRefresh,
    renderMobileItem,
    pagination,
    columns,
    rowKey = "stt_rec",
    tableProps,
    
    // Actions & Selection
    selectedRowKeys,
    setSelectedRowKeys,
    setSelectedRowsData,
    mobileActions, // Actions in the sticky footer
    
    // Filters
    mobileFilterForm, // Form inputs block to render
    onClearAllFilters,
}) => {
    const navigate = useNavigate();
    const [showMobileFilter, setShowMobileFilter] = useState(false);

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
        scroll: { x: 600 },
        size: "small",
        ...tableProps,
    };

    return (
        <div className="phieu-container mobile-app-layout">
            <Row align="middle" className="phieu-header mobile-sticky-header" style={{ position: "relative" }}>
                <Col flex={1} style={{ textAlign: "left", zIndex: 1 }}>
                    {onBack && <Button type="text" icon={<LeftOutlined />} onClick={onBack} />}
                </Col>

                <div style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 0,
                    whiteSpace: "nowrap"
                }}>
                    <Title level={5} className="phieu-title" style={{ margin: 0 }}>
                        {title}
                    </Title>
                </div>

                <Col flex={1} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", zIndex: 1, gap: 8 }}>
                    {onRefresh && (
                        <Button
                            type="text"
                            icon={<ReloadOutlined />}
                            onClick={onRefresh}
                            title="Làm tươi"
                        />
                    )}
                    {onAdd && (
                        <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={onAdd} />
                    )}
                </Col>
            </Row>

            {mobileFilterForm && (
                <div className="mobile-filter-header">
                    <Button
                        icon={<SearchOutlined />}
                        onClick={() => setShowMobileFilter(!showMobileFilter)}
                        type={showMobileFilter ? "primary" : "default"}
                    >
                        Bộ lọc
                    </Button>
                    {showMobileFilter && (
                        <div className="mobile-filter-content">
                            {mobileFilterForm}
                            <Button 
                                block 
                                type="dashed" 
                                onClick={onClearAllFilters}
                                style={{ marginTop: '12px', borderRadius: '8px' }}
                            >
                                Xóa tất cả bộ lọc
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="mobile-list-content" style={{ paddingBottom: selectedRowKeys?.length > 0 ? '120px' : '20px' }}>
                {loading ? (
                    <div className="mobile-loading"><Spin size="large" /></div>
                ) : data?.length > 0 ? (
                    renderMobileItem ? (
                        <List
                            dataSource={data}
                            renderItem={renderMobileItem}
                            pagination={{
                                ...pagination,
                                simple: true,
                                align: 'center',
                                style: { marginTop: 16, marginBottom: 16 }
                            }}
                        />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={data}
                            rowKey={rowKey}
                            pagination={{
                                ...pagination,
                                simple: true,
                                align: 'center',
                                style: { marginTop: 16, marginBottom: 16 }
                            }}
                            {...mergedTableProps}
                        />
                    )
                ) : (
                    <Empty description="Không có dữ liệu" style={{ marginTop: 50 }} />
                )}
            </div>

            {selectedRowKeys?.length > 0 && mobileActions && (
                <div className="mobile-sticky-actions">
                    <div className="mobile-sticky-actions__header">
                        <Text strong>Đã chọn {selectedRowKeys.length} mục</Text>
                        <Button size="small" type="link" onClick={() => { 
                            setSelectedRowKeys([]); 
                            if(setSelectedRowsData) setSelectedRowsData([]); 
                        }}>
                            Bỏ chọn
                        </Button>
                    </div>
                    <div className="mobile-sticky-actions__buttons">
                        {mobileActions.map((action, idx) => {
                            if (action.render) return <React.Fragment key={action.key || idx}>{action.render()}</React.Fragment>;
                            return (
                                <Button 
                                    key={action.key || idx}
                                    icon={action.icon} 
                                    type={action.type || "primary"} 
                                    danger={action.danger}
                                    ghost={action.ghost}
                                    size="small"
                                    onClick={action.onClick}
                                    loading={action.loading}
                                    disabled={action.disabled}
                                >
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileLayout;
