import React from 'react';
import { Form, Row, Col, Select, InputNumber } from 'antd';

const TotalsSection = ({
    form,
    watchMaKh,
    voucherSearchLoading,
    handleSearchVoucher,
    voucherSelectOptions,
    chiTietData,
    chiPhiData,
    updateTotals,
    numFmt,
    isEditMode,
    stt_rec
}) => {
    const isFormDisabled = !isEditMode && !!stt_rec;
    return (
        <div className="detail-don-hang__totals">
            <Row gutter={[32, 12]}>
                {/* --- Cột bên trái: Các khoản giảm trừ & Chi phí --- */}
                <Col xs={24} lg={12}>
                    <Form.Item name="the_voucher" label="Thẻ voucher">
                        <Select
                            showSearch
                            placeholder="Chọn thẻ voucher"
                            loading={voucherSearchLoading}
                            onSearch={handleSearchVoucher}
                            onFocus={() => !voucherSelectOptions.length && handleSearchVoucher("")}
                            onChange={(val) => {
                                const opt = voucherSelectOptions.find(o => o.value === val);
                                if (opt) {
                                    // Calculate current items total
                                    const currentTien2 = chiTietData.reduce((sum, row) => sum + parseFloat(row.tien_nt2 || 0), 0);
                                    
                                    const ck_tien = parseFloat(opt.tien_ck || 0);
                                    const ck_phantram = parseFloat(opt.tl_ck || 0);
                                    
                                    let tienck = 0;
                                    if (ck_tien !== 0) {
                                        tienck = ck_tien;
                                        // If it's fixed, we clear tl_ck_voucher so it doesn't recalculate on total changes
                                        form.setFieldsValue({
                                            t_ck_voucher: Math.round(tienck),
                                            tl_ck_voucher: 0
                                        });
                                    } else if (ck_phantram !== 0) {
                                        tienck = currentTien2 * (ck_phantram / 100);
                                        form.setFieldsValue({
                                            t_ck_voucher: Math.round(tienck),
                                            tl_ck_voucher: ck_phantram
                                        });
                                    } else {
                                        form.setFieldsValue({
                                            t_ck_voucher: 0,
                                            tl_ck_voucher: 0
                                        });
                                    }
                                } else {
                                    form.setFieldsValue({
                                        t_ck_voucher: 0,
                                        tl_ck_voucher: 0
                                    });
                                }
                                updateTotals(chiTietData, chiPhiData);
                            }}
                            filterOption={false}
                            options={voucherSelectOptions}
                            allowClear
                            disabled={isFormDisabled || !watchMaKh}
                        />
                    </Form.Item>
                    <Form.Item name="t_ck_tt" label="CK tổng đơn">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} disabled={isFormDisabled} />
                    </Form.Item>
                    <Form.Item name="t_ck" label="Tiền chiết khấu">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} disabled={isFormDisabled} />
                    </Form.Item>
                    <Form.Item name="tien_cp" label="Chi phí">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} disabled={isFormDisabled} />
                    </Form.Item>
                </Col>

                {/* --- Cột bên phải: Tiền hàng, Thuế & Tổng cộng --- */}
                <Col xs={24} lg={12}>
                    <Form.Item name="t_tien2" label="Tiền hàng">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                    </Form.Item>
                    <Form.Item name="t_ck_voucher" label="CK voucher">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                    </Form.Item>
                    <Form.Item name="t_thue_nt" label="Tiền thuế">
                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                    </Form.Item>

                    <div className="total-grand-divider" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '8px' }}>
                        <Form.Item name="tong_cong" label="Tổng cộng" className="detail-don-hang__totals-grand">
                            <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                        </Form.Item>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default TotalsSection;
