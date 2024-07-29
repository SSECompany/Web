import { Form } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAllValueByColumn,
  getAllValueByRow,
  getCellName,
  getRowKey,
} from "../../../../../../app/Functions/getTableValue";
import { formStatus } from "../../../../../../utils/constants";
import EditableTable from "../../../../../ReuseComponents/EditableTable/EditableTable";
import { setPaymentSaleOrderInfo } from "../../../../Store/Sagas/SaleOrderActions";
import { getSaleOrderInfo } from "../../../../Store/Selector/Selector";

const DetailTableSaleOrder = ({ detailForm }) => {
  const { action, detailInfo, paymentInfo } = useSelector(getSaleOrderInfo);
  const [columns, setColumns] = useState([]);
  const [currentAction, setCurrentAction] = useState("");
  const [dataSource, setDataSource] = useState([]);

  const calTotalPayment = async () => {
    const totalPayment = {
      t_so_luong: 0,
      t_tt: 0,
      t_tien: 0,
      t_thue: 0,
      t_ck: 0,
    };
    const allCells = detailForm.getFieldsValue();
    totalPayment.t_so_luong = await getAllValueByColumn(
      "so_luong",
      allCells
    ).reduce((Sum, num) => Sum + num, 0);
    totalPayment.t_ck = await getAllValueByColumn("ck", allCells).reduce(
      (Sum, num) => Sum + num,
      0
    );
    totalPayment.t_tien = await getAllValueByColumn("tien", allCells).reduce(
      (Sum, num) => Sum + num,
      0
    );
    totalPayment.t_thue = 0;

    totalPayment.t_tt =
      totalPayment.t_tien - totalPayment.t_ck + totalPayment.t_thue;

    console.log("set ở detail", paymentInfo);
    setPaymentSaleOrderInfo({ ...paymentInfo, ...totalPayment });
  };

  const handleChangedValues = async (cellChanged, allCells) => {
    const cellName = getCellName(_.first(Object.keys(cellChanged)));
    const changedRowKey = getRowKey(_.first(Object.keys(cellChanged)));
    const rowValues = await getAllValueByRow(changedRowKey, allCells);
    const allCellsValues = await getAllValueByColumn(cellName, allCells);

    switch (cellName) {
      case "so_luong":
        detailForm.setFieldValue(
          `${changedRowKey}_tien`,
          (rowValues?.so_luong || 0) * (rowValues?.gia || 0)
        );

        detailForm.setFieldValue(
          `${changedRowKey}_ck`,
          ((rowValues?.so_luong || 0) *
            (rowValues?.gia || 0) *
            (rowValues?.tl_ck || 0)) /
            100
        );

        calTotalPayment();
        break;

      case "gia":
        detailForm.setFieldValue(
          `${changedRowKey}_tien`,
          (rowValues?.so_luong || 0) * (rowValues?.gia || 0)
        );

        detailForm.setFieldValue(
          `${changedRowKey}_ck`,
          ((rowValues?.so_luong || 0) *
            (rowValues?.gia || 0) *
            (rowValues?.tl_ck || 0)) /
            100
        );

        calTotalPayment();

        break;

      case "tl_ck":
        detailForm.setFieldValue(
          `${changedRowKey}_tien`,
          (rowValues?.so_luong || 0) * (rowValues?.gia || 0)
        );

        detailForm.setFieldValue(
          `${changedRowKey}_ck`,
          ((rowValues?.so_luong || 0) *
            (rowValues?.gia || 0) *
            (rowValues?.tl_ck || 0)) /
            100
        );

        calTotalPayment();
        break;

      default:
        break;
    }
  };

  const scrollToField = (field, fieldName) => {
    if (currentAction !== formStatus.VIEW) {
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

  useEffect(() => {
    setCurrentAction(action || formStatus.VIEW);
    return () => {};
  }, [action]);

  useEffect(() => {
    if (detailInfo?.columns?.length > 0) {
      if (columns?.length == 0) setColumns(detailInfo?.columns || []);
      setDataSource(detailInfo?.data || []);
    }
    return () => {};
  }, [detailInfo]);

  return (
    <Form
      form={detailForm}
      component={false}
      onValuesChange={handleChangedValues}
    >
      <EditableTable
        form={detailForm}
        action={currentAction}
        colData={columns}
        rowData={dataSource}
      />
    </Form>
  );
};

export default DetailTableSaleOrder;
