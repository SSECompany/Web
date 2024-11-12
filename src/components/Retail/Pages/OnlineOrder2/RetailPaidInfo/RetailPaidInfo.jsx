import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { uuidv4 } from "@antv/xflow-core";

import {
  Button,
  Dropdown,
  Input,
  InputNumber,
  message as messageAPI,
  notification,
  Spin,Select,
  Switch,
} from "antd";
import _, { truncate } from "lodash";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { useDebouncedCallback } from "use-debounce";
import useLocalStorage from "use-local-storage";
import { filterKeyHelper } from "app/Functions/filterHelper";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../../app/Functions/getTableValue";
import { formatCurrency } from "../../../../../app/hooks/dataFormatHelper";
import { num2words } from "../../../../../app/Options/DataFomater";
import { formatterNumber, parserNumber } from "../../../../../app/regex/regex";
import { getUserInfo,getUerSetting } from "../../../../../store/selectors/Selectors";
import emitter from "../../../../../utils/emitter";
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import AdvanceRetailPayment from "../../../Modals/AdvanceRetailPayment/AdvanceRetailPayment";
import PrintComponent from "../../../Modals/PrintRetailModal/PrintComponent/PrintComponent";
import RetailPaymentConfirm from "../../../Modals/RetailPaymentConfirm/RetailPaymentConfirm";
import { modifyIsFormLoading,modifyIsAddNewCustomer } from "../../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../../Store/Selectors/RetailOrderSelectors";
import UpdateCustomerPopup from "../UpdateCustomerPopup/UpdateCustomerPopup";
import { CloseOutlined } from "@ant-design/icons";

import AddCustomerPopup from "../AddCustomerPopup/AddCustomerPopup";

const { Search } = Input;

const paymentTypeOptions = [
  {
    label: "Tiền mặt",
    key: "tien_mat",
  },
  {
    label: "Quẹt thẻ",
    key: "tien_the",
  },
  {
    label: "Chuyển khoản",
    key: "chuyen_khoan",
  },
];
var so_ct={};

