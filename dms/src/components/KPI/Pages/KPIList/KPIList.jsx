import { notification, Table } from "antd";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import OperationColumn from "../../../../app/hooks/operationColumn";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import TableLocale from "../../../../Context/TableLocale";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import KPIListAddModal from "../../Modals/KPIListAddModal/KPIListAddModal";
import {
  deleteKpilist,
  fetchKPIListData,
  setKPIListCurrentItem,
  setKPIListOpenModal,
} from "../../Store/Actions/KPIList";
import { getKPIListState } from "../../Store/Selectors/Selectors";

const KPIList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    keywords: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 10,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { currentItem } = useSelector(getKPIListState);

  const refreshData = useCallback(() => {
    setPagination({ ...pagination, pageindex: 1, current: 1 });
    if (pagination.pageindex === 1) {
      setLoading(true);
    }
  }, [pagination]);

  const handleAdd = useCallback(() => {
    setKPIListOpenModal(true);
    setKPIListCurrentItem({});
  }, []);

  const handleEdit = useCallback((record) => {
    setKPIListOpenModal(true);
    setKPIListCurrentItem(record);
  }, []);

  const handleOpenDeleteDialog = (record) => {
    setOpenDeleteDialog(true);
    setKPIListCurrentItem(record || {});
  };

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setKPIListCurrentItem({});
  }, []);

  const handleDeleteItems = useCallback(async (keys) => {
    const isSuccess = await deleteKpilist({ keys });
    if (isSuccess) {
      notification.success({
        message: `Xoá thành công`,
      });
      refreshData();
      setSelectedRowKeys([]);
    }
    handleCloseDeleteDialog();
  }, []);

  const getData = async () => {
    const result = await fetchKPIListData({
      ...tableParams,
      pageindex: pagination.pageindex,
      pageSize: pagination.pageSize,
    });

    if (_.isEmpty(tableColumns)) {
      result.layout.push({
        title: "Chức năng",
        dataIndex: "",
        editable: false,
        dataType: "Operation",
        align: "center",
        fixed: "right",
        shouldCellUpdate: (record, prevRecord) => {
          return !shallowEqual(record, prevRecord);
        },
        render: (_, record) => {
          return (
            <OperationColumn
              record={record}
              editFunction={handleEdit}
              deleteFunction={handleOpenDeleteDialog}
            />
          );
        },
      });
      setTableColumns(result.layout);
    }

    setData(result.data || []);
    setTotalResults(result.totalCount || 0);
    setLoading(false);
  };

  const handleTableChange = (paginationChanges, filters, sorter) => {
    setPagination({
      ...pagination,
      pageindex: paginationChanges.current,
      current: paginationChanges.current,
    });
    setTableParams({ ...tableParams, ...filters, ...sorter });
    setSelectedRowKeys([]);
    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== pagination?.pageSize) {
      setData([]);
    }
  };

  const onSelect = async (record, selected, selectedRows) => {
    const keys = selectedRows.map((item) => item.key);
    setSelectedRowKeys([...keys]);
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

  const rowSelection = {
    selectedRowKeys,
    onSelectAll: onSelectAll,
    onSelect: onSelect,
  };

  const changePaginations = (item) => {
    if (pagination.pageSize !== item) {
      setData([]);
    }
    setPagination({ ...pagination, pageSize: item });
  };

  const handleSearch = useCallback(
    useDebouncedCallback((value) => {
      setTableParams({ ...tableParams, keywords: filterKeyHelper(value) });
      setPagination({ ...pagination, pageIndex: 1 });
    }, 600),
    []
  );

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getData();
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="default_list_layout page_default">
      <HeaderTableBar
        name={"KPIList"}
        title={"Danh mục KPI"}
        changePaginations={changePaginations}
        totalResults={totalResults || 0}
        refreshEvent={refreshData}
        searchCallBack={handleSearch}
        addEvent={handleAdd}
        deleteItems={{
          delete: handleOpenDeleteDialog,
          count: selectedRowKeys.length,
        }}
      />

      <div className="h-full min-h-0">
        <Table
          rowSelection={rowSelection}
          columns={tableColumns}
          dataSource={data}
          rowClassName={"default_table_row"}
          className="default_table"
          locale={TableLocale()}
          scroll={{ x: "auto" }}
          pagination={{
            ...pagination,
            total: totalResults,
            position: ["bottomCenter"],
            showSizeChanger: false,
            className: "default_pagination_bar",
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      <KPIListAddModal refreshFunction={refreshData} />

      <ConfirmDialog
        state={openDeleteDialog}
        title="Xoá"
        description={`Xoá ${
          !_.isEmpty(selectedRowKeys)
            ? selectedRowKeys.length + " KPI"
            : "KPI: " + currentItem.ma_kpi
        }`}
        handleOkModal={handleDeleteItems}
        handleCloseModal={handleCloseDeleteDialog}
        keys={
          !_.isEmpty(selectedRowKeys)
            ? selectedRowKeys.map((i) => i.trim()).join(",")
            : currentItem?.ma_kpi
        }
      />
    </div>
  );
};

export default KPIList;
