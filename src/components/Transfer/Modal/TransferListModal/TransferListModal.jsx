import { Button, DatePicker, Input, Modal, Pagination, Popover, Skeleton, Tag, Tooltip, } from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import { memo, useCallback, useEffect, useState } from "react";
import { Column } from "react-base-table";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { datetimeFormat, datetimeFormat2, } from "../../../../app/Options/DataFomater";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import PerformanceTable from "../../../ReuseComponents/PerformanceTable/PerformanceTable";
import { fetchTransferList, getValueParam, resetFetchListParams, setFetchListParams, } from "../../Store/Actions/TransferActions";
import { getTransferState } from "../../Store/Selectors/TransferSelectors";
import DetailTransferViewer from "../DetailTransferViewer/DetailTransferViewer";
import "./TransferListModal.css";

const TransferListModal = ({ isOpen, onClose, ma_ct = 'HDL' }) => {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowDetail, setIsShowDetail] = useState(false);
  const [curItemShow, setCurItemShow] = useState("");
  const [totalRecord, setTotalRecord] = useState(0);
  const { fetchListParams } = useSelector(getTransferState);
  const { id: userId, storeId, unitId } = useSelector(getUserInfo);

  const modifyShowDetail = useCallback(() => {
    setIsShowDetail(!isShowDetail);
  }, [isShowDetail]);

  const handleShowDetail = (key = "") => {
    modifyShowDetail();
    setCurItemShow(key);
  };

  // functions
  const fetchData = async () => {
    setIsLoading(true);
    const result = await fetchTransferList({
      ...fetchListParams,
      userId,
      storeId,
      unitId,
    }, ma_ct);

    setData(result?.data || []);

    setColumns([
      ...renderColumns(result.columns),
      {
        key: "action",
        title: "Thao tác",
        width: 120,
        frozen: Column.FrozenDirection.RIGHT,
        align: "center",
        headerRenderer: ({ columns, column }) => "Thao tác",
        cellRenderer: ({ rowData }) => actionsRender(rowData),
      },
    ]);

    setTotalRecord(_.first(result?.pagination)?.totalRecord || 0);

    setIsLoading(false);
  };

  const handleSearchData = useDebouncedCallback(
    ({ key, value, params }) => {
      setFetchListParams({ [`${key}`]: value, pageIndex: 1 });
    },
    [600]
  );

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
    if (!isOpen) resetFetchListParams();
    return () => { };
  }, [JSON.stringify(fetchListParams), JSON.stringify(isOpen)]);

  const renderColumns = (columns) => {
    const _columns = columns.map((item) => {
      if (item?.Type === "Status")
        return {
          key: item?.Field,
          title: item?.Name,
          dataKey: item?.Field,
          width: item?.width,
          cellRenderer: ({ rowData }) => renderStatus(rowData),
          resizable: item?.width ? true : false,
          sortable: false,
          hidden: !item?.width ? true : false,
        };

      return {
        key: item?.Field,
        title: renderTitle({
          title: item?.Name,
          type: item?.Type,
          key: item?.Field,
        }),
        dataKey: item?.Field,
        width: item?.width,
        resizable: item?.width ? true : false,
        sortable: false,
        hidden: !item?.width ? true : false,
      };
    });
    return _columns;
  };

  const renderTitle = ({ title, type, key }) => {
    return type !== "Numeric" && key !== "ten_bp" ? (
      <Popover
        destroyTooltipOnHide
        afterOpenChange={(e) => {
          if (e) {
            document.getElementById(`popup-${key}`)?.focus();
          }
        }}
        placement="bottom"
        content={
          <div>
            <div>
              <span className="mb-1">Tìm kiếm </span> <b>{title}</b>
            </div>
            {type === "Datetime" ? (
              <DatePicker
                id={`popup-${key}`}
                onChange={(e) => {
                  handleSearchData({
                    key,
                    value: e ? dayjs(e).format(datetimeFormat2) : null,
                  });
                }}
                format={datetimeFormat}
                defaultValue={dayjs()}
                className="w-full"
                placeholder="Ngày nè"
              />
            ) : (
              <Input
                autoFocus
                defaultValue={() => {
                  return getValueParam(key);
                }}
                id={`popup-${key}`}
                className="w-full"
                placeholder={`Điền ${title}`}
                allowClear
                onChange={(e) => {
                  handleSearchData({
                    key,
                    value: e.target.value.trim(),
                  });
                }}
              />
            )}
          </div>
        }
        trigger="click"
      >
        <div className="flex h-full align-items-center justify-content-between">
          <span className="select-none">{title}</span>
          <i
            className={`pi pi-search transition-ease-in transition-all mr-2${getValueParam(key) ? " font-bold" : ""
              }`}
          ></i>
        </div>
      </Popover>
    ) : (
      <span className="select-none">{title}</span>
    );
  };

  const renderStatus = (rowData) => {
    const { statusName, status } = rowData;
    return (
      <Tag color={`${status === "3" ? "red" : "green"}`}>{statusName}</Tag>
    );
  };

  const actionsRender = (key = "") => {
    return (
      <div className="flex gap-2 p-2 border-round-xs">
        <Tooltip placement="topRight" title="Xem chi tiết">
          <Button
            className="default_button"
            onClick={() => {
              handleShowDetail(key);
            }}
          >
            <i
              className="pi pi-eye sub_text_color"
              style={{ fontWeight: "bold" }}
            ></i>
          </Button>
        </Tooltip>
        <Tooltip placement="topRight" title="Sửa đơn điều chuyển">
          <Link
            to={`/EditTransfer/${key.stt_rec}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="default_button"
            >
              <i
                className="pi pi-pencil danger_text_color"
                style={{ fontWeight: "bold" }}
              ></i>
            </Button>
          </Link>
        </Tooltip>
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      width={"80%"}
      title="Danh sách đơn hàng"
      destroyOnClose={true}
      onCancel={onClose}
      cancelText="Đóng"
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <div className="retail__modal__Container">
        <Skeleton active loading={isLoading && _.isEmpty(columns)}>
          <div className="h-full w-full flex flex-column gap-3">
            <div className="h-full min-h-0">
              <PerformanceTable
                selectable={false}
                columns={columns}
                data={data}
                isLoading={isLoading}
              />
            </div>
            <div className="align-self-end">
              <Pagination
                className="w-fit"
                pageSize={fetchListParams.pageSize}
                current={fetchListParams.pageIndex}
                onChange={(e) => {
                  setFetchListParams({ pageIndex: e });
                }}
                total={totalRecord}
                showSizeChanger={false}
              />
            </div>
          </div>
        </Skeleton>
      </div>

      <DetailTransferViewer
        isOpen={isShowDetail}
        itemKey={curItemShow}
        onClose={modifyShowDetail}
        ma_ct={ma_ct}
      />
    </Modal>
  );
};

export default memo(TransferListModal);
