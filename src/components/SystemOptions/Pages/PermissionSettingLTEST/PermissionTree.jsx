import React, { useState, useEffect } from 'react';
import { Tree } from 'antd';

const PermissionTree = ({ data, onSelectChange }) => {
  const buildTree = (data) => {
    const tree = [];
    const lookup = {};

    // Tạo lookup table cho các phần tử
    data.forEach((item) => {
      lookup[item.id] = { ...item, children: [] };
    });

    // Xây dựng cấu trúc cây
    data.forEach((item) => {
      if (item.parent === 0) {
        tree.push(lookup[item.id]);
      } else {
        if (lookup[item.parent]) {
          lookup[item.parent].children.push(lookup[item.id]);
        }
      }
    });

    return tree;
  };

  const [treeData, setTreeData] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);

  useEffect(() => {
    const tree = buildTree(data);
    setTreeData(tree);

    // Lấy các keys của các node được check
    const checkedKeys = data.filter(item => item.check).map(item => item.id);
    setCheckedKeys(checkedKeys);
  }, [data]);

  const renderTreeNodes = (nodes) =>
    nodes.map((node) => ({
      title: node.nameValue,
      key: node.id,
      name: node.name,
      children: node.children.length ? renderTreeNodes(node.children) : null,
    }));

  const onCheck = (checkedKeys, info) => {
    setCheckedKeys(checkedKeys);

    const selectedNames = info.checkedNodes.map(node => node.name);
    onSelectChange(selectedNames);
  };

  return (
    <Tree
      checkable
      treeData={renderTreeNodes(treeData)}
      defaultExpandAll
      checkedKeys={checkedKeys}
      
      onCheck={onCheck}
    />
  );
};

export default PermissionTree;