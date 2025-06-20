import { Outlet } from "react-router-dom";
import "./App.css";
import Loading from "./components/common/Loading/Loading";
import useVersionCheck from "./hooks/useVersionCheck";

function App() {
  // Kiểm tra version tự động
  useVersionCheck();

  return (
    <div className="app-container">
      <div className="App">
        <Outlet />
      </div>
      <Loading />
    </div>
  );
}

export default App;
