import { Select, Space, Switch, Button, notification } from "antd";
import React, { useEffect, useState } from "react";
import https from "../../../../utils/https";

import PermissionTree from './PermissionTree'; 

const PermissionSetting = () => {
  const [typePermission, setTypePermission] = useState(true);
  const [allClaims, setAllClaims] = useState([]);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [optionsTypeUser, setOptionsTypeUser] = useState([]);
  const [nameUpdate, setNameUpdate] = useState('');

  const handleChangeUserName = async (value) => {
    setNameUpdate(value);
    const res = await https.post(`User/GetClaims`, { type: typePermission ? 0 : 1, value: value });
    const temp = res.data.roles;
    setSelected(temp);
    getAllClaims(temp);
  };

  const onChangeTypePermission = () => {
    setTypePermission(!typePermission);
    setNameUpdate('');
    setSelected([]); // reset selected
    setAllClaims([]);
  };

  const SavePermission = () => {
    if (nameUpdate === '') {
      notification.warning({
        message: `Chưa chọn tài khoản hoặc loại tài khoản`,
      });
      return;
    }
    if (selected.length < 1) {
      notification.warning({
        message: `Tài khoản đang không được gán bất kì quyền nào`,
      });
      return;
    }
    https.post(`User/UpdateClaims`, {
      type: typePermission ? 0 : 1,
      value: nameUpdate,
      listPermission: selected.join(','),
    }).then(() => {
      notification.success({
        message: `Thực hiện thành công`,
      });
    });
  };

  const handleSelectRolesChange = (newSelect) => {
    setSelected(newSelect);
  };

  const getAllClaims = (selectedRoles) => {
    https.post(`User/GetAllClaims`, {}).then((res) => {
      const newClaims = res.data.map((d) => ({
        ...d,
        check: selectedRoles.includes(d.name),
      }));
      setAllClaims(newClaims);
    });
  };

  const getAllUser = () => {
    https.post(`User/GetUserByName`, { username: '' }).then((res) => {
      const data = res.data.map((d) => ({
        label: d.userName,
        value: d.userName,
        desc: d.userName,
      }));
      setOptions(data);
    });
  };

  const getAllRoles = () => {
    https.post(`User/GetAllRoles`, {}).then((res) => {
      const data = res.data.map((d) => ({
        value: d.name,
        label: d.name,
      }));
      setOptionsTypeUser(data);
    });
  };

  useEffect(() => {
    getAllUser();
    getAllRoles();
  }, []);

  return (
    <div className="relative flex flex-column h-full" style={{ background: "white" }}>
      <span className="primary_bold_text text-lg line-height-4 p-2 shadow-1 border-bottom-1">
        Phân quyền tài khoản
      </span>

      <Space direction="vertical" className="mt-5">
        <Switch checkedChildren="Tài khoản" unCheckedChildren="Loại tài khoản" checked={typePermission} onChange={onChangeTypePermission} />
      </Space>

      {!typePermission ? (
        <Space wrap className="mt-5 mb-5"> 
            <Select style={{ width: 120 }} onChange={handleChangeUserName} options={optionsTypeUser}/>
        </Space>
      ) : (
        <Select showSearch mode="combobox" className="mt-5 mb-5" style={{ width: '100%' }} placeholder="Chọn tài khoản" 
          onSelect={handleChangeUserName}
          options={options}
        />
      )}

      <Space wrap className="mt-5 mb-5 bg-white">
        <PermissionTree data={allClaims} onSelectRolesChange={handleSelectRolesChange} />
      </Space>

      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4 mt-5">
        <Button type="primary" className="w-full min-w-0" onClick={SavePermission}>
          Phân quyền
        </Button>
      </div>
    </div>
  );
};

export default PermissionSetting;
