import React, { memo, useEffect } from "react";
import { useSelector } from "react-redux";
import { resetRetailOrder } from "../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../Store/Selectors/RetailOrderSelectors";
import "./RetailOrder.css";
import RetailOrderInfo from "./RetailOrderInfo/RetailOrderInfo";
import { RetailOrderProvider } from './RetailOrderInfo/RetailOrderContext';

const RetailOrder = () => {
  const { listOrder, currentOrder } = useSelector(getRetailOrderState);

  useEffect(() => {
    return () => {
      resetRetailOrder();
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
