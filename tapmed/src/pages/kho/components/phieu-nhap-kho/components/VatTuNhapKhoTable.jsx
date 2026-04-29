import { VatTuTable, phieuNhapKhoConfig } from "../../common/VatTuTable";

const VatTuNhapKhoTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleSelectChange,
  handleDeleteItem,
  handleDvtChange,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
  fetchDonViTinh,
  fetchLoList,
  fetchViTriList,
  onDataSourceUpdate,
}) => {
  return (
    <VatTuTable
      dataSource={dataSource}
      isEditMode={isEditMode}
      onQuantityChange={handleQuantityChange}
      onSelectChange={handleSelectChange}
      onDeleteItem={handleDeleteItem}
      onDvtChange={handleDvtChange}
      onDataSourceUpdate={onDataSourceUpdate}
      columnConfig={phieuNhapKhoConfig}
      apiHandlers={{
        fetchMaKhoList,
        fetchMaKhoListDebounced,
        fetchDonViTinh,
        fetchLoList,
        fetchViTriList,
      }}
      selectData={{
        maKhoList,
      }}
      loadingStates={{
        maKho: loadingMaKho,
      }}
    />
  );
};

export default VatTuNhapKhoTable;

