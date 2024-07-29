import React, { memo, useEffect, useState } from "react";
import BaseTable, { AutoResizer } from "react-base-table";
import "react-base-table/styles.css";
import no_file from "../../../Icons/no_file.svg";
import LoadingComponents from "../../Loading/LoadingComponents";
import "./PerformanceTable.css";
import SelectCell from "./SelectCell/SelectCell";
import SelectCellHeader from "./SelectCell/SelectCellHeader";

const PerformanceTable = ({
  selectable,
  columns,
  data,
  onSelectedRowKeyChange,
  reverseIndex,
  isLoading,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const handleSelectionChange = ({ selected, rowKey, rowData, rowIndex }) => {
    const selectedRow = [...selectedRowKeys];

    if (selected) {
      if (!selectedRowKeys.includes(rowKey)) selectedRow.push(rowKey);
    } else {
      const index = selectedRowKeys.indexOf(rowKey);
      if (index > -1) {
        selectedRow.splice(index, 1);
      }
    }

    setSelectedRowKeys(selectedRow);
  };

  const handleSelectAll = ({ selected }) => {
    if (selected) {
      const allKeys = data.map((item) => item.id);
      setSelectedRowKeys(allKeys);
    } else setSelectedRowKeys([]);
  };

  const renderSelectedRowsClass = ({ rowData, rowIndex }) => {
    const { ck_yn } = rowData;
    if (ck_yn) {
      return "performance-ck-row";
    }

    const checked = selectedRowKeys?.includes(rowData?.id);
    return checked ? "performance-row-selected" : "";
  };

  const rowRenderer = ({ rowData, cells }) => {
    if (rowData.content)
      return <div className="p-2 w-full">{rowData.content}</div>;
    return cells;
  };

  useEffect(() => {
    if (onSelectedRowKeyChange) {
      onSelectedRowKeyChange(selectedRowKeys);
    }
    return () => {};
  }, [selectedRowKeys]);

  const _columns = [
    {
      width: selectable ? 60 : 0,
      hidden: !selectable,
      flexShrink: 0,
      resizable: false,
      headerRenderer: ({ column }) => <SelectCellHeader column={column} />,
      cellRenderer: ({ rowData, rowIndex, column }) => (
        <SelectCell rowData={rowData} rowIndex={rowIndex} column={column} />
      ),
      key: "__selection__",

      onChange: handleSelectionChange,
      onSelectAll: handleSelectAll,
      dataLength: data.length,
      selectedRowKeys,
    },
    {
      width: 55,
      resizable: false,
      title: "STT",
      cellRenderer: ({ rowIndex, rowData }) => {
        const { id } = rowData;

        const newIndex = data.findIndex((item) => item.id === id);
        return reverseIndex ? newIndex + 1 : rowIndex + 1;
      },
      key: "__rowNumber__",

      align: "center",
    },
    ...columns,
  ];

  return (
    <AutoResizer>
      {({ width, height }) => (
        <BaseTable
          expandColumnKey={_columns[0].key}
          overscanRowCount={30}
          emptyRenderer={
            <div className="abs_center">
              <img src={no_file} />
              <div className="text-center">
                <b className="sub_text_color">Không có dữ liệu</b>
              </div>
            </div>
          }
          overlayRenderer={
            <LoadingComponents
              text={"Đang tải..."}
              size={50}
              loading={isLoading}
            />
          }
          headerClassName={"performance_table_header"}
          fixed
          width={width}
          height={height}
          columns={_columns}
          data={reverseIndex ? [...data].reverse() : [...data]}
          rowClassName={renderSelectedRowsClass}
          className="performance__table__Container"
          rowRenderer={rowRenderer}
        />
      )}
    </AutoResizer>
  );
};

export default memo(PerformanceTable);
