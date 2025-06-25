import { Outlet } from "react-router-dom";
import "./App.css";
import Loading from "./components/common/Loading/Loading";
import LogViewerButton from "./components/common/LogViewer/LogViewerButton";


function App() {
  return (
    <div className="app-container">
      <div className="App">
        <Outlet />
      </div>
      <Loading />
      <LogViewerButton />
    </div>
  );
}

export default App;
