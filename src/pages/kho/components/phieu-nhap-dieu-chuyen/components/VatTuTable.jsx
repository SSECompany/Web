import React from "react";
import { VatTuTable, phieuNhapDieuChuyenConfig } from "../../common/VatTuTable";

const VatTuNhapDieuChuyenTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleDeleteItem,
  handleDvtChange,
  fetchDonViTinh,
  onDataSourceUpdate,
  columnConfig,
}) => {
  return (
    <VatTuTable
      dataSource={dataSource}
      isEditMode={isEditMode}
      onQuantityChange={handleQuantityChange}
      onDeleteItem={handleDeleteItem}
      onDvtChange={handleDvtChange}
      onDataSourceUpdate={onDataSourceUpdate}
      columnConfig={columnConfig || phieuNhapDieuChuyenConfig}
      apiHandlers={{
        fetchDonViTinh,
      }}
    />
  );
};

export default VatTuNhapDieuChuyenTable;
