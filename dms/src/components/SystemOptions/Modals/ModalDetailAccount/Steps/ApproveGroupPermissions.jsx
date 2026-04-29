import { Select } from "antd";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import SelectItemCode from "../../../../../Context/SelectItemCode";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { SoFuckingUltimateGetApi } from "../../../../DMS/API";
import { apiGetUserGroup } from "../../../API";
import { setCurrentGroupPermission } from "../../../Store/Actions";
import { getCreateAccInfo } from "../../../Store/Selectors";

const ApproveGroupPermissions = () => {
  const currentGroupsPermission =
    useSelector(getCreateAccInfo).currentGroupsPermission;

  const UserId = useSelector(getCreateAccInfo).currentAccount.user_id;

  const [params, setParams] = useState({
    searchValue: "",
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defaultSelected, setDefaultSelected] = useState([]);
  const [SelectedItems, setSelectedItems] = useState([]);

  const handleSearch = (e) => {
    setParams({ ...params, searchValue: filterKeyHelper(e.trim()) });
  };

  const getData = () => {
    SoFuckingUltimateGetApi({
      store: "get_Group_Claims",
      data: { ...params },
    }).then((res) => {
      setLoading(false);
      setGroups(res?.data || []);
    });
  };

  const getUserGroup = () => {
    apiGetUserGroup({ UserId: UserId }).then((res) => {
      setSelectedItems(res?.data || []);
      setCurrentGroupPermission(res?.data || []);

      // setCurrentGroupPermission(
      //   res?.data.map((item) => {
      //     return { key: item.key, label: item.label };
      //   })
      // );
    });
  };

  const handleSelected = (keys, items) => {
    setSelectedItems(keys);
    setCurrentGroupPermission(
      items.map((item) => {
        return { key: item.key, label: item.label };
      })
    );
  };

  useEffect(() => {
    setLoading(true);
    getData();
  }, [JSON.stringify(params)]);

  useEffect(() => {
    if (currentGroupsPermission.length > 0) {
      setSelectedItems(currentGroupsPermission);
    } else {
      getUserGroup();
    }
  }, []);

  return (
    <div>
      <Select
        value={SelectedItems}
        mode="multiple"
        showSearch
        placeholder={`Nhóm quyền`}
        style={{
          width: "100%",
        }}
        defaultActiveFirstOption={false}
        suffixIcon={false}
        filterOption={false}
        notFoundContent={SelectNotFound(loading, groups)}
        onSearch={(e) => {
          handleSearch(e);
        }}
        onChange={handleSelected}
      >
        {SelectItemCode(groups)}
      </Select>
    </div>
  );
};

export default memo(ApproveGroupPermissions);
