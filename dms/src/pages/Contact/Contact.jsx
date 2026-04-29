import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse } from "antd";
import React from "react";
import emitter from "../../utils/emitter";

import "./Contact.scss";
import FAQs from "./Modals/FAQs";
import KnewIssues from "./Modals/KnewIssues";
import ReportIssue from "./Modals/ReportIssue";
const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

const getItems = (panelStyle) => [
  {
    key: "1",
    label: "This is panel header 1",
    children: <p>{text}</p>,
    style: panelStyle,
  },
  {
    key: "2",
    label: "This is panel header 2",
    children: <p>{text}</p>,
    style: panelStyle,
  },
  {
    key: "3",
    label: "This is panel header 3",
    children: <p>{text}</p>,
    style: panelStyle,
  },
];

const panelStyle = {
  marginBottom: 24,
  border: "none",
};
const Contact = () => {
  const handleToggleClick = (key) => {
    switch (key) {
      case "REPORTISSUE":
        emitter.emit("OPEN_REPORT_ISSUE_MODAL");
        break;

      case "KNEWISSUES":
        emitter.emit("OPEN_KNEW_ISSUES_MODAL");
        break;

      case "FAQS":
        emitter.emit("OPEN_FAQS_MODAL");
        break;

      default:
        break;
    }
  };

  return (
    <div className="contact__page__container">
      <ReportIssue />

      <KnewIssues />

      <FAQs />

      <div className="contact__rules__container">
        <p>Những vấn đề tiếp nhận</p>
        <Collapse
          bordered={false}
          defaultActiveKey={["1"]}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          items={getItems(panelStyle)}
        />
      </div>

      <div className="contact__toggle_container">
        <div onClick={() => handleToggleClick("REPORTISSUE")}>
          <div className="toggle__title" data-text="Báo lỗi">
            Báo lỗi
          </div>
        </div>

        <div onClick={() => handleToggleClick("KNEWISSUES")}>
          <div className="toggle__title" data-text="Vấn đề đã biết">
            Vấn đề đã biết
          </div>
        </div>

        <div onClick={() => handleToggleClick("FAQS")}>
          <div className="toggle__title" data-text="Câu hỏi thường gặp">
            Câu hỏi thường gặp
          </div>
        </div>

        <div
          className="toggle__disabled"
          onClick={() => handleToggleClick("chat")}
        >
          <div className="toggle__title " data-text="Chat cùng SSE">
            Chat cùng SSE
          </div>
        </div>
      </div>

      {/* <img src={star} alt="" className="star star1"></img>
      <img src={star} alt="" className="star star2"></img>
      <img src={star} alt="" className="star star3"></img>
      <img src={star} alt="" className="star star4"></img>
      <img src={star} alt="" className="star star5"></img>
      <img src={star} alt="" className="star star6"></img> */}
    </div>
  );
};

export default Contact;
