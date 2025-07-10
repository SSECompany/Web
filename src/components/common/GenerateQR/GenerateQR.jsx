import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../api";

const GenerateQR = () => {
  const { unitId, id } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const res = await multipleTablePutApi({
          store: "api_getListRestaurantTables",
          param: {
            searchValue: "",
            unitId: unitId,
            userId: id,
            pageindex: 1,
            pagesize: 100,
          },
          data: {},
        });
        setTableData(res?.listObject?.[0] || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [unitId, id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading table data</div>;

  return (
    <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
      {tableData.map((table, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div className="space-y-2 border-2 border-blue-500 p-4 rounded-lg shadow-md bg-white text-center w-[220px]">
            <QRCodeCanvas
              value={`http://10.1.135.82:8002/order/${table.value}?ma_qr=${table.ma_qr}`}
              size={200}
            />
          </div>
          <div className="text-sm font-semibold mt-2">{`${table.value}`}</div>
        </div>
      ))}
    </div>
  );
};

export default GenerateQR;
