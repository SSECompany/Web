// VietQR (NAPAS/EMVCo) payload builder with CRC16-CCITT

const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);

const tlv = (id, value) => {
  if (value === undefined || value === null) return "";
  const str = String(value);
  return `${pad2(Number(id))}${pad2(str.length)}${str}`;
};

const crc16ccitt = (str) => {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

/**
 * Build VietQR payload
 * @param {Object} params
 * @param {string} params.bankBin - NAPAS BIN of bank (e.g. '970436' for Vietcombank)
 * @param {string} params.accountNumber - Account number
 * @param {string} params.accountName - Account holder name (merchant name)
 * @param {number} params.amount - Amount in VND
 * @param {string} params.content - Transfer content (bill number)
 * @param {string} [params.countryCode='VN']
 * @param {string} [params.currency='704'] - 704 for VND
 * @returns {string}
 */
export const buildVietQR = ({
  bankBin,
  accountNumber,
  accountName,
  amount,
  content,
  countryCode = "VN",
  currency = "704",
}) => {
  // 00: Payload Format Indicator = 01
  const id00 = tlv(0, "01");
  // 01: Point of Initiation Method = 12 (dynamic)
  const id01 = tlv(1, "12");

  // 38: Merchant Account Information - Domestic
  // 00: GUID (A000000727), 01: Service Code (QRIBFTTA), 02: Bank BIN, 03: Account No, 04: Account Name (optional)
  const mai =
    tlv(0, "A000000727") +
    tlv(1, "QRIBFTTA") +
    tlv(2, bankBin) +
    tlv(3, accountNumber) +
    (accountName ? tlv(4, accountName) : "");
  const id38 = tlv(38, mai);

  // 52: Merchant Category Code (0000 = default)
  const id52 = tlv(52, "0000");
  // 53: Transaction Currency (704 = VND)
  const id53 = tlv(53, currency);
  // 54: Transaction Amount (optional but we include for fixed amount)
  const id54 = amount && amount > 0 ? tlv(54, String(amount)) : "";
  // 58: Country Code
  const id58 = tlv(58, countryCode);
  // 59: Merchant Name (optional)
  const id59 = accountName ? tlv(59, accountName) : "";
  // 62: Additional Data Field Template → 07: Bill Number = content
  const addl = content ? tlv(7, content) : "";
  const id62 = addl ? tlv(62, addl) : "";

  // Assemble without CRC
  const payloadNoCRC =
    id00 + id01 + id38 + id52 + id53 + id54 + id58 + id59 + id62 + "6304";
  const crc = crc16ccitt(payloadNoCRC);
  return payloadNoCRC + crc;
};

export default buildVietQR;



