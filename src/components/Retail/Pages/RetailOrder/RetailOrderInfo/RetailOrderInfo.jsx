import { FileImageOutlined } from "@ant-design/icons";
import { uuidv4 } from "@antv/xflow-core";
import {
  Avatar,
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message as messageAPI,
  Segmented,
  Select,
  Tooltip,
} from "antd";
import _ from "lodash";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Column } from "react-base-table";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import {
  getAllRowKeys,
  getAllValueByColumn,
  getAllValueByRow,
  getCellName,
  getRowKey,
} from "../../../../../app/Functions/getTableValue";
import { formatCurrency } from "../../../../../app/hooks/dataFormatHelper";
import RenderPerformanceTableCell from "../../../../../app/hooks/RenderPerformanceTableCell";
import { quantityFormat } from "../../../../../app/Options/DataFomater";
import { phoneNumberRegex } from "../../../../../app/regex/regex";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { setIsHideNav } from "../../../../../store/reducers/claimsSlice";
import {
  getIsHideNav,
  getUserInfo,
} from "../../../../../store/selectors/Selectors";
import { CHARTCOLORS } from "../../../../../utils/constants";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import PerformanceTable from "../../../../ReuseComponents/PerformanceTable/PerformanceTable";
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import RetailOrderListModal from "../../../Modals/RetailOrderListModal/RetailOrderListModal";
import RetailPromotionModal from "../../../Modals/RetailPromotionModal/RetailPromotionModal";
import {
  fetchRetailOderPromotion,
  modifyIsOpenPromotion,
  setCurrentRetailOrder,
  setRetailOrderList,
  setRetailOrderScanning,
} from "../../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../../Store/Selectors/RetailOrderSelectors";
import RetailPaidInfo from "../RetailPaidInfo/RetailPaidInfo";

const columns = [
  {
    key: "image",
    title: "Ảnh",
    dataKey: "image",
    width: 60,
    align: Column.Alignment.CENTER,
    resizable: false,

    cellRenderer: ({ cellData, rowData }) =>
      cellData ? (
        <Image
          className="border-circle"
          title=""
          style={{ height: 40 }}
          src={cellData}
          alt="SSE"
        ></Image>
      ) : (
        <Avatar style={{ background: rowData.ck_yn ? "red" : "#341b4d" }}>
          {rowData.ck_yn ? (
            <i className="pi pi-gift" style={{ fontSize: 40 }}></i>
          ) : (
            <FileImageOutlined
              style={{
                fontSize: "40px",
              }}
            />
          )}
        </Avatar>
      ),
  },

  {
    key: "ten_vt",
    title: "Tên vật tư",
    dataKey: "ten_vt",
    className: "flex-1",
    headerClassName: "flex-1",
    width: 100,
    resizable: false,
    sortable: false,
    type: "TextArea",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "barcode",
    title: "Barcode",
    dataKey: "barcode",
    width: 0,
    resizable: false,
    sortable: false,
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "ma_vt",
    title: "Mã vật tư",
    dataKey: "ma_vt",
    width: 0,
    resizable: false,
    sortable: false,
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "ma_kho",
    title: "Kho",
    dataKey: "ma_kho",
    width: 120,
    resizable: false,
    sortable: false,
    editable: true,
    controller: "dmkho_lookup",
    type: "AutoComplete",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "dvt",
    title: "Đơn vị",
    dataKey: "dvt",
    width: 70,
    resizable: false,
    sortable: false,
    editable: true,
    type: "dvt",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowData={rowData}
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "so_luong",
    title: "Số lượng",
    dataKey: "so_luong",
    width: 100,
    resizable: false,
    sortable: false,
    editable: true,
    type: "Numeric",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "don_gia",
    title: "Đơn giá",
    dataKey: "don_gia",
    width: 110,
    resizable: false,
    sortable: false,
    editable: true,
    type: "Numeric",
    format: "0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "thanh_tien",
    title: "Thành tiền",
    dataKey: "thanh_tien",
    width: 120,
    resizable: false,
    sortable: false,
    editable: true,
    format: "0",
    type: "Numeric",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "ck_yn",
    title: "Chiết khấu",
    dataKey: "ck_yn",
    width: 0,
    resizable: false,
    sortable: false,
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "ma_ck",
    title: "Mã chiết khấu",
    dataKey: "ma_ck",
    width: 0,
    resizable: false,
    sortable: false,
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "tl_ck",
    title: "Tỷ lệ chiết khấu",
    dataKey: "tl_ck",
    width: 0,
    resizable: false,
    sortable: false,
    editable: false,
    format: "0",
    type: "Numeric",
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },

  {
    key: "ck",
    title: "Tiền chiết khấu",
    dataKey: "ck",
    width: 0,
    resizable: false,
    sortable: false,
    editable: false,
    format: "0",
    type: "Numeric",
    className: "p-0",
    headerClassName: "p-0",
    cellRenderer: ({ rowData, column, cellData }) => {
      return (
        <RenderPerformanceTableCell
          rowKey={rowData?.id}
          column={column}
          cellData={cellData}
        />
      );
    },
  },
];

