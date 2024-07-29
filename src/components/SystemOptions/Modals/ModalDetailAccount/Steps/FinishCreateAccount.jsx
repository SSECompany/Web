import { Divider, Layout, Tag } from "antd";
import { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import React from "react";
import { useSelector } from "react-redux";
import { getCreateAccInfo } from "../../../Store/Selectors";

const color = [
  "magenta",
  "red",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
  "cyan",
  "blue",
  "geekblue",
  "purple",
];

const FinishCreateAccount = () => {
  const infoStyle = {
    lineHeight: "26px",
  };

  const contentStyle = {
    textAlign: "center",
    minHeight: 120,
    lineHeight: "120px",
    backgroundColor: "transparent",
  };

  const siderStyle = {
    padding: "0px 10px",
    backgroundColor: "transparent",
  };

  const UserInfo = useSelector(getCreateAccInfo);

  const titleStyled = { fontSize: "20px", fontWeight: "bold" };

  return (
    <div className="h-full m-h-0 flex flex-column">
      <div>
        <span style={titleStyled}>Kiểm tra thông tin tài khoản</span>
        <Divider
          style={{
            margin: "10px 0px 12px 0px ",
            borderBlockStart: "2px solid rgba(5, 5, 5, 0.06)",
          }}
        />
      </div>
      <div>
        <Layout hasSider style={{ background: "transparent" }}>
          <Sider width={120} style={contentStyle}>
            {UserInfo.currentAvatar ? (
              <img
                src={UserInfo.currentAvatar}
                alt=""
                style={{ width: "100%", borderRadius: "500px" }}
              />
            ) : (
              "Không có ảnh"
            )}
          </Sider>
          <Content style={siderStyle}>
            <p style={infoStyle}>
              Tên tài khoản :{" "}
              <span className="primary_bold_text">
                {UserInfo.currentAccount.user_name}
              </span>
            </p>{" "}
            <p style={infoStyle}>
              Tên đầy đủ :{" "}
              <span className="primary_bold_text">
                {UserInfo.currentAccount.full_name}
              </span>
            </p>{" "}
            <p style={infoStyle}>
              Email :{" "}
              <span className="primary_bold_text">
                {UserInfo.currentAccount.e_mail}
              </span>
            </p>{" "}
            <p style={infoStyle}>
              Điện thoại :{" "}
              <span className="primary_bold_text">
                {UserInfo.currentAccount.dien_thoai}
              </span>
            </p>
            <p style={infoStyle}>
              Mật khẩu :{" "}
              <span className="primary_bold_text">
                {UserInfo.currentAccount.password
                  ? UserInfo.currentAccount.password
                  : "***********"}
              </span>
            </p>
            <p style={infoStyle}>
              Nhóm :{" "}
              <span className="primary_bold_text">
                {UserInfo?.currentGroupsPermission?.map((item, index) => (
                  <Tag
                    key={index}
                    color={color[Math.floor(Math.random() * 12)]}
                  >
                    {item.label}
                  </Tag>
                ))}
              </span>
            </p>
            <p style={infoStyle}>
              Đơn vị :{" "}
              <span className="primary_bold_text">
                {UserInfo?.currentUnitsPermission?.map((item, index) => (
                  <Tag
                    key={index}
                    color={color[Math.floor(Math.random() * 12)]}
                  >
                    {item.label}
                  </Tag>
                ))}
              </span>
            </p>
          </Content>
        </Layout>
      </div>
    </div>
  );
};

export default FinishCreateAccount;
