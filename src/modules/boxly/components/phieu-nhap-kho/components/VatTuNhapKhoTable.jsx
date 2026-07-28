import { VatTuTable, phieuNhapKhoConfig } from "../../common/VatTuTable";

const VatTuNhapKhoTable = ({
  dataSource,
  isEditMode = true,
  handleQuantityChange,
  handleSelectChange,
  handleDeleteItem,
  handleDvtChange,
  handleInYnChange,
  handleMaVcChange,
  handleMaVuViecChange,
  handleViTriLookupUpdate,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
  fetchDonViTinh,
  fetchMaViTriLookup,
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
      onInYnChange={handleInYnChange}
      onMaVcChange={handleMaVcChange}
      onMaViTriLookupUpdate={handleViTriLookupUpdate}
      onDataSourceUpdate={onDataSourceUpdate}
      columnConfig={{
        ...phieuNhapKhoConfig,
        onMaVuViecChange: handleMaVuViecChange,
      }}
      apiHandlers={{
        fetchMaKhoList,
        fetchMaKhoListDebounced,
        fetchDonViTinh,
        fetchMaViTriLookup,
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
