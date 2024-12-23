import { FilterOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Divider, Input, Row, Space, Switch, Table } from "antd";
import { useState } from "react";
const ReturnOrderForm = () => {
    const [isBarcodeEnabled, setIsBarcodeEnabled] = useState(false);
    const [products, setProducts] = useState([
        {
            id: 1,
            image: "https://via.placeholder.com/50",
            product_name: "Hàng hóa TEST 1 033333",
            quantity: "0 / 1",
            price: 50000,
            total: 50000,
        },
    ]);

    // Tìm kiếm sản phẩm
    const handleSearch = (value) => {
        console.log("Tìm sản phẩm:", value);
    };

    // Toggle quét mã vạch
    const toggleBarcode = (checked) => {
        setIsBarcodeEnabled(checked);
    };

    // Mở bộ lọc nâng cao
    const openAdvancedFilter = () => {
        console.log("Bộ lọc nâng cao được mở.");
    };

    // Xác nhận nhận hàng
    const confirmReceipt = () => {
        console.log("Đã nhận và nhập kho.");
    };

    // Chuyển sang nhập tay
    const toggleManualReceipt = () => {
        console.log("Chuyển sang trạng thái chưa nhận hàng.");
    };

    // Thêm phương thức hoàn tiền
    const addRefundMethod = () => {
        console.log("Thêm phương thức hoàn tiền.");
    };

    const columns = [
        { title: "STT", dataIndex: "id", key: "id" },
        {
            title: "Ảnh",
            dataIndex: "image",
            key: "image",
            render: (image) => <img src={image} alt="product" width={50} height={50} />,
        },
        { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
        { title: "Số lượng", dataIndex: "quantity", key: "quantity", width: "15%" },
        {
            title: "Đơn giá",
            dataIndex: "price",
            key: "price",
            align: "right",
            render: (price) => price.toLocaleString() + " ₫",
        },
        {
            title: "Thành tiền",
            dataIndex: "total",
            key: "total",
            align: "right",
            render: (total) => total.toLocaleString() + " ₫",
        },
    ];

    return (
        <Row gutter={16}>
            {/* Phần sản phẩm trả */}
            <Col span={24}>
                <Card title="Sản phẩm trả">
                    {/* Thanh tìm kiếm + nút quét mã vạch */}
                    <Row justify="space-between" align="middle" style={{ marginBottom: "1rem" }}>
                        <Col>
                            <Switch
                                checked={isBarcodeEnabled}
                                onChange={toggleBarcode}
                                checkedChildren="Quét mã vạch"
                                unCheckedChildren="Tắt quét mã vạch"
                            />
                        </Col>
                        <Col>
                            <Button icon={<FilterOutlined />} onClick={openAdvancedFilter}>
                                Bộ lọc nâng cao (F10)
                            </Button>
                        </Col>
                    </Row>

                    {/* Bảng sản phẩm */}
                    <Input.Search
                        placeholder="Tìm sản phẩm trả hoặc quét barcode (F3)"
                        allowClear
                        enterButton="Tìm"
                        onSearch={handleSearch}
                        style={{ marginBottom: "1rem" }}
                    />
                    <Table
                        rowSelection={{ type: "checkbox" }}
                        columns={columns}
                        dataSource={products}
                        rowKey="id"
                    />
                </Card>
            </Col>

            {/* Phần nhận hàng trả lại */}
            <Col span={24}>
                <Card title="Nhận hàng trả lại">
                    <p>Hàng trả lại được nhập vào kho chi nhánh mặc định</p>
                    <Space>
                        <Button type="primary" onClick={confirmReceipt}>
                            Đã nhận và nhập kho
                        </Button>
                        <Button onClick={toggleManualReceipt}>Chưa nhận hàng</Button>
                    </Space>
                </Card>
            </Col>

            {/* Phần hoàn tiền */}
            <Col span={24}>
                <Card title="Hoàn tiền">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Cần hoàn tiền trả hàng">0</Descriptions.Item>
                        <Descriptions.Item label="Khách cần trả đơn đổi">0</Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền cần hoàn trả khách">0</Descriptions.Item>
                    </Descriptions>
                    <Divider />
                    <Button onClick={addRefundMethod} type="dashed">
                        Thêm phương thức
                    </Button>
                    <p style={{ marginTop: "1rem" }}>Còn phải hoàn trả khách: 0</p>
                </Card>
            </Col>
        </Row>
    );
};

export default ReturnOrderForm;
