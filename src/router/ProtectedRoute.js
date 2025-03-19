import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
    const token = localStorage.getItem("access_token");
    const location = useLocation();

    if (token && /^\/order\/\d+$/.test(location.pathname)) {
        return <Navigate to="/" replace />;
    }

    if (!token && !/^\/order\/\d+$/.test(location.pathname)) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;