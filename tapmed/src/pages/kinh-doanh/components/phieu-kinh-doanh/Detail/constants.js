export const numFmt = (val, precision = 0) => {
    if (val === undefined || val === null || val === "") return "";
    
    let dec;
    if (typeof precision === 'number') {
        dec = precision;
    } else if (typeof precision === 'boolean') {
        dec = precision ? 0 : 2;
    } else {
        // Fallback for cases where precision might be an object (e.g. AntD InputNumber info)
        dec = 0;
    }
    
    // Safety check for Intl.NumberFormat RangeError (0-20)
    if (dec < 0) dec = 0;
    if (dec > 20) dec = 20;

    let value = parseFloat(val);
    if (isNaN(value)) return "";

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: dec
    }).format(value);
};

export const ALL_STATUSES = [
    { status: "0", statusname: "Lập ctừ" },
    { status: "1", statusname: "Chờ duyệt" },
    { status: "2", statusname: "Duyệt" },
    { status: "3", statusname: "Treo" },
    { status: "4", statusname: "Đang xuất" },
    { status: "5", statusname: "Hoàn thành" },
    { status: "6", statusname: "Đóng" },
    { status: "9", statusname: "Hủy" },
];

export const DISPLAY_DATE_FORMAT = "DD-MM-YYYY";
export const DATE_FORMATS = ["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY", "YYYY-MM-DD", "DDMMYY", "D/M/YY", "D/M/YYYY"];
