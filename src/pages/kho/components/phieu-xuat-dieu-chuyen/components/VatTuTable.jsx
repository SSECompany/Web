import React from "react";
import { VatTuTable, phieuXuatDieuChuyenConfig } from "../../common/VatTuTable";

const VatTuXuatDieuChuyenTable = ({
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
      columnConfig={columnConfig || phieuXuatDieuChuyenConfig}
      apiHandlers={{
        fetchDonViTinh,
      }}
    />
  );
};

export default VatTuXuatDieuChuyenTable;
