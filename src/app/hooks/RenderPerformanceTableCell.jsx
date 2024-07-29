import { DatePicker, Form, Input, InputNumber, Select } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { ApiWebLookup } from "../../components/DMS/API";
import SelectItemCode from "../../Context/SelectItemCode";
import SelectNotFound from "../../Context/SelectNotFound";
import { datetimeFormat, quantityFormat } from "../Options/DataFomater";
import { formatterNumber, parserNumber } from "../regex/regex";

const RenderPerformanceTableCell = ({
  rowKey,
  column,
  cellData,
  rowData,
  numberCap,
}) => {
  const { type, editable, title, key, required, width, controller, format } =
    column;

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

  const handleSelectionChange = useDebouncedCallback((value) => {
    lookupData({ controller: controller, value: value });
  }, 600);

  const fetchItemUnitData = (ma_vt = "") => {
    lookupData({ controller: "dmqddvt_lookup", value: ma_vt });
  };

  useEffect(() => {
    if (type === "dvt") {
      fetchItemUnitData(rowData?.ma_vt || "");
    }

    return () => {};
  }, []);

  let node;
  switch (type) {
    case "Numeric":
      node = (
        <InputNumber
          placeholder="0"
          controls={false}
          min="0"
          max={numberCap || Number.MAX_SAFE_INTEGER}
          className="w-full"
          step={format || quantityFormat}
          formatter={(value) => formatterNumber(value)}
          parser={(value) => parserNumber(value)}
        />
      );
      break;
    case "Text":
      node = <Input className="default_input_detail w-full" />;
      break;
    case "Datetime":
      node = <DatePicker format={datetimeFormat} />;
      break;
    case "AutoComplete":
      node = (
        <Select
          className="w-full"
          popupMatchSelectWidth={false}
          showSearch
          placeholder={`${title} trống`}
          defaultActiveFirstOption={false}
          suffixIcon={false}
          notFoundContent={SelectNotFound(selectLoading, selectOptions)}
          filterOption={false}
          onSearch={(e) => {
            handleSelectionChange(e);
          }}
          onClick={() => {
            if (_.isEmpty(selectOptions))
              lookupData({ controller: controller, value: "" });
          }}
          optionLabelProp="value"
          // onSelect={onChangeSelection}
        >
          {SelectItemCode(selectOptions)}
        </Select>
      );

      break;

    case "dvt":
      node = (
        <Select
          className="w-full"
          popupMatchSelectWidth={false}
          placeholder={`${title} trống`}
          defaultActiveFirstOption={false}
          suffixIcon={false}
          notFoundContent={SelectNotFound(selectLoading, selectOptions)}
          filterOption={false}
          optionLabelProp="value"
          // onSelect={onChangeSelection}
        >
          {SelectItemCode(selectOptions)}
        </Select>
      );
      break;

    default:
      node = <Input className="default_input_detail w-full" />;
      break;
  }
  return (
    <>
      {editable ? (
        <Form.Item
          initialValue={cellData || null}
          name={`${rowKey}_${key}`}
          style={{
            width: "100%",
            margin: 0,
          }}
          rules={[
            {
              required: required,
              message: `${title} trống !`,
            },
          ]}
        >
          {node}
        </Form.Item>
      ) : (
        <Form.Item
          initialValue={cellData || null}
          name={`${rowKey}_${key}`}
          style={{
            width: "100%",
            margin: 0,
          }}
          rules={[
            {
              required: required,
              message: `${title} trống !`,
            },
          ]}
        >
          {type === "TextArea" ? (
            <Input.TextArea
              autoSize={{
                minRows: 1,
                maxRows: 2,
              }}
              style={{ resize: "none", transition: "none" }}
              variant={"borderless"}
              className="p-0 Performance_table_span"
              disabled={!editable}
            />
          ) : (
            <Input
              variant={"borderless"}
              className="BaseTable__row-cell-text p-0 Performance_table_span"
              disabled={!editable}
            />
          )}
        </Form.Item>
      )}
    </>
  );
};

export default memo(RenderPerformanceTableCell);
