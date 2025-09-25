import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from '../../API/phenikaaApi';

const GenerateQR = () => {
  const { unitId, id } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [errorRoom, setErrorRoom] = useState(null);
  const [qrType, setQrType] = useState("table");

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

  useEffect(() => {
    const fetchRoomData = async () => {
      setLoadingRoom(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_get_rooms",
          param: {},
          data: {},
          resultSetNames: [],
        });
        setRoomData(res?.listObject?.[0] || []);
      } catch (err) {
        setErrorRoom(err);
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoomData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading table data</div>;

  return (
    <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded font-semibold border ${
            qrType === "table"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-600 border-blue-600"
          }`}
          onClick={() => setQrType("table")}
        >
          QR Bàn
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold border ${
            qrType === "room"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-green-600 border-green-600"
          }`}
          onClick={() => setQrType("room")}
        >
          QR Phòng
        </button>
      </div>
      {/* QR Codes Table */}
      {qrType === "table" && (
        <div className="w-full">
          <h3 className="text-lg font-bold text-blue-700 mb-4">QR Codes Bàn</h3>
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
                    value={`${process.env.REACT_APP_ROOT}/order/${table.value}?ma_qr=${table.ma_qr}`}
                    size={200}
                  />
                </div>
                <div className="text-sm font-semibold mt-2">
                  {table.label || table.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* QR Codes Room */}
      {qrType === "room" && (
        <div className="w-full">
          <h3 className="text-lg font-bold text-green-700 mb-4">
            QR Codes Phòng
          </h3>
          <div className="flex flex-col items-center space-y-4 flex-wrap gap-7">
            {loadingRoom ? (
              <div>Loading...</div>
            ) : errorRoom ? (
              <div>Error loading room data</div>
            ) : Array.isArray(roomData) && roomData.length > 0 ? (
              roomData.map((room, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "center",
                  }}
                >
                  <div className="space-y-2 border-2 border-green-500 p-4 rounded-lg shadow-md bg-white text-center w-[220px]">
                    <QRCodeCanvas
                      value={`${
                        process.env.REACT_APP_ROOT
                      }/order/${room.value.trim()}?ma_qr=${room.ma_qr}`}
                      size={200}
                    />
                  </div>
                  <div className="text-sm font-semibold mt-2">
                    {room.label || room.value}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                Không có phòng nào hoặc dữ liệu không hợp lệ.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateQR;
