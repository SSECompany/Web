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

function formatCurrency(num = 0, numDegit = 0) {
  try {
    const numValue = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(numValue)) return "0";

    return Number(numValue).toLocaleString("de-DE", {
      minimumFractionDigits: Number(numDegit) || 0,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("Error in formatCurrency:", error);
    return "0";
  }
}

function formatNumber(val) {
  if (!val || val === 0) return "0";
  if (typeof val !== "number" && typeof val !== "string") return "0";

  try {
    // Convert to number first
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0";

    // Format with thousand separators
    return num.toLocaleString("de-DE");
  } catch (error) {
    console.error("Error in formatNumber:", error);
    return "0";
  }
}

function parserNumber(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;

  try {
    // Clean the string and parse
    const cleanVal = String(val)
      .replace(/\$\s?|(\.*)/g, "")
      .replace(/(\,{1})/g, ".");
    const parsed = Number.parseFloat(cleanVal);

    if (isNaN(parsed)) return 0;
    return Number(parsed.toFixed(2));
  } catch (error) {
    console.error("Error in parserNumber:", error);
    return 0;
  }
}

export { formatCurrency, formatData, formatNumber, parserNumber };
