import React, { useMemo } from "react";
import { PhieuFormInputs } from "../../common/PhieuFormInputs";

const PhieuNhapHangFormInputs = ({
  isEditMode = true,
  maKhachList,
  loadingMaKhach,
  fetchMaKhachListDebounced,
  maGiaoDichList,
  maKhoList,
  loadingMaKho,
  fetchMaKhachList,
  fetchMaGiaoDichList,
  fetchMaKhoList,
  fetchMaKhoListDebounced,
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
  onPoSearch,
}) => {
  const selectData = useMemo(
    () => ({
      maKhachList,
      maGiaoDichList,
      maKhoList,
    }),
    [maKhachList, maGiaoDichList, maKhoList]
  );

  const selectHandlers = useMemo(
    () => ({
      fetchMaKhachList,
      fetchMaKhachListDebounced,
      fetchMaGiaoDichList,
      fetchMaKhoList,
      fetchMaKhoListDebounced,
      onPoSearch,
    }),
    [
      fetchMaKhachList,
      fetchMaKhachListDebounced,
      fetchMaGiaoDichList,
      fetchMaKhoList,
      fetchMaKhoListDebounced,
      onPoSearch,
    ]
  );

  const loadingStates = useMemo(
    () => ({
      loadingMaKhach,
      loadingMaKho,
    }),
    [loadingMaKhach, loadingMaKho]
  );

  const vatTuProps = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <PhieuFormInputs
      isEditMode={isEditMode}
      formType="nhap-hang"
      selectData={selectData}
      selectHandlers={selectHandlers}
      loadingStates={loadingStates}
      vatTuProps={vatTuProps}
      VatTuSelectComponent={VatTuSelectComponent}
    />
  );
};

export default PhieuNhapHangFormInputs;

