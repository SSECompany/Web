import * as xlsx from "xlsx";

function alphaToNum(alpha) {
  var i = 0,
    num = 0,
    len = alpha.length;

  for (; i < len; i++) {
    num = num * 26 + alpha.charCodeAt(i) - 0x40;
  }

  return num - 1;
}

function numToAlpha(num) {
  var alpha = "";

  for (; num >= 0; num = parseInt(num / 26, 10) - 1) {
    alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
  }

  return alpha;
}

function _buildColumnsArray(range) {
  var i,
    res = [],
    rangeNum = range.split(":").map(function (val) {
      return alphaToNum(val.replace(/[0-9]/g, ""));
    }),
    start = rangeNum[0],
    end = rangeNum[1] + 1;

  for (i = start; i < end; i++) {
    res.push(numToAlpha(i));
  }

  return res;
}

export const handleImportExcel = (file, setData) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = async (e) => {
    const data = e.target.result;
    const workbook = xlsx.read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const keys = Object.keys(sheet).filter((item) => item.substr(0, 1) !== "!");
    const header = _buildColumnsArray(`${keys[0]}:${keys[keys.length - 1]}`);

    const parsedData = await xlsx.utils.sheet_to_json(sheet, {
      header: header,
      defval: "",
    });
    setData(parsedData);
  };
};
