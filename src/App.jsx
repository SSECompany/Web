import { Outlet, useLocation } from "react-router-dom";
import VersionIndicator from "./components/common/VersionIndicator/VersionIndicator";
import "./App.css";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/login/";

  return (
    <div className="app-container">
      {/* Trang Login không có Navbar → cần VersionIndicator để check version + hiện badge khi có bản mới */}
      {isLoginPage && <VersionIndicator showDetails={false} />}
      <div className="App">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
