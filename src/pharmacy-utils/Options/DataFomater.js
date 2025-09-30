import {
    doReadNumber,
    InvalidNumberError,
    ReadingConfig,
    ReadVietnameseNumberError,
} from "read-vietnamese-number";

const quantityFormat = "0.01";
const quantityFormatNonDecimal = "1";
const datetimeFormat = "DD/MM/YYYY";
const datetimeFormat2 = "DD-MM-YYYY";
const PriceFormat = "0.01";

const config = new ReadingConfig();
config.unit = [""];

function num2words(num) {
  try {
    var result = doReadNumber(config, num.toString());
    var first = result.charAt(0);
    first = first.toUpperCase();
    result = result.slice(1);
    result = first + result;
    return result;
  } catch (err) {
    // Handle errors
    if (err instanceof ReadVietnameseNumberError) {
      return "Định dạng input không hợp lệ";
    } else if (err instanceof InvalidNumberError) {
      return "Số không hợp lệ";
    } else {
      return "Lỗi đọc số";
    }
  }
}

export {
    datetimeFormat,
    datetimeFormat2,
    num2words,
    PriceFormat,
    quantityFormat,
    quantityFormatNonDecimal
};

