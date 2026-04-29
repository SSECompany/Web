import React from "react";
import { VatTuTable, phieuXuatDieuChuyenConfig } from "../../common/VatTuTable";

const VatTuXuatDieuChuyenTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleDeleteItem,
  handleDvtChange,
  onSelectChange, // Nhận thêm onSelectChange
  fetchDonViTinh,
  onDataSourceUpdate,
  columnConfig,
  apiHandlers, // Nhận apiHandlers từ props
  ...props
}) => {
  return (
    <VatTuTable
      dataSource={dataSource}
      isEditMode={isEditMode}
      onQuantityChange={handleQuantityChange}
      onDeleteItem={handleDeleteItem}
      onDvtChange={handleDvtChange}
      onSelectChange={onSelectChange}
      onDataSourceUpdate={onDataSourceUpdate}
      columnConfig={columnConfig || phieuXuatDieuChuyenConfig}
      apiHandlers={{
        fetchDonViTinh,
        ...apiHandlers // Merge apiHandlers
      }}
      {...props}
    />
  );
};

export default VatTuXuatDieuChuyenTable;
