import {Button,Form,Select,Checkbox,Input,message as messageAPI,} from "antd";
import _ from "lodash";
import React, {memo,useEffect,useState,} from "react";
import { useSelector } from "react-redux";
import { getUserInfo,getUerSetting } from "../../../../../store/selectors/Selectors";
import { multipleTablePutApi } from "api";
import {getTransferState} from '../../../Store/Selectors/TransferSelectors'

const MasterInfo = ({itemForm,masterForm,CreateStockTransfer}) => {

  const [message, contextHolder] = messageAPI.useMessage();
  const { id: userId, storeId, unitId,storeName } = useSelector(getUserInfo);

  const [fStock,setFStock]=useState([]);
  const [tStock,setTStock]=useState([]);
  const [list_bp,setList_bp]=useState([]);
  const { isFormLoading } = useSelector(getTransferState);

  useEffect(() => {
    multipleTablePutApi({store: "api_get_site",param: {StoreId :'', UnitId :''},data: {},})
    .then(async (res) => {
      if (res.responseModel?.isSucceded) { 
        const temp = _.first(res.listObject).map((d)=>{
          return {value:d.ma_kho, label: d.ten_kho}
        })
        setTStock(temp);     
      }
    });
    multipleTablePutApi({store: "api_get_list_store",param: {},data: {},})
    .then(async (res) => {
      if (res.responseModel?.isSucceded) { 
        setList_bp(_.first(res.listObject));     
        masterForm.setFieldValue(`dept_id`,storeId);
      }
    });
    
    return () => {};
  }, []);

  useEffect(() => {
    multipleTablePutApi({store: "api_get_site",param: {StoreId :storeId, UnitId :''},data: {},})
    .then(async (res) => {
      if (res.responseModel?.isSucceded) { 
        const temp = _.first(res.listObject).map((d)=>{
          return {value:d.ma_kho, label: d.ten_kho}
        })
        setFStock(temp); 
      
      }
    });
    
    return () => {};
  }, [storeId]);

  const handleCreateStockTransfer =()=>{
    CreateStockTransfer();
  }

  return (
    <div className="border-round-lg overflow-hidden flex flex-column align-items-center justify-content-between" style={{  flexShrink: 0, background: "white" }} >
      <div className="retail_info_container overflow-y-auto p-2 w-full min-w-0">
      <Form  form={masterForm}  component={false}  initialValues={{}}  >
        <div className="retail_bill_info">
          <div className="flex justify-content-between gap-2 align-items-center">
            <div className="stock_from">
              <span className="w-6 flex-shrink-0">Kho xuất</span>
              <Form.Item  initialValue={''}  name="fStock"  style={{margin: 0}}  rules={[  {  required: true,  message: `Kho xuất trống !`,},  ]}  >
                <Select    style={{ width: 200 }}    options={fStock}  />

              </Form.Item>
            </div>
            <div className="stock_from">
              <span className="w-6 flex-shrink-0">Kho nhập</span>
              <Form.Item  initialValue={''}  name="tStock"  style={{margin: 0}}  rules={[  {  required: true,  message: `Kho nhập trống !`,},  ]}  >
                <Select   style={{ width: 200 }}    options={tStock}  />
              </Form.Item>
            </div>
            
          </div>

          <div className="flex align-items-center mt-2">
            <span className="w-3 flex-shrink-0">Người nhận:</span>
            <Form.Item  initialValue={''}  name="ong_ba"  style={{ width:"100%",margin: 0}}   >
              <Input  placeholder="" className="w-full " />
            </Form.Item>
          </div>

          <div className="flex  align-items-center mt-2">
            <span className="w-3 flex-shrink-0">Điều xe:</span>
            <Form.Item name="dieu_xe"  valuePropName="checked" wrapperCol={{  offset: 8, span: 16,  }}>
              <Checkbox></Checkbox>
            </Form.Item>
          </div>

          {/* <div className="flex align-items-center mt-2">
            <span className="w-3 flex-shrink-0">Cửa hàng:</span>
            <Form.Item  initialValue={''}  name="dept_id"   style={{ width:"100%",margin: 0}}  >
              <Select  style={{ width: "100%" }}    options={list_bp}  />
            </Form.Item>
          </div> */}

          <div className="flex  align-items-center mt-2">
            <span className="w-3 flex-shrink-0 ">Ghi chú:</span>
            <Form.Item  initialValue={''}  name="dien_giai"  style={{ width:"100%",margin: 0}}  >
              <Input  placeholder="" className="w-full " />
            </Form.Item>
          </div>
        </div>
      </Form>
      </div>

      <div className=" flex p-2 w-full shadow-4 " style={{justifyContent: "flex-end"}}>
        <Button type="primary" className="min-w-0 " style={{background:"#52c41a"}} onClick={handleCreateStockTransfer} disabled={isFormLoading } >
          Tạo Đơn
        </Button>
      </div>

      {contextHolder}
    </div>
  );
};

export default memo(MasterInfo);
