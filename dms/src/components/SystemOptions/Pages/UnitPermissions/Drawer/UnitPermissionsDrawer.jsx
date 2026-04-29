import { Button, Drawer, notification, Skeleton, Space, Tree } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { formStatus } from "../../../../../utils/constants";
import {
  apiAlterUnitClaims,
  apiGetAllClaims,
  apiGetUnitClaims,
} from "../../../API";
import { setAllClaims } from "../../../Store/Actions";
import { getAllClaims } from "../../../Store/Selectors";

const GroupPermissionsDrawer = ({
  openState,
  handleClose,
  currentItem,
  actions,
  refreshData,
}) => {
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

  const handleOkButton = async () => {
    if (isChanged) {
      const ids = allClaims
        .filter((item) => claimsSelected.includes(item.claimValue))
        .map((item) => item.id);

      await apiAlterUnitClaims({
        DVCSCode: currentItem?.ma_dvcs.trim(),
        Claims: ids,
      })
        .then((res) => {
          notification.success({
            message: `Thực hiện thành công`,
          });
          handleClose();
          refreshData();
        })
        .catch((err) => {
          notification.warning({
            message: `Có lỗi xảy ra khi thực hiện`,
          });
        });
    } else {
      handleClose();
    }
  };

  ////////////Effects

  useEffect(() => {
    if (Object.keys(currentItem).length > 0 && actions === formStatus.EDIT) {
      setLoading(true);
      apiGetUnitClaims({ DVCSCode: currentItem?.ma_dvcs })
        .then((res) => {
          const fetchClaims = res.data.map((item) => {
            return item.value;
          });

          const allClaimsValues = allClaims.map((claim) => {
            return claim.claimValue;
          });

          const selected = fetchClaims.filter((item) =>
            _.includes(allClaimsValues, item)
          );
          setClaimsSelected(selected);
          setExpandedKeys(selected);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currentItem]);

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
      width={400}
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
            <div className="flex h-full min-h-0 flex-column gap-3">
              <p className="site-description-item-profile-p">
                Phân quyền đơn vị:{" "}
                <span className="sub_text_color font-bold">
                  {currentItem?.ma_dvcs} - {currentItem?.ten_dvcs?.trim()}
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

export default memo(GroupPermissionsDrawer);
