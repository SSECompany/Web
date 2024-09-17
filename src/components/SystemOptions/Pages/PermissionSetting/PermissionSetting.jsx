import { Transfe,Tree , Select, Space ,Switch,Button,Checkbox,List,notification   } from "antd";
import React, { useEffect, useState,useCallback,useMemo} from "react";
import https from "../../../../utils/https";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  fetchReportList,
  getSeletedReport,
  modifiedSeletedReport,
} from "../../Store/Actions/ReportDashboardActions";
import { forEach } from "lodash";
import TreeNode from "./TreeNode";
import { setDefaultSelected } from "../../Store/Actions";
import { useSelector } from "react-redux";
import {getDefaultSelected} from "../../Store/Selectors";

const PermissionSetting = () => {
  //const defaultSelected=useSelector(getDefaultSelected);
  const [targetKeys, setTargetKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const  [typePermission, setTypePermission] = useState(true);
  const  [allClaims, setAllClaims] = useState([]);
  const  [dataClaims, setDataClaims] = useState([]);
  const [options,setOptions]=useState([]);
  const [selected, setSelected] = useState([]);
  const [defaultSelected,setDefaultSelected]=useState([]);
  const [optionsTypeUser,setOptionsTypeUser]=useState([]);
  const [nameUpdate,setNameUpdate]=useState('');

   
  //var defaultSelected=['0-0'];
 
  const onCheck = (checkedKeys, info) => {
      console.log('onCheck', checkedKeys, info);
  };
  var test=1;
  const handleChangeUserName = async (value) => {
    setNameUpdate(value);
    const res = await https.post(`User/GetClaims`, {type:typePermission?0:1,value:value})
    console.log(res.data.roles);
    var temp =selected;
    temp= res.data.roles;
    setSelected(temp);
    console.log(selected);
    setDefaultSelected(['0-1']);
  };
  const onChangeTypePermission = ()=>{
    setTypePermission(!typePermission);
    setNameUpdate('');
  }
  const SavePermission=()=>{
    setDefaultSelected(['0-1']);
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
      console.log(res);
    });

  }
  const getAllClaims=()=>{
    https.post(`User/GetAllClaims`, {}).then((res) => {
      console.log(res);
      setAllClaims(res.data.map(d=>{return {...d,check:false}}));
    });
  }
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
      console.log(data);
      setOptions(data);
    });
  }
  const getAllRoles=()=>{
    https.post(`User/GetAllRoles`, {}).then((res) => {
      var data=[];
      res.data.map(d=>{
        data.push({value:d.name,label:d.name})
      })
      console.log(data);
      setOptionsTypeUser(data);
    });
  }
  
  useEffect(() => {
    getAllClaims();
    getAllUser();
    getAllRoles();
    return () => {};
  }, []);

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


      {allClaims.map((d,index)=>{
        
        return <Checkbox key={index} checked={selected.includes(d.name)?true:false} 
          onChange={(e)=>{
            const isChecked = e.target.checked;
            if (isChecked) {
              setSelected([...selected, d.name]);
            } else {
              setSelected(selected.filter((c) => c !== d.name));
            }
            console.log(selected);

          }}>{d.name}</Checkbox>
      })}
      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4 mt-5">
        <Button type="primary" className="w-full min-w-0"  onClick={SavePermission}>Update</Button>
      </div>
    </div>
  );
};

export default PermissionSetting;
