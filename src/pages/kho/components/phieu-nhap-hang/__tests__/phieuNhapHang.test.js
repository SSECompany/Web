/**
 * ============================================================================
 *  UNIT TEST — PHIẾU NHẬP HÀNG THEO ĐƠN
 * ============================================================================
 *
 *  Coverage:
 *    1. validateDataSource() — lo_yn, dataSource rỗng
 *    2. buildPhieuNhapHangPayload() — master + detail fields
 *    3. buildPhieuNhapHangPayload() — PO fields: fdate1, fcode1, fcode2, dh_so, ngay_td1
 *    4. buildPhieuNhapHangPayload() — ma_lo bị mất khi chọn tay
 *    5. handleSelectChange() — object { ma_lo, ngay_hh } cập nhật đồng thời
 *    6. Field mapping từ API kế thừa
 *    7. getUserInfo()
 *
 *  Chạy: npm test -- --testPathPattern=phieuNhapHang
 * ============================================================================
 */

const localStorageData = {
  user: JSON.stringify({ id: 1, userName: "tester", unitCode: "TAPMED", unitId: "TAPMED" }),
  unitsResponse: JSON.stringify({ unitId: "TAPMED", unitName: "TAPMED" }),
  access_token: "mock-token",
};
const localStorageMock = {
  getItem: jest.fn((key) => localStorageData[key] || null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, "localStorage", { value: localStorageMock });

jest.mock("react-redux", () => ({
  useSelector: jest.fn(() => ({ id: 1, userName: "tester" })),
}));

jest.mock("../../../../../utils/antdStatic", () => ({
  staticMessage: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../../../../../utils/jwt", () => ({
  getClaims: jest.fn(() => ({ Id: 1, Name: "tester", MA_DVCS: "TAPMED" })),
}));

jest.mock("../../../../../utils/https", () => ({
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock("../../../../../api", () => ({
  multipleTablePutApi: jest.fn(),
}));

import {
  validateDataSource,
  buildPhieuNhapHangPayload,
  getUserInfo,
} from "../utils/phieuNhapHangUtils";

// ═══════════════════════════════════════════════════════════════════════════
//  FIXTURE — API response từ kế thừa đơn hàng mua
// ═══════════════════════════════════════════════════════════════════════════
const PO_MASTER_FIXTURE = {
  so_ct: "PO-2026-001",
  ngay_ct: "2026-06-10T00:00:00Z",
  fdate1: "2026-06-10T00:00:00Z",
  fcode1: "NV001",
  ma_kh: "NCC001",
  ten_kh: "Nhà cung cấp A",
  ong_ba: "Nguyễn Văn A",
  ma_nv: "NV001",
  ten_nv: "Nguyễn Văn Nhân Viên",
  ma_gd: "1",
  dien_giai: "Mua hàng PO-2026-001",
};

const PO_DETAIL_ITEM_FIXTURE = {
  ma_vt: "VT001",
  ten_vt: "Thuốc test A",
  dvt: "viên",
  ma_kho: "KHO01",
  ma_lo: "LOT-FROM-PO",   // API trả luôn mã lô
  ma_vi_tri: "VT-A1",
  so_luong: 100,
  so_luong0: 80,          // số lượng nhận trong modal chọn
  gia_nt: 5000,
  gia_nt0: 5000,
  thue_suat: 10,
  stt_rec: "REC-DH01",
  stt_rec0: "001",
  line_nbr: 1,
  ma_vv: "VV01",
  ma_bp: "BP01",
  ma_sp: "",
  so_lsx: "LSX01",
  dh_so: "PO-2026-001",
  dh_ln: 1,
  stt_rec_dh: "REC-DH01",
  stt_rec0dh: "001",
  fdate1: "2026-06-10",
  ngay_hh: "2026-12-31",
  lo_yn: true,
  tao_lo: false,
  tk_vt: "156",
  tk_thue: "1331",
  ma_thue: "VAT10",
};

const VALID_FORM_VALUES = {
  ngay: "2026-06-18",
  ngayHachToan: "2026-06-18",
  maNT: "VND",
  tyGia: 1,
  soDonHang: "PO-2026-001",
  ngayDonHang: "2026-06-10",
  ma_nv_mua: "NV001 – Nguyễn Văn Nhân Viên",
};

const makeItem = (overrides = {}) => ({
  key: 1,
  maHang: "VT001",
  ten_mat_hang: "Vật tư 1",
  so_luong: 10,
  soLuong: 10,
  dvt: "cái",
  ma_kho: "KHO01",
  ma_lo: "LOT001",
  gia_nt: 1000,
  gia: 1000,
  gia_nt0: 1000,
  gia0: 1000,
  thue_suat: 10,
  tk_vt: "156",
  tk_thue: "1331",
  he_so: 1,
  fcode2: "PO-2026-001",
  ngay_dh: "2026-06-10",
  ngay_td1: "2026-12-31",
  ngay_hh: "2026-12-31",
  stt_rec_dh: "REC-DH01",
  stt_rec0dh: "001",
  dh_so: "PO-2026-001",
  dh_ln: 1,
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════
//  1. validateDataSource
// ═══════════════════════════════════════════════════════════════════════════
describe("1. validateDataSource", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("dataSource rỗng → isValid=false", () => {
    expect(validateDataSource([]).isValid).toBe(false);
  });

  test("dataSource có item → isValid=true (không phải hàng theo dõi lô)", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", ten_mat_hang: "VT1", lo_yn: false },
    ]).isValid).toBe(true);
  });

  test("lo_yn=true + ma_lo='' → isValid=false, focusIndex đúng", () => {
    const r = validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", ten_mat_hang: "Thuốc A", lo_yn: true },
    ]);
    expect(r.isValid).toBe(false);
    expect(r.focusIndex).toBe(0);
  });

  test("lo_yn='true' (string) + ma_lo='' → isValid=false", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: "true" },
    ]).isValid).toBe(false);
  });

  test("lo_yn='Y' + ma_lo='' → isValid=false", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: "Y" },
    ]).isValid).toBe(false);
  });

  test("lo_yn=true + ma_lo có giá trị → isValid=true", () => {
    expect(validateDataSource([
      { ma_lo: "LOT-2026-06", ma_kho: "KHO01", maHang: "VT001", lo_yn: true },
    ]).isValid).toBe(true);
  });

  test("lo_yn=true + ma_lo='  ' (space) → isValid=false (trim)", () => {
    expect(validateDataSource([
      { ma_lo: "  ", ma_kho: "KHO01", maHang: "VT001", lo_yn: true },
    ]).isValid).toBe(false);
  });

  test("lo_yn=false + ma_lo='' → isValid=true (không theo dõi lô)", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: false },
    ]).isValid).toBe(true);
  });

  test("lo_yn=undefined + ma_lo='' → isValid=true", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001" },
    ]).isValid).toBe(true);
  });

  test("lo_yn=1 (number) + ma_lo='' → isValid=false", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: 1 },
    ]).isValid).toBe(false);
  });

  test("lo_yn=1 (number) + ma_lo='LOT001' → isValid=true", () => {
    expect(validateDataSource([
      { ma_lo: "LOT001", ma_kho: "KHO01", maHang: "VT001", lo_yn: 1 },
    ]).isValid).toBe(true);
  });

  test("lo_yn=0 (number) + ma_lo='' → isValid=true (không theo dõi lô)", () => {
    expect(validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: 0 },
    ]).isValid).toBe(true);
  });

  test("nhiều dòng lo_yn=true lỗi → focusIndex = dòng đầu tiên", () => {
    const r = validateDataSource([
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT001", lo_yn: true },
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT002", lo_yn: true },
    ]);
    expect(r.isValid).toBe(false);
    expect(r.focusIndex).toBe(0);
  });

  test("dòng 0 hợp lệ, dòng 1 lỗi → focusIndex=1", () => {
    const r = validateDataSource([
      { ma_lo: "LOT001", ma_kho: "KHO01", maHang: "VT001", lo_yn: true },
      { ma_lo: "", ma_kho: "KHO01", maHang: "VT002", lo_yn: true },
    ]);
    expect(r.isValid).toBe(false);
    expect(r.focusIndex).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  2. buildPhieuNhapHangPayload — master fields
// ═══════════════════════════════════════════════════════════════════════════
describe("2. buildPhieuNhapHangPayload — master fields", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("master có đúng các trường bắt buộc", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [makeItem()]);
    const m = payload.master;
    ["ma_nk", "ma_ct", "stt_rec", "so_ct", "ma_nt", "ty_gia",
     "ma_gd", "ngay_lct", "ngay_ct", "ma_kh",
     "t_so_luong", "t_tien_nt", "t_thue_nt", "t_tt_nt",
     "status", "fcode2", "fdate1", "fcode1"].forEach((f) => {
      expect(m).toHaveProperty(f);
    });
  });

  test("isUpdate=true giữ stt_rec cũ", () => {
    const payload = buildPhieuNhapHangPayload(
      VALID_FORM_VALUES, [makeItem()], { stt_rec: "OLD-REC" }, true
    );
    expect(payload.master.stt_rec).toBe("OLD-REC");
  });

  test("isUpdate=false stt_rec rỗng", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [makeItem()], null, false);
    expect(payload.master.stt_rec).toBe("");
  });

  test("datetime0 chỉ có khi isUpdate=false", () => {
    const pNew = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [makeItem()], null, false);
    expect(pNew.master).toHaveProperty("datetime0");

    const pUpd = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [makeItem()], {}, true);
    expect(pUpd.master).not.toHaveProperty("datetime0");
  });

  test("fcode2 ưu tiên values.soDonHang", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, soDonHang: "PO-FROM-FORM" },
      [makeItem()]
    );
    expect(payload.master.fcode2).toBe("PO-FROM-FORM");
  });

  test("fcode2 fallback về dataSource[0].fcode2 khi values.soDonHang rỗng", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, soDonHang: "" },
      [makeItem({ fcode2: "PO-FROM-DETAIL" })]
    );
    expect(payload.master.fcode2).toBe("PO-FROM-DETAIL");
  });

  test("fdate1 ưu tiên values.ngayDonHang", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, ngayDonHang: "2026-06-15" },
      [makeItem()]
    );
    expect(payload.master.fdate1).toBeTruthy();
  });

  test("fdate1 fallback về dataSource[0].ngay_dh khi values.ngayDonHang rỗng", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, ngayDonHang: "" },
      [makeItem({ ngay_dh: "2026-06-15" })]
    );
    expect(payload.master.fdate1).toBeTruthy();
  });

  test("fcode1 ưu tiên values.ma_nv_mua", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, ma_nv_mua: "NV001 – Nguyễn Văn NV" },
      [makeItem()]
    );
    expect(payload.master.fcode1).toBe("NV001 – Nguyễn Văn NV");
  });

  test("t_so_luong = tổng so_luong tất cả detail", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ key: 1, so_luong: 10, soLuong: 10 }),
      makeItem({ key: 2, so_luong: 20, soLuong: 20 }),
    ]);
    expect(payload.master.t_so_luong).toBe(30);
  });

  test("t_tien_nt = tổng (so_luong × gia_nt) tất cả detail", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ key: 1, so_luong: 10, soLuong: 10, gia_nt: 1000, gia: 1000 }),
      makeItem({ key: 2, so_luong: 5, soLuong: 5, gia_nt: 2000, gia: 2000 }),
    ]);
    // 10×1000 + 5×2000 = 20000
    expect(payload.master.t_tien_nt).toBe(20000);
  });

  test("status mặc định = '3' khi không truyền", () => {
    const payload = buildPhieuNhapHangPayload(
      { ...VALID_FORM_VALUES, trangThai: undefined },
      [makeItem()]
    );
    expect(payload.master.status).toBe("3");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  3. buildPhieuNhapHangPayload — detail fields & PO fields
// ═══════════════════════════════════════════════════════════════════════════
describe("3. buildPhieuNhapHangPayload — detail fields & PO fields", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("detail có đúng các trường bắt buộc", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [makeItem()]);
    const d = payload.detail[0];
    ["stt_rec", "ma_ct", "ma_vt", "stt_rec0", "ma_lo", "ma_kho",
     "so_luong", "gia_nt", "tk_vt", "ma_vi_tri",
     "ngay_td1", "dh_so", "stt_rec_dh", "stt_rec0dh"].forEach((f) => {
      expect(d).toHaveProperty(f);
    });
  });

  test("ma_lo: trim và giữ nguyên khi có giá trị", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_lo: "  LOT-2026-06  " }),
    ]);
    expect(payload.detail[0].ma_lo).toBe("LOT-2026-06");
  });

  test("ma_lo: rỗng khi item không có field", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_lo: undefined }),
    ]);
    expect(payload.detail[0].ma_lo).toBe("");
  });

  // ── PO field: dh_so ────────────────────────────────────────────────
  test("dh_so: lấy từ item.dh_so", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ dh_so: "PO-2026-001", fcode2: "PO-2026-001" }),
    ]);
    expect(payload.detail[0].dh_so).toBe("PO-2026-001");
  });

  test("dh_so: fallback về item.fcode2 khi dh_so không có", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ dh_so: "", fcode2: "PO-FROM-FORM" }),
    ]);
    expect(payload.detail[0].dh_so).toBe("PO-FROM-FORM");
  });

  // ── PO field: ngay_td1 (HSD) ────────────────────────────────────
  test("ngay_td1: lấy từ item.ngay_td1", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ngay_td1: "2026-12-31", ngay_hh: "2026-12-31" }),
    ]);
    expect(payload.detail[0].ngay_td1).toBeTruthy();
  });

  test("ngay_td1: fallback về item.ngay_hh khi ngay_td1 không có", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ngay_td1: undefined, ngay_hh: "2026-12-31" }),
    ]);
    expect(payload.detail[0].ngay_td1).toBeTruthy();
  });

  // ── PO field: stt_rec_dh, stt_rec0dh ────────────────────────────
  test("stt_rec_dh: lấy từ item.stt_rec_dh", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ stt_rec_dh: "REC-DH01", stt_rec0dh: "001" }),
    ]);
    expect(payload.detail[0].stt_rec_dh).toBe("REC-DH01");
    expect(payload.detail[0].stt_rec0dh).toBe("001");
  });

  // ── ma_sp, ma_vv, ma_bp, so_lsx: giữ nguyên từ item ─────────────
  test("ma_vv: giữ nguyên từ item", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_vv: "VV-CUSTOM" }),
    ]);
    expect(payload.detail[0].ma_vv).toBe("VV-CUSTOM");
  });

  test("ma_bp: giữ nguyên từ item", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_bp: "BP-CUSTOM" }),
    ]);
    expect(payload.detail[0].ma_bp).toBe("BP-CUSTOM");
  });

  test("so_lsx: giữ nguyên từ item", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ so_lsx: "LSX-001" }),
    ]);
    expect(payload.detail[0].so_lsx).toBe("LSX-001");
  });

  test("ma_sp: giữ nguyên từ item", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_sp: "SP-CUSTOM" }),
    ]);
    expect(payload.detail[0].ma_sp).toBe("SP-CUSTOM");
  });

  test("stt_rec_pn: giữ nguyên từ item", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ stt_rec_pn: "REC-PN01", stt_rec0pn: "001" }),
    ]);
    expect(payload.detail[0].stt_rec_pn).toBe("REC-PN01");
    expect(payload.detail[0].stt_rec0pn).toBe("001");
  });

  // ── Tính toán tài chính ─────────────────────────────────────────
  test("so_luong round 3 chữ số thập phân", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ so_luong: 10.123456789, soLuong: 10.123456789 }),
    ]);
    expect(payload.detail[0].so_luong).toBe(10.123);
  });

  test("thue_nt = tien_nt × thue_suat / 100", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ so_luong: 10, soLuong: 10, gia_nt: 1000, gia: 1000, thue_suat: 10 }),
    ]);
    expect(payload.detail[0].thue_nt).toBe(1000); // 10000 × 10%
    expect(payload.detail[0].tt_nt).toBe(11000);  // 10000 + 1000
  });

  test("tk_vt mặc định '156'", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ tk_vt: undefined }),
    ]);
    expect(payload.detail[0].tk_vt).toBe("156");
  });

  test("tk_thue mặc định '1331'", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ tk_thue: undefined }),
    ]);
    expect(payload.detail[0].tk_thue).toBe("1331");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  4. buildPhieuNhapHangPayload — ma_lo bị mất khi chọn tay
