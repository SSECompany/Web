import { Button, message as messageAPI, Modal, Upload } from "antd";
import React, { memo } from "react";
import * as XLSX from "xlsx";
import { handleImportExcel } from "../../app/Functions/importExcel";
const { Dragger } = Upload;

const UploadFileModal = ({ openState, onOk, onCancel, fileExample }) => {
  const [message, contextHolder] = messageAPI.useMessage();

  const IconUploadStyled = {
    fontSize: "3rem",
  };

  const IconFileExtension = {
    fontSize: "1.5rem",
  };

  const DraggerStyled = {
    marginBottom: "1rem",
  };

  const DowloadFileStyled = {
    width: "100%",
    background: "var(--success)",
    color: "#fff",
  };

  const downloadExampleFile = () => {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet([], {
      header: fileExample,
      origin: "A5",
    });
    const colsWidth = fileExample.map((item) => {
      return {
        width: 20,
      };
    });

    ws["!cols"] = [...colsWidth];
    XLSX.utils.book_append_sheet(wb, ws, "data");
    XLSX.writeFile(wb, "importExample.xlsx");
  };

  const props = {
    name: "file",
    multiple: false,
    maxCount: 1,
    accept: ".xlsx, .xls",
    showUploadList: false,
    onChange(info) {
      const { status, error } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} tải lên thành công.`);
      }
      if (status === "error" && error !== "notExcel") {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
    customRequest({ file, onSuccess, onError }) {
      const isExcel = file.name.includes(".xlsx");
      if (!isExcel) {
        onError("notExcel");
        return message.error(`${file.name} Không phải file excel`);
      }
      handleImportExcel(file, (data) => {
        onOk(data);
      });
      return onSuccess("OK");
    },
  };
  return (
    <Modal
      open={openState}
      title="Nhập file"
      okButtonProps={{ style: { display: "none" } }}
      onCancel={onCancel}
      okText="Nhận"
      cancelText="Huỷ"
    >
      <Dragger {...props} style={DraggerStyled}>
        <p className="ant-upload-drag-icon">
          <i className="pi pi-file-import" style={IconUploadStyled}></i>
        </p>
        <p className="ant-upload-text">
          Click hoặc thả file vào đây để tải lên
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ các định dạng file:{" "}
          <i
            className="pi  pi-file-excel"
            style={{ ...IconFileExtension, color: "#1D6F42" }}
          ></i>{" "}
          <i
            className="pi  pi-database"
            style={{ ...IconFileExtension, color: "#F29111" }}
          ></i>
        </p>
      </Dragger>

      <Button
        style={DowloadFileStyled}
        className="default_button"
        onClick={downloadExampleFile}
        icon={
          <i className="pi pi-cloud-download" style={{ fontSize: "20px" }}></i>
        }
      >
        File mẫu
      </Button>
      {contextHolder}
    </Modal>
  );
};

export default memo(UploadFileModal);
