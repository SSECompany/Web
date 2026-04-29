import { Button, Checkbox, Form, Input, message as messageAPI, Select } from "antd";
import { multipleTablePutApi } from "api";
import _ from "lodash";
import { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import { getTransferState } from '../../../Store/Selectors/TransferSelectors';

const MasterInfo = ({ itemForm, masterForm, CreateStockTransfer, masterData }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const { id: userId, storeId, unitId, storeName } = useSelector(getUserInfo);

  const [stockList, setStockList] = useState([]); // Danh sách toàn bộ kho
  const [fStock, setFStock] = useState([]); // Danh sách kho xuất
  const [tStock, setTStock] = useState([]); // Danh sách kho nhập
  const { isFormLoading } = useSelector(getTransferState);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const res = await multipleTablePutApi({
          store: "api_get_site",
          param: { StoreId: '', UnitId: '' }, // Lấy toàn bộ danh sách kho
          data: {},
        });

        if (res.responseModel?.isSucceded) {
          const stocks = _.first(res.listObject).map((d) => ({
            value: d.ma_kho.trim(),
            label: d.ten_kho.trim(),
          }));

          setStockList(stocks); // Lưu toàn bộ danh sách kho
          setFStock(stocks); // Dùng cho kho xuất
          setTStock(stocks); // Dùng cho kho nhập
        }
      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    };

    fetchStockData();
  }, [storeId]);

  // Đặt giá trị ban đầu từ masterData
  useEffect(() => {
    if (masterData) {
      const findStockName = (maKho) => {
        const stock = stockList.find((item) => item.value === maKho?.trim());
        return stock ? stock.label : '';
      };

      masterForm.setFieldsValue({
        fStock: masterData.ma_kho?.trim(),
        tStock: masterData.ma_khon?.trim(),
        ten_kho_xuat: findStockName(masterData.ma_kho),
        ten_kho_nhap: findStockName(masterData.ma_khon),
        ong_ba: masterData.ong_ba?.trim(),
        dieu_xe: false,
        dien_giai: masterData.ghi_chu,
      });
    }
  }, [masterData, stockList, masterForm]);

  // Xử lý khi thay đổi kho xuất hoặc kho nhập
  const handleStockChange = (field, value) => {
    const findStockName = (maKho) => {
      const stock = stockList.find((item) => item.value === maKho?.trim());
      return stock ? stock.label : '';
    };

    if (field === 'fStock') {
      const tenKhoXuat = findStockName(value); // Lấy tên kho xuất từ `ma_kho`
      masterForm.setFieldsValue({ ten_kho_xuat: tenKhoXuat });
    } else if (field === 'tStock') {
      const tenKhoNhap = findStockName(value); // Lấy tên kho nhập từ `ma_khon`
      masterForm.setFieldsValue({ ten_kho_nhap: tenKhoNhap });
    }
  };

  const handleCreateStockTransfer = () => {
    CreateStockTransfer();
  };

  return (
    <div
      className="border-round-lg overflow-hidden flex flex-column align-items-center justify-content-between"
      style={{ flexShrink: 0, background: "white" }}
    >
      <div className="retail_info_container overflow-y-auto p-2 w-full min-w-0">
        <Form form={masterForm} component={false} initialValues={{}}>
          <div className="retail_bill_info">
            <div className="flex justify-content-between gap-2 align-items-center">
              <div className="stock_from">
                <span className="w-6 flex-shrink-0">Kho xuất</span>
                <Form.Item
                  name="fStock"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: `Kho xuất trống!` }]}
                >
                  <Select
                    style={{ width: 200 }}
                    options={fStock}
                    onChange={(value) => handleStockChange('fStock', value)}
                  />
                </Form.Item>
              </div>
              <div className="stock_from">
                <span className="w-6 flex-shrink-0">Kho nhập</span>
                <Form.Item
                  name="tStock"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: `Kho nhập trống!` }]}
                >
                  <Select
                    style={{ width: 200 }}
                    options={tStock}
                    disabled={true}

                    onChange={(value) => handleStockChange('tStock', value)}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="flex align-items-center mt-2">
              <span className="w-3 flex-shrink-0">Người nhận:</span>
              <Form.Item name="ong_ba" style={{ width: "100%", margin: 0 }}>
                <Input placeholder="" className="w-full " />
              </Form.Item>
            </div>

            <div className="flex align-items-center mt-2">
              <span className="w-3 flex-shrink-0">Điều xe:</span>
              <Form.Item
                name="dieu_xe"
                valuePropName="checked"
                wrapperCol={{ offset: 8, span: 16 }}
              >
                <Checkbox></Checkbox>
              </Form.Item>
            </div>

            <div className="flex align-items-center mt-2">
              <span className="w-3 flex-shrink-0">Ghi chú:</span>
              <Form.Item name="dien_giai" style={{ width: "100%", margin: 0 }}>
                <Input placeholder="" className="w-full " />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>

      <div className="flex p-2 w-full shadow-4" style={{ justifyContent: "flex-end" }}>
        <Button
          type="primary"
          className="min-w-0"
          style={{ background: "#52c41a" }}
          onClick={handleCreateStockTransfer}
          disabled={isFormLoading}
        >
          Lưu
        </Button>
      </div>

      {contextHolder}
    </div>
  );
};

export default memo(MasterInfo);
