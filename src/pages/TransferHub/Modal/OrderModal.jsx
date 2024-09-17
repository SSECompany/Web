import { Modal } from "antd";
import _, { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import { formatCurrency } from "../../../app/hooks/dataFormatHelper";
import PerformanceTable from "../../../components/ReuseComponents/PerformanceTable/PerformanceTable";

const CTDH = [
  {
    Field: "id",
    Name: "id",
    Name2: "id",
    Type: "Text",
    Format: null,
    width: 0,
    hidden: true,
  },
  {
    Field: "ten_vt",
    Name: "Tên hàng",
    Name2: "Item name",
    className: "flex-1",
    headerClassName: "flex-1",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },
  {
    Field: "dvt",
    Name: "Đơn vị",
    Name2: "Item unit",
    Type: "Text",
    Format: null,
    width: 80,
    hidden: false,
  },

  {
    Field: "so_luong",
    Name: "SL",
    Name2: "Item quantity",
    Type: "Numeric",
    Format: null,
    width: 80,
    hidden: false,
  },

  {
    Field: "don_gia",
    Name: "Giá",
    Name2: "Item price",
    Type: "Numeric",
    Format: null,
    width: 100,
    hidden: false,
  },

  // {
  //   Field: "tl_ck",
  //   Name: "Tỷ lệ chiết khấu",
  //   Name2: "Promotion ratio",
  //   Type: "Numeric",
  //   Format: null,
  //   width: 100,
  //   hidden: false,
  // },

  {
    Field: "ck",
    Name: "Chiết khấu",
    Name2: "Promotion value",
    Type: "Numeric",
    Format: null,
    width: 100,
    hidden: false,
  },
  {
    Field: "thanh_toan",
    Name: "Thành tiền",
    Name2: "Total",
    Type: "Numeric",
    Format: null,
    width: 130,
    hidden: false,
    className: "primary_bold_text",
  },
];

const OrderModal = ({ children }) => {
  const [orderData, setOrderData] = useLocalStorage(
    "CUSTOMER_RETAILORDER_DATA",
    null
  );
  const [qrSource, setQrSource] = useLocalStorage("QRimg", "");
  const [data, setData] = useState([]);

  const renderColumns = (columns) => {
    const _columns = columns.map((item) => {
      return {
        id: uniqueId(),
        key: item?.Field,
        className: item?.className || "",
        headerClassName: item?.headerClassName || "",
        title: item?.Name,
        dataKey: item?.Field,
        width: item?.width,
        resizable: item?.width ? true : false,
        sortable: false,
        hidden: !item?.width ? true : false,
      };
    });
    return _columns;
  };

  const test=()=>{
    console.log(qrSource);
  }
  useEffect(() => {
    const preparedData = JSON.parse(orderData || null) || [];

    if (!_.isEmpty(preparedData)) {
      preparedData[1].map((item) => {
        item.thanh_toan = item.so_luong * item.don_gia - item.ck;
      });
    }

    setData(preparedData);
    return () => {};
  }, [orderData]);

  useEffect(() => {
    return () => {
      setOrderData("");
      setQrSource("");
    };
  }, []);

  return (
    <Modal
      zIndex={100}
      width={"100vw"}
      forceRender
      closable={false}
      footer
      centered
      open={!_.isEmpty(data) && !_.isEmpty(data[1])}
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <div style={{ width: "100%", height: "55vh" }}>
        <PerformanceTable  columns={renderColumns(CTDH)}  data={_.isEmpty(data) ? [] : data[1]}  isLoading={false}/>
      </div>
      <div  className="line-height-4 mt-2 flex justify-content-between px-2 border-round-lg"  style={{ width: "100%", height: "30vh"  }}  >
        <div className="border-round-sm" style={{width:"50%" ,background: "#F58220", color: "white"}}>
          <div className="w-100 mt-2 flex justify-content-between px-2"><span className="text-left">Khách hàng:</span> <span className="text-right">{data[0]?.ten_kh}</span></div>
          <div className="w-100 mt-2 flex justify-content-between px-2">
            <span className="text-left">Thành tiền:</span> 
            <span className="text-right">{data[0]?.tong_tt}</span>   
          </div>
          <div className="w-100 mt-2 flex justify-content-between px-2">
            <span className="text-left">Chiết khấu :</span> 
            <span className="text-right">
              {data[0]?.tl_ck != 0 ? (
                <>
                  (<span>{formatCurrency(data[0]?.tl_ck)}%</span>)
                </>
              ) : (
                <>
                  (<span>{formatCurrency(data[0]?.ck)}₫</span>)
                </>
              )}
            </span>   
          </div>
          
        </div>
        <div className="image-qr" style={{width:"50%"}}>
          <img  src={qrSource} style={{height:"100%"}} className="w-100 h-100"  />
        </div>
      </div>
      {children}
    </Modal>
  );
};

export default OrderModal;
