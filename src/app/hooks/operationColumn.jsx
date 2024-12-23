import { Button } from "antd";
import PropTypes from "prop-types";
import React, { memo } from "react";

const OperationColumn = ({
  record,
  editFunction,
  deleteFunction,
  viewFunction,
}) => {
  return (
    <div className="operation_column_container">
      {editFunction && (
        <Button
          onClick={(e) => {
            editFunction(record);
          }}
        >
          <i className="pi pi-pencil"></i>
        </Button>
      )}

      {deleteFunction && (
        <Button
          onClick={(e) => {
            deleteFunction(record);
          }}
          danger
        >
          <i className="pi pi-trash"></i>
        </Button>
      )}

      {viewFunction && (
        <Button
          onClick={(e) => {
            viewFunction(record);
          }}
        >
          <i className="pi pi-eye sub_text_color"></i>
        </Button>
      )}
    </div>
  );
};

export default memo(OperationColumn);

OperationColumn.prototype = {
  record: PropTypes.object.isRequired,
  editFunction: PropTypes.func,
  deleteFunction: PropTypes.func,
  viewFunction: PropTypes.func,
};
