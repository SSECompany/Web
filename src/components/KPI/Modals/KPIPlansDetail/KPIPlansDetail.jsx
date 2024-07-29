import {
  Button,
  DatePicker,
  Divider,
  Form,
  InputNumber,
  Modal,
  notification,
  Table,
} from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { deleteObjectItems } from "../../../../app/hooks/dataFormatHelper";
import OperationColumn from "../../../../app/hooks/operationColumn";
import { quantityFormat } from "../../../../app/Options/DataFomater";
import TableLocale from "../../../../Context/TableLocale";
import { formStatus } from "../../../../utils/constants";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { setCurrentItem } from "../../Store/Actions/KPIPerforms";
import {
  fetchKPIPlansDetailData,
  KPIPlanModify,
  setCurrentKPIPlanAction,
  setIsOpenModal,
} from "../../Store/Actions/KPIPlans";
import { getKPIPlansState } from "../../Store/Selectors/Selectors";
import "./KPIPlansDetail.css";

const { RangePicker } = DatePicker;

const KPIPlansDetail = ({ refreshList }) => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableParams, setTableParams] = useState({
    keywords: "",
  });
  const [pagination, setPagination] = useState({
    pageindex: 1,
    pageSize: 5,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [initialValue, setInitialValue] = useState({
    ke_hoach: 0,
    ma_kpi: null,
    ma_nvbh: null,
    rangeTime: [],
    ten_kpi: null,
    ten_nvbh: null,
    trong_so: 0,
  });

  const { isOpenModal, currentItem, action } = useSelector(getKPIPlansState);

  const refreshData = () => {
    setPagination({
      ...pagination,
      pageIndex: pagination.pageindex,
      current: pagination.pageindex,
    });
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleResetForm = () => {
    setInitialValue({
      ke_hoach: 0,
      ma_kpi: null,
      rangeTime: [],
      ten_kpi: null,
      trong_so: 0,
      ma_nvbh: currentItem?.ma_nvbh,
      ten_nvbh: currentItem?.ten_nvbh,
    });
    setSelectedRowKeys([]);
  };

  const handleDeletePlan = (record) => {
    handleModifyPlan(record, formStatus.DELETE);
  };

  const handleTableChange = (paginationChanges, filters, sorter) => {
    setPagination({
      ...pagination,
      pageindex: paginationChanges.current,
      current: paginationChanges.current,
    });
    setTableParams({ ...tableParams, ...filters, ...sorter });
    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== pagination?.pageSize) {
      setData([]);
    }
  };

  const onDeselect = async () => {
    await setSelectedRowKeys([]);
    await handleResetForm();
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    columnTitle: (
      <i className="pi pi-ban deselect_button" onClick={onDeselect}></i>
    ),
    type: "radio",
    selectedRowKeys,
    onChange: onSelectChange,
    onSelect: (record) => {
      setInitialValue({
        ...record,
        rangeTime: [dayjs(record?.ngay_bd), dayjs(record?.ngay_kt)],
      });
    },
  };

  const handleModifyPlan = async (data, formAction = formStatus.ADD) => {
    var params = {
      ...data,
      ngay_bd: !data.ngay_bd
        ? dayjs(data?.rangeTime[0]).format("YYYY/MM/DD")
        : data?.ngay_bd,
      ngay_kt: !data.ngay_kt
        ? dayjs(data?.rangeTime[1]).format("YYYY/MM/DD")
        : data?.ngay_kt,
    };

    params = await deleteObjectItems(params, [
      "rangeTime",
      "ten_kpi",
      "ten_nvbh",
      "ma_vt",
      "ten_vt",
      "key",
    ]);

    await KPIPlanModify({
      ...params,
      action: formAction,
      id: !params?.id ? _.first(selectedRowKeys) : params?.id || null,
    }).then((res) => {
      if (res) {
        notification.success({
          message: `${
            formAction === formStatus.EDIT ? "Xoá" : "Thực hiện "
          } thành công`,
        });

        setCurrentItem({
          ma_nvbh: data?.ma_nvbh,
          ten_nvbh: data?.ten_nvbh,
        });
        setCurrentKPIPlanAction(formStatus.EDIT);
        refreshData();
        refreshList();
      }
    });
  };

  const getdata = async (key) => {
    const result = await fetchKPIPlansDetailData({
      id: key,
      pageindex: pagination.pageindex,
      pageSize: pagination.pageSize,
    });

    if (_.isEmpty(tableColumns)) {
      result.layout.push({
        title: "Chức năng",
        dataIndex: "",
        editable: false,
        dataType: "Operation",
        align: "center",
        fixed: "right",
        render: (_, record) => {
          return (
            <OperationColumn
              deleteFunction={() => {
                handleDeletePlan(record);
              }}
            />
          );
        },
      });
      setTableColumns(result.layout);
    }
    setData(result.data || []);
    setTotalResults(result.totalCount || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpenModal) {
      setLoading(true);
      getdata(currentItem?.ma_nvbh);
      handleResetForm();
    }
    return () => {
      handleResetForm();
      setData([]);
      setSelectedRowKeys([]);
    };
  }, [isOpenModal, JSON.stringify(tableParams), pagination]);

  useEffect(() => {
    if (!_.isEmpty(currentItem)) {
      handleResetForm();
    }
  }, [currentItem]);

  useEffect(() => {
    if (isOpenModal) {
      form.resetFields();
    }
  }, [initialValue]);

  return (
    <Modal
      open={isOpenModal}
      onCancel={handleCloseModal}
      onOk={handleCloseModal}
      okText="Hoàn thành"
      centered
      cancelButtonProps={{ style: { display: "none" } }}
      width={800}
      destroyOnClose={true}
      title="Chi tiết KPI"
    >
      <div className="">
        <Table
          rowSelection={rowSelection}
          columns={tableColumns}
          dataSource={data}
          rowClassName={"default_table_row"}
          className="default_table kpi_plans_detail_table"
          locale={TableLocale()}
          scroll={{ x: "auto" }}
          pagination={{
            ...pagination,
            total: totalResults,
            position: ["bottomCenter"],
            showSizeChanger: false,
            className: "default_pagination_bar",
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </div>

      <Divider style={{ margin: "10px 0px" }} />

      <Form
        initialValues={initialValue}
        form={form}
        className="default_modal_container"
        preserve={false}
        onFinish={handleModifyPlan}
      >
        <div className="default_modal_group_items">
          <div className="default_modal_group_items">
            <FormSelectDetail
              width={100}
              codeWidth={120}
              controller={"dmkpi_lookup"}
              keyCode="ma_kpi"
              keyName="ten_kpi"
              label="Mã KPI"
              placeHolderCode="KPI"
              placeHolderName="Tên KPI"
              form={form}
              direction="column"
            />
          </div>
          <div className="default_modal_group_items">
            <div
              className="split__view__detail__primary__item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span className="default_bold_label">Kế hoạch</span>

              <div className="flex w-full gap-2">
                <Form.Item
                  name="ke_hoach"
                  rules={[
                    {
                      required: true,
                      message: `Điền kế hoạch`,
                    },
                  ]}
                >
                  <InputNumber
                    controls={false}
                    min="0"
                    style={{
                      width: "100%",
                    }}
                    min="0"
                    step={quantityFormat}
                    stringMode
                  />
                </Form.Item>
              </div>
            </div>

            <div
              className="split__view__detail__primary__item"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span className="default_bold_label">Trọng số</span>

              <div className="flex w-full gap-2">
                <Form.Item
                  name="trong_so"
                  rules={[
                    {
                      required: true,
                      message: `Điền trọng số`,
                    },
                  ]}
                >
                  <InputNumber
                    controls={false}
                    min="0"
                    style={{
                      width: "100%",
                    }}
                    min="0"
                    step={quantityFormat}
                    stringMode
                  />
                </Form.Item>
              </div>
            </div>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div
            className="split__view__detail__primary__item"
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span className="default_bold_label">Ngày bắt đầu - kết thúc</span>

            <div className="flex w-full gap-2">
              <Form.Item
                name="rangeTime"
                rules={[
                  {
                    required: true,
                    message: `chọn ngày`,
                  },
                ]}
              >
                <RangePicker
                  style={{
                    width: `100%`,
                  }}
                />
              </Form.Item>
            </div>
          </div>

          <FormSelectDetail
            disable={action === formStatus.EDIT}
            width={100}
            codeWidth={120}
            controller={"dmnvbh_lookup"}
            keyCode="ma_nvbh"
            keyName="ten_nvbh"
            label="Mã nhân viên"
            placeHolderCode="Nhân viên"
            placeHolderName="Tên Nhân viên"
            form={form}
            direction="column"
          />
        </div>

        <div
          className="split__view__detail__primary__item"
          style={{
            justifyContent: "center",
          }}
        >
          <Button onClick={handleResetForm}>Huỷ</Button>
          <Button type="primary" htmlType="submit">
            {selectedRowKeys.length > 0 ? "Lưu" : "Thêm mới"}
          </Button>
        </div>
      </Form>
      <Divider style={{ margin: "10px 0px" }} />
    </Modal>
  );
};

export default KPIPlansDetail;
