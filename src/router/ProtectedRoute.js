import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

const ProtectedRoute = () => {
    const token = localStorage.getItem("access_token");
    const location = useLocation();
    const { orderId } = useParams();

    if (token) {
        return <Outlet />;
    }

    return location.pathname === "/" ? <Navigate to="/login" replace /> : <Navigate to={`/order/${orderId}`} replace />;
};

export default ProtectedRoute;