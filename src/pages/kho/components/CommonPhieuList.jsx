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
  extraButtons,
  tableClassName = "phieu-data-table hidden_scroll_bar",
  tableProps = {},
}) => {
  return (
    <div className="phieu-container">
      <Row align="middle" className="phieu-header" style={{ position: "relative" }}>
        <Col flex={1} style={{ textAlign: "left", zIndex: 1 }}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={onBack}
            className="phieu-back-button"
            style={{ paddingLeft: 0 }}
          />
        </Col>

        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 0,
          whiteSpace: "nowrap"
        }}>
          <Title level={5} className="phieu-title" style={{ margin: 0 }}>
            {title}
          </Title>
        </div>

        <Col flex={1} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", zIndex: 1 }}>
          {(onAdd || extraButtons) && (
            extraButtons ? (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                {extraButtons}
              </span>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                className="phieu-add-button"
              >
                {addLabel}
              </Button>
            )
          )}
        </Col>
      </Row>
      {extraHeader}
      <div className="phieu-table-container">
        <Table
          columns={columns.map((col) => ({
            ...col,
            align: col.align || "center",
            ellipsis: col.ellipsis !== undefined ? col.ellipsis : false,
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
