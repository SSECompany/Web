import { FileImageOutlined } from "@ant-design/icons";
import { uuidv4 } from "@antv/xflow-core";
import {Avatar,Button,Form,Image,Input,InputNumber,message as messageAPI,Segmented,Select,Tooltip,} from "antd";
import _, { forEach } from "lodash";
import React, { memo, useCallback, useEffect, useRef, useState, useContext ,useMemo } from "react";
import { Column } from "react-base-table";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import {getAllRowKeys,getAllValueByColumn,getAllValueByRow,getCellName,getRowKey,} from "../../../../../app/Functions/getTableValue";
import { formatCurrency } from "../../../../../app/hooks/dataFormatHelper";
import RenderPerformanceTableCell from "../../../../../app/hooks/RenderPerformanceTableCell";
import { quantityFormat } from "../../../../../app/Options/DataFomater";
import { phoneNumberRegex } from "../../../../../app/regex/regex";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { setIsHideNav } from "../../../../../store/reducers/claimsSlice";
import { modifyIsAddNewCustomer } from "../../../Store/Actions/RetailOrderActions";
import {getIsHideNav,getUserInfo,getUerSetting} from "../../../../../store/selectors/Selectors";
import { CHARTCOLORS } from "../../../../../utils/constants";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import PerformanceTable from "../../../../ReuseComponents/PerformanceTable/PerformanceTable";
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import RetailOrderListModal from "../../../Modals/RetailOrderListModal/RetailOrderListModal";
import ShowItemInfoModal from "../../../Modals/ShowItemInfo/ShowItemInfoModal";
import RetailPromotionModal from "../../../Modals/RetailPromotionModal/RetailPromotionModal";
import {fetchRetailOderPromotion,modifyIsOpenPromotion,setCurrentRetailOrder,setRetailOrderList,setRetailOrderScanning,modifyChangeTabOrder} from "../../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../../Store/Selectors/RetailOrderSelectors";
import "./RetailOrderInfo.css";
import RetailPaidInfo from "../RetailPaidInfo/RetailPaidInfo";

import { RetailOrderContext } from './RetailOrderContext';
import useLocalStorage from "use-local-storage";
import checkPermission from 'utils/permission'

var isDelete =false;

