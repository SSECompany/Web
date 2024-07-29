import { Modal } from "antd";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import LoadingComponents from "../../../Loading/LoadingComponents";
import PerformanceTable from "../../../ReuseComponents/PerformanceTable/PerformanceTable";
import {
  fetchRetailOderPromotion,
  modifyIsOpenPromotion,
} from "../../Store/Actions/RetailOrderActions";
import { getRetailOrderState } from "../../Store/Selectors/RetailOrderSelectors";
import "./RetailPromotionModal.css";

const ckvt = [
  {
    Field: "id",
    Name: "id",
    Name2: "id",
    Type: "Text",
    Format: null,
    width: 0,
    hidden: true,
  },
  {
    Field: "ma_ck",
    Name: "Mã chiết khấu",
    Name2: "Promotion code",
    Type: "Text",
    Format: null,
    width: 0,
    hidden: true,
  },
  {
    Field: "ma_vt",
    Name: "Mã vật tư",
    Name2: "Item code",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },
  {
    Field: "ten_vt",
    Name: "Tên vật tư",
    Name2: "Item name",
    Type: "Text",
    Format: null,
    width: 300,
    hidden: false,
  },
  {
    Field: "tl_ck",
    Name: "Tỷ lệ chiết khấu",
    Name2: "Promotion ratio",
    Type: "Numeric",
    Format: null,
    width: 130,
    hidden: false,
  },
  {
    Field: "ck",
    Name: "Tiền chiết khấu",
    Name2: "Promotion value",
    Type: "Numeric",
    Format: null,
    width: 130,
    hidden: false,
  },
];

const ckth = [
  {
    Field: "id",
    Name: "id",
    Name2: "id",
    Type: "Text",
    Format: null,
    width: 0,
    hidden: true,
  },
  {
    Field: "ma_vt",
    Name: "Mã vật tư",
    Name2: "Item code",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },
  {
    Field: "ten_vt",
    Name: "Tên vật tư",
    Name2: "Item name",
    Type: "Text",
    Format: null,
    width: 200,
    hidden: false,
  },
  {
    Field: "dvt",
    Name: "Đơn vị tính",
    Name2: "Item unit",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },
  {
    Field: "so_luong",
    Name: "Số lượng",
    Name2: "Quantity",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },

  {
    Field: "ma_kho",
    Name: "Kho",
    Name2: "Stock code",
    Type: "Text",
    Format: null,
    width: 100,
    hidden: false,
  },
];

const cktd = [
  {
    Field: "id",
    Name: "id",
    Name2: "id",
    Type: "Text",
    Format: null,
    width: 0,
    hidden: true,
  },
  {
    Field: "ma_ck",
    Name: "Mã chiết khấu",
    Name2: "Item code",
    Type: "Text",
    Format: null,
    width: 120,
    hidden: false,
  },

  {
    Field: "tl_ck",
    Name: "Tỷ lệ chiết khấu",
    Name2: "Promotion ratio",
    Type: "Numeric",
    Format: null,
    width: 130,
    hidden: false,
  },
  {
    Field: "ck",
    Name: "Tiền chiết khấu",
    Name2: "Promotion value",
    Type: "Numeric",
    Format: null,
    width: 130,
    hidden: false,
  },
];

const RetailPromotionModal = ({ tableData, customer, handleSave }) => {
  const { isOpenPromotion, isPromotionLoading } =
    useSelector(getRetailOrderState);

  const [CKVTData, setCKVTData] = useState([]);
  const [CKTHData, setCKTHData] = useState([]);
  const [CKTDData, setCKTDData] = useState([]);

  const [CKVTSelected, setCKVTSelected] = useState([]);
  const [CKTHSelected, setCKTHSelected] = useState([]);
  const [CKTDSelected, setCKTDSelected] = useState([]);

  const handleOK = async () => {
    const CKVT = CKVTData.filter((item) => CKVTSelected.includes(item.id));
    const CKTH = CKTHData.filter((item) => CKTHSelected.includes(item.id));
    const CKTD = CKTDData.filter((item) => CKTDSelected.includes(item.id));

    await handleSave(CKVT, CKTH, CKTD);
    onClose();
  };

  const onClose = () => {
    modifyIsOpenPromotion(false);
  };

  const handleCKVTSelect = useCallback((keys) => {
    setCKVTSelected(keys);
  }, []);

  const handleCKTHSelect = useCallback((keys) => {
    setCKTHSelected(keys);
  }, []);

  const handleCKTDSelect = useCallback((keys) => {
    setCKTDSelected(keys);
  }, []);

  const renderColumns = (columns) => {
    const _columns = columns.map((item) => {
      return {
        key: item?.Field,
        title: item?.Name,
        dataKey: item?.Field,
        width: item?.width,
        resizable: item?.width ? true : false,
        sortable: false,
        hidden: !item?.width ? true : false,
      };
    });
    return _columns;
  };

  const getPromotion = async () => {
    const result = await fetchRetailOderPromotion(tableData, customer);

    setCKVTData(result.ckvt);
    setCKTHData(result.ckth);
    setCKTDData(result.cktd);
  };

  useEffect(() => {
    if (isOpenPromotion) {
      getPromotion();
    }
    return () => {};
  }, [isOpenPromotion]);

  useEffect(() => {
    return () => {
      setCKVTSelected([]);
      setCKTHSelected([]);
      setCKTDSelected([]);
    };
  }, []);

  return (
    <Modal
      centered
      open={isOpenPromotion}
      destroyOnClose={true}
      onCancel={onClose}
      onOk={handleOK}
      title={"Chương trình khuyến mãi"}
      width={"70%"}
    >
      <div
        className={`retail__promotion__container p-2 relative${
          isPromotionLoading ? " overflow-hidden" : ""
        }`}
      >
        <LoadingComponents
          text={"Đang lấy dữ liệu..."}
          loading={isPromotionLoading}
        />
        <div>
          <span className="primary_bold_text line-height-4">
            Chiết khấu chi tiết theo mặt hàng
          </span>

          <div className="retail__promotion__Selection">
            <PerformanceTable
              selectable
              columns={renderColumns(ckvt)}
              data={CKVTData}
              isLoading={false}
              onSelectedRowKeyChange={handleCKVTSelect}
            />
          </div>
        </div>
        <div>
          <span className="primary_bold_text line-height-4">
            Chiết khấu tặng hàng
          </span>

          <div className="retail__promotion__Selection">
            <PerformanceTable
              selectable
              columns={renderColumns(ckth)}
              data={CKTHData}
              isLoading={false}
              onSelectedRowKeyChange={handleCKTHSelect}
            />
          </div>
        </div>
        <div>
          <span className="primary_bold_text line-height-4">
            Chiết khấu tổng đơn
          </span>

          <div className="retail__promotion__Selection">
            <PerformanceTable
              selectable
              columns={renderColumns(cktd)}
              data={CKTDData}
              isLoading={false}
              onSelectedRowKeyChange={handleCKTDSelect}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(RetailPromotionModal);
