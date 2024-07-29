import acceptPerson from "../Icons/accept__person.svg";
import addVoucher from "../Icons/add__voucher.svg";
import cart from "../Icons/cart.svg";
import location from "../Icons/location.svg";

export const APP_CONFIG = {
  debug: true,
  apiUrl: process.env.REACT_APP_ROOT_API,
};

export const formStatus = {
  ADD: "ADD",
  EDIT: "EDIT",
  VIEW: "VIEW",
  SAVED: "SAVED",
  DELETE: "DELETE",
};

export const FILE_EXTENSION = {
  EXCEL: "EXCEL",
  PDF: "PDF",
  CSV: "CSV",
  OTHER: "OTHER",
};
export const STATISTICS_LIMIT = 4;
export const STATISTICS_MIN = 4;
export const STATISTICS_ICONS = {
  SO: {
    title: "Đơn hàng bán",
    icon: addVoucher,
  },
  OL: {
    title: "nghỉ phép",
    icon: acceptPerson,
  },
  PO: {
    title: "Đơn hàng mua",
    icon: cart,
  },
  DT: {
    title: "Điểm bán",
    icon: location,
  },
  BT: {
    title: "Test",
    icon: location,
  },
};
export const SIMPLECHARTS_LIMIT = 4;
export const SIMPLECHARTS_MIN = 1;
export const SIMPLECHARTS = {
  SO: {
    title: "Đơn hàng bán",
    type: "bar",
    store: "",
    unit: "triệu",
  },
  FS: {
    title: "Doanh thu",
    type: "bar",
    unit: "triệu",
  },
  NB: {
    title: "Khách hàng mới",
    type: "bar",
    store: "",
    unit: "",
  },
  MC: {
    title: "Độ phủ",
    type: "circle",
    store: "",
    unit: "%",
  },
  TEST: {
    title: "test",
    type: "circle",
    store: "",
    unit: "%",
  },
};

export const CHARTCOLORS = [
  "#8BC1F7",
  "#519DE9",
  "#06C",
  "#7CC674",
  "#4CB140",
  "#3ba272",
  "#009596",
  "#B2B0EA",
  "#8481DD",
  "#F6D173",
  "#F0AB00",
  "#C9190B",
];

export const systemOptions = [
  {
    key: "system",
    label: "Thiết lập hệ thống",
    data: "/System",
    icon: "pi pi-cog",
  },
  {
    key: "2",
    label: "Màn hình hệ thống",
    data: "Dashboard screen",
    icon: "pi pi-wrench",
    children: [
      {
        key: "2-0",
        label: "Dashboard",
        icon: "pi pi-user-plus",
        data: "DashboardOptions",
      },
      {
        key: "2-1",
        label: "Báo cáo nhanh",
        icon: "pi pi-user-plus",
        data: "RpDashboardOptions",
      },
    ],
  },
];

const systemOptionsDEMO = [
  {
    key: "system",
    label: "Thiết lập hệ thống",
    data: "/System",
    icon: "pi pi-cog",
  },

  {
    key: "0",
    label: "Phân quyền",
    data: "Phân quyền",
    icon: "pi pi-unlock",
    children: [
      {
        key: "0-0-0",
        label: "Phân quyền truy cập",
        icon: "pi pi-user",
        data: "UsersPermissions",
      },
      {
        key: "0-0-1",
        label: "Phần quyền nhóm truy cập",
        icon: "pi pi-users",
        data: "GroupPermissions",
      },
      {
        key: "0-0-2",
        label: "Phần quyền đơn vị cơ sở",
        icon: "pi pi-sitemap",
        data: "UnitPermissions",
      },
    ],
  },
  {
    key: "1",
    label: "Tài khoản",
    data: "Events Folder",
    icon: "pi pi-id-card",
    children: [
      {
        key: "1-0",
        label: "Tạo tài khoản",
        icon: "pi pi-user-plus",
        data: "Accounts",
      },
    ],
  },

  {
    key: "2",
    label: "Màn hình hệ thống",
    data: "Dashboard screen",
    icon: "pi pi-wrench",
    children: [
      {
        key: "2-0",
        label: "Dashboard",
        icon: "pi pi-user-plus",
        data: "DashboardOptions",
      },
      {
        key: "2-1",
        label: "Báo cáo nhanh",
        icon: "pi pi-user-plus",
        data: "RpDashboardOptions",
      },
    ],
  },
  // {
  //   key: "2",
  //   label: "Chứng từ",
  //   data: "Movies Folder",
  //   icon: "pi pi-ticket",
  //   children: [
  //     {
  //       key: "2-0",
  //       icon: "pi pi-check-circle",
  //       label: "Duyệt chứng từ",
  //       data: "VoucherApprove",
  //     },
  //     {
  //       key: "2-1",
  //       label: "Robert De Niro",
  //       icon: "pi pi-fw pi-star-fill",
  //       data: "De Niro Movies",
  //       children: [
  //         {
  //           key: "2-1-0",
  //           label: "Goodfellas",
  //           icon: "pi pi-fw pi-video",
  //           data: "Goodfellas Movie",
  //         },
  //         {
  //           key: "2-1-1",
  //           label: "Untouchables",
  //           icon: "pi pi-fw pi-video",
  //           data: "Untouchables Movie",
  //         },
  //       ],
  //     },
  //   ],
  // },
];

const systemOptionsGoldFruit = [
  {
    key: "system",
    label: "Thiết lập hệ thống",
    data: "/System",
    icon: "pi pi-cog",
  },
  {
    key: "2",
    label: "Màn hình hệ thống",
    data: "Dashboard screen",
    icon: "pi pi-wrench",
    children: [
      {
        key: "2-0",
        label: "Dashboard",
        icon: "pi pi-user-plus",
        data: "DashboardOptions",
      },
      {
        key: "2-1",
        label: "Báo cáo nhanh",
        icon: "pi pi-user-plus",
        data: "RpDashboardOptions",
      },
    ],
  },
];
