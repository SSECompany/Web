import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Row, Table, Typography } from "antd";

const { Title } = Typography;

const CommonPhieuList = ({
  title,
  columns,
  data,
  onAdd,
  onBack,
  addLabel = "Thêm mới",
  rowKey = "stt_rec",
  loading = false,
  pagination,
  extraHeader,
  tableClassName = "phieu-data-table hidden_scroll_bar",
  tableProps = {},
}) => {
  return (
    <div className="phieu-container">
      <Row justify="space-between" align="middle" className="phieu-header">
        <Col>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={onBack}
            className="phieu-back-button"
          >
            Trở về
          </Button>
        </Col>
        <Col flex="auto" style={{ textAlign: "center" }}>
          <Title level={5} className="phieu-title">
            {title}
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
            className="phieu-add-button"
          >
            {addLabel}
          </Button>
        </Col>
      </Row>
      {extraHeader}
      <div className="phieu-table-container">
        <Table
          columns={columns.map((col) => ({
            ...col,
            width: undefined,
            ellipsis: false,
          }))}
          dataSource={data}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          bordered
          className={tableClassName}
          {...tableProps}
        />
      </div>
    </div>
  );
};

export default CommonPhieuList;
