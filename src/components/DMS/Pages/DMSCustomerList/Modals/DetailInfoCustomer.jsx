import { Form, Input, Select } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { formStatus } from "../../../../../utils/constants";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";
import { fetchCustomerGeographi } from "../../../Store/Sagas/Sagas";
import { getcurrentDMSCustomer } from "../../../Store/Selector/Selectors";

const DetailInfoCustomer = ({ form, action }) => {
  const currentCustomer = useSelector(getcurrentDMSCustomer);
  const [selectLoading, setSelectLoading] = useState(false);
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [communeOptions, setCommuneOptions] = useState([]);

  const [params, setParams] = useState({
    Province: form.getFieldValue("city") || null,
    District: form.getFieldValue("district") || null,
  });

  const lookupData = async (payload) => {
    setSelectLoading(true);
    const data = await fetchCustomerGeographi({ ...payload });
    if (!payload.Province) {
      setProvinceOptions(data);
    }
    if (payload.Province && !payload.District) {
      setDistrictOptions(data);
    }

    if (payload.Province && payload.District) {
      setCommuneOptions(data);
    }

    setSelectLoading(false);
  };

  const handleSelectionChange = useDebouncedCallback((actions, value) => {
    lookupData(params);
  }, 600);

  useEffect(() => {
    lookupData({ Province: "", District: "" });
    lookupData({ Province: currentCustomer?.nh_kh2, District: "" });
    setParams({
      Province: currentCustomer?.nh_kh2 || null,
      District: currentCustomer?.nh_kh3 || null,
    });
    return () => {};
  }, [currentCustomer]);

  return (
    <div className="split__view__detail__group">
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Khu vực"
        keyCode="area"
        keyName="areaName"
        controller="dmkhuvuc_lookup"
        form={form}
        placeHolderCode="Khu vực"
        placeHolderName="Tên khu vực"
      />

      <div className="default_modal_group_items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Tỉnh thành
          </span>
          <Form.Item
            name="city"
            rules={[{ required: true, message: "Điền tỉnh thành" }]}
            style={{
              width: 150,
              flex: "none",
            }}
          >
            <Select
              disabled={action == formStatus.VIEW ? true : false}
              showSearch
              popupMatchSelectWidth={false}
              placeholder={`Tỉnh thành`}
              style={{
                width: "100%",
                flex: "none",
              }}
              defaultActiveFirstOption={false}
              filterOption={false}
              notFoundContent={SelectNotFound(selectLoading, provinceOptions)}
              onSearch={(e) => {
                handleSelectionChange("province", e);
              }}
              onClick={() => {
                if (_.isEmpty(provinceOptions)) lookupData(params);
              }}
              onSelect={(key, item) => {
                form.setFieldValue("cityName", item.label);
                form.setFieldValue("district", null);
                form.setFieldValue("districtName", null);
                form.setFieldValue("commune", null);
                form.setFieldValue("communeName", null);
                setParams({ ...params, Province: item.value, District: null });
                setDistrictOptions([]);
              }}
              options={provinceOptions}
            />
          </Form.Item>
          <Form.Item name={"cityName"} className="flex-1">
            <Input
              disabled={true}
              className="default_disable_input"
              placeholder={"Tên tỉnh thành"}
            />
          </Form.Item>
        </div>
      </div>

      <div className="default_modal_group_items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Quận huyện
          </span>
          <Form.Item
            name="district"
            rules={[{ required: true, message: "Điền quận huyện" }]}
            style={{
              width: 150,
              flex: "none",
            }}
          >
            <Select
              disabled={
                action == formStatus.VIEW || !params.Province ? true : false
              }
              showSearch
              popupMatchSelectWidth={false}
              placeholder={`Quận huyện`}
              style={{
                width: "100%",
                flex: "none",
              }}
              defaultActiveFirstOption={false}
              filterOption={false}
              notFoundContent={SelectNotFound(selectLoading, districtOptions)}
              onSearch={(e) => {
                handleSelectionChange("province", e);
              }}
              onClick={() => {
                if (_.isEmpty(districtOptions)) lookupData(params);
              }}
              onSelect={(key, item) => {
                form.setFieldValue("districtName", item.label);
                form.setFieldValue("commune", null);
                form.setFieldValue("communeName", null);
                setParams({ ...params, District: item.value });
                setCommuneOptions([]);
              }}
              options={districtOptions}
            />
          </Form.Item>
          <Form.Item name={"districtName"} className="flex-1">
            <Input
              disabled={true}
              className="default_disable_input"
              placeholder={"Tên quận huyện"}
            />
          </Form.Item>
        </div>
      </div>

      <div className="default_modal_group_items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Xã phường
          </span>
          <Form.Item
            name="commune"
            rules={[{ required: true, message: "Điền xã phường" }]}
            style={{
              width: 150,
              flex: "none",
            }}
          >
            <Select
              disabled={
                action == formStatus.VIEW || !params.District ? true : false
              }
              showSearch
              popupMatchSelectWidth={false}
              placeholder={`Xã phường`}
              style={{
                width: "100%",
                flex: "none",
              }}
              defaultActiveFirstOption={false}
              filterOption={false}
              notFoundContent={SelectNotFound(selectLoading, communeOptions)}
              onSearch={(e) => {
                handleSelectionChange("commune", e);
              }}
              onClick={() => {
                if (_.isEmpty(communeOptions)) lookupData(params);
              }}
              onSelect={(key, item) => {
                form.setFieldValue("communeName", item.label);
              }}
              options={communeOptions}
            />
          </Form.Item>
          <Form.Item name={"communeName"} className="flex-1">
            <Input
              disabled={true}
              className="default_disable_input"
              placeholder={"Tên quận huyện"}
            />
          </Form.Item>
        </div>
      </div>

      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Xã/phường"
        keyCode="commune"
        keyName="communeName"
        controller="dmphuong_lookup"
        form={form}
        placeHolderCode="Xã/phường"
        placeHolderName="Tên xã/phường"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Nguồn"
        keyCode="resource"
        keyName="resourceName"
        controller="dmnguonkh_lookup"
        form={form}
        placeHolderCode="Nguồn"
        placeHolderName="Tên nguồn"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Đơn vị"
        keyCode="unit"
        keyName="unitName"
        controller="dmdvcs_lookup"
        form={form}
        placeHolderCode="Đơn vị"
        placeHolderName="Tên đơn vị"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Phân loại"
        keyCode="classify"
        keyName="classifyName"
        controller="dmphanloai_lookup"
        form={form}
        placeHolderCode="Phân loại"
        placeHolderName="Tên phân loại"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Hình thức"
        keyCode="forms"
        keyName="formsName"
        controller="dmhinhthuc_lookup"
        form={form}
        placeHolderCode="Hình thức"
        placeHolderName="Tên hình thức"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Tuyến"
        keyCode="tour"
        keyName="tourName"
        controller="dmtuyen_lookup"
        form={form}
        placeHolderCode="Tuyến"
        placeHolderName="Tên tuyến"
      />
      <FormSelectDetail
        disable={action == formStatus.VIEW ? true : false}
        label="Nhân viên"
        keyCode="employee"
        keyName="employeeName"
        controller="dmnvbh_lookup"
        form={form}
        placeHolderCode="Nhân viên"
        placeHolderName="Tên nhân viên"
      />
    </div>
  );
};

export default memo(DetailInfoCustomer);
