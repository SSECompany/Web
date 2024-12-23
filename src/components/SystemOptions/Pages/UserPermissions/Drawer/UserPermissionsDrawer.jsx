import { Button, Drawer, notification, Skeleton, Space, Tree } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  apiAlterUserClaims,
  apiGetAllClaims,
  apiGetUserClaims,
} from "../../../API";
import { setAllClaims } from "../../../Store/Actions";
import { getAllClaims } from "../../../Store/Selectors";

const UserPermissionsDrawer = ({ openState, handleClose, currentUser }) => {
  const allClaims = useSelector(getAllClaims);

  const [claimsData, setClaimsData] = useState([]);
  const [claimsSelected, setClaimsSelected] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeys, info) => {
    setClaimsSelected(checkedKeys);
    setIsChanged(true);
  };

  const nestedArray = (raw) => {
    var data = [...raw],
      tree = (function (data, root) {
        var t = {};
        data.forEach((o) => {
          Object.assign((t[o.key] = t[o.key] || {}), o);
          t[o.parent] = t[o.parent] || {};
          t[o.parent].children = t[o.parent].children || [];
          t[o.parent].children.push(t[o.key]);
        });
        return t[root].children;
      })(data, undefined);

    const final = tree;
    return final;
  };

  const handleOkButton = () => {
    if (isChanged) {
      const ids = allClaims
        .filter((item) => claimsSelected.includes(item.claimValue))
        .map((item) => item.id);
      apiAlterUserClaims({
        userid: currentUser?.user_id,
        Claims: ids,
      }).then((res) => {
        notification.success({
          message: `Thực hiện thành công`,
        });
        handleClose();
      });
    } else {
      handleClose();
    }
  };

  ////////////Effects

  useEffect(() => {
    if (Object.keys(currentUser).length > 0) {
      setLoading(true);
      apiGetUserClaims({ userId: currentUser?.user_id })
        .then((res) => {
          const userClaims = res.data.map((item) => {
            return item.value;
          });

          const allClaimsValues = allClaims.map((claim) => {
            return claim.claimValue;
          });

          const selected = userClaims.filter((item) =>
            _.includes(allClaimsValues, item)
          );

          setLoading(false);
          setClaimsSelected(selected);
          setExpandedKeys(selected);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currentUser]);

  useEffect(() => {
    if (allClaims.length > 0) {
      const processedClaims = allClaims.map((claim) => {
        return {
          key: claim.claimValue,
          title: claim.description,
          parent: claim.claimUpper,
        };
      });
      setClaimsData(nestedArray(processedClaims));
    }
  }, [allClaims]);

  useEffect(() => {
    if (!openState) {
      setClaimsSelected([]);
      setExpandedKeys([]);
    }
  }, [openState]);

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

  return (
    <Drawer
      width={500}
      placement="right"
      closable={false}
      onClose={handleClose}
      open={openState}
    >
      <div className="permission__drawer__conatainer">
        {loading ? (
          <Skeleton active loading={loading} />
        ) : (
          <>
            <div className="flex h-full min-h-0 flex-column">
              <p
                className="site-description-item-profile-p"
                style={{
                  marginBottom: 24,
                }}
              >
                Phân quyền nhân viên:{" "}
                <span className="sub_text_color font-bold">
                  {currentUser?.user_id} : {currentUser?.user_name?.trim()}
                </span>
              </p>
              <Tree
                className="permission__tree__container"
                checkable
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onCheck={onCheck}
                checkedKeys={claimsSelected}
                treeData={claimsData}
              />
            </div>
            <div className="text-right">
              <Space align="center">
                <Button
                  className="default_subsidiary_button"
                  onClick={handleClose}
                >
                  Huỷ
                </Button>

                <Button
                  onClick={handleOkButton}
                  className="default_primary_button"
                >
                  Lưu
                </Button>
              </Space>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};

export default memo(UserPermissionsDrawer);
