import { Checkbox } from "antd";
import dayjs from "dayjs";
import { shallowEqual } from "react-redux";
import { formStatus } from "../../utils/constants";
import { datetimeFormat } from "../Options/DataFomater";

const renderEditColumnsV2 = (columns, action) => {
  const getAlignment = (item) => {
    if (item.type === "Datetime") {
      return "Center";
    }
    if (item.type === "Numeric") {
      return "Right";
    }
    if (item.type === "Boolean") {
      return "Center";
    }
    if (item.type === "Operation") {
      return "Center";
    }
    return "Left";
  };

  let mergedColumns = [];
  mergedColumns = columns.map((item, index) => {
    if (!item.editable) {
      return item;
    }
    return {
      ...item,
      onCell: (record) => ({
        record,
        index,
        inputType: item.type,
        dataIndex: item.dataIndex,
        title: item.title,
        editing:
          action == formStatus.VIEW || action == formStatus.SAVED
            ? false
            : true,
        controller: item?.controller,
        reference: item?.reference,
        required: item?.required,
        align: getAlignment(item),
        shouldCellUpdate: (record, prevRecord) => {
          return !shallowEqual(record, prevRecord);
        },
        render: (data) => {
          if (item.type === "Datetime") {
            if (dayjs(data).isValid()) {
              return dayjs(data).format(datetimeFormat);
            }
            return "Không có dữ liệu";
          }
          if (item.type === "Boolean") {
            return <Checkbox checked={data}></Checkbox>;
          }
          return data;
        },
      }),
    };
  });
  return mergedColumns;
};

export default renderEditColumnsV2;
