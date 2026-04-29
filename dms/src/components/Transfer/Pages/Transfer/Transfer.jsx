import { Button } from "antd";
import { memo, useEffect } from "react";

import useLocalStorage from "use-local-storage";
import { actionSetOpenTransfer } from '../../Store/Actions/TransferActions';
import TransferInfo from './Transfer/TransferInfo';

const RetailOrder = () => {
  const [paymentQR, setPaymentQR] = useLocalStorage("QRimg", "");

  useEffect(() => {
    return () => {
      setPaymentQR('');
    };
  }, []);
  const handleShowList = () => {
    actionSetOpenTransfer(true);
  }

  return (
    <div className="p-2 h-full flex flex-column align-items-stretch">
      <div className="w-full mt-2 mb-5 shadow-2 title_component p-3 flex justify-content-between gap-2 align-items-center  ">
        <h3>Đề nghị xuất điều chuyển</h3>
        <div>
          <Button onClick={handleShowList} >Danh sách</Button>
        </div>
      </div>

      <TransferInfo />

    </div>

  );
};

export default memo(RetailOrder);