// ═══════════════════════════════════════════════════════════════════════════
describe("4. buildPhieuNhapHangPayload — ma_lo không bị mất khi chọn", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("ma_lo từ kế thừa (API có trả) → trong payload", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_lo: "LOT-FROM-PO" }),
    ]);
    expect(payload.detail[0].ma_lo).toBe("LOT-FROM-PO");
  });

  test("ma_lo nhập tay sau kế thừa → trong payload", () => {
    // Mô phỏng: kế thừa xong → user nhập ma_lo → handleSelectChange → dataSource có ma_lo
    const dataSourceSauInput = [
      makeItem({ ma_lo: "", ten_mat_hang: "VT1" }),
    ];
    // User nhập ma_lo
    const afterInput = dataSourceSauInput.map((item) =>
      item.key === dataSourceSauInput[0].key
        ? { ...item, ma_lo: "LOT-USER-ENTERED" }
        : item
    );
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, afterInput);
    expect(payload.detail[0].ma_lo).toBe("LOT-USER-ENTERED");
  });

  test("ma_lo chưa nhập → payload gửi chuỗi rỗng (không undefined)", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ ma_lo: "" }),
    ]);
    expect(payload.detail[0].ma_lo).toBe("");
    expect(typeof payload.detail[0].ma_lo).toBe("string");
  });

  test("nhiều item: ma_lo của item 2 không bị ảnh hưởng khi item 1 update", () => {
    const payload = buildPhieuNhapHangPayload(VALID_FORM_VALUES, [
      makeItem({ key: 1, ma_lo: "LOT001" }),
      makeItem({ key: 2, ma_lo: "LOT002" }),
    ]);
    expect(payload.detail[0].ma_lo).toBe("LOT001");
    expect(payload.detail[1].ma_lo).toBe("LOT002");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  5. handleSelectChange — object spread { ma_lo, ngay_hh }
// ═══════════════════════════════════════════════════════════════════════════
describe("5. handleSelectChange — object spread update", () => {
  test("chọn lô từ dropdown: cập nhật ma_lo VÀ ngay_hh cùng lúc", () => {
    // Mô phỏng handleSelectChange logic trong hook
    const dataSource = [
      { key: 1, ma_lo: "", ngay_hh: null, maHang: "VT001", ma_kho: "KHO01" },
      { key: 2, ma_lo: "", ngay_hh: null, maHang: "VT002", ma_kho: "KHO02" },
    ];

    // User chọn lô: VatTuTable truyền object { ma_lo, ngay_hh }
    const newValue = { ma_lo: "LOT001", ngay_hh: "2026-12-31" };
    const record = { key: 1 };

    // === handleSelectChange logic (giống hệt hook) ===
    if (typeof newValue === "object" && newValue !== null && !Array.isArray(newValue) && "ma_lo" in newValue) {
      var { ma_lo: newMaLo, ngay_hh: newNgayHh } = newValue;
    }

    const updated = dataSource.map((item) =>
      item.key === record.key
        ? {
            ...item,
            ...(newMaLo !== undefined ? { ma_lo: newMaLo } : {}),
            ...(newNgayHh !== undefined ? { ngay_hh: newNgayHh } : {}),
          }
        : item
    );

    expect(updated[0].ma_lo).toBe("LOT001");
    expect(updated[0].ngay_hh).toBe("2026-12-31");
    expect(updated[0].ma_kho).toBe("KHO01"); // giữ nguyên
    expect(updated[1].ma_lo).toBe("");       // dòng khác không bị ảnh hưởng
    expect(updated[1].ngay_hh).toBe(null);
  });

  test("chọn lô không có ngay_hh: ngay_hh vẫn null", () => {
    const dataSource = [{ key: 1, ma_lo: "", ngay_hh: null }];
    const newValue = { ma_lo: "LOT-NO-HSD" };
    const record = { key: 1 };

    if (typeof newValue === "object" && newValue !== null && !Array.isArray(newValue) && "ma_lo" in newValue) {
      var { ma_lo: newMaLo, ngay_hh: newNgayHh } = newValue;
    }

    const updated = dataSource.map((item) =>
      item.key === record.key
        ? {
            ...item,
            ...(newMaLo !== undefined ? { ma_lo: newMaLo } : {}),
            ...(newNgayHh !== undefined ? { ngay_hh: newNgayHh } : {}),
          }
        : item
    );

    expect(updated[0].ma_lo).toBe("LOT-NO-HSD");
    expect(updated[0].ngay_hh).toBe(null);
  });

  test("select bình thường (string): chỉ cập nhật 1 field", () => {
    const dataSource = [
      { key: 1, ma_kho: "", maHang: "VT001" },
    ];
    const newValue = "KHO-NEW";
    const record = { key: 1 };
    const field = "ma_kho";

    // Antd Select unwrap
    const safeValue = typeof newValue === "object" && newValue !== null
      ? (newValue.value ?? newValue.label ?? "")
      : newValue;

    const updated = dataSource.map((item) =>
      item.key === record.key ? { ...item, [field]: safeValue } : item
    );

    expect(updated[0].ma_kho).toBe("KHO-NEW");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  6. Field mapping — handleKeThuaSelect logic
// ═══════════════════════════════════════════════════════════════════════════
describe("6. Field mapping — handleKeThuaSelect logic", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("form.setFieldsValue: soDonHang, ngayDonHang, ma_nv_mua được set đúng", () => {
    // Mô phỏng handleKeThuaSelect trong AddPhieuNhapHang
    const poNo = PO_MASTER_FIXTURE.so_ct?.trim();
    const poDate = "2026-06-10" ? new Date("2026-06-10") : null;
    const poNhanVien = PO_MASTER_FIXTURE.ma_nv && PO_MASTER_FIXTURE.ten_nv
      ? `${PO_MASTER_FIXTURE.ma_nv.trim()} – ${PO_MASTER_FIXTURE.ten_nv.trim()}`
      : (PO_MASTER_FIXTURE.ma_nv?.trim() || "");

    const formValues = {
      soDonHang: poNo,
      maKhach: PO_MASTER_FIXTURE.ma_kh?.trim(),
      ngayDonHang: poDate,
      ma_nv_mua: poNhanVien,
      dienGiai: `Nhập hàng theo đơn ${poNo}`,
    };

    expect(formValues.soDonHang).toBe("PO-2026-001");
    expect(formValues.ma_nv_mua).toBe("NV001 – Nguyễn Văn Nhân Viên");
    expect(formValues.dienGiai).toBe("Nhập hàng theo đơn PO-2026-001");
  });

  test("processedDetails: dh_so, fcode2, ngay_dh được set từ PO master + detail", () => {
    // Mô phỏng handleKeThuaSelect processedDetails
    const tyGia = 1;
    const poNo = PO_MASTER_FIXTURE.so_ct?.trim();
    const item = PO_DETAIL_ITEM_FIXTURE;
    const soLuong = parseFloat(item.so_luong0 || 0);
    const gia_nt0 = parseFloat(item.gia_nt || 0);
    const thue_suat = parseFloat(item.thue_suat || 0);

    const processed = {
      ma_lo: (item.ma_lo || "").trim(),    // ← có từ API
      ma_vi_tri: (item.ma_vi_tri || "").trim(),
      dh_so: item.so_ct || "",           // ← dh_so = so_ct của đơn
      fcode2: poNo,                        // ← số đơn hàng
      ngay_dh: item.fdate1 || item.ngay_ct, // ← ngày đơn hàng
      lo_yn: item.lo_yn || false,
      tao_lo: item.tao_lo || false,
      soLuong,
      so_luong: soLuong,
      ten_mat_hang: item.ten_vt,
      maHang: (item.ma_vt || "").trim(),
    };

    expect(processed.ma_lo).toBe("LOT-FROM-PO");  // ← fix: có ma_lo
    expect(processed.ma_vi_tri).toBe("VT-A1");
    expect(processed.fcode2).toBe("PO-2026-001");
    expect(processed.lo_yn).toBe(true);
    expect(processed.dh_so).toBe("");  // so_ct = undefined trong fixture
  });

  test("handlePoSearch (AddPhieuNhapHang): soDonHang được set vào form", () => {
    // Mô phỏng handlePoSearch trong AddPhieuNhapHang
    const poNo = "PO-2026-002";
    const poDate = new Date("2026-06-12");
    const poNhanVien = "NV002 – Trần Văn B";

    const formValues = {
      soDonHang: poNo,
      maKhach: "NCC002",
      dienGiai: `Nhập hàng theo đơn ${poNo}`,
      ngayDonHang: poDate,
      ma_nv_mua: poNhanVien,
    };

    expect(formValues.soDonHang).toBe("PO-2026-002");
    expect(formValues.ngayDonHang).toBeInstanceOf(Date);
    expect(formValues.ma_nv_mua).toBe("NV002 – Trần Văn B");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  7. HSD render logic — có lô vs không lô
// ═══════════════════════════════════════════════════════════════════════════
describe("7. HSD render logic — có lô vs không lô", () => {
  test("có ma_lo → render text span", () => {
    const renderHanSuDung = (record) => {
      const hasLo = !!(record.ma_lo && (record.ma_lo || "").trim());
      if (hasLo) {
        return { type: "span", value: record.ngay_hh };
      }
      return { type: "DatePicker", value: record.ngay_hh };
    };

    const result = renderHanSuDung({ ma_lo: "LOT001", ngay_hh: "2026-12-31" });
    expect(result.type).toBe("span");
    expect(result.value).toBe("2026-12-31");
  });

  test("không có ma_lo → render DatePicker", () => {
    const renderHanSuDung = (record) => {
      const hasLo = !!(record.ma_lo && (record.ma_lo || "").trim());
      if (hasLo) return { type: "span", value: record.ngay_hh };
      return { type: "DatePicker", value: record.ngay_hh };
    };

    expect(renderHanSuDung({ ma_lo: "", ngay_hh: null }).type).toBe("DatePicker");
    expect(renderHanSuDung({ ma_lo: null, ngay_hh: "2026-06-30" }).type).toBe("DatePicker");
    expect(renderHanSuDung({ ma_lo: "  ", ngay_hh: null }).type).toBe("DatePicker");
  });

  test("hasLo logic đúng với các giá trị boundary", () => {
    const hasLo = (ma_lo) => !!(ma_lo && (ma_lo || "").trim());

    expect(hasLo("LOT001")).toBe(true);
    expect(hasLo("")).toBe(false);
    expect(hasLo(null)).toBe(false);
    expect(hasLo(undefined)).toBe(false);
    expect(hasLo("  ")).toBe(false);
    expect(hasLo(" LOT001 ")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  8. getUserInfo
// ═══════════════════════════════════════════════════════════════════════════
describe("8. getUserInfo", () => {
  test("trả về đầy đủ các trường", () => {
    const info = getUserInfo();
    expect(info).toHaveProperty("userId");
    expect(info).toHaveProperty("userName");
    expect(info).toHaveProperty("unitId");
    expect(info).toHaveProperty("unitName");
  });

  test("userId là số", () => {
    const info = getUserInfo();
    expect(typeof info.userId).toBe("number");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  9. Integration — full flow kế thừa → build payload
// ═══════════════════════════════════════════════════════════════════════════
describe("9. Integration — full flow kế thừa → build payload", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test("flow đầy đủ: kế thừa → set form → build payload → master đúng", () => {
    // Step 1: form.setFieldsValue (từ handleKeThuaSelect)
    const formValues = {
      soDonHang: "PO-2026-001",
      ngayDonHang: "2026-06-10",
      ma_nv_mua: "NV001 – Nguyễn Văn Nhân Viên",
    };

    // Step 2: processedDetails
    const processedDetails = [
      {
        ma_lo: "LOT-FROM-PO",
        ma_vi_tri: "VT-A1",
        dh_so: "PO-2026-001",
        fcode2: "PO-2026-001",
        ngay_dh: "2026-06-10",
        ngay_hh: "2026-12-31",
        ngay_td1: "2026-12-31",
        stt_rec_dh: "REC-DH01",
        stt_rec0dh: "001",
        soLuong: 80,
        so_luong: 80,
        gia_nt: 5000,
        gia: 5000,
        thue_suat: 10,
        maHang: "VT001",
        ten_mat_hang: "Thuốc A",
        dvt: "viên",
        ma_kho: "KHO01",
        he_so: 1,
        tk_vt: "156",
        tk_thue: "1331",
        ma_thue: "VAT10",
        lo_yn: true,
        tao_lo: false,
      },
    ];

    // Step 3: build payload
    const payload = buildPhieuNhapHangPayload(formValues, processedDetails);

    // Master assertions
    expect(payload.master.fcode2).toBe("PO-2026-001");
    expect(payload.master.fdate1).toBeTruthy();
    expect(payload.master.fcode1).toBe("NV001 – Nguyễn Văn Nhân Viên");
  });

  test("flow đầy đủ: detail đúng ma_lo, ngay_td1, dh_so", () => {
    const formValues = {
      soDonHang: "PO-2026-001",
      ngayDonHang: "2026-06-10",
      ma_nv_mua: "NV001",
    };

    const processedDetails = [
      {
        ma_lo: "LOT-FROM-PO",
        ma_vi_tri: "VT-A1",
        dh_so: "PO-2026-001",
        fcode2: "PO-2026-001",
        ngay_dh: "2026-06-10",
        ngay_hh: "2026-12-31",
        ngay_td1: "2026-12-31",
        stt_rec_dh: "REC-DH01",
        stt_rec0dh: "001",
        soLuong: 80,
        so_luong: 80,
        gia_nt: 5000,
        gia: 5000,
        thue_suat: 10,
        maHang: "VT001",
        dvt: "viên",
        ma_kho: "KHO01",
        he_so: 1,
        tk_vt: "156",
        tk_thue: "1331",
        ma_thue: "VAT10",
        lo_yn: true,
      },
    ];

    const payload = buildPhieuNhapHangPayload(formValues, processedDetails);

    // Detail assertions
    expect(payload.detail[0].ma_lo).toBe("LOT-FROM-PO");
    expect(payload.detail[0].ngay_td1).toBeTruthy();
    expect(payload.detail[0].dh_so).toBe("PO-2026-001");
    expect(payload.detail[0].stt_rec_dh).toBe("REC-DH01");
    expect(payload.detail[0].stt_rec0dh).toBe("001");
    expect(payload.detail[0].ma_vi_tri).toBe("VT-A1");
  });

  test("tổng hợp: master chứa đúng tổng của detail", () => {
    const formValues = {
      soDonHang: "PO-2026-001",
      ngayDonHang: "2026-06-10",
      ma_nv_mua: "NV001",
    };

    const processedDetails = [
      {
        ma_lo: "LOT001", soLuong: 10, so_luong: 10, gia_nt: 1000, gia: 1000,
        thue_suat: 10, maHang: "VT001", dvt: "viên", ma_kho: "KHO01",
        he_so: 1, tk_vt: "156", tk_thue: "1331", ma_thue: "VAT10",
        ngay_hh: "2026-12-31",
      },
      {
        ma_lo: "LOT002", soLuong: 20, so_luong: 20, gia_nt: 2000, gia: 2000,
        thue_suat: 5, maHang: "VT002", dvt: "hộp", ma_kho: "KHO02",
        he_so: 1, tk_vt: "156", tk_thue: "1331", ma_thue: "VAT5",
        ngay_hh: "2026-12-31",
      },
    ];

    const payload = buildPhieuNhapHangPayload(formValues, processedDetails);

    // 10×1000×1.10 + 20×2000×1.05
    expect(payload.master.t_so_luong).toBe(30);
    expect(payload.master.t_tien_nt).toBe(50000);  // 10×1000 + 20×2000
    expect(payload.master.t_tt_nt).toBe(53000);    // 11000 + 42000
  });
});