const RetailOrderInfo = ({ orderKey }) => {
  const { listOrder, currentOrder, isScanning, isFormLoading } =
    useSelector(getRetailOrderState);

  const [message, contextHolder] = messageAPI.useMessage();
  const [itemForm] = Form.useForm();

  const [totalPromotionType, setTotalPromotionType] = useState("RATIO");

  const [data, setData] = useState([]);
  const [selectedRowkeys, setSelectedRowkeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setsearchOptions] = useState([]);
  const [searchColapse, setSearchColapse] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOptionsFiltered, setsearchOptionsFiltered] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({
    ma_kh: "KVL",
    ten_kh: "Vãng lai",
    dien_thoai: null,
    diem: 0,
    ma_nt: "VND",
    ty_gia: 1,
    quy_doi_diem: 1,
    tong_tien: 0,
    thue_suat: 0,
    tong_thue: 0,
    tong_sl: 0,
    ck: 0,
    ma_ck: "",
    tl_ck: 0,
    tong_ck: 0,
    voucher: "",
    tien_voucher: 0,
    tong_tt: 0,
    tien_mat: 0,
    tien_the: 0,
    chuyen_khoan: 0,
  });
  const [taxOptions, setTaxOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [autoCalPromotion, setAutoCalPromotion] = useState(false);
  const [isMergeRowData, setIsMergeRowData] = useState(false);

  const [isOpenOrderList, setIsOpenOrderList] = useState(false);

  const [isCalPromotion, setIsCalPromotion] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isChangedData, setIsChangedData] = useState(false);

  const searchInputRef = useRef(null);

  const { id: userId, storeId, unitId } = useSelector(getUserInfo);
  const dispatch = useDispatch();

  const isHideNav = useSelector(getIsHideNav);

  /////// Orde List functions //////////////

  const handleOrderListModal = useCallback(() => {
    setIsOpenOrderList(!isOpenOrderList);
  }, [isOpenOrderList]);

  const handleHideNavbar = () => {
    dispatch(setIsHideNav(!isHideNav));
  };

  /////// Calculations functions////////////

  //Tính chiết khấu
  const handlePromotionCalculate = useCallback(
    async (CKVT = [], CKTH = [], CKTD = [], currentData) => {
      var ckvtObject = {};

      CKVT.map(async (ck) => {
        ckvtObject[`${ck.rowKey}_ma_ck`] = ck?.ma_ck;
        ckvtObject[`${ck.rowKey}_tl_ck`] = ck.tl_ck;
        ckvtObject[`${ck.rowKey}_ck`] = ck.ck;
      });

      itemForm.setFieldsValue({
        ...ckvtObject,
      });

      const ckthRows = CKTH.map((ck) => {
        return {
          id: uuidv4(),
          ma_vt: ck.ma_vt,
          ten_vt: ck.ten_vt,
          ma_kho: ck.ma_kho,
          image: "",
          dvt: ck.dvt,
          so_luong: ck.so_luong,
          don_gia: "0",
          thanh_tien: "0",
          ck_yn: true,
          ma_ck: ck.ma_ck,
        };
      });

      if (!_.isEmpty(ckthRows))
        setData([...(currentData || data), ...ckthRows]);

      const cktdValues = _.first(CKTD);

      setPaymentInfo({
        ...paymentInfo,
        ma_ck: cktdValues?.ma_ck || "",
        ck: cktdValues?.ck || 0,
        tl_ck: cktdValues?.tl_ck || 0,
      });

      handleCalculatorPayment();
    },
    [JSON.stringify(paymentInfo), JSON.stringify(data)]
  );

  const handleResetPromotion = async () => {
    const changedValues = { ...itemForm.getFieldsValue() };
    const allKeys = getAllRowKeys(changedValues);

    var promotions = {};

    allKeys.map(async (key) => {
      promotions[`${key}_ma_ck`] = "";
      promotions[`${key}_tl_ck`] = 0;
      promotions[`${key}_ck`] = 0;
    });

    const rawData = data.filter((item) => !item.ck_yn);

    setData([...rawData]);

    await itemForm.setFieldsValue({
      ...promotions,
    });

    setPaymentInfo({
      ...paymentInfo,
      ma_ck: "",
      ck: 0,
      tl_ck: 0,
    });

    setTotalPromotionType("RATIO");

    handleCalculatorPayment();
  };

  //Tính thanh toán
  const handleCalculatorPayment = async () => {
    const changedValues = { ...itemForm.getFieldsValue() };

    const allData = getAllRowKeys(changedValues).map((item) => {
      return getAllValueByRow(item, changedValues);
    });

    const tong_sl = await getAllValueByColumn("so_luong", changedValues).reduce(
      (Sum, num) => Sum + num,
      0
    );

    const tong_tien = await parseFloat(
      allData.reduce((Sum, item) => {
        return (
          Sum + parseFloat(item.so_luong || 0) * parseFloat(item.don_gia || 0)
        );
      }, 0)
    );

    const tong_ckvt = await parseFloat(
      allData.reduce((Sum, item) => {
        return Sum + parseFloat(item.ck || 0);
      }, 0)
    );

    const ck_tong_don =
      paymentInfo.ma_ck || !paymentInfo.tl_ck
        ? paymentInfo.ck
        : (tong_tien * paymentInfo.tl_ck) / 100;

    const tong_ck = parseFloat(tong_ckvt + ck_tong_don);

    const tong_thue = parseFloat((tong_tien * paymentInfo.thue_suat) / 100);

    const tong_tt = parseFloat(tong_tien + tong_thue - tong_ck);

    const calculated = {
      ...paymentInfo,
      tong_sl,
      tong_tien,
      tong_tt,
      tong_ck,
      tong_thue,
    };
    setPaymentInfo(calculated);
  };

  useEffect(() => {
    handleCalculatorPayment();
    setIsChangedData(uuidv4());
  }, [JSON.stringify(data), JSON.stringify(paymentInfo)]);

  const recalPromotion = useDebouncedCallback(async () => {
    setIsCalculating(true);
    message.open({
      type: "loading",
      content: "Đang xử lý chương trình chiết khấu",
      duration: 0,
    });

    //Reset
    const changedValues = { ...itemForm.getFieldsValue() };
    const allKeys = getAllRowKeys(changedValues);
    const rawData = [...data].filter((row) => !row?.ck_yn);
    var promotions = {};

    allKeys.map(async (key) => {
      promotions[`${key}_ma_ck`] = "";
      promotions[`${key}_tl_ck`] = 0;
      promotions[`${key}_ck`] = 0;
    });

    setPaymentInfo({
      ...paymentInfo,
      ma_ck: "",
      ck: 0,
      tl_ck: 0,
    });

    await itemForm.setFieldsValue({
      ...promotions,
    });
    //Recal
    const Tinhtrang = await fetchRetailOderPromotion(
      changedValues,
      paymentInfo.ma_kh
    ).then((result) => {
      //Chiết khấu chi tiết vật tư
      var ckvtObject = {};

      result?.ckvt?.map(async (ck) => {
        ckvtObject[`${ck.rowKey}_ma_ck`] = ck?.ma_ck;
        ckvtObject[`${ck.rowKey}_tl_ck`] = ck.tl_ck;
        ckvtObject[`${ck.rowKey}_ck`] = ck.ck;
      });

      itemForm.setFieldsValue({
        ...ckvtObject,
      });

      const ckthRows = result?.ckth?.map((ck) => {
        return {
          id: uuidv4(),
          ma_vt: ck.ma_vt,
          ten_vt: ck.ten_vt,
          ma_kho: ck.ma_kho,
          image: "",
          dvt: ck.dvt,
          so_luong: ck.so_luong,
          don_gia: "0",
          thanh_tien: "0",
          ck_yn: true,
          ma_ck: ck.ma_ck,
        };
      });

      setData([...rawData, ...ckthRows]);

      const cktdValues = _.first(result.cktd);

      setPaymentInfo({
        ...paymentInfo,
        ma_ck: cktdValues?.ma_ck || "",
        ck: cktdValues?.ck || 0,
        tl_ck: cktdValues?.tl_ck || 0,
      });

      if (_.isEmpty(ckthRows) && _.isEmpty(cktdValues))
        handleCalculatorPayment();
      message.destroy();
      return !_.isEmpty(ckthRows);
    });

    setIsCalculating(false);
    setIsCalPromotion(Tinhtrang);
  }, 1300);

  useEffect(() => {
    if (!isCalPromotion && !_.isEmpty(data) && autoCalPromotion) {
      recalPromotion();
      return;
    }
    setIsCalPromotion(false);
  }, [JSON.stringify(data), JSON.stringify(paymentInfo.ma_kh)]);

  ///////////orther functions /////

  //reset Form
  const handleResetForm = useCallback(() => {
    setData([]);
    setPaymentInfo({ ...paymentInfo });
  }, []);

  // Xử lý khi thu gọn tìm kiếm
  const handleCollapseOptions = (key) => {
    const currentCollaps = [...searchColapse];
    if (currentCollaps.includes(key)) {
      currentCollaps.splice(
        currentCollaps.findIndex((item) => item === key),
        1
      );
      setSearchColapse([...currentCollaps]);
    } else setSearchColapse([...currentCollaps, key]);
  };

  // Lấy data khách hàng mà vật tư
  const fetchItemsNCustomers = ({ searchValue }) => {
    setsearchOptions([]);
    multipleTablePutApi({
      store: "Api_search_items_N_customers",
      param: {
        searchValue: filterKeyHelper(searchValue),
        unitId,
        storeId,
        userId,
      },
      data: {},
    }).then(async (res) => {
      if (res.responseModel?.isSucceded) {
        const results = [
          {
            key: "VT",
            label: <span>Vật tư</span>,
            title: "Vật tư",
            options: [..._.first(res.listObject)],
          },
          {
            key: "KH",
            label: <span>Khách hàng</span>,
            title: "Khách hàng",
            options: [..._.last(res.listObject)],
          },
        ];

        setSearchLoading(false);
        setsearchOptions([...results]);
      }
    });
  };

  // Lấy các setting cho phiếu
  const fetchRetailOptions = () => {
    multipleTablePutApi({
      store: "Api_get_retail_options",
      param: {
        userId,
      },
      data: {},
    }).then((res) => {
      if (res.responseModel?.isSucceded) {
        setCurrencyOptions(res?.listObject[0] || []);
        setTaxOptions(res?.listObject[1] || []);
        setPaymentInfo({
          ...paymentInfo,
          quy_doi_diem: parseInt(_.first(res?.listObject[2])?.val) || 0,
        });
        setAutoCalPromotion(
          _.first(res?.listObject[3])?.val === "1" ? true : false
        );

        setIsMergeRowData(
          _.first(res?.listObject[4])?.val === "1" ? true : false
        );
      }
    });
  };

  // Lấy thông tin vật tư
  const handleFetchItemInfo = async ({ barcode, ma_vt, stock }) => {
    var results = {};
    await multipleTablePutApi({
      store: "Api_get_item_info",
      param: {
        barcode,
        ma_vt,
        UnitID: unitId,
        StoreID: storeId,
        StockID: stock || "",
        Currency: paymentInfo?.ma_nt,
        userId,
      },
      data: {},
    }).then((res) => {
      if (res.responseModel?.isSucceded) {
        if (_.isEmpty(_.first(res.listObject))) {
          message.warning("Barcode không tồn tại!");
          return;
        }

        const { ma_vt, ten_vt, ma_kho, dvt, gia } = _.first(
          _.first(res.listObject)
        );

        if (barcode) {
          handleAddRowData({
            barcode,
            ma_vt,
            ten_vt,
            ma_kho,
            image: "",
            dvt,
            so_luong: 1,
            don_gia: gia || "0",
            ck_yn: false,
          });
          return;
        }
        if (ma_vt) {
          results = {
            ma_vt,
            ma_kho,
            dvt,
            gia,
          };
        }
      }
    });

    return results;
  };

  // Tìm kiếm vật tư khi vào chế đọ barcode
  const handleSearchItemInfo = useDebouncedCallback((barcode) => {
    handleFetchItemInfo({ barcode, ma_vt: "", stock: "" });
    setSearchValue("");
  }, 100);

  // Tìm kiếm thông tin khách hàng và vật tư
  const handleSearchValue = useDebouncedCallback((searchValue) => {
    fetchItemsNCustomers({ searchValue });
  }, 400);

  // Set khách hàng khi thêm mới
  const handleAddCustomerComplete = useCallback(
    ({ ma_kh, ten_kh, dien_thoai }) => {
      setPaymentInfo({
        ...paymentInfo,
        ma_kh,
        ten_kh,
        dien_thoai,
        diem: 0,
      });
    },
    [paymentInfo]
  );

  //////////table functions//////////
  const handleAddOrder = async () => {
    const curListOrder = [...listOrder];
    if (curListOrder.length >= 4) {
      message.warning("Giới hạn là 4 đơn hàng");
      return;
    }
    curListOrder.push(uuidv4());

    await setRetailOrderList(curListOrder);
    setCurrentRetailOrder(_.last(curListOrder));
  };

  const handleDeleteOrder = (key) => {
    const curListOrder = [...listOrder];
    curListOrder.splice(
      curListOrder.findIndex((item) => item === key),
      1
    );
    setCurrentRetailOrder(
      currentOrder === key ? _.last(curListOrder) : currentOrder
    );
    setRetailOrderList(curListOrder);
  };

  //Thêm dòng vật tư
  const handleAddRowData = async ({
    barcode = "",
    ma_vt,
    ten_vt,
    image,
    ma_kho,
    dvt,
    don_gia,
    ck_yn,
    so_luong = 1,
  }) => {
    if (isMergeRowData) {
      const curData = itemForm.getFieldsValue();
      let isHad = false;

      await getAllRowKeys(curData).map((key) => {
        if (getAllValueByRow(key, curData)?.ma_vt === ma_vt) {
          itemForm.setFieldValue(
            `${key}_so_luong`,
            Number(getAllValueByRow(key, curData)?.so_luong) + so_luong
          );
          isHad = true;
          return;
        }
      });
      if (autoCalPromotion) await recalPromotion();
      else await handleCalculatorPayment();

      if (isHad) return;
    }

    const rowID = uuidv4();
    setData([
      ...data,
      {
        id: rowID,
        barcode: barcode || "",
        ma_vt,
        ten_vt,
        image,
        ma_kho,
        dvt,
        so_luong: so_luong ? so_luong : 1,
        don_gia: don_gia || "0",
        thanh_tien: don_gia * 1 || "0",
        ck_yn: ck_yn || false,
        children: [
          {
            id: `${rowID}-detail`,
            content: (
              <div className="flex gap-2 justify-content-between">
                <Form.Item
                  initialValue={""}
                  name={`${rowID}_ghi_chu`}
                  style={{
                    width: "55%",
                    margin: 0,
                  }}
                  rules={[
                    {
                      required: false,
                      message: `Ghi chú trống !`,
                    },
                  ]}
                >
                  <Input.TextArea
                    autoSize={{
                      minRows: 1,
                      maxRows: 1,
                    }}
                    placeholder="Ghi chú"
                    style={{ resize: "none" }}
                  />
                </Form.Item>
                <div className="flex align-items-center gap-2">
                  <span>Chiết khấu</span>
                  <Form.Item
                    initialValue={0}
                    name={`${rowID}_ck`}
                    style={{
                      margin: 0,
                      width: 105,
                    }}
                    rules={[
                      {
                        required: false,
                        message: `Ghi chú trống !`,
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder="0"
                      disabled
                      controls={false}
                      min="0"
                      className="w-full"
                      step={quantityFormat}
                    />
                  </Form.Item>
                </div>
              </div>
            ),
          },
        ],
      },
    ]);
  };

  //xoá dòng vật tư
  const handleRemoveRowData = () => {
    const filteredData = [...data].filter(
      (item) => !selectedRowkeys.includes(item?.id)
    );

    setData(filteredData);

    if (_.isEmpty(filteredData)) {
      setPaymentInfo({
        ...paymentInfo,
        ma_ck: "",
        ck: 0,
        tl_ck: 0,
      });
    }
  };

  const handleSelectedRowKeyChange = useCallback((keys) => {
    setSelectedRowkeys(keys);
  }, []);

  const handleSelectChange = (key, params) => {
    if (params.data.type === "VT") {
      const { value, label, dvt, gia, ma_kho, image } = params.data;
      handleAddRowData({
        ma_vt: value,
        ten_vt: label,
        image: image || "https://pbs.twimg.com/media/FfgUqSqWYAIygwN.jpg",
        ma_kho: ma_kho,
        dvt,
        don_gia: gia,
        ck_yn: false,
      });
    }

    if (params.data.type === "KH") {
      const { value, label, dien_thoai, diem } = params.data;
      setPaymentInfo({
        ...paymentInfo,
        ma_kh: value,
        ten_kh: label,
        dien_thoai,
        diem,
      });
    }

    if (params.data.type === "DTVL") {
      setPaymentInfo({
        ...paymentInfo,
        dien_thoai: params?.data?.value,
      });
    }
  };

  const SegmentedRender = (item, index) => {
    return (
      <div className="flex align-items-center">
        <span>{`Đơn hàng ${index + 1}`}</span>
        {item !== 1 && (
          <i
            className="pi pi-times-circle ml-2 danger_text_color"
            onClick={() => {
              handleDeleteOrder(item);
            }}
          ></i>
        )}
      </div>
    );
  };

  ////////Form Functions
  const handleChangeValue = async (cellChanged, allCells) => {
    const cellName = getCellName(_.first(Object.keys(cellChanged)));
    const cellValue = _.first(Object.values(cellChanged));
    const changedRowKey = getRowKey(_.first(Object.keys(cellChanged)));
    const rowValues = getAllValueByRow(changedRowKey, allCells);

    const getCurRowValues = () => {
      return getAllValueByRow(changedRowKey, itemForm.getFieldsValue());
    };
    const allCellsValues = getAllValueByColumn(cellName, allCells);

    const reCalculateTotal = (donGia = 0, soLuong = 0) => {
      itemForm.setFieldValue(`${changedRowKey}_thanh_tien`, donGia * soLuong);
    };

    switch (cellName) {
      case "ma_kho":
        await handleFetchItemInfo({
          barcode: "",
          ma_vt: rowValues?.ma_vt,
          stock: cellValue,
        }).then((res) => {
          itemForm.setFieldValue(`${changedRowKey}_don_gia`, res?.gia || "0");
        });

        if (autoCalPromotion) recalPromotion();
        break;

      case "don_gia":
        if (autoCalPromotion) recalPromotion();
        break;

      case "so_luong":
        if (autoCalPromotion) recalPromotion();
        break;

      default:
        break;
    }

    await reCalculateTotal(
      getCurRowValues()?.don_gia,
      getCurRowValues()?.so_luong
    );
    handleCalculatorPayment();
  };

  ///////Scanning//////
  // const handleScanning = useMemo(() => {
  //   return async (e) => {
  //     const data =
  //       e?.clipboardData?.getData("text") ||
  //       "http://localhost:3000/RO/Reatailorder";

  //     setSearchValue("");
  //     await handleAddRowData({
  //       ma_vt: data,
  //       ten_vt: data,
  //       ma_kho: "TEST",
  //       image: "",
  //       dvt: "Chiếc",
  //       don_gia: 9999,
  //     });
  //   };
  // }, [data]);

  // useEffect(() => {
  //   if (isScanning && currentOrder === orderKey) {
  //     window.addEventListener("paste", handleScanning);
  //   }

  //   return () => {
  //     if (isScanning) window.removeEventListener("paste", handleScanning);
  //   };
  // }, [isScanning, JSON.stringify(data)]);

  // Search
  useEffect(() => {
    if (!_.isEmpty(searchOptions)) {
      const rawOptions = _.cloneDeep(searchOptions);

      const filteredOptions = rawOptions.map((item) => {
        if (searchColapse.includes(item.key)) {
          item.options.length = 0;
        }
        return item;
      });

      setsearchOptionsFiltered([...filteredOptions] || []);
    }
    return () => {};
  }, [JSON.stringify(searchOptions), JSON.stringify(searchColapse)]);

  //Key map
  useHotkeys(
    "f8",
    (e) => {
      e.preventDefault();
      handleResetPromotion();
      modifyIsOpenPromotion(true);
    },
    { enableOnFormTags: ["input", "select", "textarea"] }
  );

  useHotkeys(
    "f10",
    (e) => {
      setsearchOptions([]);
      setsearchOptionsFiltered([]);
      setRetailOrderScanning(true);
      if (!isScanning) searchInputRef.current.focus();

      e.preventDefault();
    },
    { enableOnFormTags: ["input", "select", "textarea"] },
    [isScanning]
  );

  useEffect(() => {
    fetchRetailOptions();
  }, []);

  return (
    <div className="h-full min-h-0 flex gap-1 relative">
      {contextHolder}
      <LoadingComponents loading={isFormLoading} text={"Đang tạo đơn hàng"} />
      <div className="h-full min-h-0 w-full min-w-0 flex flex-column gap-1">
        <div
          className="h-full min-h-0 overflow-hidden border-round-md flex flex-column"
          style={{ background: "#fff" }}
        >
          <div
            className="w-full p-2 flex gap-5 align-items-center"
            style={{ background: "white" }}
          >
            <div
              className="flex gap-2"
              style={{
                width: "28rem",
                flexShrink: 0,
              }}
            >
              <Select
                disabled={isCalculating}
                ref={searchInputRef}
                className="w-full"
                value={null}
                searchValue={searchValue}
                popupMatchSelectWidth={false}
                showSearch
                placeholder="Tìm kiếm..."
                allowClear
                onDropdownVisibleChange={(value) => {
                  if (!value) setSearchColapse([]);
                }}
                notFoundContent={SelectNotFound(searchLoading, searchOptions)}
                defaultActiveFirstOption={false}
                suffixIcon={false}
                filterOption={false}
                onChange={handleSelectChange}
                onFocus={() => {
                  if (!isScanning) {
                    setSearchLoading(true);
                    fetchItemsNCustomers({ searchValue: "" });
                  } else {
                    setsearchOptionsFiltered([]);
                    setSearchLoading(true);
                  }
                }}
                optionLabelProp="value"
                onSearch={(e) => {
                  setSearchValue(e);
                  if (isScanning) {
                    setSearchLoading(true);
                    handleSearchItemInfo(e);
                    return;
                  }
                  setsearchOptionsFiltered([]);
                  setSearchLoading(true);
                  handleSearchValue(e);
                }}
                listHeight={500}
              >
                {!isScanning &&
                  searchOptionsFiltered.map((group, index) => (
                    <Select.OptGroup
                      key={index}
                      label={
                        <div className="flex justify-content-between align-items-center">
                          <b className="primary_color">{group?.label}</b>
                          <i
                            className={`pi pi-angle-${
                              searchColapse.includes(group.key) ? "down" : "up"
                            } cursor-pointer`}
                            onClick={() => {
                              handleCollapseOptions(group.key);
                            }}
                          ></i>
                        </div>
                      }
                    >
                      {group.options.map((item) => (
                        <Select.Option
                          key={`${group.key}-${item.value}`}
                          value={`${group.key}-${item.value}`}
                          label={item.label}
                          className="px-2"
                          data={item}
                        >
                          <div
                            className="flex align-items-center gap-2"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <Avatar
                              style={{
                                background:
                                  CHARTCOLORS[Math.floor(Math.random() * 12)],
                                width: 30,
                                height: 30,
                              }}
                              src={item?.image}
                            >
                              {item?.label?.substring(0, 1)}
                            </Avatar>
                            <div className="flex gap-3 w-full">
                              <div className="w-full">{item.label}</div>
                              {item?.type == "VT" && (
                                <div className="text-right ml-3">
                                  <span className="ml-1 primary_bold_text">
                                    {formatCurrency(item?.ton || 0)}
                                  </span>
                                </div>
                              )}

                              {item?.type == "KH" && (
                                <div className="text-right ml-3">
                                  <span className="ml-1 primary_bold_text">
                                    {item?.dien_thoai?.trim() || ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Select.Option>
                      ))}

                      {group?.key == "KH" &&
                        phoneNumberRegex.test(searchValue) &&
                        _.isEmpty(group?.options) && (
                          <Select.Option
                            key={`dien_thoai`}
                            value={searchValue}
                            label={""}
                            className="px-2"
                            data={{
                              value: searchValue,
                              label: searchValue,
                              dien_thoai: searchValue,
                              type: "DTVL",
                            }}
                          >
                            <div className="flex align-items-center gap-2 primary_bold_text">
                              <i className="pi pi-plus-circle primary_bold_text"></i>
                              <span>Gắn số điện thoại vãng lai</span>
                            </div>
                          </Select.Option>
                        )}
                    </Select.OptGroup>
                  ))}
              </Select>

              <Tooltip placement="topRight" title="Quét (F10)">
                <Button
                  className="default_button shadow_3"
                  onClick={() => {
                    setsearchOptions([]);
                    setsearchOptionsFiltered([]);
                    setRetailOrderScanning(!isScanning);
                    if (!isScanning) searchInputRef.current.focus();
                  }}
                >
                  <i
                    className={`pi pi-qrcode ${
                      isScanning ? "success_text_color" : "danger_text_color"
                    }`}
                    style={{ fontWeight: "bold" }}
                  ></i>
                </Button>
              </Tooltip>
            </div>

            <div className="Retail_order_tabs_container justify-content-end align-items-center w-full min-w-0 flex gap-2">
              <Segmented
                value={currentOrder}
                options={listOrder.map((item, index) => {
                  return {
                    label: SegmentedRender(item, index),
                    value: item,
                  };
                })}
                onChange={(value) => {
                  setRetailOrderScanning(false);
                  setCurrentRetailOrder(value);
                }}
              />
              <Button shape="circle" onClick={handleAddOrder}>
                <i className="pi pi-plus sub_text_color"></i>
              </Button>
            </div>
          </div>

          <div className="h-full min-h-0 ">
            <Form
              form={itemForm}
              component={false}
              initialValues={{}}
              onValuesChange={handleChangeValue}
            >
              <PerformanceTable
                reverseIndex
                selectable
                columns={columns}
                data={data}
                onSelectedRowKeyChange={handleSelectedRowKeyChange}
              />
            </Form>
          </div>
        </div>
        <div
          className="border-round-md flex p-2 align-items-center justify-content-between"
          style={{
            height: "3.15rem",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div className="flex gap-2">
            <Tooltip placement="topRight" title="Xoá dữ liệu">
              <Button
                className="default_button"
                danger
                onClick={handleRemoveRowData}
              >
                <i className="pi pi-trash" style={{ fontWeight: "bold" }}></i>
              </Button>
            </Tooltip>

            <Tooltip placement="topRight" title="Khuyến mãi (F8)">
              <Button
                className="default_button"
                onClick={() => {
                  handleResetPromotion();
                  modifyIsOpenPromotion(true);
                }}
              >
                <i
                  className="pi pi-gift danger_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>

            <Tooltip placement="topRight" title="Thanh toán">
              <Button
                className="default_button"
                onClick={() => {
                  window.open(
                    `${window.location.origin}/transfer`,
                    "Thanh toán",
                    "screenX=1,screenY=1,left=1,top=1,menubar=0,height=" +
                      screen.height +
                      ",width=" +
                      screen.width
                  );
                }}
              >
                <i
                  className="pi pi-credit-card primary_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>

            <Tooltip placement="topRight" title="Danh sách đơn">
              <Button onClick={handleOrderListModal} className="default_button">
                <i
                  className="pi pi-list sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>

            <Tooltip placement="topRight" title="Toàn màn hình">
              <Button onClick={handleHideNavbar} className="default_button">
                <i
                  className={`pi pi-arrows-alt ${
                    isHideNav ? "sub_text_color" : "gray_text_color"
                  } `}
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>
          </div>

          <div className="flex gap-3">
            <div>
              <b className="primary_bold_text mr-1">Thuế :</b>
              <Select
                style={{ width: "6rem" }}
                defaultValue={0}
                options={taxOptions}
                value={paymentInfo.thue_suat}
                onChange={(e) => {
                  setPaymentInfo({
                    ...paymentInfo,
                    thue_suat: e,
                  });
                }}
              />
            </div>

            <div className="flex align-items-center justify-content-center">
              <span className="primary_bold_text mr-1">Chiết khấu :</span>
              <InputNumber
                disabled={paymentInfo.ma_ck}
                defaultValue={0}
                controls={false}
                min="0"
                max={
                  totalPromotionType === "MONEY"
                    ? paymentInfo.tong_tien + paymentInfo.tong_thue
                    : 100
                }
                style={{ width: "10rem" }}
                step={quantityFormat}
                value={
                  totalPromotionType === "MONEY"
                    ? paymentInfo.ck
                    : paymentInfo.tl_ck
                }
                onChange={(e) => {
                  setPaymentInfo({
                    ...paymentInfo,
                    tl_ck: totalPromotionType === "MONEY" ? 0 : e,
                    ck: totalPromotionType === "MONEY" ? e : 0,
                  });
                }}
                addonAfter={
                  <Select
                    disabled={paymentInfo.ma_ck}
                    className="Select__no__padding"
                    style={{
                      width: 40,
                    }}
                    value={totalPromotionType}
                    popupMatchSelectWidth={false}
                    suffixIcon={false}
                    filterOption={false}
                    onChange={(e) => {
                      setTotalPromotionType(e);
                      setPaymentInfo({
                        ...paymentInfo,
                        tl_ck: 0,
                        ck: 0,
                      });
                    }}
                  >
                    <Select.Option value="MONEY">₫</Select.Option>
                    <Select.Option value="RATIO">%</Select.Option>
                  </Select>
                }
              />
            </div>
            <Select
              style={{ width: "8rem" }}
              defaultValue={1}
              options={currencyOptions}
              onChange={(e, option) => {
                setPaymentInfo({
                  ...paymentInfo,
                  ty_gia: e,
                  ma_nt: option.label,
                });
              }}
            />
          </div>
        </div>
      </div>
      <RetailPaidInfo
        itemForm={itemForm}
        paymentInfo={paymentInfo}
        onChangeCustomer={handleAddCustomerComplete}
        onResetForm={handleResetForm}
        cantSave={isCalculating}
        isChangedData={isChangedData}
      />
      <RetailOrderListModal
        isOpen={isOpenOrderList}
        onClose={handleOrderListModal}
      />
      <RetailPromotionModal
        tableData={itemForm.getFieldsValue()}
        customer={paymentInfo?.ma_kh}
        handleSave={handlePromotionCalculate}
      />
    </div>
  );
};

export default memo(RetailOrderInfo);
