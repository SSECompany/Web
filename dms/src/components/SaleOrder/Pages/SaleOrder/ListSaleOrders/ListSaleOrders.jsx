import { Button, Col, Input, Pagination, Table } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import renderColumns from "../../../../../app/hooks/renderColumns";
import TableLocale from "../../../../../Context/TableLocale";
import emitter from "../../../../../utils/emitter";
import {
  fetchSaleOrderInfo,
  fetchSaleOrderList,
  setCurrentSaleOrder,
  setOpenSaleOrderFilter,
  setSaleOrderCurrentStep,
} from "../../../Store/Sagas/SaleOrderActions";
import { getSaleOrderInfo } from "../../../Store/Selector/Selector";
import FilterSaleOrder from "../FilterSaleOrder/FilterSaleOrder";

const ListSaleOrders = () => {
  const [selectedRowkeys, setselectedRowkeys] = useState([]);
  const { filterInfo, saleOrderList, currentItemId, action } =
    useSelector(getSaleOrderInfo);
  const [columns, setColumns] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
  });
  const [totalRecords, setTotalRecords] = useState(1);
  const [params, setParams] = useState({
    ...filterInfo,
  });
  const [loading, setLoading] = useState(false);

  const handleRowSelect = (record) => {
    setCurrentSaleOrder(record?.key || "");
  };

  const handleOpenFilter = () => {
    setOpenSaleOrderFilter(true);
  };

  const handlePaginationChange = (current) => {
    setPagination({ ...pagination, pageIndex: current });
  };

  const handleFilter = useCallback((fitlerData) => {
    setParams({ ...params, ...fitlerData });
  }, []);

  const handleSearchByWord = useDebouncedCallback((e) => {
    const searchValue = filterKeyHelper(e.target.value);
    setParams({ ...params, searchKey: searchValue });
  }, 600);

  const listenEmitter = () => {
    emitter.on("HANLDE_REFRESH_LIST_SALE_ORDER", () => {
      setPagination({ pageIndex: 1 });
    });
  };

  useEffect(() => {
    setselectedRowkeys([currentItemId || ""]);
    setSaleOrderCurrentStep(0);
    fetchSaleOrderInfo(currentItemId || "");
  }, [JSON.stringify(currentItemId)]);

  useEffect(() => {
    if (saleOrderList?.columns?.length > 0) {
      setColumns(renderColumns(saleOrderList?.columns || []));
      setDataSource(saleOrderList?.dataSource || []);
      setTotalRecords(saleOrderList.totalRecords);
      setLoading(false);
    }
    return () => {};
  }, [saleOrderList]);

  useEffect(() => {
    setLoading(true);
    fetchSaleOrderList({ ...params, pageIndex: pagination.pageIndex });
  }, [JSON.stringify(params), pagination]);

  useEffect(() => {
    listenEmitter();
  }, []);

  return (
    <>
      <Col span={5} className="flex flex-column h-full min-h-0 gap-3">
        <div
          className="w-full h-full min-h-0 p-2 border-round-lg flex flex-column gap-2"
          style={{ background: "white" }}
        >
          <div className="flex gap-2">
            <Input placeholder="Tìm kiếm..." onInput={handleSearchByWord} />
            <Button className="default_button" onClick={handleOpenFilter}>
              <i
                className="pi pi-filter sub_text_color"
                style={{ fontWeight: "bold" }}
              ></i>
            </Button>
          </div>
          <div className="h-full overflow-auto">
            <Table
              loading={loading}
              onRow={(record, rowIndex) => {
                return {
                  onClick: () => handleRowSelect(record),
                };
              }}
              className="table_hide_selection"
              rowClassName={"cursor-pointer border-round-lg"}
              columns={columns}
              dataSource={dataSource}
              size="small"
              locale={TableLocale()}
              pagination={{
                position: ["none"],
              }}
              rowSelection={{
                selectedRowKeys: selectedRowkeys,
                type: "radio",
                columnWidth: 0,
                renderCell: () => "",
              }}
            />
          </div>
        </div>
        <div
          className="p-2 relative text-center border-round-lg"
          style={{ background: "white" }}
        >
          <Pagination
            defaultCurrent={pagination.pageIndex}
            total={totalRecords}
            simple
            showSizeChanger={false}
            onChange={handlePaginationChange}
          />
        </div>
      </Col>

      <FilterSaleOrder onFilter={handleFilter} />
    </>
  );
};

export default ListSaleOrders;
