import {
  doReadNumber,
  InvalidNumberError,
  ReadVietnameseNumberError,
  ReadingConfig,
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
    var result = doReadNumber(num.toString(), config);
    var first = result.charAt(0);
    first = first.toUpperCase();
    result = result.slice(1);
    result = first + result;
    return result;
  } catch (err) {
    // Handle errors (read-vietnamese-number chỉ export InvalidNumberError & ReadVietnameseNumberError)
    if (err instanceof InvalidNumberError) {
      return "Số không hợp lệ";
    }
    if (err instanceof ReadVietnameseNumberError) {
      return "Không thể đọc số";
    }
    return "Không thể đọc số";
  }
}

export {
  quantityFormat,
  quantityFormatNonDecimal,
  datetimeFormat2,
  datetimeFormat,
  PriceFormat,
  num2words,
};
