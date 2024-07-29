import { Button, notification, Transfer } from "antd";
import _ from "lodash";
import React, { memo, useEffect, useState } from "react";
import emitter from "../../../../../utils/emitter";

const TransferForm = ({ eventId, dataset, limit, min, selectedKeys }) => {
  const [mockData, setMockData] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [isDisable, setIsDisable] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const getMock = () => {
    setMockData([...dataset] || []);
    setTargetKeys([...selectedKeys] || []);
    setIsSaved(false);
  };

  const filterOption = (inputValue, option) =>
    option.description.indexOf(inputValue) > -1;

  const handleChange = (newTargetKeys) => {
    setTargetKeys(
      newTargetKeys.slice(
        newTargetKeys.length - limit < 0 ? 0 : newTargetKeys.length - limit,
        newTargetKeys.length
      )
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    if (targetKeys.length < min) {
      notification.warning({
        message: `Số lượng phải chọn: ${min}`,
      });
      return;
    }

    emitter.emit(eventId, targetKeys);
    notification.success({
      message: `Thực hiện thành công`,
    });
    setIsSaved(true);
  };

  useEffect(() => {
    getMock();
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <Transfer
        select
        titles={["Báo cáo", "Đã chọn"]}
        disabled={isDisable}
        dataSource={mockData}
        showSearch
        oneWay
        filterOption={filterOption}
        targetKeys={targetKeys}
        onChange={handleChange}
        render={(item) => item.title}
      />
      {!_.isEqual(selectedKeys, targetKeys) && !isSaved && (
        <div className="w-full text-right">
          <Button onClick={handleSave} className="mt-2" type={"primary"}>
            Lưu
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(TransferForm);
