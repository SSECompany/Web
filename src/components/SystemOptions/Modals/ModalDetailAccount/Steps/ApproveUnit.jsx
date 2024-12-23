import { Select } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import SelectItemCode from "../../../../../Context/SelectItemCode";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { ApiWebLookup } from "../../../../DMS/API";
import { apiGetUnitByUser } from "../../../API";
import { setCurrentUnitsPermission } from "../../../Store/Actions";
import { getCreateAccInfo } from "../../../Store/Selectors";

const ApproveUnit = () => {
  const currentUnitsPermission =
    useSelector(getCreateAccInfo).currentUnitsPermission;
  const UserName = useSelector(getCreateAccInfo).currentAccount.user_name;

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
    ApiWebLookup({
      userId: "1",
      controller: "dmdvcs_lookup",
      pageIndex: 1,
      FilterValueCode: params.searchValue,
    }).then((res) => {
      const resOptions = res.data.map((item) => {
        return {
          value: item.code.trim(),
          label: item.name.trim(),
        };
      });
      setLoading(false);
      setGroups([...resOptions]);
    });
  };

  const getUserGroup = () => {
    apiGetUnitByUser({ username: UserName }).then((res) => {
      if (res) {
        const keys = res.map((item) => item.dvcsCode.trim());
        setSelectedItems(keys);

        setCurrentUnitsPermission(
          res.map((item) => {
            return { key: item.dvcsCode.trim(), label: item.name.trim() };
          })
        );
      }
    });
  };

  const handleSelected = (keys, items) => {
    setSelectedItems(keys);
    setCurrentUnitsPermission(
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
    if (currentUnitsPermission.length > 0) {
      setSelectedItems(currentUnitsPermission);
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

export default ApproveUnit;
