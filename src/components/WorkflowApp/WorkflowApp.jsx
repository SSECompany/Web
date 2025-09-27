import { Layout } from "antd";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { getIsHideNav } from "../../store/selectors/Selectors";
import Footer from "../Footer/Footer";
import Navbar from "../Navbar/Navbar";
import "./WorkflowApp.css";

const { Header, Content } = Layout;

const WorkflowApp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  // const isHideNav = useSelector(getIsHideNav);

  useEffect(() => {
    // Set workflow page class
    document.body.classList.add("workflow-app");

    // Update page title
    document.title = "Workflow";

    return () => {
      document.body.classList.remove("workflow-app");
    };
  }, []);

  return (
    <Layout className="workflow-layout">
      <Header className="workflow-header">
        <Navbar />
      </Header>
      <Content className="workflow-content">
        <div className="workflow-content-wrapper">
          <Outlet />
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default WorkflowApp;
