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
  Spin,
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
  onResetForm,
  cantSave,
  isChangedData,
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
    "CUSTOMER_RETAILORDER_DATA",
    null
  );
  const noteRef = useRef("");
  const {tk_nh,bin,hs_quy_doi} = useSelector(getUerSetting);

  const [printMaster, setPrintMaster] = useState({});
  //const [so_ct, setSo_ct] = useState("");
  const [printDetail, setPrintDetail] = useState([]);
  const [isCreatingOrder,setIsCreatingOrder]=useState(false);

  var printContent = useRef();
  const beforePrint =()=>{
    console.log("after printing...");
    //SaveOrder();
  }
  const handlePrint2 =()=>{
    console.log('ok2')
  }
  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    onAfterPrint: beforePrint,
    copyStyles: false,
  });

  const [paymentType, setPaymentType] = useState("tien_mat");

  const [paymentData, setPaymentData] = useState({});

  const [change, setChange] = useState(0);
  const [point, setPoint] = useState(0);
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
  const [isUsePoint, setIsUsePoint] = useState(true);
  const [isOpenAdvancePayment, setIsOpenAdvancePayment] = useState(false);
  const [isShowConfirmDialog, setIsShowConfirmDialog] = useState(false);

  const { isFormLoading } = useSelector(getRetailOrderState);
  const { id: userId, storeId, unitId,storeName } = useSelector(getUserInfo);

  //Chuẩn bị dữ liệu
  const prepareOrderData = (paymentMethods, paymentMethodInfo) => {
    const data = { ...itemForm.getFieldsValue() };
    const masterData = {
      ...paymentData,
      ...paymentMethodInfo,
      tien_mat: paymentMethods
        ? paymentMethodInfo?.tien_mat
        : paymentData?.tong_tt,
      httt: paymentMethods || "tien_mat",
      dien_giai: noteRef?.current?.resizableTextArea?.textArea?.value || "",
    };

    const detailData = [];

    getAllRowKeys(data).map((item) => {
      var temp=getAllValueByRow(item, data);
      if(!temp.ghi_chu) temp={...temp,ghi_chu:''}
      return detailData.push(temp);
    });

    return [masterData, detailData];
  };

  //Hiển thị xác nhận lưu phiếu
  const handleShowCustomerViewDialog = async () => {
    const RETAILDATA = await prepareOrderData();
    setRetailOrderData(JSON.stringify(RETAILDATA));
  };

  //Ẩn xác nhận lưu phiếu
  const handleHideCustomerViewDialog = useCallback(async () => {
    setRetailOrderData(JSON.stringify(""));
  }, []);

  const SucessOrder = ()=>{
    SaveOrder();
  }
  const SuccessOrder= ()=>{
    SaveOrder();
  }
  const ChangePoint = (e)=>{
    paymentInfo.diem_sd=e;
    setPoint(e);
    CalFinalPayment();
  }
  const SaveOrder =  async (paymentMethods, paymentMethodInfo, type = "SIMPLE") => {
      if(isCreatingOrder) return;
      setIsCreatingOrder(true);

      const [masterData, detailData] = await prepareOrderData(
        paymentMethods,
        paymentMethodInfo
      );

      var master = { ...masterData};
      if (type === "SIMPLE") {
        master = {
          ...masterData,
          tien_mat: paymentType === "tien_mat" ? masterData.tong_tt : 0,
          tien_the: paymentType === "tien_the" ? masterData.tong_tt : 0,
          chuyen_khoan: paymentType === "chuyen_khoan" ? masterData.tong_tt : 0,
          httt: paymentType,
        };
      }
      if(so_ct.so_ct){
        master={...master,so_ct:so_ct.so_ct};
      }
      else{
        const temp_so_ct =await multipleTablePutApi({
          store: "GetTblSoCt",
          param: {
            so_ct:""
          },
          data: {},
        })
        const data_so_ct = temp_so_ct?.listObject || [];
        master={...master,so_ct:_.first(data_so_ct[0]).so_ct}
      }
      

      modifyIsFormLoading(true);

      if (change - paymentData?.tong_tt < 0 && !isOpenAdvancePayment) {
        message.warning("Tiền thanh toán không đủ !");
        modifyIsFormLoading(false);
        setIsCreatingOrder(false);
        return;
      }

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
      setPrintMaster(master);
      var temp =master.diem_sd;
      setPrintDetail(detailData);

      multipleTablePutApi({
        arandomnumber: Math.floor(Math.random() * 10000),
        store: "Api_create_retail_order",
        param: {
          UnitID: unitId,
          StoreID: storeId,
          userId,
        },
        data: {
          master: [
            {
              ...master,
              voucher: voucher.voucherId,
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

            onResetForm();
            setPaymentQR('');
            emitter.emit("HANDLE_RETAIL_ORDER_SAVE");
            handleCloseAdvancePayment();
            setChange(0);
            return _.first(res.listObject[0]);
          } else {
            notification.warning({
              message: res?.responseModel?.message,
            });
            return null;
          }
        })
        .catch((res) => {
          setIsCreatingOrder(true);
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
      setPaymentType('chuyen_khoan');
      await setChange(paymentData.tong_tt);

      console.log('zzzzz');
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


      const [masterData, detailData] = await prepareOrderData(
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
          tien_mat: paymentType === "tien_mat" ? masterData.tong_tt : 0,
          tien_the: paymentType === "tien_the" ? masterData.tong_tt : 0,
          chuyen_khoan: paymentType === "chuyen_khoan" ? masterData.tong_tt : 0,
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
      console.log(master);
      if (master?.tong_tt > 0) {
        console.log('setchuyenkhoan');
        setPaymentQR(
          `https://img.vietqr.io/image/${bin}-${tk_nh}-EEmxQTR.jpg?amount=${
            master?.tong_tt || 0
          }&addInfo=${so_ct_temp.so_ct}%20${storeName}`
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

  // Xác thực voucher
  const handleFindVoucher = useDebouncedCallback(async (e) => {
    const value = e.target.value;
    if (value) {
      setVoucherStatus({
        ...voucherStatus,
        currentVoucher: value,
        loading: true,
      });
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
            const { tl_ck, tien_ck } = _.first(_.first(res?.listObject));

            setVoucher({
              voucherId: value,
              tien_ck,
              tl_ck,
            });

            setVoucherStatus({
              ...voucherStatus,
              currentVoucher: value,
              valid: true,
              loading: false,
            });

            return;
          }
        }

        setVoucherStatus({
          ...voucherStatus,
          currentVoucher: value,
          valid: false,
          loading: false,
        });
      });

      return;
    }
    setVoucherStatus({
      ...voucherStatus,
      currentVoucher: value,
      valid: false,
      loading: false,
    });
  }, 300);

  // Set khách hàng khi thêm mới
  const handleAddCustomerComplete = useCallback(
    ({ ma_kh, ten_kh, dien_thoai }) => {
      onChangeCustomer({
        ma_kh,
        ten_kh,
        dien_thoai,
      });
    },
    [paymentData]
  );

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

    setPaymentData({
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
    console.log(key);
    if(key!= "tien_mat"){
      setPaymentQR("");
    }
    setPaymentType(key);
  };

  // Lắng nghe sự thay đổi tham số để tính toán
  useEffect(() => {
    if (!_.isEmpty(paymentInfo)) {
      CalFinalPayment();
    }
    return () => {};
  }, [paymentInfo, isUsePoint, voucher]);

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
    if (isChangedData) {
      handleShowCustomerViewDialog();
    }
    return () => {};
  }, [JSON.stringify(isChangedData)]);

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
        <div className="flex justify-content-between mb-3">
          <span className="primary_bold_text text-lg line-height-4">
            Thông tin khách hàng:
          </span>
          <AddCustomerPopup onSave={handleAddCustomerComplete} />
        </div>

        <div
          className="retail-customer-info relative"
          style={{ minHeight: 60 }}
        >
          {paymentData?.ma_kh ? (
            <>
              <p className="">
                <b>{paymentData?.ma_kh}</b> -{" "}
                {paymentData?.ten_kh || "Không có dữ liệu"}
              </p>
              <p className="">
                {paymentData?.dien_thoai?.trim() || "Không có số điện thoại"}
              </p>
              <div>
                <span className="primary_bold_text">
                  {formatCurrency(paymentData?.diem || 0)} điểm{" "}
                </span>
                {isUsePoint && (
                  <b className="danger_text_color">
                    -
                    {paymentData?.diem <=
                    paymentInfo?.tong_tt / paymentInfo?.quy_doi_diem
                      ? paymentData?.diem
                      : paymentInfo?.tong_tt / paymentInfo?.quy_doi_diem}
                  </b>
                )}
              </div>
            </>
          ) : (
            <b className="abs_center sub_text_color">Không có dữ liệu</b>
          )}
        </div>

        <p className="primary_bold_text text-lg line-height-4">
          Thông tin thanh toán:
        </p>

        <div className="retail_bill_info">
          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">
              Tổng tiền ({paymentData?.tong_sl || 0} sản phẩm):
            </span>
            <span className="primary_bold_text line-height-16 white-space-normal">
              {formatCurrency(
                paymentData?.tong_tien / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Tổng thuế:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentData?.tong_thue / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Tổng chiết khấu:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentData?.tong_ck / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Voucher:</span>
            <span className="primary_bold_text">
              <Input
                status={
                  !voucherStatus.valid &&
                  voucherStatus.currentVoucher &&
                  !voucherStatus.loading
                    ? "error"
                    : null
                }
                onChange={handleFindVoucher}
                allowClear
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
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Tiền voucher:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                (paymentData?.tien_voucher || 0) / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Sử dụng điểm:</span>
            <InputNumber
              controls={paymentInfo.diem_sd}
              min="0"
              className="w-full"
              placeholder="0"
              onChange={(e) => {
                ChangePoint(e)
              }}
              value={paymentInfo.diem_sd}
              formatter={(value) => formatterNumber(value)}
              parser={(value) => parserNumber(value)}
            />
            <Switch
              checked={isUsePoint}
              onChange={(e) => {
                setIsUsePoint(e);
              }}
            />
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Thanh toán:</span>
            <span className="primary_bold_text">
              {formatCurrency(
                paymentData?.tong_tt / (paymentData?.ty_gia || 1),
                paymentData?.ma_nt === "VND" ? 0 : 2
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Bằng chữ:</span>
            <span className="primary_bold_text line-height-16 white-space-normal">
              {num2words(
                parseFloat(
                  (paymentData?.tong_tt / (paymentData?.ty_gia || 1)).toFixed(
                    paymentData?.ma_nt === "VND" ? 0 : 2
                  )
                ) || 0
              )}
            </span>
          </div>

          <div className="flex justify-content-between gap-2 align-items-center">
            <span className="w-6 flex-shrink-0">Khách đưa:</span>
            <InputNumber
              controls={false}
              value={change}
              min="0"
              className="w-full"
              placeholder="0"
              onChange={(e) => {setChange(e);}}
              formatter={(value) => formatterNumber(value)}
              parser={(value) => parserNumber(value)}
            />
          </div>
        </div>

        <Dropdown
          menu={{
            items: paymentTypeOptions,
            onClick: handlePaymentTypeClick,
          }}
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

        <div className="flex justify-content-between gap-2 align-items-center">
          <span className="w-6 flex-shrink-0 line-height-4">Trả lại:</span>
          <span className="primary_bold_text danger_text_color">
            {formatCurrency(calculateBackMoney)}
          </span>
        </div>

        <div className="flex flex-column justify-content-between gap-2 ">
          <span className="w-6 flex-shrink-0 line-height-4">Ghi chú:</span>
          <Input.TextArea
            ref={noteRef}
            autoSize={{
              minRows: 1,
              maxRows: 3,
            }}
            style={{ resize: "none" }}
          />
        </div>
      </div>

      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4">
        <Button
          disabled={cantSave}
          className="w-fit"
          onClick={() => {
            setIsOpenAdvancePayment(true);
            handleShowCustomerViewDialog();
          }}
        >
          Nâng cao (F7)
        </Button>

        <Button
          type="primary"
          className="w-full min-w-0"
          onClick={() => {
            // setIsShowConfirmDialog(true);
            handleShowCustomerViewDialog();
            handleSave();
          }}
          disabled={isFormLoading || cantSave}
        >
          QrCode (F1)
        </Button>
        <Button type="primary" className="w-full min-w-0" style={{background:"#52c41a"}} disabled={isCreatingOrder||isFormLoading || cantSave}
           onClick={ SaveOrder}
        >
          Hoàn thành
        </Button>
      </div>
      <AdvanceRetailPayment
        isOpen={isOpenAdvancePayment}
        total={paymentData?.tong_tt / (paymentData?.ty_gia || 1)}
        onClose={handleCloseAdvancePayment}
        onSave={handleSave}
        SuccessOrder={SuccessOrder}
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
