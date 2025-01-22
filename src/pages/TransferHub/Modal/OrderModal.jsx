import { Modal } from "antd";
import _, { uniqueId } from "lodash";
import { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import { formatCurrency } from "../../../app/hook/dataFormatHelper";
import PerformanceTable from "../../../components/PerformanceTable/PerformanceTable";
import './OrderModal.css';

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
  );
  const [qrSource, setQrSource] = useLocalStorage("QRimg", "");
  const [openQrCode, setOpenQrCode] = useState(false);
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

  const test = () => {
    console.log(qrSource);
  }
  useEffect(() => {
    return () => {
      console.log()
      const storeActive = JSON.parse(localStorage.getItem("CUSTOMER_RETAILORDER_DATA"));
      console.log(storeActive)
      console.log(typeof (storeActive))
      if (typeof (storeActive) != 'object' || storeActive == '' || storeActive == null || storeActive == undefined) return;
      console.log('---')
      const preparedData = storeActive || [];
      console.log(preparedData);

      if (!_.isEmpty(preparedData)) {
        preparedData[1].map((item) => {
          item.thanh_toan = item.so_luong * item.don_gia - item.ck;
          item.so_luong = formatCurrency(item.so_luong);
          item.don_gia = formatCurrency(item.don_gia);
          item.thanh_toan = formatCurrency(item.thanh_toan);
          item.ck = formatCurrency(item.ck);
        });
      }
      setData(preparedData);


    };
  }, [JSON.stringify(orderData)]);

  useEffect(() => {
    return () => {
      setQrSource("");
    };
  }, []);

  // function usePrevious(value) {
  //   const ref = useRef();
  //   useEffect(() => {
  //     ref.current = value;
  //   });
  //   return ref.current;
  // }
  // const prevAmount = usePrevious({qrSource});
  useEffect(() => {
    console.log(qrSource)
    if (qrSource != '') setOpenQrCode(true);
    else setOpenQrCode(false);
  }, [qrSource]);
  return (
    <div>
      <Modal
        zIndex={100}
        width={"100vw"}
        forceRender
        closable={false}
        footer
        centered
        className="custom_table"
        open={orderData != ""}
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div style={{ width: "100%", height: "55vh" }}>
          <PerformanceTable columns={renderColumns(CTDH)} data={_.isEmpty(data) ? [] : data[1]} isLoading={false} />
        </div>
        <div className="line-height-4 mt-2 flex  px-2 border-round-lg" style={{ width: "100%", height: "30vh" }}  >
          <div className="border-round-sm" style={{
            width: "100%",
            background: "rgb(217 235 248)",
            color: "black",
            fontWeight: "bold",
          }}>
            <div className="w-100 mt-2 flex justify-content-between px-2"><span className="text-left">Khách hàng:</span> <span className="text-right">{data[0]?.ten_kh}</span></div>
            <div className="w-100 mt-2 flex justify-content-between px-2">
              <span className="text-left">Thành tiền:</span>
              <span className="text-right">{formatCurrency(data[0]?.tong_tt)}</span>
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
          {/* <div className="image-qr" style={{width:"50%"}}>
            <img  src={qrSource} style={{height:"100%"}} className="w-100 h-100"  />
          </div> */}
        </div>
        {children}
      </Modal>
      <Modal
        zIndex={5000}
        forceRender
        closable={false}
        footer
        centered
        open={openQrCode}
        onCancel={() => {
          setOpenQrCode(false);
        }}
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
        styles={{ body: { position: "relative", }, }}
      >
        <img src={qrSource} style={{ height: "100%" }} className="w-100 h-100" />

      </Modal>
    </div>

  );
};

export default OrderModal;
