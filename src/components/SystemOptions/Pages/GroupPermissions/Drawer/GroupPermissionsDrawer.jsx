import {
  Button,
  Drawer,
  Form,
  Input,
  notification,
  Skeleton,
  Space,
  Tree,
} from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { formStatus } from "../../../../../utils/constants";
import {
  apiAlterGroupClaims,
  apiCreategroup,
  apiGetAllClaims,
  apiGetGroupClaims,
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
  const [infoForm] = Form.useForm();

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
      var success = false;

      if (actions === formStatus.EDIT) {
        await apiAlterGroupClaims({
          GroupId: currentItem?.value,
          Claims: ids,
        }).then((res) => {
          success = true;
        });
      }
      if (actions === formStatus.ADD) {
        try {
          await infoForm.validateFields();

          await apiCreategroup({
            ...infoForm.getFieldsValue(),
            GroupType: "",
            Claims: ids,
          }).then((res) => {
            success = true;
          });
        } catch (error) {
          return (success = false);
        }
      }

      if (success) {
        notification.success({
          message: `Thực hiện thành công`,
        });
        handleClose();
        refreshData();
      } else {
        notification.warning({
          message: `Có lỗi xảy ra khi thực hiện`,
        });
      }
    } else {
      handleClose();
    }
  };

  ////////////Effects

  useEffect(() => {
    if (Object.keys(currentItem).length > 0 && actions === formStatus.EDIT) {
      setLoading(false);
      apiGetGroupClaims({ GroupId: currentItem?.value })
        .then((res) => {
          console.log(res);
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

      if (actions === formStatus.ADD) {
        infoForm.resetFields();
      }
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
              {actions == formStatus.ADD ? (
                <>
                  <p className="sub_text_color font-bold">Thông tin nhóm</p>
                  <Form
                    form={infoForm}
                    className="default_modal_container"
                    style={{ gap: "12px 0px" }}
                  >
                    <div className="default_modal_group_items">
                      <Space direction="vertical">
                        <span className="default_bold_label">Tên nhóm :</span>
                        <div className="default_modal_group_items">
                          <Form.Item
                            name="GroupName"
                            initialValue={""}
                            rules={[
                              {
                                required: true,
                                message: "Điền tên nhóm",
                              },
                            ]}
                          >
                            <Input
                              placeholder="Tên nhóm"
                              onChange={(e) => {
                                setIsChanged(true);
                              }}
                            />
                          </Form.Item>
                        </div>
                      </Space>
                    </div>

                    <div className="default_modal_group_items">
                      <Space direction="vertical">
                        <span className="default_bold_label">Diễn giải :</span>
                        <div className="default_modal_group_items">
                          <Form.Item name="Description" initialValue={""}>
                            <Input placeholder="Diễn giải" />
                          </Form.Item>
                        </div>
                      </Space>
                    </div>
                  </Form>

                  <p className="sub_text_color font-bold">Phân quyền</p>
                </>
              ) : (
                <p
                  className="site-description-item-profile-p"
                  style={{
                    marginBottom: 24,
                  }}
                >
                  Phân quyền nhóm:{" "}
                  <span className="sub_text_color font-bold">
                    {currentItem?.value} - {currentItem?.label?.trim()}
                  </span>
                </p>
              )}

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
