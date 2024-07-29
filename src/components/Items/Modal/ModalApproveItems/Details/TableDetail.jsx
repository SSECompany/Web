import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Table, Tooltip } from "antd";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import addNewRow from "../../../../../app/hooks/addNewRow";
import getChangedTableRow from "../../../../../app/hooks/getChangedTableRow";
import getEditRowsValue from "../../../../../app/hooks/getEditRowsValue";
import RenderEditCell from "../../../../../app/hooks/RenderEditCell";
import renderEditColumnsV2 from "../../../../../app/hooks/renderEditColumnsV2";
import { GetUniqueArray } from "../../../../../app/Options/GetUniqueArray";
import TableLocale from "../../../../../Context/TableLocale";
import copy__icon from "../../../../../Icons/copy__icon.svg";
import delete__icon from "../../../../../Icons/delete__icon.svg";
import lock__icon from "../../../../../Icons/lock__icon.svg";
import { setApproveItemDetail } from "../../../Store/Actions/Actions";

const EditableCell = (cell, form, addRow) => {
  return RenderEditCell(cell, form, addRow);
};

const TableDetail = ({ masterForm, data, Tablecolumns, Action }, ref) => {
  const [detailForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isChecked, setIsChecked] = useState(false);

  useImperativeHandle(ref, () => ({
    getData: async () => {
      try {
        await detailForm.validateFields();
        await BtnSave();
        setIsChecked(true);
      } catch (error) {
        console.error(error);
      }
    },
  }));

  ////////////////////////////////////////btntable////////////////////////////////////////
  const BtnSave = async () => {
    const rawData = [...dataSource];
    const newData = [];
    const rows = await detailForm.validateFields();
    await editingKey.map(async (key) => {
      const changedData = await getChangedTableRow(key, rows, rawData);
      newData.push(changedData);
    });

    await newData.map((item) => {
      const index = rawData.findIndex((record) => item?.key === record?.key);
      if (index > -1) {
        rawData.splice(index, 1, item);
      }
    });

    setDataSource(rawData);
    setEditingKey([]);
    setSelectedRowKeys([]);
  };

  const addRow = async () => {
    const newRow = addNewRow(columns);
    setDataSource([...dataSource, newRow]);
    const inputRecord = getEditRowsValue(newRow);
    detailForm.setFieldsValue({
      ...inputRecord,
    });
    setSelectedRowKeys([...selectedRowKeys, newRow.key]);
    setEditingKey([...editingKey, newRow.key]);
  };

  const deleteRow = async () => {
    const newData = await dataSource.filter((item) => {
      return !selectedRowKeys.includes(item.key);
    });
    setDataSource([...newData]);
    setSelectedRowKeys([]);
    setEditingKey([]);
  };

  const addnew = async () => {
    await addRow();
    scrollToField("ma_vt");
  };

  ///////////////////////////////////////////////////////////////////////////////////////

  const scrollToField = (field, fieldName) => {
    const allFields = detailForm.getFieldsValue(true);
    if (!fieldName) {
      const itemFocusName = Object.keys(allFields)
        .filter((item) => item.includes(field))
        .pop();
      document.getElementById(itemFocusName).focus();
    } else {
      document.getElementById(fieldName).focus();
    }
  };

  const handleChangedValues = (changedValues, allValues) => {
    const keys = Object.keys(allValues);
    const changedObject = Object.keys(changedValues)[0];

    const changedKey = changedObject.substring(
      0,
      changedObject.indexOf("_") + 1
    );
    const changedColumn = changedObject.substring(
      changedObject.indexOf("_") + 1,
      changedObject.length
    );
    switch (changedColumn) {
      case "ma_vt":
        break;

      default:
        break;
    }
  };

  const onSelect = async (record, selected, selectedRows) => {
    const keys = selectedRows.map((item) => item?.key);
    setSelectedRowKeys([...keys]);
    if (selected) {
      scrollToField("ma_vt", `${selectedRows.pop().key}_ma_vt`);
    }
  };

  const onSelectAll = (selected, selectedRows) => {
    if (selected) {
      const selectedKeys = selectedRows.map((record) => {
        return record.key;
      });
      setEditingKey([...selectedKeys]);
      setSelectedRowKeys([...selectedKeys]);
    } else {
      setEditingKey([]);
      setSelectedRowKeys([]);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onSelectAll: onSelectAll,
    onSelect: onSelect,
  };

  ////////////////////////Effects////////////////////

  useEffect(() => {
    if (Tablecolumns) {
      const layout = Tablecolumns.map((item) => {
        item.editable = true;
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

        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
        };
      });
      setColumns(layout);
    }
  }, [Tablecolumns]);

  useEffect(() => {
    setEditingKey([]);
    setSelectedRowKeys([]);
    if (data) {
      const tableData = data.map((item, index) => {
        item.key = index;
        return item;
      });

      setDataSource(tableData);
    }
  }, [data]);

  useEffect(() => {
    if (isChecked) {
      setApproveItemDetail([...GetUniqueArray(dataSource, "ma_vt")]);
      setIsChecked(false);
    }
  }, [isChecked]);

  return (
    <div
      className="default_modal_group_items default_modal_details"
      style={{ flexDirection: "column", gap: "10px" }}
    >
      <div className="default_table_header">
        <span className="default_bold_table_label">Chi tiết</span>
        <div
          className="default_modal_group_items"
          style={{
            flexDirection: "roo",
            gap: "10px",
            alignItems: "flex-end",
            flex: "none",
          }}
        >
          <Tooltip placement="topLeft" title="Thêm dòng">
            <Button
              className="default_primary_detail_button"
              icon={<PlusOutlined />}
              onClick={async () => {
                await addRow();
                scrollToField("ma_vt");
              }}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Xoá dòng">
            <Button
              className="default_detail_button"
              icon={
                <img
                  style={{
                    height: "12px",
                    width: "12px",
                    margin: "0 auto",
                  }}
                  src={delete__icon}
                  alt=""
                />
              }
              onClick={() => {
                deleteRow();
              }}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Nhân dòng">
            <Button
              className="default_detail_button"
              icon={
                <img
                  style={{
                    height: "12px",
                    width: "12px",
                    margin: "0 auto",
                  }}
                  src={copy__icon}
                  alt=""
                />
              }
              onClick={() => {
                addRow();
              }}
            ></Button>
          </Tooltip>
          <Tooltip placement="topLeft" title="Khoá dòng">
            <Button
              className="default_detail_button"
              icon={
                <img
                  style={{
                    height: "12px",
                    width: "12px",
                    margin: "0 auto",
                  }}
                  src={lock__icon}
                  alt=""
                />
              }
              onClick={() => {
                addRow();
              }}
            ></Button>
          </Tooltip>
        </div>
      </div>

      <Form
        form={detailForm}
        component={false}
        onValuesChange={handleChangedValues}
        ref={ref}
      >
        <Table
          rowSelection={rowSelection}
          components={{
            body: {
              cell: (cells) => {
                if (dataSource.length > 0) {
                  return EditableCell(cells, detailForm, addnew);
                }
                return <></>;
              },
            },
          }}
          locale={TableLocale()}
          columns={renderEditColumnsV2(columns, Action)}
          dataSource={dataSource}
          rowClassName="default_detail_table_row"
          className="default_detail_table"
          pagination={{
            position: ["none"],
            defaultPageSize: 1000,
          }}
          scroll={{
            y: "20vh",
          }}
        />
      </Form>
    </div>
  );
};

export default forwardRef(TableDetail);
