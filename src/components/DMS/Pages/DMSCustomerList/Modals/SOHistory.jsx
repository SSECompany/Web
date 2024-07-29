import { Table } from "antd";
import dayjs from "dayjs";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import renderColumns from "../../../../../app/hooks/renderColumns";
import TableLocale from "../../../../../Context/TableLocale";
import { SoFuckingUltimateGetApi } from "../../../API";
import {
  getActiveTab,
  getcurrentDMSCustomer,
} from "../../../Store/Selector/Selectors";

const SOHistory = () => {
  const activeTab = useSelector(getActiveTab);
  const [customerCode, setCustomerCode] = useState("");
  const [data, setData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentCustomer = useSelector(getcurrentDMSCustomer);

  const fetchData = async (customer) => {
    setLoading(true);
    await SoFuckingUltimateGetApi({
      store: "get_customer_PO_history",
      data: {
        DateFrom: dayjs(),
        DateTo: dayjs(),
        Customer: customer,
      },
    }).then((res) => {
      setTableColumns(renderColumns(res?.reportLayoutModel));
      const data = res.data;
      data.map((item, index) => {
        item.key = item.ma_hinh_thuc;
        return item;
      });
      setData(data);
      setLoading(false);
      setCustomerCode(currentCustomer.stt_rec_dm);
    });
  };

  useEffect(() => {
    if (activeTab === "SOHistory" && currentCustomer.stt_rec_dm) {
      if (!customerCode || currentCustomer.stt_rec_dm !== customerCode) {
        fetchData(currentCustomer.stt_rec_dm);
      }
    }
  }, [JSON.stringify(activeTab)]);
  return (
    <div>
      <Table
        columns={tableColumns}
        dataSource={data}
        rowClassName={"default_table_row"}
        className="default_table_none_pagination"
        locale={TableLocale()}
        loading={loading}
        scroll={{ x: "auto" }}
        pagination={{
          defaultPageSize: 999,
          position: ["none"],
          showSizeChanger: false,
          className: "default_pagination_bar",
        }}
      />
    </div>
  );
};

export default memo(SOHistory);
