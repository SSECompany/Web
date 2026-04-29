import { notification, Table } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import OperationColumn from "../../../../app/hooks/operationColumn";
import renderColumns from "../../../../app/hooks/renderColumns";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import TableLocale from "../../../../Context/TableLocale";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { formStatus } from "../../../../utils/constants";
import { SoFuckingUltimateGetApi, UltimatePutDataApi2 } from "../../../DMS/API";
import ExcelFailedModel from "../../../ReuseComponents/ExcelFailedModel";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { SoFuckingUltimateApi } from "../../API";
import SaleEmployeeModal from "../../Modals/SaleEmployeeModal/SaleEmployeeModal";

const exampleStruct = [
  "Mã nhân viên",
  "Tên nhân viên",
  "Tên khác",
  "Địa chỉ",
  "Điện thoại",
  "Ghi chú",
  "User id",
  "User quản lý",
  "Đơn vị",
];

const SaleEmployee = () => {
  // initialize #########################################################################
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    ten_nvbh: "",
    ma_nvbh: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 10,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [openModalType, setOpenModalType] = useState(formStatus.ADD);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isOpenDetail, setIsOpenDetail] = useState(false);
  const [isOpenModalDeleteTask, setIsOpenModalDeleteTask] = useState(false);
  const [currentItemSelected, setCurrentItemSelected] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [excelFailedData, setExcelFailedData] = useState([]);
  const userInfo = useSelector(getUserInfo);

  //functions #########################################################################

  const refreshData = () => {
    setPagination({ ...pagination, pageindex: 1, current: 1 });
    if (pagination.pageindex === 1) {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentRecord(record.ma_nvbh);
    setIsOpenDetail(true);
    setOpenModalType(formStatus.EDIT);
  };

  const handleOpenDeleteDialog = (record) => {
    setIsOpenModalDeleteTask(true);
    setCurrentItemSelected(record);
  };

  const handleDelete = (keys) => {
    SoFuckingUltimateApi({
      store: "api_delete_customers",
      data: {
        id: keys.replaceAll(" ", ""),
        userid: 0,
      },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          refreshData();
        } else {
          notification.warning({
            message: `Có lỗi xảy ra khi thực hiện`,
          });
        }
      })
      .catch((err) => {});

    handleCloseDeleteDialog();
    refreshData();
  };

  const handleCloseDeleteDialog = () => {
    setIsOpenModalDeleteTask(false);
    setCurrentItemSelected({});
    setSelectedRowKeys([]);
  };

  const getdata = () => {
    setLoading(true);
    SoFuckingUltimateGetApi({
      store: "api_get_sale_employee",
      data: {
        ...tableParams,
        pageindex: pagination.pageindex,
        pageSize: pagination.pageSize,
      },
    }).then((res) => {
      let layout = renderColumns(res?.reportLayoutModel);
      layout.push({
        title: "Chức năng",
        dataIndex: "",
        editable: false,
        dataType: "Operation",
        align: "center",
        fixed: "right",
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
      setTableColumns(layout);
      const data = res.data;
      data.map((item, index) => {
        item.key = item.ma_nvbh;
        return item;
      });
      setData(data);
      setLoading(false);
      setTotalResults(res.pagegination.totalRecord);
    });
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

  const openModalAddTask = () => {
    setIsOpenDetail(!isOpenDetail);
    setOpenModalType(formStatus.ADD);
    setCurrentRecord(0);
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

  const handleExcelData = (excelData) => {
    UltimatePutDataApi2({
      store: "api_import_employee",
      data: {
        UnitID: userInfo.unitId,
        UserId: userInfo.id,
      },
      listData: excelData,
    })
      .then((res) => {
        if (res?.length > 0) {
          setExcelFailedData(res);
        } else {
          notification.success({
            message: `Thành công`,
          });
          refreshData();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getdata();
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="default_list_layout page_default">
      <HeaderTableBar
        name={"nhân viên"}
        title={"Danh sách nhân viên bán hàng"}
        changePaginations={changePaginations}
        totalResults={totalResults}
        addEvent={openModalAddTask}
        refreshEvent={refreshData}
        deleteItems={{
          delete: handleOpenDeleteDialog,
          count: selectedRowKeys.length,
        }}
        uploadFunction={handleExcelData}
        fileExample={exampleStruct}
      />

      <div className="h-full min-h-0">
        <Table
          columns={tableColumns}
          rowSelection={rowSelection}
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
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      <SaleEmployeeModal
        currentRecord={currentRecord}
        handleCloseModal={setIsOpenDetail}
        openModalState={isOpenDetail}
        openModalType={openModalType}
        refreshData={refreshData}
      />

      <ConfirmDialog
        state={isOpenModalDeleteTask}
        title="Xoá"
        description={`Xoá  ${
          currentItemSelected.ma_nvbh
            ? "nhân viên : " +
              currentItemSelected.ma_nvbh +
              ", Tên : " +
              currentItemSelected.ten_nvbh
            : `${selectedRowKeys.length} nhân viên`
        }`}
        handleOkModal={handleDelete}
        handleCloseModal={handleCloseDeleteDialog}
        keys={
          currentItemSelected.ma_nvbh
            ? currentItemSelected.ma_nvbh
            : selectedRowKeys.join(",").trim()
        }
      />

      <ExcelFailedModel data={excelFailedData} />
    </div>
  );
};

export default SaleEmployee;
