import { memo, useEffect } from "react";
import { useSelector } from "react-redux";
import useLocalStorage from "use-local-storage";
import { resetRetailOrder } from "../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../Store/Selectors/RetailOrderSelectors";
import "./EditOrder.css";
import { RetailOrderProvider } from './RetailOrderInfo/RetailOrderContext';
import RetailOrderInfo from "./RetailOrderInfo/RetailOrderInfo";

const EditOrder = () => {
  const { listOrder, currentOrder } = useSelector(getRetailOrderState);
  const [paymentQR, setPaymentQR] = useLocalStorage("QRimg", "");
  const [retailOrderData, setRetailOrderData] = useLocalStorage(
    "CUSTOMER_RETAILORDER_DATA", null
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
        {listOrder.map((item, index) => (
          <div key={item} className={currentOrder !== item ? "hidden" : "h-full"}>
            <RetailOrderInfo orderKey={item} currentTabOrder={index} />
          </div>
        ))}
      </div>
    </RetailOrderProvider>

  );
};

export default memo(EditOrder);
