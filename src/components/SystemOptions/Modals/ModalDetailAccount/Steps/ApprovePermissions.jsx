import { CaretRightOutlined } from "@ant-design/icons";
import { Collapse, Divider, theme } from "antd";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useSelector } from "react-redux";
import { setCurrentStep } from "../../../Store/Actions";
import { getAllClaims, getCreateAccInfo } from "../../../Store/Selectors";
import ApproveGroupPermissions from "./ApproveGroupPermissions";
import ApproveUnit from "./ApproveUnit";
import UserPermission from "./UserPermission";

const ApprovePermissions = ({ userClaims }, ref) => {
  const { token } = theme.useToken();

  const titleStyled = { fontSize: "20px", fontWeight: "bold" };

  const allClaims = useSelector(getAllClaims);

  const [claimsData, setClaimsData] = useState([]);
  const [claimsSelected, setClaimsSelected] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const createInfo = useSelector(getCreateAccInfo);

  useImperativeHandle(ref, () => ({
    nextStep: async () => {
      try {
        setCurrentStep(createInfo.currentSteps + 1);
      } catch (error) {
        return;
      }
    },
  }));

  const permissionsItems = [
    {
      key: "1",
      label: "Quyền cá nhân",
      children: <UserPermission userClaims={userClaims} />,
      style: {
        marginBottom: 24,
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: "none",
      },
      forceRender: true,
    },
    {
      key: "2",
      label: "Nhóm quyền",
      children: <ApproveGroupPermissions />,
      style: {
        marginBottom: 24,
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: "none",
      },
      forceRender: true,
    },
    {
      key: "3",
      label: "Đơn vị cơ sở",
      children: <ApproveUnit />,
      style: {
        marginBottom: 24,
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: "none",
      },
      forceRender: true,
    },
  ];

  return (
    <div className="h-full m-h-0 flex flex-column">
      <div>
        <span style={titleStyled}>Phân quyền tài khoản</span>
        <Divider
          style={{
            margin: "10px 0px 12px 0px ",
            borderBlockStart: "2px solid rgba(5, 5, 5, 0.06)",
          }}
        />
      </div>

      <Collapse
        variant={"borderless"}
        defaultActiveKey={["1"]}
        className="h-full m-h-0 overflow-auto flex flex-column"
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        style={{
          background: token.colorBgContainer,
        }}
        items={permissionsItems}
      />
    </div>
  );
};

export default forwardRef(ApprovePermissions);
