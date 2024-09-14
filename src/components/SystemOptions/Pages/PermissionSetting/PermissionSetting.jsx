import { Transfe,Tree , Select, Space ,Switch,Button,TreeNode  } from "antd";
import React, { useEffect, useState,useCallback,useMemo} from "react";
import https from "../../../../utils/https";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  fetchReportList,
  getSeletedReport,
  modifiedSeletedReport,
} from "../../Store/Actions/ReportDashboardActions";
import { forEach } from "lodash";

const PermissionSetting = () => {
  const [targetKeys, setTargetKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const  [typePermission, setTypePermission] = useState(true);
  const  [allClaims, setAllClaims] = useState([]);
  const  [dataClaims, setDataClaims] = useState([]);
  const [options,setOptions]=useState([]);
  const [defaultSelected,setDefaultSelected]=useState([]);
 
  const onCheck = (checkedKeys, info) => {
      console.log('onCheck', checkedKeys, info);
  };
  const handleChangeUserName = useCallback( (value) => {
    https.post(`User/GetClaims`, {type:0,value:value}).then((res) => {
      console.log(res.data.roles);
      setDefaultSelected(res.data.roles);
      // dataClaims.forEach(d => {
      //   if(res.data.roles.includes(d.key)) d.checked=true;
      //   d.children.forEach(d2 => {
      //     if(res.data.roles.includes(d2.key)) d.checked=true;
      //     d2.checked=true;
      //   });
      // });
      console.log(defaultSelected);
    });
  },[]);
  const onChangeTypePermission = ()=>{
    setTypePermission(!typePermission);
  }
  const SavePermission=()=>{
    console.log(defaultSelected);
  }
  const getAllClaims=()=>{
    https.post(`User/GetAllClaims`, {}).then((res) => {
      console.log(res);
      setAllClaims(res.data);
      var claims=[];
      res.data.map(d=>{
        if (d.level==1)claims.push({title:d.name,key:d.name,id:d.id,children:[]})
      })
      var data = claims.map(d=>{
        var temp =res.data.filter(c=>c.level==2 && c.parent == d.id);
        temp.forEach(d2 => {
          d.children.push({title:d2.name,key:d2.name,id:d2.id})
        });
        return d;
      })
      setDataClaims(data);
      console.log(data);
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
  const renderTreeNodes = (data) =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} />;
  });
  useEffect(() => {
    getAllClaims();
    getAllUser();
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
        <Select defaultValue="lucy" style={{  width: 120,  }} options={optionsTypeUser} />
      </Space>
      :
      <Select mode="single" className="mt-5 mb-5"  style={{ width: '100%' }} placeholder="select one user"  onChange={handleChangeUserName}options={options}  optionRender={(option) => (
          <Space>
            <span role="img" aria-label={option.data.label}> {option.data.emoji} </span>
            {option.data.desc}
          </Space>
        )}
      />}

      <Tree  className=" p-2 shadow-1" checkable  defaultSelectedKeys={defaultSelected}  defaultCheckedKeys={defaultSelected}   onCheck={onCheck}  >
        {renderTreeNodes(dataClaims)}
      </Tree>
      <div className="retail_action_container flex gap-2 p-2 w-full shadow-4 mt-5">
        <Button type="primary" className="w-full min-w-0"  onClick={SavePermission}>Update</Button>
      </div>
    </div>
  );
};

export default PermissionSetting;
