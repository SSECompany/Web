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

const formatCurrency = (num = 0, numDegit = 0) => {
  return Number(num).toLocaleString("vi-VN", {
    minimumFractionDigits: Number(numDegit),
    maximumFractionDigits: 2,
  });
};

const formatNumber = (val) => {
  if (!val) return 0;
  return `${val}`
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    .replace(/\.(?=\d{0,2}$)/g, ",");
};

const parserNumber = (val) => {
  if (!val) return 0;
  return Number.parseFloat(
    val.replace(/\$\s?|(\.*)/g, "").replace(/(\,{1})/g, ".")
  ).toFixed(2);
};

export { formatCurrency, formatData, formatNumber, parserNumber };
