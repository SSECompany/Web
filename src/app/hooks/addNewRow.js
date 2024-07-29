import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const addNewRow = (columns) => {
  var newRow = {};
  columns.map((item) => {
    switch (item.type) {
      case "Text":
        newRow[item.dataIndex] = "";
        break;
      case "Numeric":
        newRow[item.dataIndex] = 0;
        break;
      case "Boolean":
        newRow[item.dataIndex] = false;
        break;
      case "Datetime":
        newRow[item.dataIndex] = dayjs();
        break;
      default:
        newRow[item.dataIndex] = "";
        break;
    }
  });
  newRow.key = uuidv4();
  return newRow;
};

const cloneRows = (columns, rows) => {
  return rows.map((row) => {
    row.key = uuidv4();
    return row;
  });
};

export { cloneRows };

export default addNewRow;
