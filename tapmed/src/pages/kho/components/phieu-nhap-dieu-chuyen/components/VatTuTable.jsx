import React from "react";
import { VatTuTable, phieuNhapDieuChuyenConfig } from "../../common/VatTuTable";

const VatTuNhapDieuChuyenTable = ({
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
      columnConfig={columnConfig || phieuNhapDieuChuyenConfig}
      apiHandlers={{
        fetchDonViTinh,
        ...apiHandlers // Merge apiHandlers
      }}
      {...props}
    />
  );
};

export default VatTuNhapDieuChuyenTable;
