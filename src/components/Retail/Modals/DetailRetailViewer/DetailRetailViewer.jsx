import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Form,
  message as messageAPI,
  notification,
} from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../app/Functions/getTableValue";
import RenderPerformanceTableCell from "../../../../app/hooks/RenderPerformanceTableCell";
import LoadingComponents from "../../../Loading/LoadingComponents";
import PerformanceTable from "../../../ReuseComponents/PerformanceTable/PerformanceTable";
import {
  apiCreateRefundOrder,
  fetchRetailOderDetail,
} from "../../Store/Actions/RetailOrderActions";
import "./DetailRetailViewer.css";

const DetailRetailViewer = ({ isOpen, onClose, itemKey }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const { stt_rec } = itemKey;
  const [itemForm] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});
  const [tableColumns, setTableColumns] = useState([]);
  const [isRefundMode, setIsRefundMode] = useState(false);

  const getData = async () => {
    setIsLoading(true);
    const result = await fetchRetailOderDetail({
      stt_rec,
    });
    setData(result);
    setTableColumns(result?.columns || []);
    setIsLoading(false);
  };

  const handleRefundModeModify = () => {
    setIsRefundMode(!isRefundMode);
  };

  const handleSaveRefundOrder = async () => {
    const data = { ...itemForm.getFieldsValue() };
    const detailData = [];

    getAllRowKeys(data).map((item) => {
      const rowData = getAllValueByRow(item, data);
      if (rowData.so_luong_tl) {
        return detailData.push(rowData);
      }
      return;
    });

    if (detailData.findIndex((item) => item.so_luong_tl) < 0) {
      message.warning("Không có vật tư nào trả lại !");
      return;
    }
    setIsLoading(true);

    const result = await apiCreateRefundOrder(
      { stt_rec_hd: stt_rec },
      detailData
    );

    if (result?.responseModel?.isSucceded) {
      notification.success({
        message: `Tạo đơn hàng trả lại thành công`,
      });
      handleRefundModeModify();
      onClose();
    } else {
      notification.warning({
        message: result?.responseModel?.message,
      });
    }
    setIsLoading(false);
  };

  const renderRefundColumns = (isRefund) => {
    var columns = _.cloneDeep(tableColumns);
    if (isRefund) {
      columns.map((item) => {
        if (item.key === "stt_rec0") {
          item.hidden = false;
          item.width = 0;
          item.resizable = false;
          item.sortable = false;
          item.className = "p-0";
          item.headerClassName = "p-0";
        }
        item.editable = false;
        item.cellRenderer = ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}
            />
          );
        };
      });

      columns.push({
        key: "so_luong_tl",
        title: "Số lượng trả",
        dataKey: "so_luong_tl",
        width: 120,
        editable: true,
        resizable: false,
        sortable: false,
        required: true,
        type: "Numeric",
        cellRenderer: ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}
              numberCap={rowData?.so_luong}
            />
          );
        },
      });
    }
    return columns;
  };

  useEffect(() => {
    if (isOpen) {
      getData();
    }

    if (!isOpen) {
      setIsRefundMode(false);
    }

    return () => {
      setIsLoading(true);
    };
  }, [isOpen]);

  return (
    <Drawer
      title={
        <div className="flex justify-content-between align-items-center">
          <span>Thông tin đơn hàng</span>

          {isRefundMode ? (
            <div>
              <Button
                type="primary"
                className="mr-2"
                onClick={handleSaveRefundOrder}
              >
                Lưu
              </Button>
              <Button onClick={handleRefundModeModify}>Huỷ</Button>
            </div>
          ) : (
            <Button onClick={handleRefundModeModify}>Đề nghị trả hàng</Button>
          )}
        </div>
      }
      placement="right"
      width={"80%"}
      open={isOpen}
      styles={{
        body: {
          position: "relative",
        },
      }}
      onClose={() => {
        onClose();
      }}
      destroyOnClose={true}
    >
      {isLoading ? (
        <LoadingComponents text={"Đang tải..."} size={50} loading={isLoading} />
      ) : (
        <div className="flex gap-3 h-full w-full detail__retail__order__Container">
          <div className="detail__retail__order__Left flex gap-3 flex-column pr-2 pl-2 pt-1 pb-1 overflow-auto">
            <div className="detail__retail__Userinfo flex flex-column align-items-center justify-content-center gap-2 p-2 flex-shrink-0">
              <Avatar size={72}>
                {data?.master?.ten_kh || "Không có dữ liệu"}
              </Avatar>
              <div className="text-center">
                <b className="text-xl">
                  {data?.master?.ten_kh || "Không có dữ liệu"}
                </b>
                <div>
                  <span>Tel: </span>
                  <b className="sub_text_color">
                    {data?.master?.dien_thoai || "Không có dữ liệu"}
                  </b>
                </div>
                <div>
                  <span>Add: </span>
                  <b className="sub_text_color">
                    {data?.master?.dia_chi || "Không có dữ liệu"}
                  </b>
                </div>
                <div>
                  <span>Điểm: </span>{" "}
                  <b className="danger_text_color">
                    {data?.master?.diem_so || 0}
                  </b>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-bold">Thông tin đơn hàng</p>

              <div className="retail_bill_info detail__retail__PaymentInfo p-2">
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">
                    Tổng tiền ({data?.master?.t_so_luong || 0} sản phẩm):
                  </span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.t_tien || 0}
                  </span>
                </div>

                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tổng thuế:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.t_thue || 0}
                  </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tổng chiết khấu:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.t_ck || 0}
                  </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Voucher sd:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.so_voucher || ""}
                  </span>
                </div>

                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Ngày tạo:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.ngay_ct || "Không có dữ liệu"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-bold">Thông tin giao hàng</p>

              <div className="retail_bill_info detail__retail__PaymentInfo p-2">
                <div className="pl-1 pr-1">
                  <span className="white-space-normal">
                    {data?.master?.ten_nguoi_n ||
                      data?.master?.ten_kh ||
                      "Không rõ"}
                  </span>
                </div>
                <div className="pl-1 pr-1">
                  <span>
                    {data?.master?.dien_thoai_n ||
                      data?.master?.dien_thoai ||
                      "Không có dữ liệu"}
                  </span>
                </div>
                <div className="pl-1 pr-1">
                  <span className="white-space-normal">
                    {data?.master?.dia_chi_n ||
                      data?.master?.dia_chi ||
                      "Không có dữ liệu"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-column gap-3 w-full min-w-0">
            <Alert
              message={
                data?.master?.status == "1" || data?.master?.status == "2"
                  ? "Đơn hàng đã được xác nhận thành công"
                  : data?.master?.status == "3"
                  ? "Đơn hàng đã bị huỷ"
                  : "Đơn hàng đang chờ xác nhận"
              }
              type={
                data?.master?.status == "1" || data?.master?.status == "2"
                  ? "success"
                  : data?.master?.status == "3"
                  ? "error"
                  : "warning"
              }
              showIcon
            />

            <Form form={itemForm} component={false} initialValues={{}}>
              {!isRefundMode && (
                <div className="h-full min-h-0 shadow_3 not_edit">
                  <PerformanceTable
                    selectable={false}
                    columns={renderRefundColumns(isRefundMode)}
                    data={data?.detail || []}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {isRefundMode && (
                <div className="h-full min-h-0 shadow_3 edit">
                  <PerformanceTable
                    selectable={false}
                    columns={renderRefundColumns(isRefundMode)}
                    data={data?.detail || []}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </Form>
          </div>
        </div>
      )}
      {contextHolder}
    </Drawer>
  );
};

export default DetailRetailViewer;
