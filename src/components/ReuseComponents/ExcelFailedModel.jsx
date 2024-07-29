import { Modal, Table } from "antd";
import React, { memo, useEffect, useState } from "react";
import TableLocale from "../../Context/TableLocale";

const titleStyled = { color: "var(--warnning)", fontSize: "24px" };

const TableLayout = [
  {
    title: "Số hàng",
    dataIndex: "Row",
  },
  {
    title: "Cột",
    dataIndex: "Columns",
  },
  {
    title: "Giá trị",
    dataIndex: "Values",
  },
  {
    title: "Diễn giải",
    dataIndex: "Names",
    render: (data) => <span className="font-bold">{data}</span>,
  },
];

const ExcelFailedModel = ({ data }) => {
  const [dataSource, setDataSource] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (data?.length > 0) {
      const dataKey = data.map((item, index) => {
        item.key = item.Row;
        return item;
      });
      setDataSource(dataKey);
      setIsOpen(true);
    }
  }, [data]);

  return (
    <Modal
      width={"75%"}
      className="no-scroll-modal"
      open={isOpen}
      centered
      onCancel={() => {
        setIsOpen(false);
        setDataSource([]);
      }}
      title=<span style={titleStyled}>
        Lỗi dữ liệu{" "}
        <span style={{ color: "black", fontWeight: "normal" }}>
          (Vui lòng sửa và tiến hành import lại)
        </span>
      </span>
      okButtonProps={{ style: { display: "none" } }}
      okText="Nhận"
      cancelText="Huỷ"
    >
      <Table
        locale={TableLocale()}
        columns={TableLayout}
        dataSource={dataSource}
        rowClassName="default_detail_table_row"
        className="default_detail_table sticky h-full"
        pagination={{
          position: ["none"],
          defaultPageSize: 1000,
        }}
      />
    </Modal>
  );
};

export default memo(ExcelFailedModel);
