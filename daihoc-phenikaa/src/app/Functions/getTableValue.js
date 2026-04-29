const getAllValueByColumn = (getColumn, allColumns) => {
  const allKeys = Object.keys(allColumns);
  const allValues = allKeys
    .filter((item) => {
      const prefixItem = item.substring(item.indexOf("_") + 1, item.length);
      if (prefixItem == getColumn) {
        return allColumns[item];
      }
    })
    .map((item) => allColumns[item]);
  return allValues;
};

const getAllValueByRow = (rowKey, allColumns) => {
  const allKeys = Object.keys(allColumns);
  var allValues = {};

  allKeys
    .filter((item) => {
      const prefixItem = item.substring(0, item.indexOf("_"));
      if (prefixItem == rowKey) {
        return item;
      }
    })
    .map(
      (item) =>
        (allValues = {
          ...allValues,
          [item.substring(item.indexOf("_") + 1, item.length)]:
            allColumns[item],
        })
    );

  return allValues;
};

const getAllRowKeys = (allColumns) => {
  const allKeys = Object.keys(allColumns).map((item) => {
    return item.substring(0, item.indexOf("_"));
  });

  return _.union(allKeys);
};

const getRowKey = (key = "") => {
  return key.substring(0, key.indexOf("_"));
};

const getCellName = (key = "") => {
  return key.substring(key.indexOf("_") + 1, key.length);
};

export {
  getAllValueByColumn,
  getAllValueByRow,
  getAllRowKeys,
  getRowKey,
  getCellName,
};
