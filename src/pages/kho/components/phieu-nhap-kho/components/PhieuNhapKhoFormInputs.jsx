import React, { useMemo } from "react";
import { PhieuFormInputs } from "../../common/PhieuFormInputs";

const PhieuNhapKhoFormInputs = ({
  isEditMode = true,
  maKhachList,
  loadingMaKhach,
  fetchMaKhachListDebounced,
  maGiaoDichList,
  fetchMaKhachList,
  fetchMaGiaoDichList,
  barcodeEnabled,
  setBarcodeEnabled,
  setBarcodeJustEnabled,
  vatTuInput,
  setVatTuInput,
  vatTuSelectRef,
  loadingVatTu,
  vatTuList,
  searchTimeoutRef,
  fetchVatTuList,
  handleVatTuSelect,
  totalPage,
  pageIndex,
  setPageIndex,
  setVatTuList,
  currentKeyword,
  VatTuSelectComponent,
}) => {
  // Group các props theo category để dễ quản lý
  const selectData = useMemo(() => ({
    maKhachList,
    maGiaoDichList,
  }), [maKhachList, maGiaoDichList]);

  const selectHandlers = useMemo(() => ({
    fetchMaKhachList,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
  }), [fetchMaKhachList, fetchMaKhachListDebounced, fetchMaGiaoDichList]);

  const loadingStates = useMemo(() => ({
    loadingMaKhach,
  }), [loadingMaKhach]);

  const vatTuProps = useMemo(() => ({
    barcodeEnabled,
    setBarcodeEnabled,
    setBarcodeJustEnabled,
    vatTuInput,
    setVatTuInput,
    vatTuSelectRef,
    loadingVatTu,
    vatTuList,
    searchTimeoutRef,
    fetchVatTuList,
    handleVatTuSelect,
    totalPage,
    pageIndex,
    setPageIndex,
    setVatTuList,
    currentKeyword,
  }), [
    barcodeEnabled,
    setBarcodeEnabled,
    setBarcodeJustEnabled,
    vatTuInput,
    setVatTuInput,
    vatTuSelectRef,
    loadingVatTu,
    vatTuList,
    searchTimeoutRef,
    fetchVatTuList,
    handleVatTuSelect,
    totalPage,
    pageIndex,
    setPageIndex,
    setVatTuList,
    currentKeyword,
  ]);

  return (
    <PhieuFormInputs
      isEditMode={isEditMode}
      formType="nhap-kho"
      selectData={selectData}
      selectHandlers={selectHandlers}
      loadingStates={loadingStates}
      vatTuProps={vatTuProps}
      VatTuSelectComponent={VatTuSelectComponent}
    />
  );
};

export default PhieuNhapKhoFormInputs;
