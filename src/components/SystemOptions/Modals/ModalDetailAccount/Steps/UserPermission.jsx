import { Input, Tree } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  setChangedPermissions,
  setCurrentPermissions,
} from "../../../Store/Actions";
import {
  getAllClaims,
  getChangedPermissions,
  getCurrentPermissions,
} from "../../../Store/Selectors";

const UserPermission = ({ userClaims }) => {
  const allClaims = useSelector(getAllClaims);
  const currentPermissions = useSelector(getCurrentPermissions);
  const changedPermissions = useSelector(getChangedPermissions);

  const [claimsSelected, setClaimsSelected] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [claimsData, setClaimsData] = useState([]);

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

  const onChange = (e) => {
    const { value } = e.target;
    const newExpandedKeys = allClaims
      .map((claim) => {
        return {
          key: claim.claimValue,
          title: claim.description,
          parent: claim.claimUpper,
        };
      })
      .filter((item) =>
        item.title
          .toLocaleLowerCase()
          .trim()
          .includes(value.toLocaleLowerCase().trim())
      );
    setExpandedKeys((old) => {
      return (old = newExpandedKeys.map((item) => item.key));
    });
    setAutoExpandParent(true);
  };

  const onExpand = (newExpandedKeys) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeys, info) => {
    setClaimsSelected(checkedKeys);
    setCurrentPermissions(checkedKeys);

    if (!changedPermissions) {
      setChangedPermissions(true);
    }
  };

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

      setClaimsSelected((old) => {
        return (old = changedPermissions
          ? currentPermissions
          : userClaims.map((item) => item.key));
      });

      if (!changedPermissions) {
        setCurrentPermissions(userClaims.map((item) => item.key));
      }
    }
  }, [allClaims]);

  return (
    <div>
      <Input
        placeholder="Tìm kiếm"
        style={{ marginBottom: "8px" }}
        onChange={onChange}
      />
      <Tree
        onExpand={onExpand}
        autoExpandParent={autoExpandParent}
        expandedKeys={expandedKeys}
        checkedKeys={claimsSelected}
        onCheck={onCheck}
        treeData={claimsData}
        checkable
        className="system__left__navigation"
      />
    </div>
  );
};

export default UserPermission;
