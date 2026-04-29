import { Button, Modal, Steps } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { apiCreateAccount } from "../../../../api";
import { formStatus } from "../../../../utils/constants";
import {
  apiAlterUserClaims,
  apiAlterUserGroup,
  apiGetAllClaims,
  apiGetUserClaims,
} from "../../API";
import {
  setAllClaims,
  setChangedPermissions,
  setCurrentAccount,
  setCurrentAvatar,
  setCurrentGroupPermission,
  setCurrentPermissions,
  setCurrentStep,
  setCurrentUnitsPermission,
} from "../../Store/Actions";
import { getAllClaims, getCreateAccInfo } from "../../Store/Selectors";
import ApprovePermissions from "./Steps/ApprovePermissions";
import CreateAccount from "./Steps/CreateAccount";
import FinishCreateAccount from "./Steps/FinishCreateAccount";

const ModalDetailAccount = ({ record, action }) => {
  const [openState, setOpenState] = useState(false);
  const [userClaims, setUserClaims] = useState([]);
  const [current, setCurrent] = useState(0);
  const childRef = useRef();
  const createInfo = useSelector(getCreateAccInfo);
  const allClaims = useSelector(getAllClaims);
  const [saveLoading, setSaveLoading] = useState(false);

  const nextStep = () => {
    if (current < createInfo.totalSteps) {
      childRef.current.nextStep();
    } else {
      handleAddAccount(createInfo);
    }
  };

  const backStep = () => {
    if (!current - 1 < 0) {
      setCurrentStep(current - 1);
    }
  };

  const handleAddAccount = async (data) => {
    setSaveLoading(true);
    const {
      currentAccount: accountInfo,
      currentAvatar: avatar,
      currentGroupsPermission: groupsPermission,
      currentPermissions: permissions,
    } = data;

    const claimsSelected = allClaims
      .filter((item) => permissions.includes(item.claimValue))
      .map((item) => item.id);

    const groupSelected = groupsPermission.map((item) => parseInt(item.key));

    console.log("record", record);
    console.log("claimsSelected", claimsSelected);
    console.log("groupSelected", groupSelected);

    if (_.isEmpty(record)) {
      const {
        full_name: name,
        user_name: userName,
        password,
        e_mail: email,
      } = accountInfo;

      await apiCreateAccount({ name, userName, password, email }).then(
        async (res) => {
          console.log("Tạo tài khoản", res);

          await apiAlterUserGroup({
            userid: res?.userId,
            groups: groupSelected,
          });

          apiAlterUserClaims({
            userid: res?.userId,
            Claims: claimsSelected,
          });

          setSaveLoading(false);
          handleCloseModal();
        }
      );
    } else {
      await apiAlterUserGroup({
        userid: record?.user_id,
        groups: groupSelected,
      });

      apiAlterUserClaims({
        userid: record?.user_id,
        Claims: claimsSelected,
      });

      setSaveLoading(false);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setOpenState(false);
    setCurrentStep(0);
    setCurrent(0);
    setCurrentAccount({});
    setCurrentAvatar("");
    setCurrentPermissions([]);
    setChangedPermissions(false);
    setCurrentGroupPermission([]);
    setCurrentUnitsPermission([]);
    setUserClaims([]);
    setSaveLoading(false);
  };

  useEffect(() => {
    if (record) {
      setOpenState(true);
      if (action === formStatus.EDIT) {
        apiGetUserClaims({ userId: record.user_id })
          .then((res) => {
            setUserClaims((claims) => {
              const fetchResult = res?.data || [];

              return (claims = fetchResult.map((item) => {
                return {
                  key: item.value,
                };
              }));
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  }, [record]);

  useEffect(() => {
    if (allClaims.length == 0) {
      apiGetAllClaims({}).then((res) => {
        const allClaims = [...res];
        allClaims.map((claim) => {
          if (!claim.claimUpper) {
            delete claim.claimUpper;
          }

          delete claim.level;
        });

        setAllClaims(allClaims);
      });
    }
  }, []);

  useEffect(() => {
    setCurrent(createInfo.currentSteps);
  }, [createInfo.currentSteps]);

  useEffect(() => {
    if (!openState) {
      setCurrent(0);
      setCurrentAccount({});
    }
  }, [openState]);

  return (
    <Modal
      open={openState}
      width={"65%"}
      className="no-scroll-modal"
      centered
      title={`${_.isEmpty(record) ? "Tạo" : "Sửa"} tài khoản`}
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      onCancel={handleCloseModal}
      footer={[
        <Button disabled={saveLoading} key={1} onClick={backStep}>
          Quay lại
        </Button>,
        <Button
          key={2}
          onClick={nextStep}
          style={{ background: "var(--light_blue)", color: "white" }}
          loading={saveLoading}
        >
          {current == 2 ? "Hoàn thành" : "Tiếp tục"}
        </Button>,
      ]}
    >
      <div className="h-full overflow-auto flex">
        <div style={{ flex: "1" }}>
          <Steps
            direction="vertical"
            current={current}
            items={[
              {
                title: "Thông tin",
                description: "Tạo thông tin cơ bản",
              },
              {
                title: "Phân quyền",
                description: "Phân quyền truy cập",
              },
              {
                title: "Kết thúc",
                description: "Kiểm tra lại thông tin",
              },
            ]}
          />
        </div>

        <div style={{ flex: "3" }}>
          {current == 0 && (
            <CreateAccount
              ref={childRef}
              userId={record?.user_id}
              record={{ ...record }}
            />
          )}
          {current == 1 && (
            <ApprovePermissions ref={childRef} userClaims={userClaims} />
          )}
          {current == 2 && <FinishCreateAccount />}
        </div>
      </div>
    </Modal>
  );
};

export default memo(ModalDetailAccount);
