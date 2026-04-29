import { memo, useEffect } from "react";
import { useSelector } from "react-redux";
import useLocalStorage from "use-local-storage";
import { resetRetailOrder } from "../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../Store/Selectors/RetailOrderSelectors";
import "./RetailOrder.css";
import { RetailOrderProvider } from './RetailOrderInfo/RetailOrderContext';
import RetailOrderInfo from "./RetailOrderInfo/RetailOrderInfo";

const RetailOrder = () => {
  const { listOrder, currentOrder } = useSelector(getRetailOrderState);
  const [paymentQR, setPaymentQR] = useLocalStorage("QRimg", "");
  const [retailOrderData, setRetailOrderData] = useLocalStorage(
    "CUSTOMER_RETAILORDER_DATA", null, {
    syncData: false
  }
  );

  useEffect(() => {
    return () => {
      setRetailOrderData("");
      resetRetailOrder();
      setPaymentQR("");
    };
  }, []);

  return (
    <RetailOrderProvider>
      <div className="p-2 h-full flex flex-column align-items-stretch">
        {listOrder.map((item) => (
          <div key={item} className={currentOrder !== item ? "hidden" : "h-full"}>
            <RetailOrderInfo orderKey={item} />
          </div>
        ))}
      </div>
    </RetailOrderProvider>

  );
};

export default memo(RetailOrder);
