import { Form } from "antd";
import React, { memo } from "react";
import EditableTable from "../../../../ReuseComponents/EditableTable/EditableTable";

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
