import { Form, Select } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import SelectItemCode from "../../Context/SelectItemCode";
import SelectNotFound from "../../Context/SelectNotFound";
import { ApiWebLookup } from "../DMS/API";

const FormSelect = ({
  disable,
  form,
  label,
  keyCode,
  placeHolderCode,
  controller,
  width,
  codeWidth,
  required,
  onChange,
  direction,
  multiple,
  defaultOptions,
}) => {
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  // const keyData = Form.useWatch(keyCode, form);

  const lookupData = async (item) => {
    await ApiWebLookup({
      userId: "1",
      controller: item.controller,
      pageIndex: 1,
      FilterValueCode: item.value.trim(),
    }).then((res) => {
      const resOptions = res.data.map((item) => {
        return {
          value: item.code.trim(),
          label: item.name.trim(),
        };
      });
      setSelectLoading(false);
      setSelectOptions([...resOptions]);
    });
  };

  const handleSelectionChange = useDebouncedCallback((actions, value) => {
    setSelectLoading(true);
    setSelectOptions([]);
    lookupData({ controller: actions, value: value });
  }, 600);

  const handleClick = (actions, value) => {
    setSelectLoading(true);
    setSelectOptions([]);
    lookupData({ controller: actions, value: value });
  };

  useEffect(() => {
    if (!_.isEmpty(defaultOptions) && _.first(defaultOptions)?.value) {
      setSelectOptions(defaultOptions);
    }
    return () => {};
  }, [defaultOptions]);

  return (
    <div
      className="split__view__detail__primary__item"
      style={{
        flexDirection: `${
          direction?.toUpperCase() == "COLUMN" ? "column" : "row"
        }`,
        alignItems: `${
          direction?.toUpperCase() == "COLUMN" ? "flex-start" : "center"
        }`,
        flex: `${codeWidth ? "none" : 1}`,
      }}
    >
      <div style={{ width: `${width ? width + "px" : "auto"}`, flexShrink: 0 }}>
        <span className="default_bold_label">{label}</span>
      </div>

      <Form.Item
        className="min-w-0"
        style={{
          width: `${codeWidth ? String(codeWidth) + "px" : "100%"}`,
          flex: `${codeWidth ? "none" : 1}`,
        }}
        name={keyCode}
        rules={[
          {
            required: required ? true : false,
            message: `Điền ${label}`,
          },
        ]}
      >
        <Select
          popupMatchSelectWidth={false}
          mode={multiple ? "multiple" : ""}
          disabled={disable}
          className={disable ? "default_disable_select" : "default_select"}
          showSearch
          placeholder={placeHolderCode}
          defaultActiveFirstOption={false}
          suffixIcon={false}
          filterOption={false}
          optionLabelProp="label"
          notFoundContent={SelectNotFound(selectLoading, selectOptions)}
          onSearch={(e) => {
            handleSelectionChange(controller, e);
          }}
          onClick={(e) => {
            if (_.isEmpty(selectOptions)) {
              handleClick(controller, "");
            }
          }}
          allowClear
          onSelect={(key, item) => {
            if (onChange) {
              onChange(key, item);
            }
          }}
        >
          {SelectItemCode(selectOptions)}
        </Select>
      </Form.Item>
    </div>
  );
};

export default memo(FormSelect);