const RetailPaidInfo = ({
  itemForm,
  paymentInfo,
  onChangeCustomer,
  onSelectCustomer,
  onResetForm,
  cantSave,
  isChangedData,
  isCalVat,
  ChangeCalVat,
  ChangePaymentInfo,
  changeCustomerPay,
  getDataOrder ,
  setVoucherMaster,
  voucher,
  voucherStatus
}) => {
  //Key map
  useHotkeys(
    "f1",
    (e) => {
      e.preventDefault();
      //setIsShowConfirmDialog(true);
      handleShowCustomerViewDialog();
      handleSave();
    },
    { enableOnFormTags: ["input", "select", "textarea"] }
  );

  useHotkeys(
    "f7",
    (e) => {
      e.preventDefault();
      setIsOpenAdvancePayment(true);
      handleShowCustomerViewDialog();
    },
    { enableOnFormTags: ["input", "select", "textarea"] }
  );

  const [message, contextHolder] = messageAPI.useMessage();
  const [paymentQR, setPaymentQR] = useLocalStorage("QRimg", "");
  const [retailOrderData, setRetailOrderData] = useLocalStorage(
    "CUSTOMER_RETAILORDER_DATA",null,{
      syncData: false
    }
  );
  const noteRef = useRef("");
  const {tk_nh,bin,hs_quy_doi,bank_account_name,maxPoint} = useSelector(getUerSetting);

  const [printMaster, setPrintMaster] = useState({});
  //const [so_ct, setSo_ct] = useState("");
  const [printDetail, setPrintDetail] = useState([]);
  const [isCreatingOrder,setIsCreatingOrder]=useState(false);
  const [selectCustomer,setSelectCustomer]=useState({})
  const [note,setNote] =useState('');


  const handleChangeVat=(value)=>{
    ChangeCalVat(value)
  }

  var printContent = useRef();
  const beforePrint =()=>{
    //SaveOrder();
  }
  const handlePrint2 =()=>{
  }
  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    onAfterPrint: beforePrint,
    copyStyles: false,
  });

  const [paymentType, setPaymentType] = useState("tien_mat");

  const [isQrCode, setIsQrCode] = useState(false);

  const [paymentData, setPaymentData] = useState({});

  const [change, setChange] = useState(0);
  const [point, setPoint] = useState(0);
  // const [voucher, setVoucher] = useState({
  //   voucherId: "",
  //   tl_ck: 0,
  //   tien_ck: 0,
  // });

  // const [voucherStatus, setVoucherStatus] = useState({
  //   currentVoucher: "",
  //   loading: false,
  //   valid: false,
  // });
  const [isUsePoint, setIsUsePoint] = useState(true);
  const [isOpenAdvancePayment, setIsOpenAdvancePayment] = useState(false);
  const [isShowConfirmDialog, setIsShowConfirmDialog] = useState(false);
  const [dataCustomerSearch,setDataCustomerSearch]=useState([]);
  const [valueSearch,setValueSearch]=useState("");
  const [ voucherChild,setVoucherChild]=useState('')

  const { isFormLoading } = useSelector(getRetailOrderState);
  const { id: userId, storeId, unitId,storeName } = useSelector(getUserInfo);

  //Chuẩn bị dữ liệu
  const prepareOrderData = (paymentMethods, paymentMethodInfo) => {
    const data = { ...itemForm.getFieldsValue() };
    const masterData = {
      ...paymentInfo,
      ...paymentMethodInfo,
      tien_mat: paymentMethods
        ? paymentMethodInfo?.tien_mat
        : paymentData?.tong_tt,
      httt: paymentMethods || "tien_mat",
      dien_giai: noteRef?.current?.resizableTextArea?.textArea?.value || "",
    };


    var detailData = [];

    detailData =getAllRowKeys(data).map((item) => {
      var temp=getAllValueByRow(item, data);
      if(!temp.ghi_chu) temp={...temp,ghi_chu:''}
      return temp;
    });

    return [masterData, detailData];
  };
  

  //Hiển thị xác nhận lưu phiếu
  const handleShowCustomerViewDialog = async() => {
    // console.log('z1')
     //const RETAILDATA = await prepareOrderData();
    // setRetailOrderData(RETAILDATA);
    ChangePaymentInfo({...paymentInfo})
  };


  const SucessOrder = ()=>{
    SaveOrder();
  }
  const SuccessOrder= ()=>{
    SaveOrder();
  }
  const ChangePoint = (e)=>{
    if(e<=paymentInfo.diem){
      
    paymentInfo.diem_sd=e;
    setPoint(e);

    var finalPay = paymentInfo?.tong_tt;
    var tien_voucher = 0;
    var tt_none_diem =0;

    tien_voucher = Number(
      parseFloat(
        voucher?.tl_ck
          ? (voucher?.tl_ck * paymentInfo?.tong_tien) / 100
          : voucher?.tien_ck
      ).toFixed(2)
    );

    finalPay = Number(parseFloat(finalPay - tien_voucher).toFixed(2));
    tt_none_diem = finalPay;
    
    if (isUsePoint) {
      finalPay = Number(
        parseFloat(
          finalPay-e * hs_quy_doi
          
          //finalPay - paymentInfo?.diem_sd * paymentInfo?.quy_doi_diem
        ).toFixed(2)
      );
    }

    ChangePaymentInfo({
      ...paymentInfo,
      tong_tt: finalPay < 0 ? 0 : finalPay,
      tien_voucher: tien_voucher,
      tt_none_diem: tt_none_diem,
      diem_sd:e
    });



      // ChangePaymentInfo({...paymentInfo,diem_sd:e})
      // CalFinalPayment();
    }
  }
  const SaveOrder =  async (paymentMethods, paymentMethodInfo, type = "SIMPLE") => {
      if(isCreatingOrder||isFormLoading || cantSave) return;
      setIsCreatingOrder(true);

      const [masterData, detailData] = getDataOrder(
        paymentMethods,
        paymentMethodInfo
      );

      var master = { ...masterData};
      if (type === "SIMPLE") {
        master = {
          ...masterData,
          tien_mat: paymentMethods === "tien_mat" ? masterData.tong_tt : 0,
          tien_the: paymentType === "tien_the" ? masterData.tong_tt : 0,
          chuyen_khoan: (paymentType === "chuyen_khoan" && !isQrCode) ? masterData.tong_tt : 0,
          qr: isQrCode ? masterData.tong_tt : 0,
          httt: isQrCode ? 'qr' : paymentType,
        };
      }
      if (type === "ADVANCE") {
        master = {
          ...masterData,
          tien_mat:  paymentMethodInfo?.tien_mat ,
          tien_the: paymentMethodInfo?.tien_the ,
          chuyen_khoan:  paymentMethodInfo?.chuyen_khoan ,
          qr: paymentMethodInfo?.qr, 
          httt: paymentMethods,
        };
      }
      if(so_ct?.so_ct){
        master={...master,so_ct:so_ct?.so_ct};
      }
      else{
        const temp_so_ct =await multipleTablePutApi({
          store: "GetTblSoCt",
          param: {
            so_ct:"",
            ma_ct:"HDO"
          },
          data: {},
        })
        const data_so_ct = temp_so_ct?.listObject || [];
        master={...master,so_ct:_.first(data_so_ct[0]).so_ct}
      }
      

      modifyIsFormLoading(true);

      // if (change - paymentData?.tong_tt < 0 && !isOpenAdvancePayment) {
      //   message.warning("Tiền thanh toán không đủ !");
      //   modifyIsFormLoading(false);
      //   setIsCreatingOrder(false);
      //   return;
      // }

      if (_.isEmpty(detailData)) {
        message.warning("Vui lòng thêm vật tư !");
        modifyIsFormLoading(false);
        setIsCreatingOrder(false);
        return;
      }

      if (_.isEmpty(master?.ma_kh)) {
        message.warning("Mã khách hàng trống!");
        modifyIsFormLoading(false);
        setIsCreatingOrder(false);
        return;
      }

      setIsShowConfirmDialog(false);
      setPrintMaster({
        ...master,
        voucher: voucher?.voucherId,
        sd_diem: isUsePoint ? 1 : 0,
        tt_diem:temp,
      });
      var temp =master.diem_sd;
      setPrintDetail(detailData);

      multipleTablePutApi({
        arandomnumber: Math.floor(Math.random() * 10000),
        store: "Api_create_retail_order_hdo",
        param: {
          UnitID: unitId,
          StoreID: storeId,
          userId,
        },
        data: {
          master: [
            {
              ...master,
              voucher: voucher?.voucherId,
              sd_diem: isUsePoint ? 1 : 0,
              tt_diem:temp,
            },
          ],
          detail: detailData,
        },
      })
        .then((res) => {
          if (res?.responseModel?.isSucceded) {
            setIsCreatingOrder(false);
            setPaymentQR("");
            notification.success({
              message: `Thực hiện thành công`,
            });
            setPaymentType("tien_mat")
            onResetForm();
            setValueSearch("");
            so_ct={}
            setPaymentQR('');
            setVoucherMaster(
              {
                status:{
                currentVoucher: '',
                loading: false,
                },
                voucher:{
                  voucherId: '',
                  tien_ck:0,
                  tl_ck:0,
                }
              }
            )
            setVoucherChild('');
            setDataCustomerSearch([]);
            emitter.emit("HANDLE_RETAIL_ORDER_SAVE");
            handleCloseAdvancePayment();
            
            setChange(0);
            return _.first(res.listObject[0]);
          } else {
            notification.warning({
              message: res?.responseModel?.message,
            });
            setIsCreatingOrder(false);
            modifyIsFormLoading(false);
            return null;
          }
        })
        .catch((res) => {
          setIsCreatingOrder(false);
          modifyIsFormLoading(false);
          return null;
        })

      modifyIsFormLoading(false);
    }
  // Lưu phiếu
  const handleSave = useCallback(
    async (paymentMethods, paymentMethodInfo, type = "SIMPLE") => {
      // setPaymentData({
      //   ...paymentData,
      // });
      var totalQr=paymentData.tong_tt;
      if(isFormLoading || cantSave) return;
      if(type=='SIMPLE'){
        setPaymentType('chuyen_khoan');
        setIsQrCode(true);
        await setChange(paymentData.tong_tt);
        ChangePaymentInfo({...paymentInfo,tong_tt:paymentData.tong_tt})
      }
      if(type=='ADVANCE'){
        ChangePaymentInfo({...paymentInfo,tong_tt:paymentData.tong_tt})
        totalQr = paymentMethodInfo?.qr
      }

      const temp_so_ct =await multipleTablePutApi({
        store: "GetTblSoCt",
        param: {
          so_ct:""
        },
        data: {},
      })
      const data = temp_so_ct?.listObject || [];
      var so_ct_temp = _.first(data[0]);
      so_ct=so_ct_temp;
      //setSo_ct(so_ct_temp);


      const [masterData, detailData] = getDataOrder(
        paymentMethods,
        paymentMethodInfo
      );
      // const temp_so_ct =await multipleTablePutApi({
      //   store: "GetTblSoCt",
      //   param: {
      //     so_ct:""
      //   },
      //   data: {},
      // })
      // const data = temp_so_ct?.listObject || [];
      // const so_ct = _.first(data[0]);
      var master = { ...masterData};
      if (type === "SIMPLE") {
        master = {
          ...masterData,
          tien_mat:  0,
          tien_the:  0,
          chuyen_khoan:  masterData.tong_tt ,
          httt: paymentType,
        };
      }
      // console.log(master);
      // master.so_ct=so_ct.so_ct;

      //modifyIsFormLoading(true);

      if (_.isEmpty(detailData)) {
        message.warning("Vui lòng thêm vật tư !");
        modifyIsFormLoading(false);
        return;
      }

      if (_.isEmpty(master?.ma_kh)) {
        message.warning("Mã khách hàng trống!");
        modifyIsFormLoading(false);
        return;
      }
      if (master?.tong_tt > 0) {
        setPaymentQR(
          `https://img.vietqr.io/image/${bin}-${tk_nh}-EEmxQTR.jpg?amount=${
            totalQr || 0
          }&addInfo=${so_ct_temp.so_ct}%20${storeName}&accountName=${bank_account_name}`
        );
      }

      // setIsShowConfirmDialog(false);
      
      // modifyIsFormLoading(false);
    },
    [paymentData, voucher, change, isOpenAdvancePayment, paymentType]
  );

  //Tính toán tiền trả
  const calculateBackMoney = useMemo(() => {
    return change - paymentData?.tong_tt;
  }, [paymentData, voucher, change]);

  const onVoucherClear =() =>{
    setVoucherChild('');
    setVoucherMaster(
      {
        status:{
        ...voucherStatus,
        currentVoucher: '',
        loading: false,
        },
        voucher:{
          voucherId: '',
          tien_ck:0,
          tl_ck:0,
        }
      }
    )
  }
  const changeVoucher =(e)=>{
    setVoucherChild( e.target.value)
  }
  // Xác thực voucher
  const handleFindVoucher = useDebouncedCallback(async (e) => {
    var value = e.target.value;
    if (value) {
      setVoucherMaster({status:{
        ...voucherStatus,
        currentVoucher: value,
        loading: true,
      }})
      await multipleTablePutApi({
        store: "Api_check_Voucher_valid",
        param: {
          voucherId: value,
          customerId: paymentData?.ma_kh || "",
          unitId,
          storeId,
          userId,
        },
        data: {},
      }).then((res) => {
        if (res?.responseModel?.isSucceded) {
          if (!_.isEmpty(_.first(res?.listObject))) {
            const { tl_ck, tien_ck,ma_the } = _.first(_.first(res?.listObject));

            setVoucherMaster(
              {
                status:{
                ...voucherStatus,
                currentVoucher: ma_the,
                loading: false,
                },
                voucher:{
                  voucherId: ma_the,
                  tien_ck,
                  tl_ck,
                }
              }
            )
            return;
          }
          else{
            setVoucherMaster(
              {
                status:{
                ...voucherStatus,
                currentVoucher: '',
                loading: false,
                },
                voucher:{
                  voucherId: '',
                  tien_ck:0,
                  tl_ck:0,
                }
              }
            )
          }
        }
        setVoucherMaster({status:{
          ...voucherStatus,
          currentVoucher: value,
          valid: false,
          loading: false,
        }})
      });

      return;
    }
    setVoucherMaster({status:{
      ...voucherStatus,
      currentVoucher: value,
      valid: false,
      loading: false,
    }})
  }, 300);

  // Set khách hàng khi thêm mới
  const handleAddCustomerComplete = useCallback(
    ({ ma_kh, ten_kh, dien_thoai,dia_chi }) => {
      onChangeCustomer({
        ma_kh,
        ten_kh,
        dien_thoai,
        diem:0
      });
      setSelectCustomer({
        value: ma_kh,
        label: ten_kh,
        dia_chi: dia_chi,
        dien_thoai: dien_thoai,
        bl_yn: true,
        bb_yn: false,
        diem: 0.0000,
        type: "KH"
      })
      onSelectCustomer({
        ma_kh:ma_kh,
        ten_kh:ten_kh,
        dien_thoai:dien_thoai,
        diem:0,
        bb_yn:false,
        bl_yn:true,
        moc_diem:0
      });
    },
    [paymentData]
  );
  const handleUpdateCustomerComplete = 
    ({ ma_kh, ten_kh, dien_thoai,bl_yn,bb_yn,dia_chi,diem,moc_diem }) => {
      onChangeCustomer({
        ma_kh,
        ten_kh,
        dien_thoai,
        diem
      });
      setSelectCustomer({
        value: ma_kh,
        label: ten_kh,
        dia_chi: dia_chi,
        dien_thoai: dien_thoai,
        bl_yn: bl_yn,
        bb_yn: bb_yn,
        diem: diem,
        type: "KH"
      })
      onSelectCustomer({
        ma_kh:ma_kh,
        ten_kh:ten_kh,
        dien_thoai:dien_thoai,
        diem:diem,
        bb_yn,
        bl_yn,
        moc_diem:moc_diem
      });
    }

  // Tính toán thông tin thanh toán khi có sự thay đổi
  const CalFinalPayment = () => {
    var finalPay = paymentInfo?.tong_tt;
    var tien_voucher = 0;
    var tt_none_diem =0;

    tien_voucher = Number(
      parseFloat(
        voucher?.tl_ck
          ? (voucher?.tl_ck * paymentInfo?.tong_tien) / 100
          : voucher?.tien_ck
      ).toFixed(2)
    );

    finalPay = Number(parseFloat(finalPay - tien_voucher).toFixed(2));
    tt_none_diem = finalPay;
    
    if (isUsePoint) {
      finalPay = Number(
        parseFloat(
          finalPay-paymentInfo?.diem_sd * hs_quy_doi
          
          //finalPay - paymentInfo?.diem_sd * paymentInfo?.quy_doi_diem
        ).toFixed(2)
      );
    }

    ChangePaymentInfo({
      ...paymentInfo,
      tong_tt: finalPay < 0 ? 0 : finalPay,
      tien_voucher: tien_voucher,
      tt_none_diem: tt_none_diem
    });
  };

  const handleCloseAdvancePayment = useCallback(() => {
    setIsOpenAdvancePayment(false);
  }, []);

  const handlePaymentTypeClick = ({ key }) => {
    setIsQrCode(false);
    if(key!= "chuyen_khoan"){
      setPaymentQR("");
    }
    setPaymentType(key);
  };
  const changeNote =(e)=>{
    setNote(e.value);
    ChangePaymentInfo({...paymentInfo,dien_giai:e.target.value})
  }
  const handleSearch = useDebouncedCallback((newValue)=>{
    multipleTablePutApi({
      store: "Api_search_customers",
      param: {
        valueSearch: filterKeyHelper(newValue),
        unitId,
        storeId,
        userId,
      },
      data: {},
    }).then(res=>{
      if (res.responseModel?.isSucceded) {
        setDataCustomerSearch(_.first(res.listObject))
      }
    })
  },300)
  const handleChange = (newValue,params)=>{
    setValueSearch(newValue);

    const { value, label, dien_thoai, diem,moc_diem,bl_yn,bb_yn } = params.data;
    // setPaymentData({
    //   ...paymentData,
    //   ma_kh: value,
    //   ten_kh: label,
    //   dien_thoai,
    //   diem,
    //   diem_sd:0,
    //   moc_diem:moc_diem
    // });
    setSelectCustomer(params.data)
    onSelectCustomer({
      ma_kh:value,
      ten_kh:label,
      dien_thoai:dien_thoai,
      diem:diem,
      moc_diem:moc_diem,
      bl_yn,
      bb_yn 
    });
  }

  // Lắng nghe sự thay đổi tham số để tính toán
  useEffect(() => {
    if (!_.isEmpty(paymentInfo)) {
      setPaymentData(paymentInfo)
    }
    return () => {};
  }, [paymentInfo]);

  //Kiểm tra đã render lại phiếu chưa và in hoá đơn
  useEffect(() => {
    if (!_.isEmpty(printMaster)) {
      handlePrint();
    }

    return () => {
      setPrintMaster([]);
      setPrintDetail([]);
    };
  }, [JSON.stringify(printMaster)]);

  useEffect(() => {
    setChange(changeCustomerPay);
    return () => {};
  }, [changeCustomerPay]);

  useEffect(() => {
    return () => {
    };
  }, []);

  return (
    <div
      className="border-round-lg overflow-hidden flex flex-column align-items-center justify-content-between"
      style={{  flexShrink: 0, background: "white" }}
    >
      <div className="retail_info_container overflow-y-auto p-2 w-full min-w-0">
        <div className="flex justify-content-between mb-3" id="search-customer">
          <Select
            showSearch
            value={valueSearch}
            placeholder="Tìm kiếm khách hàng"
            defaultActiveFirstOption={false}
            suffixIcon={null}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
            style={{minWidth:"200px",width:"100%"}}
          >
            {
              dataCustomerSearch.map(d=>{
                return  <Select.Option
                  value={d.value}
                  label={d.text}
                  className="px-2"
                  data={d}
                >
                  <div className="flex align-items-center gap-2">
                    <div className="flex gap-3 w-full">{d.label}</div>
                    <div className="text-right ml-3">
                      <span className="ml-1 primary_bold_text pr-2">
                        {d?.dien_thoai?.trim() || ""}
                      </span>
                    </div>
                  </div>
                </Select.Option>
              })
            
            
            }
          </Select>
          <AddCustomerPopup onSave={handleAddCustomerComplete} />
        </div>

        <div  className="flex justify-content-between gap-2 retail-customer-info relative"  style={{ minHeight: 60 }} >
          <div>
            {paymentInfo?.ma_kh ? (
              <>
                <p className="">
                  <b>{paymentInfo?.ma_kh}</b> -{" "}
                  {paymentInfo?.ten_kh || "Không có dữ liệu"}
                </p>
                <p className="">
                  {paymentInfo?.dien_thoai?.trim() || "Không có số điện thoại"}
                </p>
                <div>
                  <span className="primary_bold_text">
                    {formatCurrency(paymentInfo?.diem || 0)} điểm{" "}
                  </span>
                  {isUsePoint && paymentInfo?.diem >=paymentInfo?.moc_diem  && (
                    <b className="danger_text_color">
                      -
                      {paymentInfo?.diem <=
                      paymentInfo?.tong_tt / paymentInfo?.quy_doi_diem
                        ? paymentInfo?.diem
                        : paymentInfo?.tong_tt / paymentInfo?.quy_doi_diem}
                    </b>
                  )}
                </div>
              </>
            ) : (
              <b className="abs_center sub_text_color">Không có dữ liệu</b>
            )}
          </div>
          { selectCustomer && !selectCustomer.bb_yn && selectCustomer.bl_yn ? 
          <UpdateCustomerPopup onSave={handleUpdateCustomerComplete} kh={selectCustomer}></UpdateCustomerPopup>
          :''}
        </div>

        <p className="primary_bold_text text-lg line-height-4">
          Thông tin thanh toán:
        </p>

        <div className="retail_bill_info">
          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">
              Tổng tiền ({paymentInfo?.tong_sl || 0} sản phẩm):
            </span>
            <span className="primary_bold_text line-height-16 white-space-normal">
              {formatCurrency(
                paymentInfo?.tong_tien / (paymentInfo?.ty_gia || 1),
                paymentInfo?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Thuế: <Switch checked={isCalVat} onChange={handleChangeVat} /></span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentInfo?.tong_thue / (paymentData?.ty_gia || 1),
                paymentInfo?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Tổng chiết khấu:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentInfo?.tong_ck / (paymentInfo?.ty_gia || 1),
                paymentInfo?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">
              <Input id="voucher-custom"
              value={voucherChild}
                status={
                  !voucherStatus.valid &&
                  voucherStatus.currentVoucher &&
                  !voucherStatus.loading
                    ? "error"
                    : null
                }
                onChange={(e)=>{changeVoucher(e);handleFindVoucher(e)}}
                allowClear ={{ clearIcon: <CloseOutlined onClick={ onVoucherClear } /> }}
                placeholder="Mã Voucher"
                suffix={
                  voucherStatus.loading ? (
                    <Spin
                      indicator={
                        <LoadingOutlined
                          style={{
                            fontSize: 14,
                          }}
                          spin
                        />
                      }
                    />
                  ) : !voucherStatus.valid && voucherStatus.currentVoucher ? (
                    <CloseCircleTwoTone twoToneColor={"red"} />
                  ) : voucherStatus.valid && voucherStatus.currentVoucher ? (
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  ) : null
                }
              />
            </span>
            <span className="primary_bold_text">
              {formatCurrency(
                (paymentInfo?.tien_voucher || 0) / (paymentInfo?.ty_gia || 1),
                paymentInfo?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          {/* <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Tiền voucher:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                (paymentData?.tien_voucher || 0) / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div> */}

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Sử dụng điểm:</span>
            <InputNumber
              controls={false}
              min="0"
              className="w-full custom_input_design"
              placeholder="0"
              onChange={(e) => {ChangePoint(e)}}
              value={paymentInfo.diem_sd}
              formatter={(value) => formatterNumber(value)}
              parser={(value) => parserNumber(value)}
              style={{border:"none"}}
              disabled={paymentInfo?.moc_diem<maxPoint}
            />
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0" style={{color:"#4779CF",fontWeight:"bold"}}>Thanh toán:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentInfo?.tong_tt / (paymentInfo?.ty_gia || 1),
                paymentInfo?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Bằng chữ:</span>
            <span className="primary_bold_text line-height-16 white-space-normal">
              {num2words(
                parseFloat(
                  (paymentInfo?.tong_tt / (paymentInfo?.ty_gia || 1)).toFixed(
                    paymentInfo?.ma_nt === "VND" ? 0 : 2
                  )
                ) || 0
              )}
            </span>
          </div>

          {/* <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Khách đưa:</span>
            <InputNumber
              controls={false}
              value={change}
              min="0"
              className="w-full custom_input_design"
              placeholder="0"
              onChange={(e) => {setChange(e);}}
              formatter={(value) => formatterNumber(value)}
              parser={(value) => parserNumber(value)}
              style={{border:"none"}}
            />
          </div> */}
        </div>

        <Dropdown
          menu={{
            items: paymentTypeOptions,
            onClick: handlePaymentTypeClick,
          }}
          className="mb-2 mt-2"
        >
          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0 line-height-4 primary_bold_text">
              {
                paymentTypeOptions.find((item) => item.key === paymentType)
                  ?.label
              }
            </span>
            <DownOutlined className="primary_text_color" />
          </div>
        </Dropdown>

        {/* <div className="flex justify-content-between gap-2 align-items-center">
          <span className="w-6 flex-shrink-0 line-height-4">Trả lại:</span>
          <span className="primary_bold_text danger_text_color">
            {formatCurrency(calculateBackMoney)}
          </span>
        </div> */}

        <div className="flex justify-content-between gap-2  mt-2">
          <Input
            value={note}
            placeholder="Ghi chú"
            onChange={changeNote}
            style={{ resize: "none" }}
          />
        </div>
      </div>

      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4" style={{minWidth:"350px"}}>
        {/* <Button  className="w-fit"  onClick={() => {  setIsOpenAdvancePayment(true); handleShowCustomerViewDialog();  }}   >
          Nâng cao (F7)
        </Button>

        <Button type="primary" className="w-full min-w-0" onClick={() => {  handleShowCustomerViewDialog();  handleSave();  }} >
          QrCode (F1)
        </Button> */}
        <Button type="primary" className="w-full min-w-0" style={{background:"#52c41a"}}  onClick={ SaveOrder}  >
          Tạo đơn
        </Button>
      </div>
      <AdvanceRetailPayment
        isOpen={isOpenAdvancePayment}
        total={paymentInfo?.tong_tt / (paymentInfo?.ty_gia || 1)}
        onClose={handleCloseAdvancePayment}
        onSave={handleSave}
        SuccessOrder={SaveOrder}
      />

      <RetailPaymentConfirm
        onOk={handleSave}
        isOpen={isShowConfirmDialog}
        onClose={() => {
          setIsShowConfirmDialog(false);
        }}
      />
      <PrintComponent
        ref={printContent}
        master={printMaster}
        detail={printDetail}
      />

      {contextHolder}
    </div>
  );
};

export default memo(RetailPaidInfo);
