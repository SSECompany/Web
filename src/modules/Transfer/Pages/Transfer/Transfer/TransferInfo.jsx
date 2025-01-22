import { FileImageOutlined } from "@ant-design/icons";
import { uuidv4 } from "@antv/xflow-core";
import { Avatar, Button, Form, Image, Input, message as messageAPI, Modal, notification, Select, Tooltip } from "antd";
import { multipleTablePutApi } from "api";
import CustomConfirmModal from "components/Transfer/Modal/ConfirmModal/ConfirmModal";
import _ from "lodash";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Column } from "react-base-table";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import getTextValue from 'utils/lang';
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import { getAllRowKeys, getAllValueByRow } from "../../../../../app/Functions/getTableValue";
import { formatCurrency } from "../../../../../app/hooks/dataFormatHelper";
import RenderPerformanceTableCell from "../../../../../app/hooks/RenderPerformanceTableCell";
import SelectNotFound from "../../../../../Context/SelectNotFound";
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import { CHARTCOLORS } from "../../../../../utils/constants";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import PerformanceTable from "../../../../ReuseComponents/PerformanceTable/PerformanceTable";
import TransferListModal from "../../../Modal/TransferListModal/TransferListModal";
import { modifyIsFormLoading } from "../../../Store/Actions/TransferActions";
import { getTransferState } from "../../../Store/Selectors/TransferSelectors";
import MasterInfo from "../MasterInfo/MasterInfo";


