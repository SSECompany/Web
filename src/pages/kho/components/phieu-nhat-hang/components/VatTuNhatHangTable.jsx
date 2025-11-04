import { VatTuTable, phieuNhatHangConfig } from "../../common/VatTuTable";

const VatTuNhatHangTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleSelectChange,
  handleDeleteItem,
  handleAddItem,
  handleDvtChange,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
  fetchDonViTinh,
  onDataSourceUpdate,
  fetchLoList,
  fetchViTriList,
}) => {
  return (
    <VatTuTable
      dataSource={dataSource}
      isEditMode={isEditMode}
      onQuantityChange={handleQuantityChange}
      onSelectChange={handleSelectChange}
      onDeleteItem={handleDeleteItem}
      onAddItem={handleAddItem}
      onDvtChange={handleDvtChange}
      onDataSourceUpdate={onDataSourceUpdate}
      columnConfig={phieuNhatHangConfig}
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

export default VatTuNhatHangTable;
