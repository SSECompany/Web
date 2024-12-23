import {
  Button,
  Divider,
  Form,
  Input,
  message,
  notification,
  Pagination,
  Space,
  Steps
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import { getIndexRow } from "../../../../app/Functions/getIndexRow";
import {
  getAllRowKeys,
  getAllValueByRow
} from "../../../../app/Functions/getTableValue";
import {
  deleteObjectItems,
  formatData
} from "../../../../app/hooks/dataFormatHelper";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { formStatus } from "../../../../utils/constants";
import emitter from "../../../../utils/emitter";
import { UltimatePutDataApi } from "../../../DMS/API";
import Filter from "../../../DMS/Pages/DMSCustomerList/Modals/Filter";
import LoadingComponents from "../../../Loading/LoadingComponents";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { SoFuckingUltimateGetApi } from "../../../SystemOptions/API";
import { SoFuckingUltimateApi } from "../../API";
import {
  fetchSaleOutDetail,
  fetchSaleOutMaster,
  setCurrentDetailSaleOut,
  setSaleOutAction
} from "../../Store/Sagas/Sagas";
import {
  getCurrentSaleOutDetail,
  getCurrentSaleOutMaster,
  getSaleOutInfo
} from "../../Store/Selector/Selector";
import SaleoutDetail from "./Detail/SaleoutDetail";
import SaleOutMaster from "./Detail/SaleOutMaster";
import SummaryMaster from "./Detail/summaryMaster";
import "./SaleOut.css";

const SaleOut = () => {
  // initialize #########################################################################
  const [masterForm] = Form.useForm();
  const [detailForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [tableParams, setTableParams] = useState({
    DateFrom: "2022/10/30",
    DateTo: dayjs(),
  });
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
  });

  const [totalResults, setTotalResults] = useState(0);
  const [currentRecord, setCurrentRecord] = useState({
    stt_rec: "A00000000",
    so_ct: "000001",
    ngay_ct: dayjs(),
  });
  const [isOpenAdvanceFilter, setIsOpenAdvanceFilter] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

  const [customerList, setCustomerList] = useState([]);

  const [initialCustomerValue, setInitialCustomerValue] = useState({});
  const [isSimpleFilter, setIsSimpleFilter] = useState(false);

  const currentSaleOutMaster = useSelector(getCurrentSaleOutMaster);
  const currentSaleOutDetail = useSelector(getCurrentSaleOutDetail);

  const { action } = useSelector(getSaleOutInfo);

  const userInfo = useSelector(getUserInfo);

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([
    {
      key: 0,
      title: "Thông tin chính",
    },
    {
      key: 1,
      title: "chi tiết",
    },
  ]);

  //functions #########################################################################

  const refreshData = () => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    if (pagination.pageIndex === 1) {
      setLoading(true);
    }
  };

  const getdata = async () => {
    setLoading(true);
    await SoFuckingUltimateGetApi({
      store: "api_get_order_list",
      data: {
        ...tableParams,
        pageindex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    }).then((res) => {
      setCustomerList(res.data.data);
      setTotalResults(res?.data.pagegination?.totalRecord);
      setLoading(false);
    });
  };

  const handleChangePagintion = (currentPage, pageSize) => {
    setPagination({ ...pagination, pageIndex: currentPage });
  };

  const openAdvanceFilter = async () => {
    await setIsOpenAdvanceFilter(true);
  };

  const onSubmitForm = () => {
    const finalDetails = getAllRowKeys(detailForm.getFieldsValue()).map(
      (item) => {
        return getAllValueByRow(item, detailForm.getFieldsValue());
      }
    );

    const master = {
      ...deleteObjectItems(masterForm.getFieldsValue(), [
        "cacel_reason",
        "t_so_luong",
        "t_tt_nt",
        "ten_kh2",
        "ten_nvbh",
        "ten_kh",
      ]),
      stt_rec: action == formStatus.EDIT ? currentRecord.stt_rec : null,
      so_ct: action == formStatus.EDIT ? currentRecord.so_ct : "",
      UserId: 0,
      UnitId: userInfo.unitId,
    };

    var detail = [...finalDetails];
    detail = detail.map((item, index) => {
      return {
        stt_rec0: getIndexRow(index),
        ...item,
      };
    });

    UltimatePutDataApi({
      store: "api_create_sale_out",
      data: master,
      listData: detail,
    })
      .then((res) => {
        if (res.status != "Failed") {
          notification.success({
            message: `Thành công`,
          });
          refreshData();
          setSaleOutAction(formStatus.VIEW);
        } else {
          notification.warning({
            message: `Có lỗi xảy ra khi thực hiện`,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSelectedMasterItem = (item) => {
    setCurrentRecord(item);
    setSaleOutAction(formStatus.VIEW);
  };

  const onFilter = (items) => {
    console.log(items);
  };

  const scrollToField = (field, fieldName) => {
    if (action !== formStatus.VIEW) {
      const allFields = detailForm.getFieldsValue(true);
      if (!fieldName) {
        const itemFocusName = Object.keys(allFields)
          .filter((item) => item.includes(field))
          .pop();
        document.getElementById(itemFocusName).focus();
        document.getElementById(itemFocusName).scrollIntoView();
      } else {
        document.getElementById(fieldName).focus();
        document.getElementById(fieldName).scrollIntoView();
      }
    }
  };

  const handleDetailValidate = async () => {
    try {
      await detailForm.validateFields();
      const detailData = [];

      getAllRowKeys(detailForm.getFieldsValue()).map((item) => {
        return detailData.push(
          getAllValueByRow(item, detailForm.getFieldsValue())
        );
      });

      if (_.isEmpty(detailData)) {
        message.warning("Vui lòng thêm vật tư !");
        onStepsChange(1);
        return false;
      }
      return true;
    } catch (error) {
      console.log(error);
      await onStepsChange(1);
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  const handleMasterValidate = async () => {
    try {
      await masterForm.validateFields();
      return true;
    } catch (error) {
      onStepsChange(0);
      scrollToField("", error?.errorFields[0]?.name[0]);
      return false;
    }
  };

  const handleSaveSaleOut = async (items) => {
    try {
      const masterValid = await handleMasterValidate();
      if (!masterValid) return;
      const detailValid = await handleDetailValidate();

      if (masterValid && detailValid) {
        setSaleOutAction(formStatus.SAVED);
        onSubmitForm();
      }
    } catch (error) {
      return;
    }
  };

  const onStepsChange = (step) => {
    emitter.on("SET_SALE_ORDER_STEP", (newStep) => {
      setCurrentStep(newStep);
    });
    setCurrentStep(step);
  };

  const handleSearchCustomer = useDebouncedCallback(async (searchValue) => {
    const newKeywords = await filterKeyHelper(searchValue);
    setTableParams({ ...tableParams });
    setPagination({ ...pagination, pageIndex: 1 });
  }, 800);

  const handleShowFilter = () => {
    if (!isSimpleFilter) {
      setIsSimpleFilter(true);
    }
  };

  const handleHiddenFilter = () => {
    setIsSimpleFilter((prevCurrPos) => false);
    handleSearchCustomer("");
  };

  const handleAddNew = () => {
    setSaleOutAction(formStatus.ADD);
    setInitialCustomerValue({});

    setCurrentDetailSaleOut({ ...currentSaleOutDetail, data: [] });
  };

  const handleOpenDeleteDialog = () => {
    if (currentRecord.stt_rec != "A00000000" && action !== formStatus.ADD) {
      setIsOpenDeleteModal(true);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsOpenDeleteModal(false);
  };

  const handleDelete = (key) => {
    SoFuckingUltimateApi({
      store: "api_Order_Cancel",
      data: {
        LetterId: currentRecord.stt_rec,
        UserId: 0,
        UnitId: userInfo.unitId,
      },
    }).then((res) => {
      if (res.status === 200 && res.data === true) {
        notification.success({
          message: `Thành công`,
        });
        refreshData();
        setSaleOutAction(formStatus.VIEW);
        handleCloseDeleteDialog();
      } else {
        notification.warning({
          message: `Có lỗi xảy ra khi thực hiện`,
        });
      }
    });
  };

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getdata();
  }, [JSON.stringify(tableParams), pagination]);

  // Khi chọn khách sẽ load dữ liệu detail
  useEffect(() => {
    fetchSaleOutDetail(currentRecord);

    if (currentRecord) {
      setLoadingDetail(true);
      fetchSaleOutMaster(currentRecord);
      setCurrentStep(0);
    }
  }, [JSON.stringify(currentRecord)]);

  // Khi lấy dữ liệu set thành initial để khi huỷ không bị mất
  useEffect(() => {
    if (currentSaleOutMaster?.data?.length > 0) {
      setInitialCustomerValue({
        ...formatData(
          currentSaleOutMaster?.data[0],
          currentSaleOutMaster?.reportLayoutModel
        ),
      });
    }
    setLoadingDetail(false);
  }, [JSON.stringify(currentSaleOutMaster)]);

  // Refresh lại form để nhận dữ liệu
  useEffect(() => {
    masterForm.resetFields();
  }, [JSON.stringify(initialCustomerValue)]);

  useEffect(() => {
    return () => {
      emitter.removeAllListeners();
    };
  }, []);

  return (
    <div className="default_list_layout page_default">
      <div className="split__view__container">
        <div className="split__view__header__bar">
          <HeaderTableBar
            name={"Saleout"}
            title={"Danh sách phiếu saleout"}
            totalResults={totalResults}
            advanceFilter={openAdvanceFilter}
            refreshEvent={refreshData}
            addEvent={handleAddNew}
            deleteEvent={handleOpenDeleteDialog}
          />
        </div>
        <div className="split__view__detail">
          <div className="split__view__detail__left">
            <div
              className={` ${
                isSimpleFilter
                  ? "split__view__detail__left__filter"
                  : "split__view__detail__left__item_SO"
              } split__view__header split__view__detail__header`}
              onClick={handleShowFilter}
            >
              {!isSimpleFilter ? (
                <>
                  <span>Số CT</span>
                  <span>Ngày CT</span>
                  <span>Tên khách hàng</span>
                </>
              ) : (
                <>
                  <Input
                    style={{
                      height: "30px",
                      minWidth: 0,
                    }}
                    size="middle"
                    placeholder="Tìm kiếm..."
                    onChange={(e) => {
                      handleSearchCustomer(e.target.value);
                    }}
                  />
                  <Button
                    onClick={handleHiddenFilter}
                    className="default_warning_button"
                  >
                    Huỷ
                  </Button>
                </>
              )}
            </div>
            <div className="split__view__detail__left__item__container h-full">
              {/* selected */}
              {loading == false ? (
                customerList.map((item, index) => (
                  <div
                    key={index}
                    className={`split__view__detail__left__item_SO split_view_item ${
                      item.so_ct === currentRecord.so_ct ? "selected" : ""
                    }`}
                    onClick={(e) => {
                      handleSelectedMasterItem(item);
                    }}
                  >
                    <span>{item?.so_ct?.trim()}</span>
                    <span>
                      {dayjs(item?.ngay_ct?.trim()).format("DD/MM/YYYY")}
                    </span>
                    <span>{item?.ten_kh?.trim()}</span>
                  </div>
                ))
              ) : (
                <LoadingComponents
                  text={"Đang tải..."}
                  size={50}
                  loading={true}
                />
              )}
            </div>

            <div className="split__view__pagination">
              <Pagination
                simple
                defaultCurrent={1}
                current={pagination.pageIndex}
                total={totalResults}
                onChange={handleChangePagintion}
              />
            </div>
          </div>
          <div className="split__view__detail__right">
            <div
              className="split__view__detail__primary relative w-full justify-content-between"
              style={{ flex: 1 }}
            >
              {loadingDetail ? (
                <LoadingComponents
                  text={"Đang tải..."}
                  size={50}
                  loading={true}
                />
              ) : (
                <>
                  <div className="flex flex-column h-full min-h-0">
                    <div className="w-full flex gap-3 justify-content-between align-items-center">
                      <Steps
                        size="small"
                        className="w-fit"
                        current={currentStep}
                        items={steps}
                        onChange={onStepsChange}
                      />

                      <div className="text-left">
                        <span>Số chứng từ: </span>
                        <span className="primary_bold_text">
                          {initialCustomerValue?.so_ct || "Tự động sinh"}
                        </span>
                      </div>
                    </div>

                    <Divider style={{ margin: "5px 0px" }} />
                    <div
                      className="h-full min-h-0"
                      style={{
                        display: `${
                          steps[currentStep].key == 0 ? "block" : "none"
                        }`,
                      }}
                    >
                      <Form
                        initialValues={initialCustomerValue}
                        form={masterForm}
                        component={false}
                      >
                        <SaleOutMaster action={action} form={masterForm} />
                      </Form>
                    </div>

                    <div
                      className="h-full min-h-0"
                      style={{
                        display: `${
                          steps[currentStep].key == 1 ? "block" : "none"
                        }`,
                      }}
                    >
                      <SaleoutDetail
                        masterForm={masterForm}
                        detailForm={detailForm}
                        action={action}
                      />
                    </div>
                  </div>

                  <div className="split__view__detail__summary">
                    <Form
                      initialValues={initialCustomerValue}
                      form={masterForm}
                      component={false}
                    >
                      <SummaryMaster action={action} />
                    </Form>

                    <Space className="justify-content-end">
                      {action !== "VIEW" && action !== formStatus.SAVED ? (
                        <>
                          <Button
                            onClick={(e) => {
                              masterForm.resetFields();
                              setSaleOutAction(formStatus.VIEW);
                            }}
                            className="default_subsidiary_button"
                          >
                            Huỷ
                          </Button>

                          <Button
                            onClick={handleSaveSaleOut}
                            className="default_primary_button"
                          >
                            Lưu
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={(e) => setSaleOutAction(formStatus.EDIT)}
                            className="default_warning_button"
                          >
                            Sửa
                          </Button>
                        </>
                      )}
                    </Space>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Filter
        setIsOpenAdvanceFilter={setIsOpenAdvanceFilter}
        isOpenAdvanceFilter={isOpenAdvanceFilter}
        onFilter={onFilter}
      />

      <ConfirmDialog
        state={isOpenDeleteModal}
        title="Xoá đơn hàng"
        description={`Xoá chứng từng: ${currentRecord.so_ct}, ngày lập: ${dayjs(
          currentRecord.ngay_ct
        ).format("DD/MM/YYYY")}`}
        handleOkModal={handleDelete}
        handleCloseModal={handleCloseDeleteDialog}
        keys={currentRecord.stt_rec}
      />
    </div>
  );
};

export default SaleOut;
