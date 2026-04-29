import React from 'react';
import { Modal, Button, Table, Input, Row, Col, Typography } from 'antd';
import { GiftOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const DiscountModal = ({
    visible,
    onCancel,
    onApply,
    stage,
    searchText,
    onSearchTextChange,
    chiTietData,
    discountResults,
    itemsSelection,
    onItemsSelectionChange,
    resultsSelection,
    onResultsSelectionChange,
    watchSoCt,
    watchNgayCt,
    isMobile
}) => {
    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GiftOutlined style={{ color: '#1890ff' }} />
                    <span>CK áp dụng</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            width={1000}
            centered
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button 
                    key="apply" 
                    type="primary" 
                    onClick={onApply}
                    icon={<CheckOutlined />}
                >
                    Nhận
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Row gutter={[24, 12]} align="middle">
                    <Col xs={24} md={10}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ whiteSpace: 'nowrap', minWidth: '80px' }}>Mã hàng</span>
                            <Input 
                                placeholder="Tìm mã hàng..." 
                                allowClear 
                                value={searchText}
                                onChange={e => onSearchTextChange(e.target.value)}
                            />
                        </div>
                    </Col>
                    <Col xs={12} md={7} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <Text type="secondary">Số chứng từ: </Text><Text strong>{watchSoCt || "Mới"}</Text>
                    </Col>
                    <Col xs={12} md={7} style={{ textAlign: 'right' }}>
                        <Text type="secondary">Ngày hạch toán: </Text><Text strong>{watchNgayCt ? dayjs(watchNgayCt).format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY")}</Text>
                    </Col>
                </Row>
            </div>

            <Table
                rowKey={stage === 'selection' ? "line_nbr" : "key"}
                dataSource={
                    (stage === 'selection' ? chiTietData : discountResults).filter(item => {
                        if (!searchText) return true;
                        const search = searchText.toLowerCase();
                        return (
                            (item.ma_vt && item.ma_vt.toLowerCase().includes(search)) ||
                            (item.ten_vt && item.ten_vt.toLowerCase().includes(search)) ||
                            (item.ma_vt_mua && item.ma_vt_mua.toLowerCase().includes(search)) ||
                            (item.ma_ck && item.ma_ck.toLowerCase().includes(search)) ||
                            (item.ten_ck && item.ten_ck.toLowerCase().includes(search))
                        );
                    })
                }
                rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys: stage === 'selection' ? itemsSelection : resultsSelection,
                    onChange: (keys) => {
                        if (stage === 'selection') onItemsSelectionChange(keys);
                        else onResultsSelectionChange(keys);
                    }
                }}
                scroll={{ x: 800, y: 400 }}
                pagination={false}
                size="small"
                columns={[
                    { title: 'Mã hàng mua', dataIndex: 'ma_vt_mua', width: 120, render: (v) => String(v || "").trim() },
                    { title: 'Mã CK', dataIndex: 'ma_ck', width: 110, align: 'center', render: (v) => String(v || "").trim() },
                    { title: 'Tên CK', dataIndex: 'ten_ck', render: (v) => String(v || "").trim() },
                    { title: 'Loại CK', dataIndex: 'loai_ck', width: 80, align: 'center', render: (v) => String(v || "").trim() },
                    { title: 'Tên loại CK', dataIndex: 'ten_loai', width: 150, render: (v, r) => String(v || "").trim() || (r.kieu_ck === 'H' ? 'Khuyến mại tặng hàng' : (r.kieu_ck === 'M' ? 'Chiết khấu tổng đơn' : 'Chiết khấu dòng')) },
                    { title: 'Mã hàng tặng', dataIndex: 'ma_vt', width: 120, render: (v, r) => String(r.kieu_ck || "").trim() === 'H' ? String(v || "").trim() : "" },
                ]}
            />
        </Modal>
    );
};

export default DiscountModal;
