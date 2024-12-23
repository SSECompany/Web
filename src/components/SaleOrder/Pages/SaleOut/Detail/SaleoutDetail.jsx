import { Form } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAllValueByColumn,
  getAllValueByRow,
} from "../../../../../app/Functions/getTableValue";
import { formStatus } from "../../../../../utils/constants";
import EditableTable from "../../../../ReuseComponents/EditableTable/EditableTable";
import {
  getCurrentSaleOutDetail,
  getSaleOutInfo,
} from "../../../Store/Selector/Selector";

const TableDetail = ({ detailForm, masterForm }) => {
  const { action } = useSelector(getSaleOutInfo);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [currentAction, setCurrentAction] = useState("");

  const currentSaleOutDetail = useSelector(getCurrentSaleOutDetail);

  const handleChangedValues = async (changedValues, allValues) => {
    try {
      var columnsValues = [];
      var rowValues = {};
      const keys = Object.keys(allValues);
      const changedObject = Object.keys(changedValues)[0];

      const changedKey = changedObject.substring(0, changedObject.indexOf("_"));
      const changedColumn = changedObject.substring(
        changedObject.indexOf("_") + 1,
        changedObject.length
      );

      switch (changedColumn) {
        case "ma_vt":
          columnsValues = await getAllValueByColumn(changedColumn, allValues);
          break;
        case "so_luong":
          rowValues = await getAllValueByRow(changedKey, allValues);

          await detailForm.setFieldValue(
            `${changedKey}_tien_nt2`,
            rowValues?.so_luong * rowValues?.gia_nt2
          );

          masterForm.setFieldValue(
            "t_so_luong",
            await getAllValueByColumn(changedColumn, allValues).reduce(
              (sum, x) => sum + x
            )
          );

          masterForm.setFieldValue(
            "t_tt_nt",
            (await getAllValueByColumn(
              "tien_nt2",
              detailForm.getFieldsValue()
            ).reduce((sum, x) => sum || 0 + x || 0)) -
              (await getAllValueByColumn(
                "ck_nt",
                detailForm.getFieldsValue()
              ).reduce((sum, x) => sum + x)) || 0
          );
          break;
        case "gia_nt2":
          rowValues = await getAllValueByRow(changedKey, allValues);

          await detailForm.setFieldValue(
            `${changedKey}_tien_nt2`,
            rowValues?.so_luong * rowValues?.gia_nt2
          );

          masterForm.setFieldValue(
            "t_tt_nt",
            (await getAllValueByColumn(
              "tien_nt2",
              detailForm.getFieldsValue()
            ).reduce((sum, x) => sum || 0 + x || 0)) -
              (await getAllValueByColumn(
                "ck_nt",
                detailForm.getFieldsValue()
              ).reduce((sum, x) => sum + x)) || 0
          );

          break;

        case "tl_ck":
          rowValues = await getAllValueByRow(changedKey, allValues);

          detailForm.setFieldValue(
            `${changedKey}_ck_nt`,
            (rowValues.tien_nt2 * rowValues.tl_ck) / 100
          );

          masterForm.setFieldValue(
            "t_tt_nt",
            (await getAllValueByColumn(
              "tien_nt2",
              detailForm.getFieldsValue()
            ).reduce((sum, x) => sum || 0 + x || 0)) -
              (await getAllValueByColumn(
                "ck_nt",
                detailForm.getFieldsValue()
              ).reduce((sum, x) => sum + x)) || 0
          );
          break;
        default:
          break;
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (!_.isEmpty(currentSaleOutDetail)) {
      const layout = currentSaleOutDetail?.reportLayoutModel?.map((item) => {
        if (item.field === "ma_vt") {
          return {
            title: item.name,
            dataIndex: item.field,
            type: item.type,
            editable: true,
            key: item.field,
            reference: "ten_vt",
            controller: "dmvt_lookup",
            required: true,
          };
        }
        if (item.field === "ma_kho") {
          return {
            title: item.name,
            dataIndex: item.field,
            type: item.type,
            editable: true,
            key: item.field,
            reference: "ten_kho",
            controller: "dmkho_lookup",
            required: true,
          };
        }
        if (item.field === "dvt") {
          return {
            title: item.name,
            dataIndex: item.field,
            type: item.type,
            editable: true,
            key: item.field,
            controller: "dmdvt_lookup",
            required: true,
          };
        }

        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
        };
      });

      setColumns(layout);

      var initData = [...currentSaleOutDetail?.data] || [];
      initData = initData.map((item, index) => ({
        ...item,
        key: index,
      }));
      setData(initData);
    }

    return () => {};
  }, [currentSaleOutDetail]);

  useEffect(() => {
    setCurrentAction(action || formStatus.VIEW);
    return () => {};
  }, [action]);

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
        rowData={data}
      />
    </Form>
  );
};

export default memo(TableDetail);
