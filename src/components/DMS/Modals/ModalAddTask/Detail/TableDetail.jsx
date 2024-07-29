import { Form } from "antd";
import React, { memo } from "react";
import RenderEditCell from "../../../../../app/hooks/RenderEditCell";
import EditableTable from "../../../../ReuseComponents/EditableTable/EditableTable";

const EditableCell = (cell, form, addRow) => {
  return RenderEditCell(cell, form, addRow);
};

const TableDetail = ({ detailForm, data, columns, action }) => {
  return (
    <Form form={detailForm} component={false}>
      <EditableTable
        form={detailForm}
        action={action}
        colData={columns}
        rowData={data}
      />
    </Form>
  );
};

export default memo(TableDetail);
