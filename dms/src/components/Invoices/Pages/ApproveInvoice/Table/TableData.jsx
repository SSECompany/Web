import { Steps, Table } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import renderColumns from "../../../../../app/hooks/renderColumns";
import TableLocale from "../../../../../Context/TableLocale";
import { SoFuckingUltimateGetApi } from "../../../../DMS/API";
import ApproveModal from "../Modals/ApproveModal";

const TableData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    SearchKey: "",
  });
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 5,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [currentVouchers, setCurrentVouchers] = useState([]);

  const items = [
    {
      title: "Lập chứng từ",
    },
    {
      title: "Chờ duyệt",
    },
    {
      title: "Duyệt",
    },
  ];

  const refreshData = useCallback(() => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    if (pagination.pageIndex === 1) {
      setLoading(false);
    }
  }, [pagination]);

  const handleChangeStatus = (status, key) => {
    setCurrentVouchers([{ key: key, status: status }]);
    setShowDialog(true);
  };

  const getdata = () => {
    setLoading(true);
    SoFuckingUltimateGetApi({
      store: "api_get_dmalbum",
      data: {
        ...tableParams,
        pageindex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    }).then((res) => {
      let layout = renderColumns(res?.reportLayoutModel);

      layout.push({
        title: "Trạng thái",
        dataIndex: "",
        dataType: "Operation",
        align: "center",
        fixed: "right",
        render: (_, record) => {
          return (
            <Steps
              type="inline"
              current={1}
              items={items}
              onChange={(current) => {
                handleChangeStatus(current, record.key);
              }}
            />
          );
        },
      });

      console.log(layout);
      setTableColumns(layout);
      const data = res.data;
      data.map((item, index) => {
        item.key = item.ma_album;
        return item;
      });
      setData(data);
      setTotalResults(res?.pagegination?.totalRecord);
      setLoading(false);
    });
  };

  const handleTableChange = (paginationChanges, filters, sorter) => {
    setPagination({
      ...pagination,
      pageIndex: paginationChanges.current,
      current: paginationChanges.current,
    });
    setTableParams({ ...tableParams, ...filters, ...sorter });
    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== pagination?.pageSize) {
      setData([]);
    }
  };

  const changePaginations = (item) => {
    if (pagination.pageSize !== item) {
      setData([]);
    }
    setPagination({ ...pagination, pageSize: item });
  };
  const handleCloseDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const updateStatus = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleConfirmDialog = useCallback(() => {
    updateStatus();
    setCurrentVouchers([]);
    handleCloseDialog();
  }, [handleCloseDialog, updateStatus]);

  /////////////////Effect/////////////////
  useEffect(() => {
    setLoading(true);
    getdata();
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="h-full ">
      <span className="default_header_label mb-3 line-height-4">
        Đơn hàng bán
      </span>

      <Table
        rowSelection={true}
        columns={tableColumns}
        rowKey={(record) => record.key}
        dataSource={data}
        rowClassName={"default_table_row"}
        className="default_table"
        locale={TableLocale()}
        pagination={{
          ...pagination,
          total: totalResults,
          position: ["bottomCenter"],
          showSizeChanger: false,
          className: "default_pagination_bar",
        }}
        scroll={{ x: "auto" }}
        loading={loading}
        onChange={handleTableChange}
      />

      <ApproveModal
        showConfirm={showDialog}
        handleClose={handleCloseDialog}
        handleConfirm={handleConfirmDialog}
        vouchersInfo={currentVouchers}
      />
    </div>
  );
};

export default TableData;
