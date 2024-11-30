import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Form,
  Input,
  message as messageAPI,
  notification,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../app/Functions/getTableValue";
import RenderPerformanceTableCell from "../../../../app/hooks/RenderPerformanceTableCell";
import { formatCurrency } from "../../../../app/hooks/dataFormatHelper";
import LoadingComponents from "../../../Loading/LoadingComponents";
import PerformanceTable from "../../../ReuseComponents/PerformanceTable/PerformanceTable";
import {
  apiCreateRefundOrder,
  fetchRetailOderDetail,
} from "../../Store/Actions/RetailOrderActions";
import "./DetailRetailViewer.css";

const DetailRetailViewer = ({ isOpen, onClose, itemKey, ma_ct = 'HDL' }) => { 
  const [message, contextHolder] = messageAPI.useMessage();
  const { stt_rec } = itemKey;
  const [itemForm] = Form.useForm();
  const [itemForm2] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({});

  const [dataDetail, setDataDetail] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [selectedRowkeys, setSelectedRowkeys] = useState([]);


  const columnOrder=[
    {
        "key": "images",
        "title": "ảnh",
        "dataKey": "images",
        "width": 0,
        "resizable": false,
        "sortable": false,
        "hidden": true,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "stt_rec",
        "title": "stt_rec",
        "dataKey": "stt_rec",
        "width": 0,
        "resizable": false,
        "sortable": false,
        "hidden": true,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "stt_rec0",
        "title": "stt_rec0",
        "dataKey": "stt_rec0",
        "width": 0,
        "resizable": false,
        "sortable": false,
        "hidden": true,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "ma_vt",
        "title": "Mã vật tư",
        "dataKey": "ma_vt",
        "width": 120,
        "resizable": true,
        "sortable": false,
        "hidden": false,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "ten_vt",
        "title": "Tên vật tư",
        "dataKey": "ten_vt",
        "width": 200,
        "resizable": true,
        "sortable": false,
        "hidden": false,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "dvt",
        "title": "Đơn vị tính",
        "dataKey": "dvt",
        "width": 80,
        "resizable": true,
        "sortable": false,
        "hidden": false,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "ten_kho",
        "title": "Kho",
        "dataKey": "ten_kho",
        "width": 120,
        "resizable": true,
        "sortable": false,
        "hidden": false,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
    {
        "key": "gia",
        "title": "Giá",
        "dataKey": "gia",
        "width": 110,
        "resizable": false,
        "sortable": false,
        "hidden": false,
        "type": "Numeric",
        "format": "0",
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          );
        }
    },
    {
        "key": "so_luong",
        "title": "Số lượng",
        "dataKey": "so_luong",
        "width": 100,
        "resizable": true,
        "sortable": false,
        "hidden": false,
        cellRenderer : ({ rowData, column, cellData }) => {
          return (
            <RenderPerformanceTableCell
              rowKey={rowData?.key}
              column={column}
              cellData={cellData}

            />
          )
        }
    },
  ]
  const columns_temp = [
    {
      "key": "images",
      "title": "ảnh",
      "dataKey": "images",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": true,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>
        );
      }
    },
    {
      "key": "stt_rec",
      "title": "stt_rec",
      "dataKey": "stt_rec",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": true,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "stt_rec0",
      "title": "stt_rec0",
      "dataKey": "stt_rec0",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": false,
      "className": "p-0",
      "headerClassName": "p-0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ma_vt",
      "title": "Mã vật tư",
      "dataKey": "ma_vt",
      "width": 80,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ten_vt",
      "title": "Tên vật tư",
      "dataKey": "ten_vt",
      "width": 200,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "dvt",
      "title": "Đơn vị tính",
      "dataKey": "dvt",
      "width": 80,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ten_kho",
      "title": "Kho",
      "dataKey": "ten_kho",
      "width": 120,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "gia",
      "title": "Giá",
      "dataKey": "gia",
      "width": 110,
      "resizable": false,
      "sortable": false,
      "type": "don_gia",
      "editable": true,
      "format": "0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{formatCurrency(cellData)}</span>
        );
      }
    },
    {
      "key": "so_luong",
      "title": "Số lượng",
      "dataKey": "so_luong",
      "width": 100,
      "resizable": true,
      "sortable": false,
      "hidden": false, cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    
    
  ]
  const columns = [
    {
      "key": "images",
      "title": "ảnh",
      "dataKey": "images",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": true,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>
        );
      }
    },
    {
      "key": "stt_rec",
      "title": "stt_rec",
      "dataKey": "stt_rec",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": true,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "stt_rec0",
      "title": "stt_rec0",
      "dataKey": "stt_rec0",
      "width": 0,
      "resizable": false,
      "sortable": false,
      "hidden": false,
      "className": "p-0",
      "headerClassName": "p-0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ma_vt",
      "title": "Mã vật tư",
      "dataKey": "ma_vt",
      "width": 80,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ten_vt",
      "title": "Tên vật tư",
      "dataKey": "ten_vt",
      "width": 200,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "dvt",
      "title": "Đơn vị tính",
      "dataKey": "dvt",
      "width": 80,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "ten_kho",
      "title": "Kho",
      "dataKey": "ten_kho",
      "width": 120,
      "resizable": true,
      "sortable": false,
      "hidden": false,
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      "key": "gia",
      "title": "Giá",
      "dataKey": "gia",
      "width": 110,
      "resizable": false,
      "sortable": false,
      "type": "don_gia",
      "editable": true,
      "format": "0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.key}
            column={column}
            cellData={cellData}
            handleChangePrice={handleChangePrice}
          />
        );
      }
    },
    {
      "key": "so_luong",
      "title": "Số lượng",
      "dataKey": "so_luong",
      "width": 100,
      "resizable": true,
      "sortable": false,
      "hidden": false, cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <span>{cellData}</span>

        );
      }
    },
    {
      key: "tra_hang_yn",
      title: "Trả hàng",
      dataKey: "tra_hang_yn",
      width: 120,
      editable: true,
      resizable: false,
      sortable: false,
      required: false,
      type: "Checkbox",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.key}
            column={column}
            cellData={cellData}
            handleChangeCell={handleChangeCell}
          />
        );
      },
    },
    {
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
    }
  ]


  const getData = async () => {
    setIsLoading(true);
    const result = await fetchRetailOderDetail({
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
    console.log(result, "result")
    setDataDetail(result.detail)
    // result?.columns.map((item) => {
    //   if (item.key === "gia") {
    //     item.key = "gia";
    //     item.title = "Giá";
    //     item.dataKey = "gia";
    //     item.width = 110;
    //     item.resizable = false;
    //     item.sortable = false;
    //     item.type = "Numeric";
    //     item.format = "0";
    //   }

    //   item.cellRenderer = ({ rowData, column, cellData }) => {
    //     return (
    //       <RenderPerformanceTableCell
    //         rowKey={rowData?.key}
    //         column={column}
    //         cellData={cellData}

    //       />
    //     );
    //   };
    // });
    //setTableColumns(result?.columns || []);
    console.log(result?.columns)
    setIsLoading(false);
  };

  const handleRefundModeModify = () => {
    setIsRefundMode(!isRefundMode);
    if (isRefundMode) {
      resetValues();
    }

  };
  const test = () => {
    console.log(data.detail)
  }

  const handleSelectedRowKeyChange = useCallback((keys) => {
    setSelectedRowkeys(keys);
  }, []);
  const handleChangeCell = (value, key, rowKey) => {
    itemForm.setFieldValue(rowKey + '_' + key, value.target.checked ? 1 : 0)
  }

  const handleSaveRefundOrder = async () => {
    const data = { ...itemForm.getFieldsValue() };
    console.log(data)
    const detailData = [];
    getAllRowKeys(data).map((item,index) => {
      console.log(item,index)
      const tt=dataDetail[index]
      tt.children=""
      const rowData = getAllValueByRow(item, data);
      if (rowData.ghi_chu == undefined) tt.ghi_chu = ""; else  tt.ghi_chu=rowData.ghi_chu;
      if (rowData.tra_hang_yn == undefined) tt.tra_hang_yn = 0; else  tt.ghi_chu=rowData.tra_hang_yn;
      if (rowData.so_luong_tl == undefined) tt.so_luong_tl=0; else  tt.so_luong_tl=rowData.so_luong_tl;
      console.log(tt)
      if (tt.so_luong_tl) {
        return detailData.push(tt);
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


  const handleChangePrice = async (discountType, percent, value, key, rowkey) => {
    const gia_ban = itemForm.getFieldValue([rowkey + '_gia'])
    var gia_last = gia_ban;
    if (value > 0) {
      gia_last = value
    } else {
      if (percent > 0) {
        if (discountType == "%") gia_last = gia_ban * (100 - percent) / 100
        else gia_last = gia_ban - percent
      }
    }

    itemForm.setFieldsValue({
      [rowkey + '_' + key]: gia_last
    });

  }




  useEffect(() => {

    if (isOpen) {
      console.log(itemKey)
      getData();
    }

    if (!isOpen) {
      setIsRefundMode(false);

    }

    return () => {
      setIsLoading(true);
      if (isRefundMode) {
        resetValues();
      }
    };
  }, [itemKey, isOpen, stt_rec]);


  const resetValues = () => {
    itemForm.resetFields();
    itemForm2.resetFields();
    setData(prevData => ({
      ...prevData,
      detail: prevData.detail.map(item => ({
        ...item,
        ghi_chu: "",
        tra_hang_yn: 0,
        so_luong_tl: ""
      }))
    }));
  };
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
                    {formatCurrency(data?.master?.t_tien || 0)}
                  </span>
                </div>

                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tổng thuế:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {formatCurrency(data?.master?.t_thue || 0)}
                  </span>
                </div>
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Tổng chiết khấu:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {formatCurrency(data?.master?.t_ck || 0)}
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
                <div className="flex justify-content-between gap-2 align-items-center pl-1 pr-1">
                  <span className="w-6 flex-shrink-0">Trạng thái:</span>
                  <span className="primary_bold_text line-height-16 white-space-normal">
                    {data?.master?.statusname || "Không có dữ liệu"}
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
            <Form form={itemForm2} component={false} initialValues={{}} >
              <div className="h-full min-h-0 shadow_3 not_edit" style={{display:!isRefundMode ? 'block':'none'}}>
                <PerformanceTable
                  reverseIndex
                  selectable={false}
                  columns={columns_temp}
                  onSelectedRowKeyChange={handleSelectedRowKeyChange}
                  data={dataDetail}
                  isLoading={isLoading}
                />
              </div>
            </Form>
            
              
              <Form form={itemForm} component={false} initialValues={{}}  >
                <div className="h-full min-h-0 shadow_3 edit" style={{display:isRefundMode ? 'block':'none'}}>
                  <PerformanceTable
                    reverseIndex
                    selectable
                    columns={columns}
                    onSelectedRowKeyChange={handleSelectedRowKeyChange}
                    data={dataDetail}
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
