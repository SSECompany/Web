import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

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
import _ from "lodash";
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
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import emitter from "../../../../../utils/emitter";
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import AdvanceRetailPayment from "../../../Modals/AdvanceRetailPayment/AdvanceRetailPayment";
import PrintComponent from "../../../Modals/PrintRetailModal/PrintComponent/PrintComponent";
import RetailPaymentConfirm from "../../../Modals/RetailPaymentConfirm/RetailPaymentConfirm";
import { modifyIsFormLoading } from "../../../Store/Actions/RetailOrderActions";
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
      setIsShowConfirmDialog(true);
      handleShowCustomerViewDialog();
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

  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);

  var printContent = useRef();
  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    copyStyles: false,
  });

  const [paymentType, setPaymentType] = useState("tien_mat");

  const [paymentData, setPaymentData] = useState({});

  const [change, setChange] = useState(0);
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
  const [isUsePoint, setIsUsePoint] = useState(false);
  const [isOpenAdvancePayment, setIsOpenAdvancePayment] = useState(false);
  const [isShowConfirmDialog, setIsShowConfirmDialog] = useState(false);

  const { isFormLoading } = useSelector(getRetailOrderState);
  const { id: userId, storeId, unitId } = useSelector(getUserInfo);

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
      return detailData.push(getAllValueByRow(item, data));
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

  // Lưu phiếu
  const handleSave = useCallback(
    async (paymentMethods, paymentMethodInfo, type = "SIMPLE") => {
      const [masterData, detailData] = await prepareOrderData(
        paymentMethods,
        paymentMethodInfo
      );
      var master = { ...masterData };
      if (type === "SIMPLE") {
        master = {
          ...masterData,
          tien_mat: paymentType === "tien_mat" ? masterData.tong_tt : 0,
          tien_the: paymentType === "tien_the" ? masterData.tong_tt : 0,
          chuyen_khoan: paymentType === "chuyen_khoan" ? masterData.tong_tt : 0,
          httt: paymentType,
        };
      }

      modifyIsFormLoading(true);

      if (change - paymentData?.tong_tt < 0 && !isOpenAdvancePayment) {
        message.warning("Tiền thanh toán không đủ !");
        modifyIsFormLoading(false);
        return;
      }

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

      if (master?.chuyen_khoan > 0) {
        setPaymentQR(
          `https://img.vietqr.io/image/970436-0551000325525-print.png?amount=${
            master?.chuyen_khoan || 0
          }&addInfo=TEST&accountName=MACH%20HAI%20HUNG&randon=${Math.floor(
            Math.random() * 10000
          )}`
        );
      }

      setIsShowConfirmDialog(false);

      const result = await multipleTablePutApi({
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
            },
          ],
          detail: detailData,
        },
      })
        .then((res) => {
          if (res?.responseModel?.isSucceded) {
            notification.success({
              message: `Thực hiện thành công`,
            });

            onResetForm();

            emitter.emit("HANDLE_RETAIL_ORDER_SAVE");
            handleCloseAdvancePayment();
            return _.first(res.listObject[0]);
          } else {
            notification.warning({
              message: res?.responseModel?.message,
            });
            return null;
          }
        })
        .catch((res) => {
          return null;
        });

      // In phiếu
      if (result && !_.isEmpty(result)) {
        await multipleTablePutApi({
          store: "api_get_infomation_print",
          param: {
            stt_rec: result?.stt_rec,
          },
          data: {},
        }).then((res) => {
          const data = res?.listObject || [];
          setPrintMaster(_.first(data[0]));
          setPrintDetail(data[1]);
        });
      }
      modifyIsFormLoading(false);
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

    tien_voucher = Number(
      parseFloat(
        voucher?.tl_ck
          ? (voucher?.tl_ck * paymentInfo?.tong_tien) / 100
          : voucher?.tien_ck
      ).toFixed(2)
    );

    finalPay = Number(parseFloat(finalPay - tien_voucher).toFixed(2));

    if (isUsePoint) {
      finalPay = Number(
        parseFloat(
          finalPay - paymentInfo?.diem * paymentInfo?.quy_doi_diem
        ).toFixed(2)
      );
    }

    setPaymentData({
      ...paymentInfo,
      tong_tt: finalPay < 0 ? 0 : finalPay,
      tien_voucher: tien_voucher,
    });
  };

  const handleCloseAdvancePayment = useCallback(() => {
    setIsOpenAdvancePayment(false);
  }, []);

  const handlePaymentTypeClick = ({ key }) => {
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
      setPaymentQR("");
    };
  }, []);

  return (
    <div
      className="border-round-lg overflow-hidden flex flex-column align-items-center justify-content-between"
      style={{ width: "23rem", flexShrink: 0, background: "white" }}
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
              min="0"
              className="w-full"
              placeholder="0"
              onChange={(e) => {
                setChange(e);
              }}
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
            setIsShowConfirmDialog(true);
            handleShowCustomerViewDialog();
          }}
          disabled={isFormLoading || cantSave}
        >
          Thanh toán (F1)
        </Button>
      </div>
      <AdvanceRetailPayment
        isOpen={isOpenAdvancePayment}
        total={paymentData?.tong_tt / (paymentData?.ty_gia || 1)}
        onClose={handleCloseAdvancePayment}
        onSave={handleSave}
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
