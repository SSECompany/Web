const getEditRowsValue = (record) => {
  const objectKeys = Object.keys(record);
  const inputRecord = {};
  objectKeys.map((item) => {
    inputRecord[`${record.key}_${item}`] = record[item];
  });
  return inputRecord;
};

export default getEditRowsValue;
