import dayjs from "dayjs";
import { shallowEqual } from "react-redux";
import { datetimeFormat } from "../Options/DataFomater";

const renderEditColumns = (columns, editingKey) => {
  const isEditing = (record) => editingKey.includes(record.key);
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
        editing: isEditing(record),
        controller: item?.controller,
        reference: item?.reference,
        shouldCellUpdate: (record, prevRecord) => {
          return !shallowEqual(record, prevRecord);
        },
        render: (data) => {
          if (item.type === "Datetime") {
            return dayjs(data).format(datetimeFormat);
          }
          return data;
        },
      }),
    };
  });
  return mergedColumns;
};

export default renderEditColumns;
