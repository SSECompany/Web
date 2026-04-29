import { Table } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import renderColumns from "../../../../app/hooks/renderColumns";
import TableLocale from "../../../../Context/TableLocale";
import { SoFuckingUltimateGetApi2 } from "../../../DMS/API";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";

const printLayouts = [];

const LocationReport = () => {
  const [dataSourse, setDataSource] = useState([]);
  const [layoutSource, setLayoutSource] = useState([]);
  const [currentLayout, setCurrentLayout] = useState([]);
  const [pickerLayout, setPickerLayout] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    DateFrom: dayjs().add(-1, "month"),
    DateTo: dayjs(),
    ma_tinh: "",
    ma_quan: "",
    ma_xa: "",
    ma_dvcs: "",
    phan_loai: "",
    language: "V",
    orderBy: "",
    UserID: 1022,
    Admin: 0,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    orderBy: "",
  });

  const [totalResults, setTotalResults] = useState(0);
  const [filterState, setFilterState] = useState(false);

  const refreshData = () => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    if (pagination.pageIndex === 1) {
      setLoading(true);
    }
  };

  const getReportData = async () => {
    await SoFuckingUltimateGetApi2({
      store: "api_Location_Report",
      data: {
        ...tableParams,
        orderBy: pagination.orderBy,
        pageindex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    }).then(async (res) => {
      let layout = renderColumns(res?.reportLayoutModel, true);
      await setTotalResults(res?.pagegination?.totalRecord);

      if (!pickerLayout.length > 0) {
        setCurrentLayout(layout);
        setLayoutSource(layout);
        setPickerLayout(
          res?.reportLayoutModel.map((item) => {
            return {
              key: item.field,
              title: item.name,
            };
          })
        );
      }

      if (res.data) {
        setDataSource((old) => {
          return (old = res.data.map((item, index) => {
            item.key = item.stt;
            return item;
          }));
        });
      }

      setLoading(false);
    });
  };

  const changePaginations = (item) => {
    if (pagination.pageSize !== item) {
      setDataSource([]);
    }

    setPagination({ ...pagination, pageSize: item });
  };

  const handleTableChange = async (paginationChanges, filters, sorter) => {
    var sortValues = "";

    if (Array.isArray(sorter)) {
      sortValues = sorter
        ?.map((item) =>
          item.order
            ? `${item.field} ${item.order == "descend" ? "desc" : "asc"}`
            : ""
        )
        .join(", ");
    } else {
      if (sorter.order) {
        sortValues = `${sorter.field} ${
          sorter.order == "descend" ? "desc" : "asc"
        }`;
      }
    }

    setPagination({
      ...pagination,
      pageIndex: paginationChanges.current,
      current: paginationChanges.current,
      orderBy: sortValues,
    });
    // `dataSource` is useless since `pageSize` changed

    if (pagination.pageSize !== paginationChanges?.pageSize) {
      setDataSource([]);
    }
  };

  const onLayoutChange = useCallback(
    (layout) => {
      if (layout.length > 0) {
        const newLayout = layoutSource.filter((item) =>
          layout.includes(item.dataIndex)
        );
        setCurrentLayout(newLayout);
      } else {
        setCurrentLayout(layoutSource);
      }
    },
    [layoutSource]
  );

  const handleOpenFilter = useCallback(() => {
    setFilterState(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setFilterState(false);
  }, []);

  const handleFilter = useCallback((filterData) => {
    setTableParams({ ...tableParams, ...filterData });
  }, []);

  const handlePrint = useCallback((item) => {
    // ApiGetPrintReportFile(item.link, {
    //   store: item.store,
    //   data: null,
    //   path: item.path,
    //   fileName: `test`,
    // }).then((res) => {
    //   FileSaver.saveAs(res, item.title);
    // });
    // ApiPrintReport({
    //   filePath: item.path,
    //   fileName: item.fileName,
    //   store: item.store,
    //   param: {
    //     stt: "",
    //   },
    // }).then((res) => {
    //   console.log(res);
    //   if (res.status === 200) {
    //     FileSaver.saveAs(res.data, item.title);
    //   }
    // });
  }, []);

  ////////////////////////////////////Effects//////////////////////////

  useEffect(() => {
    setLoading(true);
    getReportData();
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="w-full flex gap-3 flex-column min-h-0 h-full relative">
      <HeaderTableBar
        name={"Báo cáo"}
        title={"Báo cáo vị trí"}
        totalResults={totalResults}
        refreshEvent={refreshData}
        changePaginations={changePaginations}
        ReportLayout={{
          columns: pickerLayout,
          layoutCallBack: onLayoutChange,
        }}
        advanceFilter={handleOpenFilter}
        printList={printLayouts}
        printCallBack={handlePrint}
      />

      <div className="h-full min-h-0">
        <Table
          columns={currentLayout}
          rowKey={(record) => record.key}
          dataSource={dataSourse}
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
          showSorterTooltip={false}
        />
      </div>
    </div>
  );
};

export default LocationReport;
