import { Checkbox, Form } from "antd";
import React, { memo } from "react";
import { formStatus } from "../../../../../utils/constants";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";

const MainInfo = ({ form, action }) => {
  return (
    <div className="split__view__detail__group">
      <div className="default_modal_group_items">
        <div className="default_modal_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Nhiều đơn vị tính
          </span>
          <Form.Item
            name="nhieu_dvt"
            initialValue={false}
            valuePropName="checked"
          >
            <Checkbox
              disabled={action == formStatus.VIEW ? true : false}
            ></Checkbox>
          </Form.Item>
        </div>
        <div className="default_modal_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Theo dõi tồn
          </span>
          <Form.Item
            name="vt_ton_kho"
            initialValue={false}
            valuePropName="checked"
          >
            <Checkbox
              disabled={action == formStatus.VIEW ? true : false}
            ></Checkbox>
          </Form.Item>
        </div>
        <div className="default_modal_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Theo dõi lô
          </span>
          <Form.Item name="lo_yn" initialValue={false} valuePropName="checked">
            <Checkbox
              disabled={action == formStatus.VIEW ? true : false}
            ></Checkbox>
          </Form.Item>
        </div>
      </div>
      <div className="default_modal_group_items">
        <FormSelectDetail
          disable={action == formStatus.VIEW ? true : false}
          label="Loại vật tư"
          keyCode="loai_vt"
          keyName="ten_loai_vt"
          controller="dmloaivt_lookup"
          form={form}
          placeHolderCode="Loại vật tư"
          placeHolderName="Tên loại"
          required={true}
        />
      </div>

      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Kho"
        keyCode="ma_kho"
        keyName="ten_kho"
        controller="dmkho_lookup"
        form={form}
        placeHolderCode="Mã kho"
        placeHolderName="Tên kho"
        required={true}
      />

      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Vị trí"
        keyCode="ma_vi_tri"
        keyName="ten_vi_tri"
        controller="dmvitri_lookup"
        form={form}
        placeHolderCode="Vị trí"
        placeHolderName="Tên vị trí"
        required={true}
      />

      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Nhóm 1"
        keyCode="nh_vt1"
        keyName="ten_nh_vt1"
        controller="dmnhvt_lookup1"
        form={form}
        placeHolderCode="Nhóm vật tư 1"
        placeHolderName="Tên nhóm vật tư 1"
        required={true}
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Nhóm 2"
        keyCode="nh_vt2"
        keyName="ten_nh_vt2"
        controller="dmnhvt_lookup2"
        form={form}
        placeHolderCode="Nhóm vật tư 2"
        placeHolderName="Tên nhóm vật tư 2"
        required={true}
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Nhóm 3"
        keyCode="nh_vt3"
        keyName="ten_nh_vt3"
        controller="dmnhvt_lookup3"
        form={form}
        placeHolderCode="Nhóm vật tư 3"
        placeHolderName="Tên nhóm vật tư 3"
        required={true}
      />
    </div>
  );
};

export default memo(MainInfo);
