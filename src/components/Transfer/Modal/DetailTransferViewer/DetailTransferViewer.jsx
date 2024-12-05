import { Alert, Drawer, Form, Input, message as messageAPI } from "antd";

import { CaretDownOutlined } from '@ant-design/icons';
import _ from "lodash";
import { useEffect, useState } from "react";
import LoadingComponents from "../../../Loading/LoadingComponents";
import PerformanceTable from "../../../ReuseComponents/PerformanceTable/PerformanceTable";
import { fetchTransferDetail, } from "../../Store/Actions/TransferActions";
import "./DetailTransferViewer.css";

const DetailRetailViewer = ({ isOpen, onClose, itemKey, ma_ct = 'HDL' }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const { stt_rec } = itemKey;
  const [itemForm] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});
  const [tableColumns, setTableColumns] = useState([]);
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [selectedRowkeys, setSelectedRowkeys] = useState([]);

  const getData = async () => {
    setIsLoading(true);
    const result = await fetchTransferDetail({
      stt_rec
    }, ma_ct);
    if (result.detail)
      result.detail = result.detail.map((d, index) => {
        d.children = [
          {
            id: `${(index + 1).toString().padStart(3, '0')}-detail`,
            content: (
              <div className="flex gap-2 justify-content-between">
                <Form.Item
                  initialValue={""}
                  name={`${(index + 1).toString().padStart(3, '0')}_ghi_chu`}
                  style={{
                    width: "55%",
                    margin: 0,
                  }}
                  rules={[
                    {
                      required: false,
                      message: `Ghi chú trống !`,
                    },
                  ]}
                >
                  <Input.TextArea
                    autoSize={{
                      minRows: 1,
                      maxRows: 1,
                    }}
                    placeholder="Ghi chú"
                    style={{ resize: "none" }}
                  />
                </Form.Item>
              </div>
            ),
          },
        ]
        return d;
      })
    setData(result);
    setTableColumns(result?.columns || []);
    setIsLoading(false);
  };
  const renderRefundColumns = (isRefund) => {
    var columns = _.cloneDeep(tableColumns);
    return columns;
  };


  useEffect(() => {
    if (isOpen) getData();
    if (!isOpen) setIsRefundMode(false);
    return () => {
      setIsLoading(true);
    };
  }, [isOpen]);

  return (
    <Drawer
      title={
        <div className="flex justify-content-between align-items-center">
          <span>Thông tin đề nghị xuất điều chuyển</span>
        </div>
      }
      placement="right" width={"80%"} open={isOpen}
      styles={{ body: { position: "relative", }, }}
      onClose={() => { onClose(); }}
      destroyOnClose={true}
    >
      {isLoading ? (
        <LoadingComponents text={"Đang tải..."} size={50} loading={isLoading} />
      ) : (
        <div className="flex gap-3 h-full w-full detail__retail__order__Container">
          <div className="detail__retail__order__Left flex gap-3 flex-column pr-2 pl-2 pt-1 pb-1 overflow-auto">
            <div>
              <p className="mb-2 font-bold">Kho xuất</p>
              <div className="retail_bill_info detail__retail__PaymentInfo p-2">
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Mã kho :</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">{data?.master?.ma_kho} </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tên kho :</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">{data?.master?.ten_kho_xuat} </span>
                </div>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <CaretDownOutlined style={{ fontSize: '32px', color: '#08c' }} />
            </div>
            <div>
              <p className="mb-2 font-bold">Kho nhập</p>
              <div className="retail_bill_info detail__retail__PaymentInfo p-2">
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Mã kho :</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">{data?.master?.ma_khon} </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tên kho :</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">{data?.master?.ten_kho_nhap} </span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 font-bold mt-5">Thông tin đề nghị xuất điều chuyển</p>
              <div className="retail_bill_info detail__retail__PaymentInfo p-2">
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Số phiếu xuất: </span>
                  <span className="primary_bold_text line-height-16 white-space-normal"> {data?.master?.so_ct} </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Ngày chứng từ: </span>
                  <span className="primary_bold_text line-height-16 white-space-normal"> {data?.master?.ngay_ct} </span>
                </div>

                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Người nhận: </span>
                  <span className="primary_bold_text line-height-16 white-space-normal"> {data?.master?.dept_id} </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Cửa hàng: </span>
                  <span className="primary_bold_text line-height-16 white-space-normal"> {data?.master?.cua_hang} </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Ghi chú: </span>
                  <span className="primary_bold_text line-height-16 white-space-normal" style={{
                    textAlign: "right"
                  }}> {data?.master?.ghi_chu} </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-column gap-3 w-full min-w-0">
            <Alert
              message={data?.master?.status == "0" ? "Đơn hàng đang chờ phê duyệt" : "Đơn hàng điều chuyển thành công"}
              type={data?.master?.status == "0" ? "warning" : "success"}
              showIcon
            />
            <Form form={itemForm} component={false} initialValues={{}}>
              <div className="h-full min-h-0 shadow_3 not_edit">
                <PerformanceTable
                  selectable={false}
                  columns={renderRefundColumns(isRefundMode)}
                  data={data?.detail || []}
                  isLoading={isLoading}
                />
              </div>
            </Form>
          </div>
        </div>
      )}
      {contextHolder}
    </Drawer>
  );
};

export default DetailRetailViewer;
