import { Button, Col, Divider, Form, message, Steps } from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../../app/Functions/getTableValue";
import { formStatus } from "../../../../../utils/constants";
import emitter from "../../../../../utils/emitter";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import {
  setActionSaleOrder,
  setMasterSaleOrderInfo,
  setPaymentSaleOrderInfo,
  setSaleOrderCurrentStep,
  setSaleOrderInsertDetails,
} from "../../../Store/Sagas/SaleOrderActions";
import { getSaleOrderInfo } from "../../../Store/Selector/Selector";
import DetailTableSaleOrder from "./DetailTableSaleOrder/DetailTableSaleOrder";
import MasterSaleOrder from "./MasterSaleOrder/MasterSaleOrder";
import ShippingAndPayment from "./ShippingAndPayment/ShippingAndPayment";

const stepItems = [
  {
    key: 0,
    title: "Thông tin đơn hàng",
  },
  {
    key: 1,
    title: "Thanh toán và vận chuyển",
  },
];

const DetailSaleOrder = () => {
  const [shipNPayForm] = Form.useForm();
  const [masterForm] = Form.useForm();
  const [detailForm] = Form.useForm();
  const [shipNPayInit, setshipNPayInit] = useState({});
  const [masterFormInit, setMasterFormInit] = useState({});
  const { loading, currentStep, paymentInfo, masterInfo, action } =
    useSelector(getSaleOrderInfo);
  const [stepButtonDisable, setStepButtonDisable] = useState({
    nextDisabled: true,
    prevDisabled: false,
  });

  const onStepChange = (value) => {
    setSaleOrderCurrentStep(value);
  };

  const scrollToField = (field, fieldName) => {
    if (action !== formStatus.VIEW) {
      const allFields = detailForm.getFieldsValue(true);
      if (!fieldName) {
        const itemFocusName = Object.keys(allFields)
          .filter((item) => item.includes(field))
          .pop();
        document.getElementById(itemFocusName).focus();
        document.getElementById(itemFocusName).scrollIntoView();
      } else {
        document.getElementById(fieldName).focus();
        document.getElementById(fieldName).scrollIntoView();
      }
    }
  };

  const handleShipNPayValidate = async () => {
    try {
      await shipNPayForm.validateFields();
      console.log("shipNpay", shipNPayForm.getFieldsValue());
      setPaymentSaleOrderInfo({
        ...paymentInfo,
        ...shipNPayForm.getFieldsValue(),
      });
      return true;
    } catch (error) {
      console.log("Ship N pay", error);
      setSaleOrderCurrentStep(1);
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  const handleMasterValidate = async () => {
    try {
      await masterForm.validateFields();
      await setMasterSaleOrderInfo(masterForm.getFieldValue());
      console.log("masterForm", masterForm.getFieldsValue());
      return true;
    } catch (error) {
      console.log("Master", error);
      setSaleOrderCurrentStep(0);
      scrollToField("", error?.errorFields[0]?.name[0]);

      return false;
    }
  };

  const handleDetailValidate = async () => {
    try {
      await detailForm.validateFields();
      const detailData = [];

      getAllRowKeys(detailForm.getFieldsValue()).map((item) => {
        return detailData.push(
          getAllValueByRow(item, detailForm.getFieldsValue())
        );
      });

      console.log("detailData", detailData);
      if (_.isEmpty(detailData)) {
        message.warning("Vui lòng thêm vật tư !");
        await setSaleOrderCurrentStep(0);
        return false;
      }

      await setSaleOrderInsertDetails(detailData);
      return true;
    } catch (error) {
      await setSaleOrderCurrentStep(0);
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  useEffect(() => {
    setStepButtonDisable({
      nextDisabled: currentStep == stepItems.length - 1 ? true : false,
      prevDisabled: currentStep == 0 ? true : false,
    });
    return () => {
      setStepButtonDisable({ nextDisabled: true, prevDisabled: false });
    };
  }, [currentStep]);

  ////////////Xử lý forms////////////////////

  /*Thông tin vận chuyển và thanh toán*/
  useEffect(() => {
    var init = { ...paymentInfo };
    init.ngay_nhan = dayjs(init?.ngay_nhan || undefined);
    setshipNPayInit(init);
    return () => {};
  }, [paymentInfo]);

  /*Thông tin chính*/
  useEffect(() => {
    setMasterFormInit(masterInfo);
    return () => {};
  }, [masterInfo]);

  /*Khi form load*/
  useEffect(() => {
    emitter.on("HANDLE_SALE_ORDER_SAVE", async () => {
      try {
        var shipNPayValid = await handleShipNPayValidate();
        if (!shipNPayValid) return;

        var masterValid = await handleMasterValidate();
        if (!masterValid) return;

        var detailValid = await handleDetailValidate();
        if (!detailValid) return;

        if (shipNPayValid && masterValid && detailValid)
          await setActionSaleOrder(formStatus.SAVED);
      } catch (error) {}
    });

    return () => {
      emitter.removeAllListeners();
    };
  }, []);

  return (
    <Col span={14} className="flex flex-column h-full min-h-0 gap-3">
      <div
        className="w-full h-full min-h-0 p-2 border-round-lg flex flex-column gap-2 relative"
        style={{ background: "white" }}
      >
        {loading ? (
          <LoadingComponents size={50} loading={loading} text={"Đang tải"} />
        ) : (
          <>
            <div className="flex gap-2 align-items-center gap-5">
              <Button
                className="default_button"
                disabled={stepButtonDisable.prevDisabled}
                onClick={() => {
                  onStepChange(currentStep - 1);
                }}
              >
                <i
                  className="pi pi-angle-left sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>

              <Steps
                onChange={onStepChange}
                size="small"
                current={currentStep}
                items={stepItems}
              />

              <Button
                className="default_button"
                disabled={stepButtonDisable.nextDisabled}
                onClick={() => {
                  onStepChange(currentStep + 1);
                }}
              >
                <i
                  className="pi pi-angle-right sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </div>

            <div className="h-full min-h-0">
              <div
                style={{
                  display: `${
                    stepItems[currentStep].key == 0 ? "flex" : "none"
                  }`,
                }}
                className="h-full min-h-0 flex-column"
              >
                <Form
                  form={masterForm}
                  className="relative flex flex-column gap-2"
                  initialValues={masterFormInit}
                >
                  <MasterSaleOrder
                    masterForm={masterForm}
                    init={masterFormInit}
                  />
                </Form>
                <Divider />
                <DetailTableSaleOrder detailForm={detailForm} />
              </div>
              <div
                className="h-full min-h-0"
                style={{
                  display: `${
                    stepItems[currentStep].key == 1 ? "block" : "none"
                  }`,
                }}
              >
                <Form
                  form={shipNPayForm}
                  component={false}
                  initialValues={shipNPayInit}
                >
                  <ShippingAndPayment
                    shipNPayForm={shipNPayForm}
                    init={shipNPayInit}
                  />
                </Form>
              </div>
            </div>
          </>
        )}
      </div>
    </Col>
  );
};

export default DetailSaleOrder;
