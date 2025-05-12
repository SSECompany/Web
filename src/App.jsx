import jwt from "./utils/jwt";
import Navbar from "./components/layout/Navbar/Navbar";
import { Outlet } from "react-router-dom";
import "./App.css";
import Loading from "./components/common/Loading/Loading";

function App() {
  return (
    <div className="app-container">
      {jwt.checkExistToken() && <Navbar />}
      <div className="App">
        <Outlet />
      </div>
      <Loading />
    </div>
  );
}

export default App;
