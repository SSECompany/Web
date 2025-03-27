import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tableData } from "../components/common/GenerateQR/tableDataQR"; // Import tableData

const ProtectedRoute = () => {
    const token = localStorage.getItem("access_token");
    const location = useLocation();

    if (/^\/order\//.test(location.pathname)) {
        const orderId = location.pathname.split("/")[2];
        const params = new URLSearchParams(location.search);
        const ma_qr = params.get("ma_qr");

        const isValid = tableData.some((table) => table.value === orderId && table.ma_qr === ma_qr);

        if (!isValid) {
            console.log("🚀 ")
            return <Navigate to="/error" replace />;
        }
    }

    if (!token && location.pathname === "/") {
        return <Navigate to="/login" replace />;
    }

    if (token && /^\/order\/[\w-]+$/.test(location.pathname)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;