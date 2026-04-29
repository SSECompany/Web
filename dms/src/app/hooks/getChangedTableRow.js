const getChangedTableRow = (key, rows, rawData) => {
  const newData = [...rawData];
  const rowsKeys = Object?.keys(rows);

  var row = {};
  rowsKeys.map((item) => {
    if (item.includes(`${key}_`)) {
      row[item.replace(`${key}_`, "")] = rows[item];
    }
  });

  const index = newData.findIndex((item) => key === item.key.toString());
  if (index > -1) {
    const item = newData[index];
    return {
      ...item,
      ...row,
    };
  }
};

export default getChangedTableRow;
