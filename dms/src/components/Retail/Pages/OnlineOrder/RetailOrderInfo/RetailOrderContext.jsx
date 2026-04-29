import React, { createContext, useState, useEffect } from 'react';
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import _ from 'lodash';

// Tạo Context
export const RetailOrderContext = createContext();

// Tạo Provider
export const RetailOrderProvider = ({ children }) => {
    const { id: userId } = useSelector(getUserInfo); // Di chuyển useSelector vào đây

    const [currencyOptions, setCurrencyOptions] = useState([]);
    const [taxOptions, setTaxOptions] = useState([]);
    const [paymentInfo, setPaymentInfo] = useState({});
    const [autoCalPromotion, setAutoCalPromotion] = useState(false);
    const [isMergeRowData, setIsMergeRowData] = useState(false);

    // Hàm để lấy các thiết lập cho phiếu
    const fetchRetailOptions = () => {
        multipleTablePutApi({
            store: "Api_get_retail_options",
            param: {
                userId,
            },
            data: {},
        }).then((res) => {
            if (res.responseModel?.isSucceded) {
                setCurrencyOptions(res?.listObject[0] || []);
                setTaxOptions(res?.listObject[1] || []);
                setPaymentInfo({
                    ...paymentInfo,
                    quy_doi_diem: parseInt(_.first(res?.listObject[2])?.val) || 0,
                });
                setAutoCalPromotion(
                    _.first(res?.listObject[3])?.val === "1" ? true : false
                );
                setIsMergeRowData(
                    _.first(res?.listObject[4])?.val === "1" ? true : false
                );
            }
        });
    };

    useEffect(() => {
        fetchRetailOptions();
    }, [userId]);

    const value = {
        currencyOptions,
        setCurrencyOptions,
        taxOptions,
        setTaxOptions,
        paymentInfo,
        setPaymentInfo,
        autoCalPromotion,
        setAutoCalPromotion,
        isMergeRowData,
        setIsMergeRowData,
        fetchRetailOptions,
    };

    return (
        <RetailOrderContext.Provider value={value}>
            {children}
        </RetailOrderContext.Provider>
    );
};
