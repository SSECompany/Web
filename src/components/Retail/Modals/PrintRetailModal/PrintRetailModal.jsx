import { Input, message as messageAPI, Modal } from "antd";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import PrintComponent from "./PrintComponent/PrintComponent";
import "./PrintRetailModal.css";

const PrintRetailModal = ({ item, isOpen, onClose }) => {
  const { so_ct, ngay_ct, ma_kh, ten_kh, t_tt, stt_rec } = item;

  const inputPassword = useRef("");
  const [message, contextHolder] = messageAPI.useMessage();
  const [password, setPassword] = useState("123ABC");
  const [master, setMaster] = useState({});
  const [detail, setDetail] = useState([]);

  const [loading, setLoading] = useState(true);
  var printContent = useRef();

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    copyStyles: false,
  });

  const fetchData = async () => {
    setLoading(true);

    await multipleTablePutApi({
      store: "api_get_infomation_print",
      param: {
        stt_rec,
      },
      data: {},
    }).then((res) => {
      const data = res?.listObject || [];
      setMaster(_.first(data[0]));
      setDetail(data[1]);
    });

    setLoading(false);
  };

  const handleOK = async () => {
    if (password === inputPassword?.current?.input?.value || "") {
      handlePrint();
      message.success("Đang tiến hành in");
      const to = await setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      message.warning("Sai mật khẩu");
    }
  };

  useEffect(() => {
    if (!_.isEmpty(item) && isOpen) {
      fetchData();
    }
    return () => {};
    x;
  }, [isOpen]);

  return (
    <Modal
      centered
      open={isOpen}
      destroyOnClose={true}
      onCancel={() => {
        if (!loading) {
          onClose();
        }
      }}
      loading={loading}
      onOk={handleOK}
    >
      <div className="no-print">
        <p className="primary_bold_text text-lg line-height-4">In đơn hàng</p>
        <div className="retail-customer-info mb-2">
          <div>
            <span>Số chứng từ: </span>
            <b className="sub_text_color">{so_ct}</b>
          </div>
          <div>
            <span>Ngày chứng từ: </span>
            <b className="sub_text_color">{ngay_ct}</b>
          </div>
          <div>
            <span>Khách hàng: </span>
            <b className="sub_text_color">
              {ma_kh} - {ten_kh}
            </b>
          </div>
          <div>
            <span>Tiền thanh toán: </span>
            <b className="sub_text_color">{t_tt}</b>
          </div>
        </div>
        <div>
          <label>Nhập mật khẩu</label>
          <Input
            type={"password"}
            autoComplete="false"
            autoCapitalize="false"
            defaultValue=""
            ref={inputPassword}
            required
            minLength={8}
            placeholder="Nhập mật khẩu"
          />
        </div>
      </div>
      <PrintComponent
        ref={printContent}
        master={master}
        detail={detail}
        items={[1, 2, 3, 4, 5, 6]}
      />
      {contextHolder}
    </Modal>
  );
};

export default PrintRetailModal;
