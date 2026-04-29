import { Form, Input, message, Modal, Select } from "antd";
import React, { memo, useEffect, useState } from "react";
import emitter from "../../../utils/emitter";

const ReportIssue = () => {
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCloseModal = () => {
    setIsOpen(false);
    form.resetFields();
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        messageApi.success("Thafnh coong");
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  useEffect(() => {
    emitter.on("OPEN_REPORT_ISSUE_MODAL", () => {
      setIsOpen(true);
    });
  }, []);

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        width={"50%"}
        title="Báo lỗi"
        destroyOnClose={true}
        onOk={handleCreate}
        onCancel={handleCloseModal}
      >
        <Form className="default_modal_container" form={form}>
          <div>
            <span>
              Tiêu đề (<span className="danger_text_color">*</span>)
            </span>
            <Form.Item name="title" rules={[{ required: true }]}>
              <Input placeholder="abc..." />
            </Form.Item>
          </div>

          <div className="default_modal_group_items">
            <div>
              <span>
                Chức năng (<span className="danger_text_color">*</span>)
              </span>
              <Form.Item name="function" rules={[{ required: true }]}>
                <Input placeholder="abc..." />
              </Form.Item>
            </div>

            <div>
              <span>
                Loại lỗi (<span className="danger_text_color">*</span>)
              </span>
              <Form.Item name="type" initialValue={"1"}>
                <Select
                  options={[
                    { value: "0", label: "Không lưu" },
                    { value: "1", label: "Sai dữ liệu" },
                    { value: "2", label: "Giao diện" },
                    { value: "3", label: "Khác" },
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <span>
              diễn giải (<span className="danger_text_color">*</span>)
            </span>
            <Form.Item name="description" rules={[{ required: true }]}>
              <Input.TextArea
                autoSize={{
                  minRows: 4,
                  maxRows: 4,
                }}
                placeholder="Nhập nội dung"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default memo(ReportIssue);
