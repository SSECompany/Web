import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Table } from "antd";
import React, { useEffect, useState } from "react";
import router from "../../../../router/routes";
import { ApiGetTimekeepingSchedule } from "../../API";
import HROptions from "../../Modals/HROptions";

const { RangePicker } = DatePicker;

const TimeKeepingSchedule = () => {
  const handletest = (e, key) => {
    console.log(key);
  };

  const [tableColumn, setTableColumn] = useState([]);
  const [data, setData] = useState([]);
  const [tableParams, setTableParams] = useState({
    year: 2023,
    month: 1,
    pagecount: 10,
    pageindex: 1,
  });
  const [pagination, setPagination] = useState({
    position: ["bottomLeft"],
    className: "default_pagination_bar",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params) => {
    ApiGetTimekeepingSchedule(params).then((res) => {
      setPagination({
        ...pagination,
        current: tableParams.pageindex,
        pageSize: tableParams.pagecount,
        total: res.totalpages * tableParams.pagecount,
      });
      const tableData = res.datas.map((item, index) => {
        item.key = index;
        item = { ...item, ...item.schedule };
        console.log(item);
        return item;
      });
      setData(tableData);

      setTableColumn([
        {
          title: "Mã nhân viên",
          dataIndex: "employee",
          render: (employee) => `${employee.ma_nv}`,
        },
        {
          title: "Tên nhân viên",
          dataIndex: "employee",
          textWrap: "word-break",
          render: (employee) => `${employee.ho_nv} ${employee.ten_nv}`,
        },
      ]);

      Object.keys(res.datas[0].schedule).map((key) => {
        setTableColumn((old) => {
          return (old = [
            ...old,
            {
              title: (
                <span>
                  {" "}
                  <Checkbox onChange={(e) => handletest(e, key)}></Checkbox>
                  {parseInt(key) + 1}
                </span>
              ),
              dataIndex: key,
              textWrap: "word-break",
              render: (checked) => (
                <div>
                  {checked.checkin && (
                    <Button
                      icon={<EditOutlined style={{ color: "black" }} />}
                    />
                  )}
                  {checked.absent && (
                    <Button
                      icon={
                        <DeleteOutlined
                          style={{ color: "red", background: "none" }}
                        />
                      }
                    />
                  )}
                  {checked.permit && (
                    <Button icon={<EyeOutlined style={{ color: "black" }} />} />
                  )}
                </div>
              ),
            },
          ]);
        });
      });
      setLoading(false);
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

  const onSelect = async (record, selected, selectedRows) => {
    const keys = selectedRows.map((item) => item.key);
    console.log(selectedRows);
    setSelectedRowKeys([...keys]);
  };

  const onSelectAll = (selected, selectedRows) => {
    console.log(selectedRows);
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

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    fetchData(tableParams);
  }, [JSON.stringify(tableParams), pagination]);

  return (
    <div className="page_2_side_default">
      <HROptions selectedKey={router.state.location.pathname.slice(1, 99)} />
      <div className="page_2_side_default_right">
        <div className="page_2_side_default_right_tools">
          <RangePicker
            format="YYYY/MM/DD"
            // onChange={onRangeChange}
          />
        </div>
        <div className="page_2_side_default_right_details">
          <Table
            rowSelection={rowSelection}
            columns={tableColumn}
            onHeaderCell={(columns) => console.log(columns)}
            dataSource={data}
            className={"default_table"}
            rowClassName={"default_table_row"}
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeKeepingSchedule;
