/**
 * Test cases cho QuantityValidationUtils (common)
 * Chạy: npm test -- --testPathPattern=QuantityValidationUtils
 */

jest.mock(
  "../../../../components/common/Modal/ModalConfirm",
  () => jest.fn(() => Promise.resolve())
);

const {
  validateQuantityDifference,
  validateQuantityForPhieu,
} = require("./QuantityValidationUtils");

describe("validateQuantityDifference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("luôn trả về hasDifference=false (theo yêu cầu user)", () => {
    const result = validateQuantityDifference(
      [{ so_luong: 100, soLuongDeNghi: 50 }],
      "phieu_nhap_kho",
      "2"
    );
    expect(result.hasDifference).toBe(false);
  });

  test("trả về hasDifference=false với mảng rỗng", () => {
    const result = validateQuantityDifference([], "phieu_xuat_kho", "1");
    expect(result.hasDifference).toBe(false);
  });

  test("trả về object có property hasDifference", () => {
    const result = validateQuantityDifference([], "phieu_nhap_dieu_chuyen", "3");
    expect(result).toHaveProperty("hasDifference");
    expect(typeof result.hasDifference).toBe("boolean");
  });
});

describe("validateQuantityForPhieu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("trả về hasDifference=false khi không có lệch", () => {
    const result = validateQuantityForPhieu([], "phieu_nhap_kho", "2");
    expect(result.hasDifference).toBe(false);
  });

  test("hoạt động với status khác nhau", () => {
    const result1 = validateQuantityForPhieu([], "phieu_nhap_kho", "0");
    const result2 = validateQuantityForPhieu([], "phieu_nhap_kho", "3");
    expect(result1.hasDifference).toBe(false);
    expect(result2.hasDifference).toBe(false);
  });

  test("hoạt động với mảng rỗng", () => {
    const result = validateQuantityForPhieu([], "phieu_nhap_kho", "2");
    expect(result.hasDifference).toBe(false);
  });
});
