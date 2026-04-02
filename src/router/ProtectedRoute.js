import { useEffect, useRef, useState } from "react";
import { notification } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { apiGetQRCodeData, multipleTablePutApi } from "../api";
import jwt from "../utils/jwt";
import { setListOrderTable } from "../modules/order/store/order";
import {
  setQRCodeData,
  setQRPayload,
  setQRCodeLoading,
  setQRCodeError,
} from "../store/reducers/qrCodeSlice";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const roleWarningShownRef = useRef(false);
  const qrCodeFetchedKeyRef = useRef(null);
  const { unitId, id } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [errorRoom, setErrorRoom] = useState(null);

  const needsTableValidation = /^\/order\/[\w-]+(\?ma_qr=[\w-]+)?$/.test(
    location.pathname
  );
  const tablesFetchedKeyRef = useRef(null);

  // Xử lý query param để set QR payload trực tiếp (nếu có)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qrCodeParam = params.get("qrCode") || params.get("qr");
    if (qrCodeParam) {
      dispatch(setQRPayload(qrCodeParam));
    }
  }, [location.search, dispatch]);

  // Helper function để parse QR code data từ API response - chỉ lấy stringQrCode
  const parseQRCodeResponse = (res) => {
    let qrCodeData = res;
    let qrPayload = null;

    // Nếu response có cấu trúc listObject
    if (res?.listObject?.[0]?.[0]) {
      qrCodeData = res.listObject[0];
      // Chỉ lấy field stringQrCode (thử cả camelCase và PascalCase)
      const firstItem = res.listObject[0][0];
      qrPayload = firstItem.stringQrCode || null;
    } else if (res?.listObject?.[0]) {
      // Nếu là array trực tiếp
      qrCodeData = res.listObject[0];
      if (Array.isArray(qrCodeData) && qrCodeData.length > 0) {
        const firstItem = qrCodeData[0];
        qrPayload = firstItem?.stringQrCode || firstItem?.StringQrCode || null;
      }
    } else if (res?.stringQrCode || res?.StringQrCode) {
      // Nếu response là object có field stringQrCode
      qrPayload = res.stringQrCode || res.StringQrCode;
      qrCodeData = res;
    }

    return { qrCodeData, qrPayload };
  };

  // Call QRCode data API mỗi khi reload trang - luôn gọi lại để lấy data mới nhất
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !unitId) return;

    const key = `qrcode-data-${unitId}`;
    
    // Reset ref để luôn gọi API mỗi khi reload trang
    qrCodeFetchedKeyRef.current = null;

    const fetchQRCodeData = async () => {
      dispatch(setQRCodeLoading(true));
      try {
        const res = await apiGetQRCodeData({ unitId });
        const { qrCodeData, qrPayload } = parseQRCodeResponse(res);

        // Dispatch vào Redux
        dispatch(
          setQRCodeData({
            qrCodeData,
            qrPayload,
            unitId,
          })
        );

        // Cache vào sessionStorage để các component khác có thể dùng (nhưng không dùng để skip API call)
        sessionStorage.setItem(key, JSON.stringify({ qrCodeData, qrPayload }));
      } catch (e) {
        console.error("Error fetching QR code data:", e);
        dispatch(setQRCodeError(e.message || "Failed to fetch QR code data"));
      } finally {
        dispatch(setQRCodeLoading(false));
      }
    };

    fetchQRCodeData();
  }, [unitId, dispatch]);

  useEffect(() => {
    if (!needsTableValidation) {
      setLoading(false);
      return;
    }
    if (!unitId || !id) {
      setLoading(false);
      return;
    }
    const key = `tables-${unitId}-${id}`;
    if (tablesFetchedKeyRef.current === key) return;
    tablesFetchedKeyRef.current = key;

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
        const raw = res?.listObject?.[0] || [];
        setTableData(raw);
        const tableDataForStore = raw.map((item) => ({
          id: item.value,
          name: item.label,
        }));
        dispatch(setListOrderTable(tableDataForStore));
      } catch (err) {
        setError(err);
        tablesFetchedKeyRef.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [unitId, id, dispatch, needsTableValidation]);

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

  // Bypass token check for /order/:orderId?ma_qr=xxx path
  if (/^\/order\/[\w-]+(\?ma_qr=[\w-]+)?$/.test(location.pathname)) {
    if (loading || loadingRoom) return null; // or a loading spinner
    if (error || errorRoom) return <Navigate to="/error" replace />;
    const orderId = location.pathname.split("/")[2];
    const params = new URLSearchParams(location.search);
    const ma_qr = params.get("ma_qr");

    const foundTable = tableData.find(
      (table) => table.value === orderId && table.ma_qr === ma_qr
    );
    const foundRoom = roomData.find(
      (room) => room.value?.trim() === orderId && room.ma_qr === ma_qr
    );

    // Lưu label vào localStorage để POSPage.jsx lấy ra hiển thị
    if (foundTable) {
      localStorage.setItem("pos_table_label", foundTable.label);
      localStorage.removeItem("pos_room_label");
    } else if (foundRoom) {
      localStorage.setItem("pos_room_label", foundRoom.label);
      localStorage.removeItem("pos_table_label");
    } else {
      localStorage.removeItem("pos_table_label");
      localStorage.removeItem("pos_room_label");
    }

    if (!foundTable && !foundRoom) {
      return <Navigate to="/error" replace />;
    }
    return <Outlet />; // Allow access to the order page
  }

  // Kiểm tra nếu không có token, điều hướng đến trang đăng nhập
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let claims = {};
  try {
    claims = jwt.getClaims?.() || {};
  } catch (error) {
    console.error("Invalid token:", error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleWeb = claims?.RoleWeb;

  if (!roleWeb && !roleWarningShownRef.current) {
    const warnedKey = "missing_roleweb_warned";
    const hasWarned = sessionStorage.getItem(warnedKey) === "1";

    if (!hasWarned) {
      notification.warning({
        message: "Tài khoản chưa được cấp quyền truy cập",
        description: "Vui lòng liên hệ quản trị viên để được phân quyền.",
        placement: "topRight",
      });
      sessionStorage.setItem(warnedKey, "1");
    }

    roleWarningShownRef.current = true;
  } else if (roleWeb) {
    sessionStorage.removeItem("missing_roleweb_warned");
  }

  // Điều hướng dựa trên RoleWeb
  if (roleWeb === "isPos" || roleWeb === "isPosMini") {
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
  } else if (roleWeb === "isMealTiket") {
    if (location.pathname !== "/meal-ticket") {
      return <Navigate to="/meal-ticket" replace />;
    }
  } else if (!roleWeb) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else {
    return <Navigate to="/error" replace />;
  }

  // Logic cũ: Điều hướng nếu đã đăng nhập và truy cập /order/:orderId
  if (token && /^\/order\/[\w-]+$/.test(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
