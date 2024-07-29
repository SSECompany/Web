import { Button, Form, notification, Pagination, Space, Tabs } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import { deleteObjectItems } from "../../../../app/hooks/dataFormatHelper";
import ConfirmDialog from "../../../../Context/ConfirmDialog";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import {
  SoFuckingUltimateApi,
  SoFuckingUltimateGetApi,
  UltimatePutDataApi,
} from "../../API";
import {
  fetchDMSCustomersDetail,
  setCurrentDMSCustomer,
  setCurrentTab,
} from "../../Store/Sagas/Sagas";
import { getcurrentDMSCustomer } from "../../Store/Selector/Selectors";
import "./DMSCustomerList.css";
import CIHistory from "./Modals/CIHistory";
import CustomerCheckinHistory from "./Modals/CustomerCheckinHistory";
import CustomerContact from "./Modals/CustomerContact";
import DetailInfoCustomer from "./Modals/DetailInfoCustomer";
import Filter from "./Modals/Filter";
import MasterInfoCustomer from "./Modals/MasterInfoCustomer";
import SOHistory from "./Modals/SOHistory";
import TKHistory from "./Modals/TKHistory";

const DMSCustomerList = () => {
  // initialize #########################################################################
  const [detailForm] = Form.useForm();
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [tableParams, setTableParams] = useState({
    keywords: "",
    orderby: "ten_dm",
  });
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
  });

  const [totalResults, setTotalResults] = useState(0);
  const [currentRecord, setCurrentRecord] = useState({});
  const [isOpenAdvanceFilter, setIsOpenAdvanceFilter] = useState(false);
  const [filterForm] = Form.useForm();
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [action, setAction] = useState(formStatus.VIEW);
  const detailCustomer = useSelector(getcurrentDMSCustomer);
  const [initialCustomerValue, setInitialCustomerValue] = useState({});
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const userInfo = useSelector(getUserInfo);

  const tabItems = [
    {
      key: "detail",
      label: "Chi tiết",
      children: <DetailInfoCustomer form={detailForm} action={action} />,
    },
    {
      key: "contact",
      label: "Liên hệ",
      children: <CustomerContact action={action} />,
      forceRender: true,
    },
    {
      key: "SOHistory",
      label: "Lịch sử mua hàng",
      children: <SOHistory />,
    },
    {
      key: "CIHistory",
      label: "Lịch sử viếng thăm",
      children: <CIHistory />,
    },
    {
      key: "TKHistory",
      label: "Lịch sử phản hồi",
      children: <TKHistory />,
    },
  ];

  //functions #########################################################################

  const refreshData = () => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    setCurrentRecord({});
    if (pagination.pageIndex === 1) {
      setLoading(true);
    }
  };

  const getdata = async () => {
    const tablepagination = {
      pageindex: pagination.pageindex,
      pageSize: pagination.pageSize,
    };
    await SoFuckingUltimateGetApi({
      store: "get_vcrdm",
      data: {
        ...tableParams,
        ...tablepagination,
      },
    }).then((res) => {
      setCustomerList(res.data);
      setTotalResults(res.pagegination.totalRecord);
    });
    setLoading(false);
  };

  const handleTableChange = (paginationChanges, filters, sorter) => {
    setPagination({
      ...pagination,
      pageIndex: paginationChanges.current,
      current: paginationChanges.current,
    });
    setTableParams({ ...tableParams, ...filters, ...sorter });

    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== pagination?.pageSize) {
      setData([]);
    }
  };

  const handleChangePagintion = (currentPage, pageSize) => {
    setPagination({ ...pagination, pageIndex: currentPage });
  };

  const openAdvanceFilter = async () => {
    await setIsOpenAdvanceFilter(true);
  };

  const onSubmitForm = (items) => {
    const data = {
      ...deleteObjectItems(items, [
        "areaName",
        "districtName",
        "employeeName",
        "formsName",
        "classifyName",
        "cityName",
        "resourceName",
        "tourName",
        "typeName",
        "unitName",
        "communeName",
      ]),
      stt_rec_dm:
        action === formStatus.EDIT && currentRecord?.ma_kh
          ? currentRecord?.ma_kh?.trim()
          : "",
      UserId: userInfo.id,
    };

    SoFuckingUltimateApi({
      store: "api_Create_DMSCustomer",
      data: { ...data },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          setAction(formStatus.VIEW);
          setInitialCustomerValue({ ...initialCustomerValue, ...items });
          refreshData();
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

  const handleSelectedCustomer = (item) => {
    setCurrentRecord(item);
    setAction(formStatus.VIEW);
  };

  const onFilter = (items) => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    setTableParams({ ...tableParams, ...items });
  };

  const onTabChanges = (tabKey) => {
    setCurrentTab(tabKey);
  };

  const handleSearchCustomer = useDebouncedCallback(async (searchValue) => {
    const newKeywords = await filterKeyHelper(searchValue);
    setTableParams({ ...tableParams, keywords: newKeywords });
    setPagination({ ...pagination, pageIndex: 1 });
  }, 800);

  const handleEdit = useCallback(() => {
    if (currentRecord) setAction(formStatus.EDIT);
  }, []);

  const handleAddNew = () => {
    setAction(formStatus.ADD);
    setInitialCustomerValue({});
    setCurrentRecord({});
    setCurrentDMSCustomer({});
  };

  const handleOpenDeleteDialog = () => {
    if (currentRecord?.ma_kh && action !== formStatus.ADD) {
      setIsOpenDeleteModal(true);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsOpenDeleteModal(false);
  };

  const handleDelete = (key) => {
    SoFuckingUltimateApi({
      store: "api_Delete_DMSCustomer",
      data: {
        stt_rec_dm: currentRecord.ma_kh,
      },
    }).then((res) => {
      if (res.status === 200 && res.data === true) {
        notification.success({
          message: `Thành công`,
        });
        refreshData();
        setAction(formStatus.VIEW);
        handleCloseDeleteDialog();
        setCurrentRecord({});
      } else {
        notification.warning({
          message: `Có lỗi xảy ra khi thực hiện`,
        });
      }
    });
  };

  const handleExcelData = (excelData) => {
    console.log(userInfo);
    UltimatePutDataApi({
      store: "api_import_dmsCustomer",
      data: {
        UnitID: userInfo.unitId,
        UserId: userInfo.id,
      },
      listData: excelData,
    })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getdata();
  }, [JSON.stringify(tableParams), pagination]);

  // Khi chọn khách sẽ load dữ liệu detail
  useEffect(() => {
    if (currentRecord?.ma_kh) {
      setLoadingDetail(true);
      fetchDMSCustomersDetail(currentRecord?.ma_kh);
    }
  }, [JSON.stringify(currentRecord)]);

  // Khi lấy dữ liệu set thành initial để khi huỷ không bị mất
  useEffect(() => {
    if (detailCustomer && currentRecord?.ma_kh) {
      setInitialCustomerValue({
        customerName: detailCustomer?.ten_dm?.trim(),
        contactPhone: detailCustomer?.dien_thoai?.trim(),
        address: detailCustomer?.dia_chi?.trim(),
        birthDay: dayjs(detailCustomer?.ngay_sinh).isValid()
          ? dayjs(detailCustomer?.ngay_sinh)
          : undefined,
        tourName: detailCustomer?.ten_tuyen?.trim(),
        area: detailCustomer?.nh_kh1?.trim(),
        areaName: detailCustomer?.ten_khu_vuc?.trim(),
        city: detailCustomer?.nh_kh2?.trim(),
        cityName: detailCustomer?.ten_tinh?.trim(),
        district: detailCustomer?.nh_kh3?.trim(),
        districtName: detailCustomer?.ten_quan?.trim(),
        commune: detailCustomer?.nh_kh4?.trim(),
        communeName: detailCustomer?.ten_phuong?.trim(),
        resource: detailCustomer?.nh_kh5?.trim(),
        resourceName: detailCustomer?.nh_kh5?.trim(),
        unit: detailCustomer?.nh_kh6?.trim(),
        unitName: detailCustomer?.ten_dvcs?.trim(),
        classify: detailCustomer?.nh_kh7?.trim(),
        classifyName: detailCustomer?.nh_kh7?.trim(),
        forms: detailCustomer?.nh_kh8?.trim(),
        formsName: detailCustomer?.nh_kh8?.trim(),
        tour: detailCustomer?.ma_tuyen?.trim(),
        employee: detailCustomer?.ma_nvbh?.trim(),
        employeeName: detailCustomer?.ma_nvbh?.trim(),
        contactPhone2: detailCustomer?.dien_thoai_dd?.trim(),
        email: detailCustomer?.email?.trim(),
        MST: detailCustomer?.ma_so_thue?.trim(),
        contactPerson: detailCustomer?.ong_ba?.trim(),
      });
      detailForm.resetFields();
      setLoadingDetail(false);
    }
  }, [detailCustomer]);

  // Refresh lại form để nhận dữ liệu
  useEffect(() => {
    detailForm.resetFields();
  }, [JSON.stringify(initialCustomerValue)]);

  return (
    <div className="default_list_layout page_default">
      <div className="split__view__container">
        <div className="split__view__header__bar">
          <HeaderTableBar
            name={"khách hàng DMS"}
            title={"Danh sách khách hàng DMS"}
            totalResults={totalResults}
            advanceFilter={openAdvanceFilter}
            refreshEvent={refreshData}
            addEvent={handleAddNew}
            editEvent={handleEdit}
            deleteEvent={handleOpenDeleteDialog}
            uploadFunction={handleExcelData}
          />

          {/* <div className="split__view__search__bar">
            <Input
              style={{
                width: "15vw",
                height: "30px",
              }}
              size="middle"
              className="default_input"
              placeholder="Tìm kiếm..."
              onChange={(e) => {
                handleSearchCustomer(e.target.value);
              }}
            />
            <Button
              style={{ borderRadius: "4px", height: "30px" }}
              className="default_button"
              onClick={openAdvanceFilter}
            >
              <span style={{ fontWeight: "bold" }}>Nâng cao</span>
            </Button>
          </div> */}
        </div>
        <div className="split__view__detail">
          <div className="split__view__detail__left">
            <div className="split__view__detail__left__item split__view__header split__view__detail__header">
              <span>STT</span>
              <span>Tên khách</span>
              <span>Số điện thoại</span>
            </div>
            <div className="split__view__detail__left__item__container h-full">
              {/* selected */}
              {loading == false ? (
                customerList.map((item, index) => (
                  <div
                    key={index}
                    className={`split__view__detail__left__item split_view_item ${
                      item.ma_kh === currentRecord?.ma_kh ? "selected" : ""
                    }`}
                    onClick={(e) => {
                      handleSelectedCustomer(item);
                    }}
                  >
                    <span>{index + 1}</span>
                    <span>{item.ten_kh.trim()}</span>
                    <span>{item.dien_thoai.trim()}</span>
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
            <Form
              initialValues={initialCustomerValue}
              form={detailForm}
              onFinish={onSubmitForm}
              className="split__view__detail__primary relative"
            >
              {loadingDetail ? (
                <LoadingComponents
                  text={"Đang tải..."}
                  size={50}
                  loading={true}
                />
              ) : (
                <>
                  {/* Thông tin chính */}
                  <MasterInfoCustomer action={action} />
                  <div
                    className="split__view__detail__primary__items"
                    style={{ alignItems: "normal", paddingRight: "12px" }}
                  >
                    <Tabs
                      onTabClick={onTabChanges}
                      moreIcon={<span>...</span>}
                      style={{ minWidth: "0" }}
                      items={tabItems}
                      destroyInactiveTabPane={false}
                    />
                  </div>

                  <Space className="justify-content-end pr-3">
                    {action !== formStatus.VIEW && (
                      <>
                        <Button
                          onClick={(e) => {
                            detailForm.resetFields();
                            setAction(formStatus.VIEW);
                          }}
                          className="default_subsidiary_button"
                        >
                          Huỷ
                        </Button>

                        <Button
                          type="primary"
                          htmlType="submit"
                          className="default_primary_button"
                        >
                          Lưu
                        </Button>
                      </>
                    )}
                  </Space>
                </>
              )}
            </Form>

            <CustomerCheckinHistory
              customer={currentRecord?.ma_kh}
              loading={loadingDetail}
            />
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
        title="Xoá khách hàng"
        description={`Xoá khách hàng: ${currentRecord.ten_kh}, SDT: ${currentRecord.dien_thoai}`}
        handleOkModal={handleDelete}
        handleCloseModal={handleCloseDeleteDialog}
        keys={currentRecord?.ma_kh}
        size={400}
      />
    </div>
  );
};

export default DMSCustomerList;
