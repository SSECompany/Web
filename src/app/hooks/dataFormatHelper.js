import dayjs from "dayjs";

const format = (data, type) => {
  var formatedData;
  switch (type) {
    case "Datetime":
      formatedData = dayjs(data);
      break;
    case "Numeric":
      formatedData = parseFloat(data);
      break;
    default:
      formatedData = data ? data?.trim() : "";
      break;
  }
  return formatedData;
};

const formatData = (data, layout) => {
  const formatedData = {};
  layout.map((item) => {
    return (formatedData[item?.field] = format(
      data[`${item?.field}`],
      item?.type
    ));
  });
  return formatedData;
};

const deleteObjectItems = (data: {}, options: []) => {
  const rawData = { ...data };
  options.map((item) => {
    return delete rawData[item];
  });
  return rawData;
};

const formatCurrency = (num = 0, numDegit = 0) => {
  return Number(num).toLocaleString("de-DE", {
    minimumFractionDigits: Number(numDegit),
    maximumFractionDigits: 2,
  });
};

export { formatData, deleteObjectItems, formatCurrency };
