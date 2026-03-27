import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { useReactToPrint } from "react-to-print";
import {
    EditOutlined,
    SaveOutlined,
    DeleteOutlined,
    DownOutlined,
    UpOutlined,
    GiftOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import {
    Button, Form, Input, Select, Typography,
    Checkbox, Tabs, Row, Col, DatePicker,
    Table, Spin, InputNumber, Divider
} from "antd";
import dayjs from "dayjs";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import { usePhieuKinhDoanh } from "./Detail/usePhieuKinhDoanh";
import DiscountModal from "./Detail/DiscountModal";
import TotalsSection from "./Detail/TotalsSection";
import { numFmt } from "./Detail/constants";
import PrintOrderTemplate from "./Detail/PrintOrderPreview";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate/index.jsx";
import "../../../kho/components/common-phieu.css";
import "./DetailPhieuKinhDoanh.css";

const { Text } = Typography;

const DetailPhieuKinhDoanh = ({ isEditMode: initialEditMode = false }) => {
    const {
        form,
        navigate,
        stt_rec,
        watchSoCt,
        watchBContractId,
        watchNgayCt,
        watchStatus,
        watchStatusSoanHang,
        isEditMode,
        loading,
        isMobile,
        showGeneralInfo,
        tinhCKLoading,
        discountModalVisible,
        setDiscountModalVisible,
        discountItemsSelection,
        setDiscountItemsSelection,
        discountResults,
        selectedDiscountResultsKeys,
        setSelectedDiscountResultsKeys,
        discountModalStage,
        discountSearchText,
        setDiscountSearchText,
        toggleGeneralInfo,
        statusList,
        chiTietData,
        setChiTietData,
        chiPhiData,
        setChiPhiData,
        khSelectOptions,
        nvSelectOptions,
        ttSelectOptions,
        vcSelectOptions,
        voucherSelectOptions,
        noiGiaoSelectOptions,
        khSearchLoading,
        nvSearchLoading,
        ttSearchLoading,
        vcSearchLoading,
        voucherSearchLoading,
        noiGiaoSearchLoading,
        vatTuInput,
        setVatTuInput,
        barcodeEnabled,
        setBarcodeEnabled,
        setBarcodeJustEnabled,
        showQRScanner,
        setShowQRScanner,
        vatTuSearchList,
        setVatTuSearchList,
        pageIndexVt,
        setPageIndexVt,
        totalPageVt,
        currentKeywordVt,
        vatTuSelectRef,
        searchTimeoutRef,
        handleFormValuesChange,
        handleCellChange,
        handleChiPhiChange,
        handleCalculateDiscounts,
        applySelectedDiscounts,
        handleSearchKh,
        handleSearchNv,
        handleSearchTt,
        handleSearchVc,
        handleSearchVoucher,
        handleSearchNoiGiao,
        fetchVatTuListWrapper,
        handleVatTuSelect,
        handleQRScanSuccess,
        handleToggleEdit,
        handleSubmit,
        updateTotals,
        watchMaKh,
        bankInfo,
        selectedDetailRowKeys,
        setSelectedDetailRowKeys,
        handleDeleteSelected,
        handleDeleteRow,
        handleDeleteChiPhi
    } = usePhieuKinhDoanh(initialEditMode);

    const printRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    const chiPhiColumns = [
        { title: "Mã chi phí", dataIndex: "ma_cp", key: "ma_cp", width: 120, align: "center" },
        { title: "Tên chi phí", dataIndex: "ten_cp", key: "ten_cp", align: "center" },
        {
            title: "Tiền (NT)",
            dataIndex: "tien_cp_nt",
            key: "tien_cp_nt",
            align: "center",
            width: 140,
            render: (v, record) => isEditMode ? (
                <InputNumber
                    size="small"
                    value={v}
                    controls={false}
                    className="phieu-table-input"
                    formatter={v => numFmt(v)}
                    style={{ width: '100%' }}
                    onChange={(val) => handleChiPhiChange(record, "tien_cp_nt", val)}
                />
            ) : (v ? v.toLocaleString() : "0"),
        },
        { 
            title: "Ghi chú", 
            dataIndex: "ghi_chu", 
            key: "ghi_chu", 
            align: "center", 
            width: 200,
            render: (v, record) => isEditMode ? (
                <Input
                    size="small"
                    value={v}
                    className="phieu-table-input"
                    onChange={(e) => {
                        setChiPhiData(prev => prev.map(item => 
                            (item.ma_cp === record.ma_cp && item.line_nbr === record.line_nbr) ? { ...item, ghi_chu: e.target.value } : item
                        ));
                    }}
                />
            ) : v
        },
        {
            title: "Hành động",
            key: "action",
            width: 80,
            align: "center",
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!isEditMode}
                    onClick={() => handleDeleteChiPhi(record)}
                />
            )
        },
    ];

    const tabItems = [
        {
            key: "chi_tiet",
            label: "Chi tiết",
            children: (
                <div style={{ minHeight: 120 }}>
                    {isEditMode && (
                        <div className="detail-don-hang__add-product-section">
                            <div className="section-title">Thêm vật tư</div>
                            <VatTuSelectFullPOS
                                isEditMode={isEditMode}
                                barcodeEnabled={barcodeEnabled}
                                setBarcodeEnabled={setBarcodeEnabled}
                                setBarcodeJustEnabled={setBarcodeJustEnabled}
                                vatTuInput={vatTuInput}
                                setVatTuInput={setVatTuInput}
                                vatTuSelectRef={vatTuSelectRef}
                                loadingVatTu={false}
                                vatTuList={vatTuSearchList}
                                searchTimeoutRef={searchTimeoutRef}
                                fetchVatTuList={fetchVatTuListWrapper}
                                handleVatTuSelect={handleVatTuSelect}
                                totalPage={totalPageVt}
                                pageIndex={pageIndexVt}
                                setPageIndex={setPageIndexVt}
                                setVatTuList={setVatTuSearchList}
                                currentKeyword={currentKeywordVt}
                                onOpenQRScanner={() => setShowQRScanner(true)}
                            />
                        </div>
                    )}
                    <Table
                        size="small"
                        dataSource={chiTietData}
                        columns={[
                            { title: "STT", width: 45, align: "center", render: (v, r, i) => i + 1 },
                            { title: "Đ.bộ", dataIndex: "db_yn", width: 50, align: "center", render: (v, record) => (
                                <Checkbox
                                    checked={!!v}
                                    disabled={!isEditMode}
                                    onChange={(e) => {
                                        setChiTietData(prev => prev.map(item =>
                                            item.line_nbr === record.line_nbr ? { ...item, db_yn: e.target.checked ? 1 : 0 } : item
                                        ));
                                    }}
                                />
                            ) },
                            {
                                title: "Sản phẩm",
                                key: "san_pham",
                                width: 240,
                                align: "center",
                                onCell: (record) => ({
                                    onClick: () => {
                                        if (!isEditMode) return;
                                        const key = record.stt_rec + "_" + record.line_nbr;
                                        setSelectedDetailRowKeys(prev => 
                                            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                        );
                                    },
                                    className: isEditMode ? 'product-column-clickable' : ''
                                }),
                                render: (_, record) => (
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
                                        {record.image ? (
                                            <img src={record.image} alt="" style={{ width: 48, height: 48, flexShrink: 0, objectFit: "cover", borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        ) : (
                                            <div style={{ width: 48, height: 48, flexShrink: 0, background: '#f8f9fb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', border: '1px solid #eef2f7' }}>No Image</div>
                                        )}
                                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                            <div style={{ marginBottom: 4 }}>
                                                <Text strong style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'normal', wordBreak: 'break-word', display: 'block', color: 'red' }}>
                                                    {record.ten_vt}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, fontSize: '11px', color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
                                                <span style={{ fontWeight: 600 }}>{record.ma_vt}</span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span>{record.dvt}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            { title: "SL", dataIndex: "so_luong", width: 80, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "so_luong", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : numFmt(v) },
                            { title: "Tồn", dataIndex: "ton13", width: 125, align: "center", render: (_, record) => (
                                <div style={{ fontSize: '11px', textAlign: 'left', padding: '0 4px' }}>
                                    <div>KLT-T1: {numFmt(record.tonl1 || 0)}</div>
                                    <div>KOL-T2: {numFmt(record.ton13 || 0)}</div>
                                    <div>SL chuyển kho: {numFmt(record.tong_chuyen || 0)}</div>
                                </div>
                            ) },
                             { title: "KM", dataIndex: "km_yn", width: 50, align: "center", render: (v, record) => (
                                <Checkbox
                                    checked={!!v}
                                    disabled={!isEditMode}
                                    onChange={(e) => handleCellChange(record, "km_yn", e.target.checked ? 1 : 0)}
                                />
                            ) },
                            { title: "Giá niêm yết", dataIndex: "gia_ban_nt", width: 100, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    precision={2}
                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "gia_ban_nt", val)} 
                                    style={{ width: '100%' }} 
                                />
                            ) : numFmt(v, 2) },
                            { 
                                title: "Tiền hàng sau Thuế", 
                                key: "tien_hang_sau_thue", 
                                width: 120, 
                                align: "center", 
                                render: (_, record) => numFmt(parseFloat(record.so_luong || 0) * parseFloat(record.gia_ban_nt || 0)) 
                            },
                            { title: "CK%", dataIndex: "tl_ck", width: 70, align: "center", render: (v) => (v ? `${v}%` : "") },
                            { title: "Tiền CK", dataIndex: "ck_nt", width: 90, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "ck_nt", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : (v ? numFmt(v) : "") },
                            { title: "Ghi chú ĐH", dataIndex: "ghi_chu_dh", width: 150, align: "center", render: (v, record) => isEditMode ? (
                                <Input size="small" value={v} onChange={(e) => handleCellChange(record, "ghi_chu_dh", e.target.value)} />
                            ) : v },
                            {
                                title: "Hành động",
                                key: "action",
                                width: 80,
                                align: "center",
                                render: (_, record) => (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        disabled={!isEditMode}
                                        onClick={() => handleDeleteRow(record)}
                                    />
                                )
                            },
                        ]}
                        pagination={{
                            pageSize: 50,
                            size: "small",
                            showSizeChanger: false,
                            simple: true,
                            align: "center",
                            style: { marginTop: 16, marginBottom: 16 }
                        }}
                        bordered
                        scroll={{ x: 1250 }}
                        rowKey={(r) => r.stt_rec + "_" + r.line_nbr}
                        rowClassName={(record) => {
                            const classes = [];
                            const key = record.stt_rec + "_" + record.line_nbr;
                            if (selectedDetailRowKeys && selectedDetailRowKeys.includes(key)) {
                                classes.push('row-selected-highlight');
                            }
                            const tonl1 = parseFloat(record.tonl1 || 0);
                            const ton13 = parseFloat(record.ton13 || 0);
                            const soluong = parseFloat(record.so_luong || 0);
                            const sl_ck = parseFloat(record.tong_chuyen || 0);
                            const flag = (ton13 + tonl1) - sl_ck;
                            if (flag < soluong) {
                                classes.push('row-stock-warning');
                            }
                            if (record.pvkd_yn === 0) {
                                classes.push('row-pvkd-red');
                            }
                            return classes.join(' ');
                        }}
                    />
                </div>
            ),
        },
        {
            key: "chi_phi",
            label: "Chi phí",
            children: (
                <div>
                    {isEditMode && (
                        <div style={{ marginBottom: 10, display: "flex", gap: 6 }}>
                            <Button 
                                icon={<UpOutlined style={{ transform: 'rotate(180deg)' }} />} 
                                size="small" 
                                onClick={() => {
                                    setChiPhiData([...chiPhiData, { ma_cp: "", ten_cp: "", tien_cp_nt: 0, ghi_chu: "", line_nbr: Date.now() }]);
                                }}
                            />
                            <Button 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                danger 
                                onClick={() => {
                                    setChiPhiData(prev => prev.slice(0, -1));
                                }}
                            />
                        </div>
                    )}
                    <Table
                        size="small"
                        dataSource={chiPhiData}
                        columns={chiPhiColumns}
                        rowKey={(r) => r.ma_cp || r.line_nbr}
                        pagination={false}
                        bordered
                    />
                </div>
            ),
        },
        {
            key: "khieu_nai",
            label: "Khiếu nại",
            children: (
                <div>
                    <div className="detail-don-hang__complaint-grid">
                        <Form.Item name="hang_bi_loi" valuePropName="checked" noStyle><Checkbox>Hàng bị lỗi</Checkbox></Form.Item>
                        <Form.Item name="khong_tra_cuoc" valuePropName="checked" noStyle><Checkbox>Không trả cước</Checkbox></Form.Item>
                        <Form.Item name="giao_nham_hang" valuePropName="checked" noStyle><Checkbox>Giao nhầm hàng</Checkbox></Form.Item>
                        <Form.Item name="thua_thieu_hang" valuePropName="checked" noStyle><Checkbox>Thừa thiếu hàng</Checkbox></Form.Item>
                        <Form.Item name="khieu_nai_gia" valuePropName="checked" noStyle><Checkbox>Khiếu nại giá</Checkbox></Form.Item>
                        <Form.Item name="doi_tra_hang" valuePropName="checked" noStyle><Checkbox>Đổi trả hàng hóa</Checkbox></Form.Item>
                        <Form.Item name="hang_date_gan" valuePropName="checked" noStyle><Checkbox>Hàng Date gần không báo</Checkbox></Form.Item>
                        <Form.Item name="van_chuyen_cham" valuePropName="checked" noStyle><Checkbox>Vận chuyển chậm</Checkbox></Form.Item>
                        <Form.Item name="van_de_khac" valuePropName="checked" noStyle><Checkbox>Vấn đề khác</Checkbox></Form.Item>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <Form.Item name="y_kien_kh" label="Ý kiến khách hàng"><Input.TextArea rows={2} /></Form.Item>
                        <Form.Item name="phan_hoi" label="Phản hồi khiếu nại"><Input.TextArea rows={2} /></Form.Item>
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="ngay_khieu_nai" label="Ngày khiếu nại"><DatePicker format={["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY"]} style={{ width: "100%" }} /></Form.Item></Col>
                            <Col span={12}><Form.Item name="ngay_phan_hoi" label="Ngày phản hồi"><DatePicker format={["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY"]} style={{ width: "100%" }} /></Form.Item></Col>
                        </Row>
                    </div>
                </div>
            ),
        },
        { 
            key: "khac", 
            label: "Khác", 
            children: (
                <div style={{ padding: '20px', minHeight: '300px' }}>
                    <Row gutter={[32, 16]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="so_hd0" label="Số hóa đơn">
                                <Input placeholder="Số hóa đơn" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="u_status" label="Trạng thái">
                                <Select placeholder="Chọn trạng thái">
                                    <Select.Option value="0">Lập chứng từ</Select.Option>
                                    <Select.Option value="1">Chờ duyệt</Select.Option>
                                    <Select.Option value="2">Duyệt</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="ngay_ct0" label="Ngày hóa đơn">
                                <DatePicker format={["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY"]} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}></Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="status_soan_hang" label="Soạn hàng">
                                <Select placeholder="Trạng thái soạn hàng">
                                    <Select.Option value="0">Chưa soạn</Select.Option>
                                    <Select.Option value="1">Đã soạn</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="tt_giao_van" label="Giao vận">
                                <Select placeholder="Trạng thái giao vận">
                                    <Select.Option value="0">Chờ lấy hàng</Select.Option>
                                    <Select.Option value="1">Đang giao hàng</Select.Option>
                                    <Select.Option value="2">Đã giao hàng</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="ban_dong_goi" label="Bàn đóng gói">
                                <Input placeholder="Nhập bàn đóng gói" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="ma_nv_dh" label="NV đóng hàng">
                                <Input placeholder="Nhân viên đóng hàng" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="bat_dau_dh" label="Thời gian bắt đầu đóng hàng">
                                <DatePicker showTime format={["DD-MM-YYYY HH:mm", "DDMMYYYY HH:mm", "DD/MM/YYYY HH:mm"]} style={{ width: '100%' }} placeholder="Ngày-Tháng-Năm Giờ:Phút" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="ket_thuc_dh" label="Thời gian kết thúc đóng hàng">
                                <DatePicker showTime format={["DD-MM-YYYY HH:mm", "DDMMYYYY HH:mm", "DD/MM/YYYY HH:mm"]} style={{ width: '100%' }} placeholder="Ngày-Tháng-Năm Giờ:Phút" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )
        },
        { key: "dinh_kem", label: "Tệp đính kèm", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có tệp đính kèm</div> },
        { key: "anh_web", label: "Ảnh Web", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có ảnh</div> },
    ];

    if (loading && !isEditMode) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    const fixedFooterActions = (isEditMode || !stt_rec) ? [
        {
            key: 'calculate',
            label: 'Tính CK',
            icon: <GiftOutlined />,
            onClick: handleCalculateDiscounts,
            loading: tinhCKLoading,
            className: "btn-calculate-discounts-fixed"
        },
        {
            key: 'print',
            label: 'In',
            icon: <PrinterOutlined />,
            onClick: handlePrint,
            className: "btn-print-fixed"
        },
        {
            key: 'save',
            label: 'Lưu',
            type: 'primary',
            icon: <SaveOutlined />,
            onClick: handleSubmit,
            loading: loading,
            className: "btn-save-fixed"
        }
    ] : [
        {
            key: 'print-view',
            label: 'In đơn hàng',
            icon: <PrinterOutlined />,
            onClick: handlePrint,
            className: "btn-print-fixed",
            style: { minWidth: 160 }
        }
    ];

    return (
        <FormTemplate
            form={form}
            onBack={() => navigate(-1)}
            badgeText={!stt_rec ? "THÊM ĐƠN HÀNG MỚI" : isEditMode ? "SỬA ĐƠN HÀNG" : "CHI TIẾT ĐƠN HÀNG"}
            badgeColor={!stt_rec ? "green" : isEditMode ? "orange" : "blue"}
            metaOrder={stt_rec ? `${watchSoCt || ''}${watchBContractId ? ` (${watchBContractId})` : ''}` : null}
            metaDate={watchNgayCt ? dayjs(watchNgayCt).format('DD-MM-YYYY') : '.........'}
            showStatusSelect={true}
            statusValue={String(watchStatus || "").trim()}
            statusOptions={statusList.map(s => ({ value: String(s.status).trim(), label: s.statusname }))}
            fixedFooterActions={fixedFooterActions}
            headerRightSpan={
                stt_rec && !isEditMode && !['1', '2', '3', '4', '5', '6'].includes(String(watchStatusSoanHang || "").trim()) ? (
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        className="phieu-edit-button-kd"
                        onClick={handleToggleEdit}
                        title="Chỉnh sửa"
                        disabled={stt_rec && !["0", "1", "2"].includes(String(watchStatus).trim())}
                    />
                ) : null
            }
        >
            <div className="detail-don-hang">
                <Form
                    form={form}
                    layout="vertical"
                    className="phieu-form--floating"
                    disabled={!isEditMode && !!stt_rec}
                    size="middle"
                    colon={false}
                    onValuesChange={handleFormValuesChange}
                >
                    <Form.Item name="bcontract_id" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="so_ct" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ngay_ct" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ma_kh" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ten_kh" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="dien_thoai" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="so_dien_thoai" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="sdt" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="phone" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ten_vc" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="tl_ck_voucher" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ma_ck" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="status" noStyle><Input type="hidden" /></Form.Item>
                    
                    <div className="detail-don-hang__body">
                        <div className="detail-don-hang__section" style={{ marginBottom: 16 }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-end', 
                                gap: '12px',
                                paddingBottom: showGeneralInfo ? '16px' : '0',
                                borderBottom: showGeneralInfo ? '1px solid #f0f0f0' : 'none',
                                marginBottom: showGeneralInfo ? '16px' : '0'
                            }}>
                                <div style={{ flex: 1 }}>
                                    {!stt_rec ? (
                                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                            <div style={{ flex: 1 }}>
                                                <Form.Item name="ten_kh" label="Tên khách hàng" style={{ marginBottom: 0 }}>
                                                    <Select
                                                        showSearch
                                                        placeholder="Tìm theo tên hoặc mã khách hàng"
                                                        loading={khSearchLoading}
                                                        onSearch={(val) => handleSearchKh(val, "ten_kh")}
                                                        onFocus={() => !khSelectOptions.length && handleSearchKh("", "ten_kh")}
                                                        onChange={(val) => {
                                                            const opt = khSelectOptions.find(o => o.value === val);
                                                            if (opt) {
                                                                form.setFieldsValue({ 
                                                                    ma_kh: opt.ma_kh,
                                                                    ten_kh: opt.ten_kh,
                                                                    dien_thoai: opt.dien_thoai,
                                                                    so_dien_thoai: opt.so_dien_thoai || opt.dien_thoai,
                                                                    sdt: opt.sdt || opt.dien_thoai,
                                                                    phone: opt.phone || opt.dien_thoai
                                                                });
                                                            }
                                                        }}
                                                        filterOption={false}
                                                        options={khSelectOptions}
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    ) : (
                                        <Form.Item name="khach_hang_display" noStyle>
                                            <Input.TextArea 
                                                disabled 
                                                autoSize 
                                                className="customer-display" 
                                            />
                                        </Form.Item>
                                    )}
                                </div>
                                <Button
                                    type="text"
                                    disabled={false}
                                    icon={showGeneralInfo ? <UpOutlined /> : <DownOutlined />}
                                    onClick={toggleGeneralInfo}
                                    style={{ 
                                        color: "#6c63ff", 
                                        height: '32px',
                                        width: '40px',
                                        background: 'rgba(108, 99, 255, 0.05)',
                                        borderRadius: '8px',
                                        opacity: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                />
                            </div>

                            {showGeneralInfo && (
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} lg={11}>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_nvbh" label="NVKD">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn NVKD"
                                                        loading={nvSearchLoading}
                                                        onSearch={handleSearchNv}
                                                        onFocus={() => !nvSelectOptions.length && handleSearchNv("")}
                                                        filterOption={false}
                                                        options={nvSelectOptions}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_tt" label="Mã TT">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn Mã TT"
                                                        loading={ttSearchLoading}
                                                        onSearch={handleSearchTt}
                                                        onFocus={() => !ttSelectOptions.length && handleSearchTt("")}
                                                        filterOption={false}
                                                        options={ttSelectOptions}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="dien_giai" label="Diễn giải">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} />
                                        </Form.Item>
                                        <Form.Item name="ghi_chu_kh" label="Ghi chú KH">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} disabled />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} lg={{ span: 11, offset: 1 }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="loai_ct" label="Loại CT" hidden>
                                                    <Select>
                                                        <Select.Option value="1">Bán hàng</Select.Option>
                                                        <Select.Option value="2">Trả hàng</Select.Option>
                                                        <Select.Option value="3">Khác</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="ty_gia" label="Tỷ giá" hidden>
                                                    <InputNumber controls={false} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="hinh_thuc_tt" label="Hình thức">
                                                    <Select>
                                                        <Select.Option value="1">Chuyển khoản</Select.Option>
                                                        <Select.Option value="2">Tiền mặt</Select.Option>
                                                        <Select.Option value="3">COD</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="kh_chiu_cuoc" label="Cước phí">
                                                    <Select>
                                                        <Select.Option value={0}>Công ty chịu cước</Select.Option>
                                                        <Select.Option value={1}>Khách hàng chịu cước</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_vc" label="P.tiện d.chuyển">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn phương tiện vận chuyển"
                                                        loading={vcSearchLoading}
                                                        onSearch={handleSearchVc}
                                                        onFocus={() => !vcSelectOptions.length && handleSearchVc("")}
                                                        filterOption={false}
                                                        options={vcSelectOptions}
                                                        style={{ borderRadius: '6px' }}
                                                        onChange={(val) => {
                                                            const opt = vcSelectOptions.find(o => o.value === val);
                                                            if (opt) {
                                                                form.setFieldsValue({ ten_vc: opt.ten_vc });
                                                            }
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="dia_chi" label="Nơi giao">
                                            <Select
                                                showSearch
                                                placeholder="Chọn nơi giao"
                                                loading={noiGiaoSearchLoading}
                                                onSearch={handleSearchNoiGiao}
                                                onFocus={() => !noiGiaoSelectOptions.length && handleSearchNoiGiao("")}
                                                filterOption={false}
                                                options={noiGiaoSelectOptions}
                                                style={{ borderRadius: '6px' }}
                                                allowClear
                                                disabled={(!isEditMode && !!stt_rec) || !watchMaKh}
                                            />
                                        </Form.Item>
                                        <Form.Item name="ghi_chu_giao_hang" label="Ghi chú ĐH">
                                            <Input.TextArea 
                                                autoSize={{ minRows: 1, maxRows: 6 }} 
                                                style={{ borderRadius: '6px' }} 
                                                disabled={!isEditMode && !!stt_rec}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </div>

                        <Tabs
                            defaultActiveKey="chi_tiet"
                            items={tabItems}
                            className="detail-don-hang__tabs"
                        />

                        <TotalsSection 
                            form={form}
                            watchMaKh={watchMaKh}
                            voucherSearchLoading={voucherSearchLoading}
                            handleSearchVoucher={handleSearchVoucher}
                            voucherSelectOptions={voucherSelectOptions}
                            chiTietData={chiTietData}
                            chiPhiData={chiPhiData}
                            updateTotals={updateTotals}
                            numFmt={numFmt}
                            isEditMode={isEditMode}
                            stt_rec={stt_rec}
                        />
                    </div>
                </Form>
            </div>

            <DiscountModal
                visible={discountModalVisible}
                onCancel={() => setDiscountModalVisible(false)}
                onApply={applySelectedDiscounts}
                stage={discountModalStage}
                searchText={discountSearchText}
                onSearchTextChange={setDiscountSearchText}
                chiTietData={chiTietData}
                discountResults={discountResults}
                itemsSelection={discountItemsSelection}
                onItemsSelectionChange={setDiscountItemsSelection}
                resultsSelection={selectedDiscountResultsKeys}
                onResultsSelectionChange={setSelectedDiscountResultsKeys}
                watchSoCt={watchSoCt}
                watchNgayCt={watchNgayCt}
                isMobile={isMobile}
            />

            <QRScanner
                visible={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={handleQRScanSuccess}
            />

            {isEditMode && selectedDetailRowKeys && selectedDetailRowKeys.length > 0 && (
                <div className="fixed-footer__selection-bar" style={{ position: 'fixed', bottom: 70, left: 24, right: 24, zIndex: 1001 }}>
                    <div className="selection-bar__left">
                        <Text type="secondary" className="selection-text">
                            Đã chọn <Text strong style={{ color: '#ff4d4f' }}>{selectedDetailRowKeys.length}</Text> mặt hàng
                        </Text>
                        <Divider type="vertical" />
                        <Button
                            type="link"
                            size="small"
                            onClick={() => setSelectedDetailRowKeys(chiTietData.map(item => item.stt_rec + "_" + item.line_nbr))}
                            className="selection-link"
                        >
                            Chọn hết
                        </Button>
                        <Divider type="vertical" />
                        <Button
                            type="link"
                            size="small"
                            onClick={() => setSelectedDetailRowKeys([])}
                            className="selection-link"
                        >
                            Bỏ chọn
                        </Button>
                    </div>
                    <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteSelected}
                        className="selection-delete-btn"
                    >
                        Xoá nhiều
                    </Button>
                </div>
            )}

            {createPortal(
                <div className="print-preview-wrapper" style={{ display: 'none' }}>
                    <PrintOrderTemplate
                        ref={printRef}
                        data={form.getFieldsValue()}
                        details={chiTietData}
                        totals={form.getFieldsValue()}
                        bankInfo={bankInfo}
                    />
                </div>,
                document.body
            )}
        </FormTemplate>
    );
};

export default DetailPhieuKinhDoanh;
