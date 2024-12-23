import { SyncOutlined } from "@ant-design/icons";
import { Button, Input, Popover, Select, Tooltip } from "antd";
import PropTypes from "prop-types";
import React, { memo, useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import PrintList from "./PrintList";
import ReportLayoutPicker from "./ReportLayoutPicker";
import UploadFileModal from "./UploadFileModal";

const HeaderTableBar = ({
  name,
  totalResults,
  addEvent,
  editEvent,
  refreshEvent,
  title,
  deleteItems = {
    count: 0,
    delete: null,
  },
  changePaginations,
  advanceFilter,
  deleteEvent,
  uploadFunction,
  fileExample,
  ReportLayout = {
    columns: [],
    layoutCallBack: null,
  },
  printList = [
    {
      key: "",
      title: "",
      type: "",
    },
  ],
  printCallBack,
  searchCallBack,
}) => {
  const [uploadState, setUploadState] = useState(false);
  const [printState, setPrintState] = useState(false);
  const [layoutKey, setLayoutKey] = useState([]);

  const handleLayoutSelected = useCallback((layout) => {
    setLayoutKey(layout);
  }, []);

  const handleCancelUpload = () => {
    setUploadState(false);
  };

  const handleOpenUpload = () => {
    setUploadState(true);
  };

  const handleCancelPrint = useCallback(() => {
    setPrintState(false);
  }, []);

  const handleOpenPrint = () => {
    setPrintState(true);
  };

  const handleSuccessUpload = useCallback(
    (data) => {
      handleCancelUpload();
      uploadFunction(data);
    },
    [uploadFunction]
  );

  const handleCloseRpLayoutPicker = (state) => {
    if (!state) {
      ReportLayout.layoutCallBack(layoutKey);
    }
  };

  const handleSearch = (e) => {
    searchCallBack(e.target.value);
  };

  useHotkeys(
    "ctrl+i",
    () => {
      addEvent();
    },
    { enableOnFormTags: ["input", "select", "textarea"] }
  );

  return (
    <div className="list__header__bar w-full">
      {title && (
        <span className="default_header_label">
          {title}{" "}
          {Number.isInteger(totalResults) && (
            <>
              (<span className="sub_text_color">{totalResults}</span>)
            </>
          )}
        </span>
      )}

      <div className="list__header__tools">
        {searchCallBack && (
          <>
            <Tooltip placement="topLeft" title="Tìm kiếm">
              <Input
                style={{ width: "120px" }}
                placeholder="Tìm kiếm"
                prefix={
                  <i
                    className="pi pi-search sub_text_color"
                    style={{ fontWeight: "bold" }}
                  ></i>
                }
                onInput={handleSearch}
              ></Input>
            </Tooltip>
          </>
        )}

        {deleteEvent && (
          <Button className="default_button" danger onClick={deleteEvent}>
            <i className="pi pi-trash"></i>
          </Button>
        )}
        {deleteItems && deleteItems.count > 0 && (
          <Button
            className="default_button"
            danger
            onClick={deleteItems.delete}
            icon={<i className="pi pi-trash"></i>}
          >
            <span
              style={{ fontWeight: "bold" }}
            >{`Xoá ${deleteItems.count} ${name}`}</span>
          </Button>
        )}

        {editEvent && (
          <Tooltip placement="topLeft" title="Sửa">
            <Button className="default_button" onClick={editEvent}>
              <i
                className="pi pi-pencil sub_text_color"
                style={{ fontWeight: "bold" }}
              ></i>
            </Button>
          </Tooltip>
        )}

        {addEvent && (
          <Tooltip placement="topLeft" title="Thêm mới">
            <Button className="default_button" onClick={addEvent}>
              <i
                className="pi pi-plus sub_text_color"
                style={{ fontWeight: "bold" }}
              ></i>
            </Button>
          </Tooltip>
        )}

        {refreshEvent && (
          <Tooltip placement="topLeft" title="Làm tươi">
            <Button className="default_button" onClick={refreshEvent}>
              <SyncOutlined
                style={{ fontSize: "20px", width: "20px", height: "20px" }}
                className="sub_text_color"
              />
            </Button>
          </Tooltip>
        )}
        {changePaginations && (
          <Tooltip placement="topLeft" title="Số bản ghi trên trang">
            <Select
              className="w-fit default_pagination_select"
              defaultValue={10}
              suffixIcon={
                <i
                  className="pi pi-table sub_text_color"
                  style={{ fontSize: "16px" }}
                ></i>
              }
              onSelect={changePaginations}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 200, label: "200" },
                { value: 500, label: "500" },
              ]}
            />
          </Tooltip>
        )}
        {advanceFilter && (
          <Tooltip placement="topLeft" title="Lọc">
            <Button className="default_button" onClick={advanceFilter}>
              <i
                className="pi pi-filter sub_text_color"
                style={{ fontWeight: "bold" }}
              ></i>
            </Button>
          </Tooltip>
        )}
        {uploadFunction && (
          <>
            <Tooltip placement="topLeft" title="Import dữ liệu">
              <Button className="default_button" onClick={handleOpenUpload}>
                <i
                  className="pi pi-download sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>

            <UploadFileModal
              onCancel={handleCancelUpload}
              onOk={handleSuccessUpload}
              openState={uploadState}
              fileExample={fileExample}
            />
          </>
        )}
        {printCallBack && printList.length > 0 && (
          <>
            <Tooltip placement="topLeft" title="In dữ liệu">
              <Button className="default_button" onClick={handleOpenPrint}>
                <i
                  className="pi pi-print sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Tooltip>

            <PrintList
              openState={printState}
              callBackClick={printCallBack}
              layouts={printList}
              onCancel={handleCancelPrint}
            />
          </>
        )}
        {ReportLayout.layoutCallBack && (
          <Tooltip placement="topLeft" title="Cấu trúc báo cáo">
            <Popover
              onOpenChange={handleCloseRpLayoutPicker}
              placement="bottomLeft"
              content={
                <ReportLayoutPicker
                  layout={ReportLayout.columns}
                  selectCallback={handleLayoutSelected}
                />
              }
              title="Cấu trúc"
              trigger="click"
            >
              <Button className="default_button">
                <i
                  className="pi pi-eye sub_text_color"
                  style={{ fontWeight: "bold" }}
                ></i>
              </Button>
            </Popover>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

/**
 * @param name - Tên hiển thị trên các chức năng.
 * @param title - Tiêu đề hiển thị.
 * @function addEvent - Function cho nút thêm mới.
 * @function refreshEvent - Function làm mới trang.
 * @param {Object} deleteItems.count - Số lượng items.
 * @function deleteItems.delete - Function xoá items.
 * @callback printEvent - Callback in.
 * @callback changePaginations - Callback đổi số bản ghi trên trang.
 * @function advanceFilter - Function mở lọc nâng cao.
 * @function deleteEvent - Function xoá 1 item.
 * @callback uploadFunction - Callback xử lý đẩy excel.
 * @param {Array} fileExample[] - Mảng tên các trường.
 * @param {Object} ReportLayout.columns[] - Cấu trúc {key:'abc', title: 'def'}.
 * @callback ReportLayout.layoutCallBack - Callback trả về mảng các trường đã chọn.
 * @param {Object} ReportLayout.columns[] - Cấu trúc {key:'abc', title: 'def'}.
 * @param {String} printList.key - Key của layout in.
 * @param {String} printList.title - title của layout in.
 * @param {String} printList.type - Loại của layout in ví dụ (PDF, EXCEL ....).
 * @callback printCallBack - Function thực hiện chức năng, sẽ trả về 1 print item.
 * @callback searchCallBack -- callback khi tìm kiếm, trả về input của người dùng
 */
export default memo(HeaderTableBar);

HeaderTableBar.prototype = {
  name: PropTypes.string.isRequired,
  totalResults: PropTypes.number.isRequired,
  addEvent: PropTypes.func,
  refreshEvent: PropTypes.func,
  title: PropTypes.string.isRequired,
  deleteItems: PropTypes.object,
  changePaginations: PropTypes.func,
  advanceFilter: PropTypes.func,
  deleteEvent: PropTypes.func,
  uploadFunction: PropTypes.func,
  fileExample: PropTypes.array,
  ReportLayout: PropTypes.object,
};