const RetailOrderInfo = ({ orderKey ,currentTabOrder,ref }) => {
  const [openItemInfo,setOpenItemInfo]=useState(false);
  const [selectedItem,setSelectedItem]=useState('');
  const [retailOrderData, setRetailOrderData] = useLocalStorage(
   "CUSTOMER_RETAILORDER_DATA"
  );

  const handleShowItemInfo =(value)=>{
    setOpenItemInfo(true);
    setSelectedItem(value.ma_vt)
  }
  const KeyDownName =(event)=>{
    event.preventDefault();
  }
  const rightClickName =(event)=>{
    event.preventDefault();
  }
  const columns = [
    {
      title: "",
      width: 60,
      align: Column.Alignment.CENTER,
      resizable: false,
  
      cellRenderer: ({ cellData, rowData }) =>{
        if (rowData.ck_yn) return null
        return <Button
          className="default_button"
          danger
          onClick={()=>RemoveTest(rowData)}
        >
          <i className="pi pi-trash" style={{ fontWeight: "bold" }}></i>
        </Button>
      }
    },
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
            <Form.Item  initialValue={cellData || null}  name={`${rowData.id}_ten_vt`}   style={{   width: "100%",  margin: 0,  }}
            >
              <Input.TextArea 
                onClick={()=>{handleShowItemInfo(rowData)}}
                autoSize={{  minRows: 1,  maxRows: 2,  }}  style={{ resize: "none", transition: "none" }} variant={"borderless"} 
                className="p-0 Performance_table_span" 
                onKeyDown={KeyDownName}
                onContextMenu={rightClickName}
              />
            </Form.Item>
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
      key: "thue_suat",
      title: "Vat",
      dataKey: "thue_suat",
      width: 80,
      resizable: false,
      sortable: false,
      editable: false,
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
      key: "thue_nt",
      title: "Vat Tềin",
      dataKey: "thue_nt",
      width: 0,
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
      key: "dvt",
      title: "Đơn vị",
      dataKey: "dvt",
      width: 120,
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
  
  const { listOrder, currentOrder, isScanning, isFormLoading,changeTabOrder } =
    useSelector(getRetailOrderState);

  var isGetBarCode=false;
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
  const [isQrCode, setIsQrCode] = useState(false);
  const [isReCal,setIsReCal]=useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    ma_kh: "KVL",
    ten_kh: "Vãng lai",
    dien_thoai: null,
    diem: 0,
    diem_sd:0,
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
    dien_giai:'',
    chuyen_khoan: 0,
    t_diem_so:0,
  });

  const [isOpenOrderList, setIsOpenOrderList] = useState(false);
  const [changeCustomerPay,setChangeCustomerPay] = useState(0)

  const [isCalPromotion, setIsCalPromotion] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isChangedData, setIsChangedData] = useState(false);

  const searchInputRef = useRef(null);

  const { id: userId, storeId, unitId } = useSelector(getUserInfo);
  const dispatch = useDispatch();

  const isHideNav = useSelector(getIsHideNav);
  const [paymentQR, setPaymentQR] = useLocalStorage("QRimg", "");
  const [isCalVat,setIsCalVat]=useState(false);
  const [so_ct,setSo_ct]=useState({so_ct:''})
  const {tk_nh,bin,hs_quy_doi,bank_account_name,maxPoint} = useSelector(getUerSetting);
  const [voucher, setVoucher] = useState({
    voucherId: "",
    tl_ck: 0,
    tien_ck: 0,
  });

  const [voucherStatus, setVoucherStatus] = useState({
    currentVoucher: "",
    loading: false,
    valid: false,
  });
  const handleSetVoucher =(value) =>{
    if(value.voucher)  setVoucher({
        voucherId: value.voucher?.voucherId,
        tien_ck:value.voucher?.tien_ck,
        tl_ck:value.voucher?.tl_ck,
      });
      setVoucherStatus({
        ...voucherStatus,
        currentVoucher: value.status?.currentVoucher,
        valid: value.status?.valid,
        loading: value.status?.loading,
      });
  }

  /////// Orde List functions //////////////

  const getDataOrder = (paymentMethods='', paymentMethodInfo={}) => {
    const data = { ...itemForm.getFieldsValue() };
    var masterData={};
    if(paymentMethods==''){
      masterData = { ...paymentInfo  }

    }
    else{
       masterData = {
        ...paymentInfo,
        ...paymentMethodInfo,
        tien_mat: paymentMethods? paymentMethodInfo?.tien_mat: paymentInfo.tong_tt,
        httt: paymentMethods || "tien_mat",
      }
    };
    var detailData = [];

      detailData =getAllRowKeys(data).map((item) => {
        var temp=getAllValueByRow(item, data);
        if(!temp.ghi_chu) temp={...temp,ghi_chu:''}
        return temp;
      });

      return [masterData, detailData];
  }
  const getDataOrder2 = async() => {
    const data = { ...itemForm.getFieldsValue() };
    const   masterData = { ...paymentInfo  }

    
    var detailData = [];

      detailData =getAllRowKeys(data).map((item) => {
        var temp=getAllValueByRow(item, data);
        if(!temp.ghi_chu) temp={...temp,ghi_chu:''}
        return temp;
      });

      return [masterData, detailData];
  }

    const handleShowCustomerViewDialog = useMemo( () =>async() => {
      const RETAILDATA = await getDataOrder2();
      await setRetailOrderData(RETAILDATA);
    },[paymentInfo])

    const onChangePaymentInfo = async(data)=>{
      const temp =await handleCalculatorPayment(data)
      setPaymentInfo(temp);
      
      //setIsReCal(uuidv4())
      //handleCalculatorPayment();
    }











  const handlechangeTabOrder = async (value)=>{
    setRetailOrderScanning(false);
    localStorage.setItem("tabOrder", value);
    setCurrentRetailOrder(value);
  }



  const handleOrderListModal = useCallback(() => {
    setIsOpenOrderList(!isOpenOrderList);
  }, [isOpenOrderList]);


  const handleCloseItemModal =useCallback( ()=>{
    setOpenItemInfo(false);
  },[openItemInfo])

  const handleHideNavbar = () => {
    dispatch(setIsHideNav(!isHideNav));
  };
  const ChangeCalVat = async (value)=>{
    await setIsCalVat(value);
    const curData = itemForm.getFieldsValue();
    if(value){
      await getAllRowKeys(curData).map((key) => {
          //itemForm.setFieldValue(`${key}_thanh_tien`,(Number(getAllValueByRow(key, curData)?.so_luong)) * (Number(getAllValueByRow(key, curData)?.don_gia) *(100 - Number(getAllValueByRow(key, curData)?.thue_suat))/100 ) );
          itemForm.setFieldValue(`${key}_thue_nt`,(((Number(getAllValueByRow(key, curData)?.so_luong)) * Number(getAllValueByRow(key, curData)?.don_gia)- Number(getAllValueByRow(key, curData)?.ck)) *(Number(getAllValueByRow(key, curData)?.thue_suat))/100 ) );
      });
    }
    else{
      await getAllRowKeys(curData).map((key) => {
        //itemForm.setFieldValue(`${key}_thanh_tien`,(Number(getAllValueByRow(key, curData)?.so_luong)) * (Number(getAllValueByRow(key, curData)?.don_gia)) );
        itemForm.setFieldValue(`${key}_thue_nt`,0);
      });
    }
    if (autoCalPromotion) await recalPromotion(true,value);
    else {
      const temp={...paymentInfo}
      setPaymentInfo(await handleCalculatorPayment(temp,true,value));
    }
    //await handleCalculatorPayment();
    //await setIsReCal(uuidv4());
  }

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
      const temp =_.cloneDeep(paymentInfo);
      temp = {
        ...temp,
        ma_ck: cktdValues?.ma_ck || "",
        ck: cktdValues?.ck || 0,
        tl_ck: cktdValues?.tl_ck || 0,
      };
      setPaymentInfo(await handleCalculatorPayment(temp));

      // setPaymentInfo({
      //   ...paymentInfo,
      //   ma_ck: cktdValues?.ma_ck || "",
      //   ck: cktdValues?.ck || 0,
      //   tl_ck: cktdValues?.tl_ck || 0,
      // });
      // setIsReCal(uuidv4())
      //handleCalculatorPayment();
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

    // setPaymentInfo({
    //   ...paymentInfo,
    //   ma_ck: "",
    //   ck: 0,
    //   tl_ck: 0,
    // });
    const temp = {
      ...paymentInfo,
      ma_ck: "",
      ck: 0,
      tl_ck: 0,
    };
    setPaymentInfo(await handleCalculatorPayment(temp));

    setTotalPromotionType("RATIO");

    //setIsReCal(uuidv4())
    //handleCalculatorPayment();
  };

  //Tính thanh toán
  const handleCalculatorPayment = async (dataTemp,temp =false,useCal=false) => {
    var tempIsCalVat =isCalVat;
    if(temp) tempIsCalVat =useCal
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
    dataTemp.ma_ck || !dataTemp.tl_ck
        ? dataTemp.ck
        : (tong_tien * dataTemp.tl_ck) / 100;

    const tong_ck = parseFloat(tong_ckvt + ck_tong_don);

    //const tong_thue = parseFloat((tong_tien * paymentInfo.thue_suat) / 100);
    var tong_thue = 0
    if (tempIsCalVat)
      tong_thue =await getAllValueByColumn("thue_nt", changedValues).reduce(
      (Sum, num) => Sum + num,
      0
    );
    var tien_voucher = 0;

    tien_voucher = Number(
      parseFloat(
        voucher?.tl_ck
          ? (voucher?.tl_ck * (tong_tien + tong_thue -tong_ck)) / 100
          : voucher?.tien_ck
      ).toFixed(2)
    );
    //console.log(isCalVat,tong_thue,tien_voucher,tong_tien ,tong_thue , tong_ck , (voucher?.tl_ck * (tong_tien + tong_thue)) / 100, tien_voucher)
    const tong_tt = parseFloat(tong_tien + tong_thue - tong_ck - dataTemp.diem_sd*(hs_quy_doi? hs_quy_doi:0)- tien_voucher);
    const cal = {
      ...dataTemp,
      tong_sl,
      tong_tien,
      tong_tt,
      tong_ck,
      tong_thue,
      tien_diem:dataTemp.diem_sd *(hs_quy_doi? hs_quy_doi:0),
      tien_voucher:tien_voucher
    };
    console

    return cal
    //setPaymentInfo(calculated);
  };


  useEffect(() => {
    //handleCalculatorPayment();
    //setIsChangedData(uuidv4());
    handleShowCustomerViewDialog();
  }, [JSON.stringify(paymentInfo)]);

  useEffect(() => {
    async function fetchData() {
      const temp = {...paymentInfo,voucherId:voucher?.voucherId};
      //console.log('voucher',temp);
      setPaymentInfo( await handleCalculatorPayment(temp))
      return () => {};
    }
    fetchData();
  }, [voucher]);

  

  // useEffect(() => {
  //   handleCalculatorPayment();
  // }, [isReCal]);



  const recalPromotion = async (temp=false,useCal=false ) => {
    setIsCalculating(true);
    // message.open({
    //   type: "loading",
    //   content: "Đang xử lý chương trình chiết khấu",
    //   duration: 0,
    // });

    //Reset
    var tempIsCalVat =isCalVat;
    if(temp) tempIsCalVat =useCal
    const changedValues = { ...itemForm.getFieldsValue() };
    const allKeys = getAllRowKeys(changedValues);
    const rawData = [...data].filter((row) => !row?.ck_yn);
    const listPromotion = [...data].filter((row) => row?.ck_yn);
    var promotions = {};
    allKeys.map(async (key) => {
      promotions[`${key}_ma_ck`] = "";
      promotions[`${key}_tl_ck`] = 0;
      promotions[`${key}_ck`] = 0;
    });
    // var tong_thue =0
    // console.log(tempIsCalVat);
    // if (tempIsCalVat){
    //     tong_thue =await getAllValueByColumn("thue_nt", changedValues).reduce(
    //     (Sum, num) => Sum + num,
    //     0
    //   );
    // }
    // console.log(tong_thue);

    // setPaymentInfo({
    //   ...paymentInfo,
    //   ma_ck: "",
    //   ck: 0,
    //   tl_ck: 0,
    //   tong_thue:tong_thue
    // });

    // await itemForm.setFieldsValue({
    //   ...promotions,
    // });
    //Recal
    const Tinhtrang = await fetchRetailOderPromotion(
      changedValues,
      paymentInfo.ma_kh
    ).then( async (result) => {
      //Chiết khấu chi tiết vật tư
      var ckvtObject = {};

      result?.ckvt?.map(async (ck) => {
        var  temp =itemForm.getFieldValue(`${ck.rowKey}_so_luong`);
        var  temp_thue_suat =itemForm.getFieldValue(`${ck.rowKey}_thue_suat`);
        if(ck.loai_ck=='08'){
          ckvtObject[`${ck.rowKey}_don_gia`] = ck?.gia_nt2;
          ckvtObject[`${ck.rowKey}_thanh_tien`] = ck?.gia_nt2 * temp;
          if(tempIsCalVat) ckvtObject[`${ck.rowKey}_thue_nt`] = (ck?.gia_nt2 * temp *temp_thue_suat /100);
          else ckvtObject[`${ck.rowKey}_thue_nt`] = 0;
          
        }
        ckvtObject[`${ck.rowKey}_ma_ck`] = ck?.ma_ck;
        ckvtObject[`${ck.rowKey}_tl_ck`] = ck.tl_ck;
        ckvtObject[`${ck.rowKey}_ck`] = ck.ck;
        if(tempIsCalVat) ckvtObject[`${ck.rowKey}_thue_nt`] = (ck?.gia_nt2 * temp -ck.ck)*temp_thue_suat /100;
        else ckvtObject[`${ck.rowKey}_thue_nt`] = 0;
      });

      itemForm.setFieldsValue({
        ...ckvtObject,
      });
      // result?.ckvt?.map(async (ck) => {
      //   if(ck.loai_ck=='08'){
      //     ckvtObject[`${ck.rowKey}_don_gia`] = ck?.gia_nt2;
      //   }
      //   ckvtObject[`${ck.rowKey}_ma_ck`] = ck?.ma_ck;
      //   ckvtObject[`${ck.rowKey}_tl_ck`] = ck.tl_ck;
      //   ckvtObject[`${ck.rowKey}_ck`] = ck.ck;
      // });

      var check =false;
      if(listPromotion.length == result.ckth.length && result.ckth.length >0){
        listPromotion.forEach(d => {
          let t = result.ckth.find(c=>c.ma_vt.trim()==d.ma_vt.trim() && c.so_luong==d.so_luong)
          if (!t) check=true;
        });
      } else if (!( result.ckth.length ==0 && listPromotion.length  ==0)) check =true;
      if(check){
        const tempzz = rawData
        console.log(tempzz)
        result?.ckth?.forEach((ck) => {
          tempzz.push({
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
          });
        });
        console.log(tempzz)
        setData(tempzz);
      }

      
      //if(!_.isEmpty(ckthRows)) setIsChangedData(uuidv4());

      const cktdValues = _.first(result.cktd);

      const temp = {
        ...paymentInfo,
        ma_ck: cktdValues?.ma_ck || "",
        ck: cktdValues?.ck || 0,
        tl_ck: cktdValues?.tl_ck || 0,
        t_diem_so:cktdValues?.t_diem_so||0
      };
      await setPaymentInfo(await handleCalculatorPayment(temp,true,tempIsCalVat));

      // await  setPaymentInfo({
      //   ...paymentInfo,
      //   ma_ck: cktdValues?.ma_ck || "",
      //   ck: cktdValues?.ck || 0,
      //   tl_ck: cktdValues?.tl_ck || 0,
      //   t_diem_so:cktdValues?.t_diem_so||0
      // });
      // setIsReCal(uuidv4())
      //handleCalculatorPayment();

      // if (_.isEmpty(ckthRows) && _.isEmpty(cktdValues) ){
      //   const temp = {...paymentInfo,};
      //   setPaymentInfo(handleCalculatorPayment(temp));
      //   //  handleCalculatorPayment();
      //   //setIsReCal(uuidv4())
      // }
      message.destroy();
      setIsCalculating(false);
    });

  }

  useEffect(() => {
    if ( !_.isEmpty(data) && autoCalPromotion) {
      console.log(data);
      recalPromotion();
      return;
    }
    setIsCalPromotion(false);
  }, [JSON.stringify(data), JSON.stringify(paymentInfo.ma_kh)]);

  // useEffect(() => {
  //     setData([...data])
  //     return;
  // }, [isChangedData]);

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
    setPaymentQR("");
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
  const { currencyOptions, taxOptions, autoCalPromotion, isMergeRowData } = useContext(RetailOrderContext);

  

  // Lấy thông tin vật tư
  const handleFetchItemInfo = async ({ barcode, ma_vt, stock }) => {
    isGetBarCode =true;
    var results = {};
    await multipleTablePutApi({
      store: "Api_get_item_info",
      param: {
        barcode,
        ma_vt,
        StoreID: storeId,
        userId,
      },
      data: {},
    })
    .then((res) => {
      if (res.responseModel?.isSucceded) {
        if (_.isEmpty(_.first(res.listObject))) {
          message.warning("Barcode không tồn tại!");
          return;
        }

        const { ma_vt, ten_vt, ma_kho, dvt, gia ,thue_suat} = _.first(
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
            thue_suat:thue_suat
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
    })
    .finally(() => {
      isGetBarCode=false;
      searchInputRef.current.focus()
    });
    return results;
  };

  // Tìm kiếm vật tư khi vào chế đọ barcode
  const handleSearchItemInfo = (barcode) => {
    // const lastCharCode = barcode.charCodeAt(barcode.length - 1)
    // if(lastCharCode=== 13){
    //   console.log('enter')
    // }
    // console.log(lastCharCode ,barcode)
    //handleFetchItemInfo({ barcode, ma_vt: "", stock: "" });QSP0915
    //setSearchValue("");
  };

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
        diem_sd:0,
        moc_diem:0
      });
    },
    [paymentInfo]
  );
  const handleSelectCustomerComplete = useCallback(
    ({ ma_kh, ten_kh, dien_thoai,diem,moc_diem }) => {
      setPaymentInfo({
        ...paymentInfo,
        ma_kh,
        ten_kh,
        dien_thoai,
        diem: diem,
        diem_sd:0,
        moc_diem:moc_diem
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
    thue_suat=0,
    so_luong = 1,
  }) => {
    if (isMergeRowData) {
      const curData = itemForm.getFieldsValue();
      let isHad = false;

      await getAllRowKeys(curData).map((key) => {
        if (getAllValueByRow(key, curData)?.ma_vt === ma_vt) {
          itemForm.setFieldValue(`${key}_so_luong`,Number(getAllValueByRow(key, curData)?.so_luong) + so_luong);
          itemForm.setFieldValue(`${key}_thanh_tien`,(Number(getAllValueByRow(key, curData)?.so_luong)+so_luong) * (Number(getAllValueByRow(key, curData)?.don_gia)) );
          if(isCalVat){
            //itemForm.setFieldValue(`${key}_thanh_tien`,(Number(getAllValueByRow(key, curData)?.so_luong)+so_luong) * (Number(getAllValueByRow(key, curData)?.don_gia) *(100 - Number(getAllValueByRow(key, curData)?.thue_suat))/100 ) );
            itemForm.setFieldValue(`${key}_thue_nt`,(((Number(getAllValueByRow(key, curData)?.so_luong)+so_luong) * Number(getAllValueByRow(key, curData)?.don_gia) -Number(getAllValueByRow(key, curData)?.ck)  )*(Number(getAllValueByRow(key, curData)?.thue_suat))/100  ) );
          }
          else{

            //itemForm.setFieldValue(`${key}_thanh_tien`,(Number(getAllValueByRow(key, curData)?.so_luong)+so_luong) * (Number(getAllValueByRow(key, curData)?.don_gia)) );
            itemForm.setFieldValue(`${key}_thue_nt`,0  );
          }
          isHad = true;
          return;
        }
      });
      if (autoCalPromotion) {
        console.log('tt')
        await recalPromotion()
      }
      else {
        const temp = {...paymentInfo};
        setPaymentInfo(await handleCalculatorPayment(temp));
      }
        //setIsReCal(uuidv4())
      //await handleCalculatorPayment();

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
        thue_suat:thue_suat,
        thue_nt:isCalVat?(thue_suat*don_gia/100)  :0,
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
    const temp = {...paymentInfo};
    //setPaymentInfo(await handleCalculatorPayment(temp));
    //handleCalculatorPayment();
    //setIsReCal(uuidv4())
  };
  const RemoveTest =async (d)=>{
    if (isDelete) return;
    isDelete=true;
    const filteredData = await [...data].filter(
      (item) => (item?.id != d.id)
    );
    setSelectedItem('');
    await setData(filteredData);

    if (_.isEmpty(filteredData)) {
      const temp = {...paymentInfo};
      setPaymentInfo(await handleCalculatorPayment(temp));
      //await handleCalculatorPayment();
      //setIsReCal(uuidv4())
      isDelete=false;
    }
    const myTimeout = setTimeout(()=>{
      isDelete=false;
    }, 300);
  }


  //xoá dòng vật tư
  const handleRemoveRowData = async() => {
    const filteredData = [...data].filter(
      (item) => {
        console.log(item);
        !selectedRowkeys.includes(item?.id)

      }
    );

    setData(filteredData);
    if (_.isEmpty(filteredData)) {
      const temp = {
        ...paymentInfo,
        ma_ck: "",
        ck: 0,
        tl_ck: 0,
      };
      setPaymentInfo(await handleCalculatorPayment(temp));
      // setPaymentInfo({
      //   ...paymentInfo,
      //   ma_ck: "",
      //   ck: 0,
      //   tl_ck: 0,
      // });
      // //handleCalculatorPayment();
      // setIsReCal(uuidv4())
    }
  };

  const handleSelectedRowKeyChange = (keys) => {
    setSelectedRowkeys(keys);
  };

  const handleSelectChange = (key, params) => {
    if (params.data.type === "VT") {
      const { value, label, dvt, gia, ma_kho, image,thue_suat } = params.data;
      handleAddRowData({
        ma_vt: value,
        ten_vt: label,
        image: image || "https://pbs.twimg.com/media/FfgUqSqWYAIygwN.jpg",
        ma_kho: ma_kho,
        dvt,
        don_gia: gia,
        ck_yn: false,
        thue_suat:thue_suat,
      });
    }

    if (params.data.type === "KH") {
      const { value, label, dien_thoai, diem,moc_diem } = params.data;
      setPaymentInfo({
        ...paymentInfo,
        ma_kh: value,
        ten_kh: label,
        dien_thoai,
        diem,
        diem_sd:0,
        moc_diem:moc_diem
      });
    }

    if (params.data.type === "DTVL") {
      modifyIsAddNewCustomer({open:true,value:searchValue})
      // setPaymentInfo({
      //   ...paymentInfo,
      //   dien_thoai: params?.data?.value,
      // });
    }
  };

  const SegmentedRender = (item, index) => {
    return (
      <div className="flex align-items-center" >
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
  const ChangeTab = async(e,index)=>{
    await modifyChangeTabOrder(index)
  }
  const handleChangeValue = async (cellChanged, allCells) => {
    const cellName = getCellName(_.first(Object.keys(cellChanged)));
    const cellValue = _.first(Object.values(cellChanged));
    const changedRowKey = getRowKey(_.first(Object.keys(cellChanged)));
    const rowValues = getAllValueByRow(changedRowKey, allCells);

    const getCurRowValues = () => {
      return getAllValueByRow(changedRowKey, itemForm.getFieldsValue());
    };
    if(cellName == 'dvt')
    var res = await multipleTablePutApi({
      store: "Web_GetPriceByDvt",
      param: {
        ma_vt:rowValues?.ma_vt,
        dvt:cellValue
      },
      data: {},
    })
    .then((res) => {
      if (res.responseModel?.isSucceded) {
        if(res.listObject.length >0 ){
          itemForm.setFieldValue(`${changedRowKey}_don_gia`, parseInt(res.listObject[0][0].t));

        }
          
      }}
    );

    const allCellsValues = getAllValueByColumn(cellName, allCells);

    const reCalculateTotal = (donGia = 0, soLuong = 0,thue_suat=0) => {
      itemForm.setFieldValue(`${changedRowKey}_thanh_tien`, donGia * soLuong);
      if (isCalVat)itemForm.setFieldValue(`${changedRowKey}_thue_nt`, donGia * soLuong *thue_suat/100 );
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
    if(cellName!='default_button')
    await reCalculateTotal(
      getCurRowValues()?.don_gia,
      getCurRowValues()?.so_luong,
      getCurRowValues()?.thue_suat
    );
    const temp = {...paymentInfo};
    setPaymentInfo(await handleCalculatorPayment(temp));
  };

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
      if(!isScanning) setRetailOrderScanning(true)
        else setRetailOrderScanning(false);
      if (!isScanning) searchInputRef.current.focus();

      e.preventDefault();
    },
    { enableOnFormTags: ["input", "select", "textarea"] },
    [isScanning]
  );

  useEffect(() => {
  }, []);

const Test=()=>{
  console.log(data);
}
const handelKeyPress =(event)=>{
  if(isScanning){
    if(event.keyCode ==13){
      handleFetchItemInfo({ barcode:searchValue, ma_vt: "", stock: "" })
      setSearchValue("")
    }
  }
}
  


  return (
    <div className="h-full min-h-0 flex gap-1 relative">
      {contextHolder}
      {/* <input type="text" onKeyDown={}></input> */}
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
                disabled={isGetBarCode}
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
                onKeyDown={handelKeyPress}
                listHeight={500}
              >
                {!isScanning &&
                  searchOptionsFiltered.map((group, index) => {
                    return <Select.OptGroup
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
                        (group?.options.length==0) && (
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
                              <span>Thêm mới khách hàng</span>
                            </div>
                          </Select.Option>
                        )}
                    </Select.OptGroup>
                  })}
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
                  handlechangeTabOrder(value)
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
            {checkPermission("Permission.HDL.Discount")?
            <Tooltip placement="topRight" title="Khuyến mãi (F8)">
              <Button className="default_button"
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
            :''}

            <Tooltip placement="topRight" title="Danh sách đơn">
              <Button onClick={handleOrderListModal} className="default_button">
                <i
                  className="pi pi-list sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>
          </div>

         
        </div>
      </div>
      <RetailPaidInfo
        itemForm={itemForm}
        paymentInfo={paymentInfo}
        onChangeCustomer={handleAddCustomerComplete}
        onSelectCustomer={handleSelectCustomerComplete}
        onResetForm={handleResetForm}
        cantSave={isCalculating}
        isChangedData={isChangedData}
        isCalVat={isCalVat}
        ChangeCalVat={ChangeCalVat}
        ChangePaymentInfo={onChangePaymentInfo}
        changeCustomerPay={changeCustomerPay}
        getDataOrder={getDataOrder}
        setVoucherMaster={handleSetVoucher}
        voucherStatus={voucherStatus}
        voucher={voucher}
      />
      <RetailOrderListModal
        isOpen={isOpenOrderList}
        onClose={handleOrderListModal}
        ma_ct={'hdo'}
      />
      {/* <ShowItemInfoModal
        isOpen={openItemInfo}
        onClose={handleCloseItemModal}
        ma_vt={selectedItem}
      /> */}
      <RetailPromotionModal
        tableData={itemForm.getFieldsValue()}
        customer={paymentInfo?.ma_kh}
        handleSave={handlePromotionCalculate}
      />
    </div>
  );
};

export default memo(RetailOrderInfo);
