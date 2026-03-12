import {
    LeftOutlined,
    EditOutlined,
    SaveOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    Button, Form, Input, Select, Typography,
    message, Checkbox, Tabs, Row, Col, DatePicker,
    Table, Spin, InputNumber
} from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { 
    fetchPhieuKinhDoanhDetail, 
    fetchPhieuKinhDoanhChiTiet
} from "./phieuKinhDoanhApi";
import "../../../kho/components/common-phieu.css";
import "./DetailPhieuKinhDoanh.css";

const { Title, Text } = Typography;
const numFmt = (val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const DetailPhieuKinhDoanh = ({ isEditMode: initialEditMode = false }) => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { stt_rec } = useParams();
    const location = useLocation();

    const [isEditMode, setIsEditMode] = useState(
        initialEditMode || location.pathname.includes("/edit/") || !stt_rec
    );
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [statusList, setStatusList] = useState([]);
    const [chiTietData, setChiTietData] = useState([]);
    const [chiPhiData, setChiPhiData] = useState([]);
    const [anhWebData, setAnhWebData] = useState([]);

    useEffect(() => {
        if (stt_rec) {
            loadData();
            loadDetails();
        } else {
            form.setFieldsValue({
                ma_gd: "1",
                hinh_thuc_tt: "1",
                ty_gia: 1,
                ngay_ct: dayjs(),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stt_rec]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchPhieuKinhDoanhDetail(stt_rec);
            if (res.success && res.data) {
                const { header, statusList: statuses, chiPhi, anhWeb } = res.data;
                setStatusList(statuses || []);
                setChiPhiData(chiPhi || []);
                setAnhWebData(anhWeb || []);
                if (header) {
                    form.setFieldsValue({
                        ...header,
                        ngay_ct: header.ngay_ct ? dayjs(header.ngay_ct) : null,
                        ngay_ct0: header.ngay_ct0 ? dayjs(header.ngay_ct0) : null,
                        kh_chiu_cuoc: !!header.kh_chiu_cuoc,
                        // Complaint tab mapping
                        hang_bi_loi: !!header.hl_yn,
                        khong_tra_cuoc: !!header.ktc_yn,
                        giao_nham_hang: !!header.gnh_yn,
                        thua_thieu_hang: !!header.tth_yn,
                        khieu_nai_gia: !!header.kng_yn,
                        doi_tra_hang: !!header.dthh_yn,
                        hang_date_gan: !!header.hdgkb_yn,
                        van_chuyen_cham: !!header.vcc_yn,
                        van_de_khac: !!header.vdk_yn,
                        y_kien_kh: header.yk_kh || "",
                        phan_hoi: header.ph_kn || "",
                        ngay_khieu_nai: header.fdate3 ? dayjs(header.fdate3) : null,
                        ngay_phan_hoi: header.fdate4 ? dayjs(header.fdate4) : null,
                        // Totals mapping
                        t_ck_tt: header.t_ck_tt_nt || header.t_ck_tt || 0,
                        t_ck: header.t_ck_nt || header.t_ck || 0,
                        tien_cp: header.t_cp_nt || header.t_cp || 0,
                        t_tien2: header.t_tien_nt2 || header.t_tien2 || 0,
                        t_ck_voucher: header.t_ck_voucher_nt || header.t_ck_voucher || 0,
                        t_thue_nt: header.t_thue_nt || header.t_thue || 0,
                        tong_cong: header.t_tt_nt || header.t_tt || 0,
                        the_voucher: header.ds_voucher || "",
                        khach_hang_display: header.ma_kh && header.ten_kh ? `${header.ma_kh} - ${header.ten_kh}` : (header.ma_kh || header.ten_kh || ""),
                    });
                }
            } else {
                message.error("Không thể tải dữ liệu phiếu");
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi hệ thống khi tải phiếu");
        } finally {
            setLoading(false);
        }
    };

    const loadDetails = async () => {
        try {
            const res = await fetchPhieuKinhDoanhChiTiet(stt_rec);
            if (res.success) {
                setChiTietData(res.data || []);
            }
        } catch (error) {
            console.error("Error loading details:", error);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            console.log("Submitting values:", values);
            setTimeout(() => {
                message.success("Lưu đơn hàng thành công");
                setLoading(false);
                navigate("/kinh-doanh/danh-sach");
            }, 1000);
        } catch (error) {
            console.error("Validation failed:", error);
            message.error("Vui lòng kiểm tra lại thông tin");
        }
    };

    const handleToggleEdit = () => {
        if (!isEditMode && stt_rec) {
            navigate(`/kinh-doanh/edit/${stt_rec}`);
        }
        setIsEditMode(true);
    };

    // ============ Tabs ============
    const chiPhiColumns = [
        { title: "Mã chi phí", dataIndex: "ma_cp", key: "ma_cp", width: 160 },
        { title: "Tên chi phí", dataIndex: "ten_cp", key: "ten_cp" },
        {
            title: "Tiền",
            dataIndex: "tien_cp",
            key: "tien_cp",
            align: "right",
            width: 160,
            render: (v) => (v ? v.toLocaleString() : "0"),
        },
    ];

    const tabItems = [
        {
            key: "chi_tiet",
            label: "Chi tiết",
            children: (
                <div style={{ minHeight: 120 }}>
                    <Table
                        size="small"
                        dataSource={chiTietData}
                        columns={[
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
                                width: 220,
                                render: (_, record) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                                        {record.image ? (
                                            <img src={record.image} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        ) : (
                                            <div style={{ width: 60, height: 60, background: '#f8f9fb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', border: '1px solid #eef2f7' }}>No Image</div>
                                        )}
                                        <div style={{ width: '100%', textAlign: 'center' }}>
                                            <div style={{ marginBottom: 4 }}>
                                                <Text strong style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'normal', wordBreak: 'break-word', display: 'block' }}>
                                                    {record.ten_vt}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: '11px', color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '2px 6px', width: 'fit-content', margin: '0 auto' }}>
                                                <span style={{ fontWeight: 600 }}>{record.ma_vt}</span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span>{record.dvt}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            { title: "Kho", dataIndex: "ma_kho", width: 80 },
                            { title: "SL", dataIndex: "so_luong", width: 65, align: "right", render: (v) => numFmt(Math.round(v || 0)) },
                            { title: "Giá bán", dataIndex: "gia_nt2", width: 100, align: "right", render: (v) => numFmt(Math.round(v || 0)) },
                            { title: "Tiền hàng", dataIndex: "tien_nt2", width: 110, align: "right", render: (v) => numFmt(Math.round(v || 0)) },
                            { title: "CK%", dataIndex: "tl_ck", width: 60, align: "right", render: (v) => (v ? `${v}%` : "") },
                            { title: "Tiền CK", dataIndex: "ck_nt", width: 90, align: "right", render: (v) => v ? numFmt(Math.round(v)) : "" },
                            { title: "Thuế", dataIndex: "thue_nt", width: 90, align: "right", render: (v) => numFmt(Math.round(v || 0)) },
                            { title: "Tồn", dataIndex: "ton13", width: 65, align: "right", render: (v) => numFmt(Math.round(v || 0)) },
                            { title: "Ghi chú", dataIndex: "ghi_chu", width: 120, ellipsis: true },
                        ]}
                        pagination={false}
                        bordered
                        scroll={{ x: 1150 }}
                        rowKey={(r) => r.stt_rec + "_" + r.line_nbr}
                    />
                </div>
            ),
        },
        {
            key: "giao_hang",
            label: "Thông tin giao hàng",
            children: (
                <Row gutter={24}>
                    <Col xs={24} lg={14}>
                        <Form.Item name="ma_dc" label="Nơi giao">
                            <Input suffix={<SearchOutlined style={{ color: '#94a3b8' }} />} />
                        </Form.Item>
                        <Form.Item name="ma_htvc" label="Loại vận chuyển">
                            <Input />
                        </Form.Item>
                        <Form.Item name="ma_vc" label="P.tiện d.chuyển">
                            <Input suffix={<SearchOutlined style={{ color: '#94a3b8' }} />} />
                        </Form.Item>
                        <Form.Item name="ghi_chu_giao_hang" label="Ghi chú giao hàng">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Col>
                </Row>
            ),
        },
        {
            key: "chi_phi",
            label: "Chi phí",
            children: (
                <div>
                    {isEditMode && (
                        <div style={{ marginBottom: 10, display: "flex", gap: 6 }}>
                            <Button icon={<PlusOutlined />} size="small" />
                            <Button icon={<DeleteOutlined />} size="small" danger />
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
                            <Col span={12}><Form.Item name="ngay_khieu_nai" label="Ngày khiếu nại"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item></Col>
                            <Col span={12}><Form.Item name="ngay_phan_hoi" label="Ngày phản hồi"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item></Col>
                        </Row>
                    </div>
                </div>
            ),
        },
        { key: "khac", label: "Khác", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có dữ liệu</div> },
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

    return (
        <div className="detail-don-hang">
            <div className="detail-don-hang__card">
                {/* ===== HEADER ===== */}
                <Row align="middle" className="detail-don-hang__header" style={{ position: "relative" }}>
                    <Col flex={1} style={{ textAlign: "left", zIndex: 1 }}>
                        <Button
                            type="text"
                            icon={<LeftOutlined />}
                            className="detail-don-hang__back-btn"
                            onClick={() => navigate("/kinh-doanh/danh-sach")}
                        />
                    </Col>

                    <div style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 0,
                        whiteSpace: "nowrap"
                    }}>
                        <Title level={5} className="phieu-title" style={{ margin: 0 }}>
                            {stt_rec
                                ? isEditMode ? "SỬA ĐƠN HÀNG" : "CHI TIẾT ĐƠN HÀNG"
                                : "THÊM ĐƠN HÀNG MỚI"}
                        </Title>
                    </div>

                    <Col flex={1} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", zIndex: 1 }}>
                        {stt_rec && !isEditMode && (
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                className="detail-don-hang__edit-btn"
                                onClick={handleToggleEdit}
                                title="Chỉnh sửa"
                            />
                        )}
                    </Col>
                </Row>

                {/* ===== BODY ===== */}
                <div className="detail-don-hang__body">
                    <Form
                        form={form}
                        layout={isMobile ? "vertical" : "horizontal"}
                        disabled={!isEditMode && !!stt_rec}
                        labelCol={isMobile ? null : { flex: "140px" }}
                        wrapperCol={isMobile ? null : { flex: 1 }}
                        size={isMobile ? "middle" : "small"}
                        colon={false}
                    >
                        {/* ---- Thông tin chung ---- */}
                        <div className="detail-don-hang__section">
                            <Row gutter={32}>
                                <Col xs={24} lg={11}>
                                    <Form.Item name="khach_hang_display" label="Khách hàng">
                                        <Input disabled />
                                    </Form.Item>
                                    <Form.Item name="ma_nvbh" label="NVKD">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="ma_tt" label="Mã thanh toán">
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={{ span: 11, offset: 1 }}>
                                    <Form.Item name="so_ct" label="Số đơn hàng">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="ngay_ct" label="Ngày lập">
                                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn thời điểm" />
                                    </Form.Item>
                                    <Form.Item name="status" label="Trạng thái">
                                        <Select>
                                            {statusList.length > 0 ? (
                                                statusList.map((s) => (
                                                    <Select.Option key={s.status} value={s.status}>
                                                        {s.status}. {s.statusname}
                                                    </Select.Option>
                                                ))
                                            ) : (
                                                <>
                                                    <Select.Option value="0">0. Lập chứng từ</Select.Option>
                                                    <Select.Option value="1">1. Chờ duyệt</Select.Option>
                                                    <Select.Option value="2">2. Duyệt</Select.Option>
                                                </>
                                            )}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={32}>
                                <Col xs={24} lg={11}>
                                    <Form.Item name="dien_giai" label="Diễn giải">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="ghi_chu_kh" label="Ghi chú KH">
                                        <Input.TextArea rows={2} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={32}>
                                <Col xs={24} lg={11}>
                                    <Form.Item name="kh_chiu_cuoc" valuePropName="checked" wrapperCol={{ offset: 0 }} style={isMobile ? {} : { marginLeft: "140px" }}>
                                        <Checkbox>Khách hàng chịu cước</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} lg={{ span: 11, offset: 1 }}>
                                    <Form.Item name="hinh_thuc_tt" label="Hình thức TT">
                                        <Select>
                                            <Select.Option value="1">1. Chuyển khoản</Select.Option>
                                            <Select.Option value="2">2. Tiền mặt</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* ---- Tabs ---- */}
                        <Tabs
                            defaultActiveKey="chi_tiet"
                            items={tabItems}
                            className="detail-don-hang__tabs"
                        />

                        {/* ---- Tổng tiền ---- */}
                        <div className="detail-don-hang__totals">
                            <Row gutter={32} justify="space-between">
                                <Col xs={24} lg={10}>
                                    <Form.Item name="the_voucher" label="Thẻ voucher">
                                        <Input suffix={<SearchOutlined style={{ color: '#94a3b8' }} />} />
                                    </Form.Item>
                                    <Form.Item name="t_ck_tt" label="CK tổng đơn">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={numFmt} />
                                    </Form.Item>
                                    <Form.Item name="t_ck" label="Tiền chiết khấu">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={numFmt} />
                                    </Form.Item>
                                    <Form.Item name="tien_cp" label="Chi phí">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={numFmt} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={10} className="detail-don-hang__totals-right">
                                    <Form.Item name="t_tien2" label="Tiền hàng">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={numFmt} />
                                    </Form.Item>
                                    <Form.Item name="t_ck_voucher" label="CK voucher">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={numFmt} />
                                    </Form.Item>
                                    <Form.Item name="t_thue_nt" label="Tiền thuế">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={numFmt} />
                                    </Form.Item>
                                    <div className="detail-don-hang__totals-grand">
                                        <Form.Item name="tong_cong" label="Tổng cộng">
                                            <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={numFmt} />
                                        </Form.Item>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* ---- Actions ---- */}
                        {(isEditMode || !stt_rec) && (
                            <div className="detail-don-hang__actions">
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
                                    Lưu
                                </Button>
                                <Button icon={<CloseCircleOutlined />} onClick={() => navigate("/kinh-doanh/danh-sach")}>
                                    Hủy
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default DetailPhieuKinhDoanh;
