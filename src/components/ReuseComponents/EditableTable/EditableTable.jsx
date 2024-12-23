import { Button, Table, Tooltip } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../app/Functions/getTableValue";
import addNewRow, { cloneRows } from "../../../app/hooks/addNewRow";
import getChangedTableRow from "../../../app/hooks/getChangedTableRow";
import RenderEditCell from "../../../app/hooks/RenderEditCell";
import renderEditColumnsV2 from "../../../app/hooks/renderEditColumnsV2";
import TableLocale from "../../../Context/TableLocale";
import { formStatus } from "../../../utils/constants";

const EditableCell = (cell, form, addRow) => {
  return RenderEditCell(cell, form, addRow);
};

const EditableTable = ({ form, action, colData, rowData }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tableAction, setTableAction] = useState(action);

  const handleAddRow = async () => {
    if (tableAction != formStatus.VIEW) {
      const newRow = await addNewRow(columns);
      await setDataSource([...dataSource, newRow]);
      await setSelectedRowKeys([...selectedRowKeys, newRow.key]);
      await scrollToField(_.first(columns)?.dataIndex);
    }
  };

  const handleDeleteRows = async () => {
    const newRows = await dataSource.filter(
      (item) => !selectedRowKeys.includes(item.key)
    );
    setDataSource([...newRows]);
    setSelectedRowKeys([]);
  };

  const handleCloneRows = async () => {
    const selectedRows = [];

    selectedRowKeys.map((item) => {
      selectedRows.push(getAllValueByRow(item, form.getFieldsValue(true)));
    });

    const newRows = await cloneRows(columns, selectedRows);
    const newRowKeys = newRows.map((row) => row.key);

    await setDataSource([...dataSource, ...newRows]);
    await setSelectedRowKeys([...selectedRowKeys, ...newRowKeys]);
    await scrollToField(_.first(columns)?.dataIndex);
  };

  const scrollToField = (field, fieldName) => {
    if (tableAction !== formStatus.VIEW) {
      const allFields = form.getFieldsValue(true);
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

  const onSelectAll = (selected, selectedRows) => {
    if (selected) {
      const selectedKeys = selectedRows.map((record) => {
        return record.key;
      });
      setSelectedRowKeys([...selectedKeys]);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const onSelect = async (record, selected, selectedRows) => {
    const keys = selectedRows.map((item) => item?.key);
    setSelectedRowKeys([...keys]);
  };

  const rowSelection = {
    selectedRowKeys,
    onSelectAll,
    onSelect,
  };

  const handleSave = async () => {
    const rawData = [...dataSource];
    const newData = [];
    const rows = await form.validateFields();
    const keys = getAllRowKeys(rows);

    await keys.map(async (key) => {
      const changedData = await getChangedTableRow(key, rows, rawData);
      newData.push(changedData);
    });

    await newData.map((item) => {
      const index = rawData.findIndex((record) => item?.key === record?.key);
      if (index > -1) {
        rawData.splice(index, 1, item);
      }
    });

    setDataSource([...rawData]);
    setSelectedRowKeys([]);
  };

  useEffect(() => {
    if (action == formStatus.SAVED) {
      handleSave();
    }
    setTableAction(action);
  }, [action]);

  useEffect(() => {
    if (colData.length > 0) {
      setColumns(colData);
      setDataSource(rowData || []);
    }
    return () => {
      setColumns([]);
      setDataSource([]);
    };
  }, [JSON.stringify(colData), rowData]);

  return (
    <div className="default_modal_details h-full min-h-0 flex flex-column gap-2 p-2">
      <div className="default_table_header pt-1">
        <span className="default_bold_table_label">Chi tiết</span>
        <div className="default_modal_group_items flex gap-2 align-items-center">
          {0 > 0 && (
            <Tooltip placement="topLeft" title="Nhận">
              <Button
                className="default_detail_button p-0"
                icon={<i className="pi pi-check sub_text_color"></i>}
                onClick={() => {
                  BtnSave();
                }}
              ></Button>
            </Tooltip>
          )}

          <Tooltip placement="topLeft" title="Thêm dòng">
            <Button
              className="default_primary_detail_button"
              icon={<i className="pi pi-plus"></i>}
              onClick={handleAddRow}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Xoá dòng">
            <Button
              className="default_detail_button p-0"
              icon={
                <i className="pi pi-trash sub_text_color danger_text_color"></i>
              }
              danger
              onClick={handleDeleteRows}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Nhân dòng">
            <Button
              className="default_detail_button p-0"
              icon={<i className="pi pi-copy sub_text_color"></i>}
              onClick={handleCloneRows}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Khoá dòng (chưa hoạt động)">
            <Button
              disabled
              className="default_detail_button p-0"
              icon={<i className="pi pi-lock sub_text_color"></i>}
              onClick={() => {
                // addRow();
              }}
            ></Button>
          </Tooltip>
        </div>
      </div>

      <Table
        rowSelection={rowSelection}
        components={{
          body: {
            cell: (cells) => {
              if (dataSource.length > 0) {
                return EditableCell(cells, form, handleAddRow);
              }
              return <></>;
            },
          },
        }}
        locale={TableLocale()}
        columns={renderEditColumnsV2(columns, tableAction)}
        dataSource={dataSource}
        rowClassName="default_detail_table_row"
        className="default_detail_table sticky h-full"
        pagination={{
          position: ["none"],
          defaultPageSize: 1000,
        }}
      />
    </div>
  );
};

export default memo(EditableTable);