const TransferInfo = ({ orderKey }) => {
  const { isScanning, isFormLoading } = useSelector(getTransferState);
  const [message, contextHolder] = messageAPI.useMessage();
  const [itemForm] = Form.useForm();
  const [masterForm] = Form.useForm();
  const [data, setData] = useState([]);
  const [selectedRowkeys, setSelectedRowkeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchOptions, setsearchOptions] = useState([]);
  const [searchColapse, setSearchColapse] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOptionsFiltered, setsearchOptionsFiltered] = useState([]);
  const [isOpenOrderList, setIsOpenOrderList] = useState(false);
  const { openListTransfer } = useSelector(getTransferState);
  const searchInputRef = useRef(null);

  const { id: userId, storeId, unitId, lang } = useSelector(getUserInfo);

  const columns = [
    {
      key: "delete",
      title: "",
      dataKey: "delete",
      width: 60,
      align: Column.Alignment.CENTER,
      resizable: false,
      cellRenderer: ({ rowData }) => {
        return (
          <Tooltip placement="topRight" title="Xóa dòng">
            <Button
              className="default_button"
              danger
              onClick={() => handleRemoveRowById(rowData.id)}
            >
              <i className="pi pi-trash" style={{ fontWeight: "bold" }}></i>
            </Button>
          </Tooltip>
        );
      },
    },
    {
      key: "image",
      title: "Ảnh",
      dataKey: "image",
      width: 60,
      align: Column.Alignment.CENTER,
      resizable: false,

      cellRenderer: ({ cellData, rowData }) =>
        cellData ? (
          <Image className="border-circle" title="" style={{ height: 40 }} src={cellData} alt="SSE" ></Image>
        ) : (
          <Avatar style={{ background: rowData.ck_yn ? "red" : "#341b4d" }}>
            {rowData.ck_yn ? (
              <i className="pi pi-gift" style={{ fontSize: 40 }}></i>
            ) : (
              <FileImageOutlined
                style={{
                  fontSize: "40px",
                }}
              />
            )}
          </Avatar>
        ),
    },

    {
      key: "ten_vt",
      title: "Tên vật tư",
      dataKey: "ten_vt",
      className: "flex-1",
      headerClassName: "flex-1",
      width: 100,
      resizable: false,
      sortable: false,
      type: "TextArea",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.id}
            column={column}
            cellData={cellData}
          />
        );
      },
    },

    {
      key: "barcode",
      title: "Barcode",
      dataKey: "barcode",
      width: 0,
      resizable: false,
      sortable: false,
      className: "p-0",
      headerClassName: "p-0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.id}
            column={column}
            cellData={cellData}
          />
        );
      },
    },

    {
      key: "ma_vt",
      title: "Mã vật tư",
      dataKey: "ma_vt",
      width: 0,
      resizable: false,
      sortable: false,
      className: "p-0",
      headerClassName: "p-0",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.id}
            column={column}
            cellData={cellData}
          />
        );
      },
    },

    {
      key: "dvt",
      title: "Đơn vị",
      dataKey: "dvt",
      width: 100,
      resizable: false,
      sortable: false,
      editable: true,
      type: "dvt",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowData={rowData}
            rowKey={rowData?.id}
            column={column}
            cellData={cellData}
          />
        );
      },
    },

    {
      key: "so_luong",
      title: "Số lượng",
      dataKey: "so_luong",
      width: 100,
      resizable: false,
      sortable: false,
      editable: true,
      type: "Numeric",
      cellRenderer: ({ rowData, column, cellData }) => {
        return (
          <RenderPerformanceTableCell
            rowKey={rowData?.id}
            column={column}
            cellData={cellData}
          />
        );
      },
    },


  ];

  const handleRemoveRowById = (rowId) => {
    const updatedData = data.filter((row) => row.id !== rowId);
    setData(updatedData);
    message.success("Đã xóa dòng thành công!");
  };


  //------------Search item------------------
  const handleSearchValue = useDebouncedCallback((searchValue) => {
    fetchItemsNCustomers({ searchValue });
  }, 400);

  const fetchItemsNCustomers = ({ searchValue }) => {
    setsearchOptions([]);
    multipleTablePutApi({
      store: "Api_search_items",
      param: { searchValue: filterKeyHelper(searchValue), unitId, storeId, userId, },
      data: {},
    }).then(async (res) => {
      if (res.responseModel?.isSucceded) {
        const results = [
          {
            key: "VT",
            label: <span>Vật tư</span>,
            title: "Vật tư",
            options: [..._.first(res.listObject)],
          }
        ];
        setSearchLoading(false);
        setsearchOptions([...results]);
      }
    });
  };
  const handleAddRowData = async ({ barcode = "", ma_vt, ten_vt, image, ma_kho, dvt, don_gia, ck_yn, so_luong = 1 }) => {
    const curData = itemForm.getFieldsValue();
    console.log(curData)
    let isHad = false;

    await getAllRowKeys(curData).map((key) => {
      if (getAllValueByRow(key, curData)?.ma_vt === ma_vt) {
        itemForm.setFieldValue(
          `${key}_so_luong`,
          Number(getAllValueByRow(key, curData)?.so_luong) + so_luong
        );
        isHad = true;
        return;
      }
    });
    if (isHad) return;
    const rowID = uuidv4();

    setData([
      ...data,
      {
        id: rowID,
        barcode: barcode || "",
        ma_vt,
        ten_vt,
        image,
        ma_kho,
        dvt,
        so_luong: so_luong ? so_luong : 1,
        don_gia: don_gia || "0",
        thanh_tien: don_gia * 1 || "0",
        ck_yn: ck_yn || false,
        children: [
          {
            id: `${rowID}-detail`,
            content: (
              <div className="flex gap-2 justify-content-between">
                <Form.Item initialValue={""} name={`${rowID}_ghi_chu`} style={{ width: "55%", margin: 0, }} rules={[{ required: false, message: `Ghi chú trống !`, },]}>
                  <Input.TextArea autoSize={{ minRows: 1, maxRows: 1, }} placeholder="Ghi chú" style={{ resize: "none" }} />
                </Form.Item>

              </div>
            ),
          },
        ],
      },
    ]);
  };

  const handleRemoveRowData = () => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu không?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setData([]);
        setSelectedRowkeys([]);
      },
      onCancel: () => {
        message.info("Đã hủy xóa dữ liệu.");
      },
    });
  };

  const handleSelectedRowKeyChange = useCallback((keys) => {
    setSelectedRowkeys(keys);
  }, []);
  const handleSelectChange = (key, params) => {
    if (params.data.type === "VT") {
      const { value, label, dvt, gia, ma_kho, image } = params.data;
      handleAddRowData({
        ma_vt: value,
        ten_vt: label,
        image: image || "https://pbs.twimg.com/media/FfgUqSqWYAIygwN.jpg",
        ma_kho: ma_kho,
        dvt,
        don_gia: gia,
        ck_yn: false,
      });
    }
  };

  //--------------------------------------------------------------------

  const CreateStockTransfer = () => {

    const masterData = masterForm.getFieldsValue();
    const itemData = itemForm.getFieldsValue();

    const detailData = [];
    getAllRowKeys(itemData).map((item) => {
      var temp = getAllValueByRow(item, itemData);
      if (!temp.ghi_chu) temp = { ...temp, ghi_chu: '' }
      return detailData.push(temp);
    });

    console.log(masterData)
    console.log(itemData)
    console.log(detailData)

    if (masterData.fStock == "" || masterData.tStock == "") {
      message.warning(getTextValue(lang, 'Transfer.MessEmptyStockTransfer'));
      return;
    }
    if (detailData.length < 1) {
      message.warning(getTextValue(lang, 'Transfer.MessEmptyItem'));
      return;
    }
    const master = [{
      ma_kho: masterData.fStock,
      ma_khon: masterData.tStock,
      ong_ba: masterData.ong_ba,
      ma_gd: '3',
      dien_giai: masterData.dien_giai,
      status: '0',
      dieu_xe: masterData.dieu_xe ? '1' : '0',
      dept_id: masterData.dept_id
    }]

    modifyIsFormLoading(true);
    multipleTablePutApi({
      store: "Api_create_delivery_request_form",
      param: {
        UnitID: unitId,
        StoreID: storeId,
        userId,
      },
      data: {
        master: master,
        detail: detailData,
      },
    })
      .then(async (res) => {
        if (res.responseModel?.isSucceded) {
          notification.success({
            message: `Thực hiện thành công`,
          });
          itemForm.resetFields();
          masterForm.resetFields();
          setData([]);
          modifyIsFormLoading(false);
        }
      }).catch((err) => { modifyIsFormLoading(false); });
  }
  const handleTransferModal = useCallback(() => {
    setIsOpenOrderList(!isOpenOrderList);
  }, [isOpenOrderList]);



  //reset Form
  const handleResetForm = useCallback(() => {
    setData([]);
  }, []);

  const handleCollapseOptions = (key) => {
    const currentCollaps = [...searchColapse];
    if (currentCollaps.includes(key)) {
      currentCollaps.splice(
        currentCollaps.findIndex((item) => item === key),
        1
      );
      setSearchColapse([...currentCollaps]);
    } else setSearchColapse([...currentCollaps, key]);
  };


  ////////Form Functions
  const handleChangeValue = async (cellChanged, allCells) => {

  };
  useEffect(() => {
    setIsOpenOrderList(openListTransfer);
  }, [openListTransfer])
  useEffect(() => {
    if (!_.isEmpty(searchOptions)) {
      const rawOptions = _.cloneDeep(searchOptions);

      const filteredOptions = rawOptions.map((item) => {
        if (searchColapse.includes(item.key)) {
          item.options.length = 0;
        }
        return item;
      });

      setsearchOptionsFiltered([...filteredOptions] || []);
    }
    return () => { };
  }, [JSON.stringify(searchOptions), JSON.stringify(searchColapse)]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleConfirmDelete = () => {
    setData([]);
    setSelectedRowkeys([]);
    setIsModalVisible(false);
    message.success("Đã xóa toàn bộ dữ liệu thành công!");
  };

  const handleCancelDelete = () => {
    setIsModalVisible(false);
    message.info("Đã hủy thao tác xóa.");
  };


  return (
    <div className="h-full min-h-0 flex gap-1 relative">
      {contextHolder}
      <LoadingComponents loading={isFormLoading} text={"Đang tạo đơn hàng"} />
      <div className="h-full min-h-0 w-full min-w-0 flex flex-column gap-1">
        <div className="h-full min-h-0 overflow-hidden border-round-md flex flex-column" style={{ background: "#fff" }}  >
          <div className="w-full p-2 flex gap-5 align-items-center" style={{ background: "white" }} >
            <div className="flex gap-2" style={{ width: "28rem", flexShrink: 0, }}  >
              <Select ref={searchInputRef} className="w-full" value={null} searchValue={searchValue} popupMatchSelectWidth={false} showSearch placeholder="Tìm kiếm..."
                allowClear notFoundContent={SelectNotFound(searchLoading, searchOptions)} defaultActiveFirstOption={false} suffixIcon={false} filterOption={false}
                onChange={handleSelectChange}
                onDropdownVisibleChange={(value) => { if (!value) setSearchColapse([]); }}
                onFocus={() => {
                  if (!isScanning) {
                    setSearchLoading(true);
                    fetchItemsNCustomers({ searchValue: "" });
                  } else {
                    setsearchOptionsFiltered([]);
                    setSearchLoading(true);
                  }
                }}
                optionLabelProp="value"
                onSearch={(e) => {
                  setSearchValue(e);
                  setsearchOptionsFiltered([]);
                  setSearchLoading(true);
                  handleSearchValue(e);
                }}
                listHeight={500}
              >
                {!isScanning && searchOptionsFiltered.map((group, index) => {
                  return <Select.OptGroup
                    key={index}
                    label={
                      <div className="flex justify-content-between align-items-center">
                        <b className="primary_color">{group?.label}</b>
                        <i className={`pi pi-angle-${searchColapse.includes(group.key) ? "down" : "up"} cursor-pointer`}
                          onClick={() => {
                            handleCollapseOptions(group.key);
                          }}
                        ></i>
                      </div>
                    }
                  >
                    {group.options.map((item) => (
                      <Select.Option key={`${group.key}-${item.value}`} value={`${group.key}-${item.value}`} label={item.label} className="px-2" data={item} >
                        <div className="flex align-items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Avatar style={{ background: CHARTCOLORS[Math.floor(Math.random() * 12)], width: 30, height: 30, }} src={item?.image} >
                            {item?.label?.substring(0, 1)}
                          </Avatar>
                          <div className="flex gap-3 w-full">
                            <div className="w-full">{item.label}</div>
                            {item?.type == "VT" && (
                              <div className="text-right ml-3">
                                <span className="ml-1 primary_bold_text"> {formatCurrency(item?.ton || 0)} </span>
                              </div>
                            )}

                            {item?.type == "KH" && (
                              <div className="text-right ml-3">
                                <span className="ml-1 primary_bold_text"> {item?.dien_thoai?.trim() || ""} </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                })}
              </Select>
            </div>
          </div>

          <div className="h-full min-h-0 ">
            <Form
              form={itemForm}
              component={false}
              initialValues={{}}
              onValuesChange={handleChangeValue}
            >
              <PerformanceTable
                reverseIndex
                selectable
                columns={columns}
                data={data}
                onSelectedRowKeyChange={handleSelectedRowKeyChange}
              />
            </Form>
          </div>
        </div>
        <div
          className="border-round-md flex p-2 align-items-center justify-content-between"
          style={{
            height: "3.15rem",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div className="flex gap-2">
            <Tooltip placement="topRight" title="Xoá toàn bộ dữ liệu">
              <Button
                className="default_button"
                danger
                onClick={() => setIsModalVisible(true)}
              >
                <i className="pi pi-trash" style={{ fontWeight: "bold" }}></i>
              </Button>
            </Tooltip>

            <CustomConfirmModal
              visible={isModalVisible}
              title="Xác nhận xóa"
              content="Bạn có chắc chắn muốn xóa toàn bộ dữ liệu không? Thao tác này không thể hoàn tác."
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
              confirmText="Xóa"
              cancelText="Hủy"
            />
            <Tooltip placement="topRight" title="Danh sách đơn">
              <Button onClick={handleTransferModal} className="default_button">
                <i className="pi pi-list sub_text_color" style={{ fontWeight: "bold" }} ></i>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <MasterInfo
        itemForm={itemForm}
        masterForm={masterForm}
        CreateStockTransfer={CreateStockTransfer}
      />
      <TransferListModal
        isOpen={isOpenOrderList}
        onClose={handleTransferModal}
      />

    </div>
  );
};

export default memo(TransferInfo);
