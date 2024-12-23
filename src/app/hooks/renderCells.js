import { DatePicker, Form, Input, InputNumber, Select } from "antd";
import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { ApiWebLookup } from "../../components/DMS/API";
import SelectItemCode from "../../Context/SelectItemCode";
import SelectNotFound from "../../Context/SelectNotFound";
import { datetimeFormat, quantityFormat } from "../Options/DataFomater";

const RenderCells = (cell, form, addRow) => {
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  const lookupData = async (item) => {
    await setSelectLoading(true);
    ApiWebLookup({
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
    lookupData({ controller: actions, value: value });
  }, 600);

  const onChangeSelection = (key, item) => {
    if (cell.reference) {
      form.setFieldValue(
        `${cell.record.key}_${cell.reference}`,
        item.label.trim()
      );
    }
  };
  const handleKeypress = (event) => {
    if (event.key === "Enter") {
      const allFields = { ...form.getFieldsValue(true) };
      const keyItems = Object.keys(allFields).filter(
        (item) => !item.includes("_key")
      );
      const keyIndex =
        keyItems.findIndex((item) => item == event.target.id) + 1;
      if (keyItems[keyIndex])
        document.getElementById(keyItems[keyIndex]).focus();
      else addRow();
    }
  };

  let inputNode;
  switch (cell.inputType) {
    case "Numeric":
      inputNode = (
        <InputNumber
          controls={false}
          min="0"
          onKeyDown={handleKeypress}
          step={quantityFormat}
        />
      );
      break;
    case "Text":
      inputNode = (
        <Input onKeyDown={handleKeypress} className="default_input_detail" />
      );
      break;
    case "Datetime":
      inputNode = (
        <DatePicker onKeyDown={handleKeypress} format={datetimeFormat} />
      );
      break;
    case "AutoComplete":
      inputNode = (
        <Select
          popupMatchSelectWidth={false}
          showSearch
          placeholder={`Vui lòng nhập ${cell.title}`}
          style={{
            width: 200,
          }}
          onKeyDown={handleKeypress}
          defaultActiveFirstOption={false}
          suffixIcon={false}
          notFoundContent={SelectNotFound(selectLoading, selectOptions)}
          filterOption={false}
          onSearch={(e) => {
            handleSelectionChange(cell.controller, e);
          }}
          optionLabelProp="value"
          onSelect={onChangeSelection}
        >
          {SelectItemCode(selectOptions)}
        </Select>
      );

      break;

    default:
      inputNode = <Input className="default_input_detail" />;
      break;
  }
  return (
    <td>
      {cell.editing ? (
        <Form.Item
          name={`${cell.record.key}_${cell.dataIndex}`}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Please Input ${cell.title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        cell.children
      )}
    </td>
  );
};

export default RenderCells;
