// import React from "react";
// import POSPage from "./pages/POSPage";

// const App = () => {
//   return (
//     <div style={{ padding: "20px" }}>
//       <POSPage />
//     </div>
//   );
// };

// export default App;


import { Outlet } from "react-router-dom";
import "./App.css";
import Loading from "./components/Loading/Loading";

function App() {

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
