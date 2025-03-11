import { message as messageAPI, Modal } from "antd";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../../api";
import PrintComponent from "./PrintComponent/PrintComponent";
import "./PrintOrderModal.css";

const PrintOrderModal = ({ item, isOpen, onClose }) => {
  const { so_ct, ngay_ct, stt_rec } = item;
  const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
  const [message, contextHolder] = messageAPI.useMessage();

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
      store: "api_get_infomation_print_PXI",
      param: {
        stt_rec,
        unitId: unitId,
        storeId: storeId,
        userId: id,
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
    handlePrint();
    message.success("Đang tiến hành in");
    const to = await setTimeout(() => {
      onClose();
    }, 1500);
  };

  useEffect(() => {
    if (!_.isEmpty(item) && isOpen) {
      fetchData();
    }
    return () => { };
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

export default PrintOrderModal;
