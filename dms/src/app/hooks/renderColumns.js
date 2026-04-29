import { Checkbox, Image } from "antd";
import dayjs from "dayjs";
import React from "react";
import { shallowEqual } from "react-redux";
import ImageListColumn from "../../components/ReuseComponents/ImageListColumn/ImageListColumn";
import { datetimeFormat } from "../Options/DataFomater";
import { formatCurrency } from "./dataFormatHelper";

const renderColumns = (columns = [], sorter) => {
  let layout = [];
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

  columns.map((item, index) => {
    return layout.push({
      title: item.name,
      dataIndex: item.field,
      editable: true,
      dataType: item.type,
      sorter: sorter
        ? {
            multiple: 1,
          }
        : false,
      align: getAlignment(item),
      shouldCellUpdate: (record, prevRecord) => {
        return !shallowEqual(record, prevRecord);
      },
      render: (data) => {
        if (item.type === "Datetime") {
          if (dayjs(data).isValid()) {
            return dayjs(data).format(datetimeFormat);
          }
          return "";
        }

        if (item.type === "Numeric") {
          return formatCurrency(data);
        }

        if (item.type === "Boolean") {
          return <Checkbox checked={data}></Checkbox>;
        }
        if (item.type === "Image") {
          return <Image src={data} alt={"SSE"} />;
        }
        if (item.type === "ImageList") {
          return <ImageListColumn keys={data} />;
        }
        return data;
      },
    });
  });
  return layout;
};

/**
 * @param columns - Mảng cấu trúc của table.
 * @param sorter - Sắp xếp hay không.
 */

export default renderColumns;
