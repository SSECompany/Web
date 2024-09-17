import { Select, Space ,Switch,Button,notification } from "antd";
import React, { useEffect, useState } from "react";
import https from "../../../../utils/https";

import PermissionTree from './PermissionTree'; 

const PermissionSettingLTEST = () => {
  const [typePermission, setTypePermission] = useState(true);
  const [allClaims, setAllClaims] = useState([]);
  const [options,setOptions]=useState([]);
  const [selected, setSelected] = useState([]);
  const [optionsTypeUser,setOptionsTypeUser]=useState([]);
  const [nameUpdate,setNameUpdate]=useState('');

  //var defaultSelected=['0-0'];
  const handleChangeUserName = async (value) => {
    setNameUpdate(value);
    const res = await https.post(`User/GetClaims`, {type:typePermission?0:1,value:value})
    var temp =selected;
    temp= res.data.roles;
    setSelected(temp);
  };
  const onChangeTypePermission = ()=>{
    setTypePermission(!typePermission);
    setNameUpdate('');
  }
  const SavePermission=()=>{
    if(nameUpdate==''){
      notification.success({
        message: `Chưa chọn tài khoản hoặc loại tài khoản`,
      });
      return;
    }
    if(selected.length<1){
      notification.success({
        message: `Tài khoản đang không được gán bất kì quyền nào`,
      });
      return;
    }
    https.post(`User/UpdateClaims`, {
      type:typePermission?0:1,
      value:nameUpdate,
      listPermission:selected.join(',')
    }).then((res) => {
      notification.success({
        message: `Thực hiện thành công`,
      });
    });

  }

  const handleSelectChange = (newSelect) => {
    setSelected(newSelect);
  };

  const getAllClaims = (selected) => {
    https.post(`User/GetAllClaims`, {}).then((res) => {
      const newClaims = res.data.map(d => {
        return { ...d, check: selected.includes(d.name) };
      });
      setAllClaims(newClaims);
    });
  };
  
  const getAllUser=()=>{
    https.post(`User/GetUserByName`, {username:''}).then((res) => {
      var data=[];
      res.data.map(d=>{
        data.push({
          label: d.userName,
          value: d.userName,
          desc: d.userName,
        })
      })
      setOptions(data);
    });
  }
  const getAllRoles=()=>{
    https.post(`User/GetAllRoles`, {}).then((res) => {
      var data=[];
      res.data.map(d=>{
        data.push({value:d.name,label:d.name})
      })
      setOptionsTypeUser(data);
    });
  }
  
  useEffect(() => {
    getAllUser();
    getAllRoles();
    return () => {};
  }, []);

  useEffect(() => {
    getAllClaims(selected);
  }, [selected]);

  

  return (
    <div className="relative flex flex-column h-full" style={{ background: "white" }}>
      <span className="primary_bold_text text-lg line-height-4 p-2 shadow-1 border-bottom-1">
        Phân quyền tài khoản
      </span>

      <Space direction="vertical" className="mt-5">
        <Switch checkedChildren="Tài khoản" unCheckedChildren="Loại tài khoản" checked={typePermission} onChange={onChangeTypePermission}  />
      </Space>


      {!typePermission ?
      <Space wrap className="mt-5 mb-5">
        <Select defaultValue="lucy" style={{  width: 120,  }} onChange={handleChangeUserName} options={optionsTypeUser} />
      </Space>
      :
      <Select mode="single" className="mt-5 mb-5"  style={{ width: '100%' }} placeholder="select one user"  onSelect={handleChangeUserName}options={options}  optionRender={(option) => (
          <Space>
            <span role="img" aria-label={option.data.label}> {option.data.emoji} </span>
            {option.data.desc}
          </Space>
        )}
      />}

      <Space wrap className="mt-5 mb-5">
          <PermissionTree data={allClaims} onSelectChange={handleSelectChange} />
        </Space>   

      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4 mt-5">
        <Button type="primary" className="w-full min-w-0"  onClick={SavePermission}>Update</Button>
      </div>
    </div>
  );
};

export default PermissionSettingLTEST;
