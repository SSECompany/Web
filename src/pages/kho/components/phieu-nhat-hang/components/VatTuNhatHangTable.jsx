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
  focusInvalidRowKey,
  onFocusInvalidRowHandled,
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
      focusInvalidRowKey={focusInvalidRowKey}
      onFocusInvalidRowHandled={onFocusInvalidRowHandled}
      // Highlight invalid rows (set via flags on each record)
      onRow={(record) => {
        const isInvalid =
          record._invalid_missing_lot ||
          record._invalid_sum_mismatch ||
          record.rowExceededSlDon;
        return {
          ...(isInvalid
            ? {
                style: {
                  backgroundColor: "#fff1f0", // Ant Design error background
                },
              }
            : {}),
          "data-row-key": record.key,
        };
      }}
    />
  );
};

export default VatTuNhatHangTable;
