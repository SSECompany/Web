import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  notification,
  Switch,
} from "antd";
import React, { useEffect, useState } from "react";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  fetchSystemSetting,
  updateSystemSetting,
} from "../../Store/Actions/SystemSettingActions";

const SystemSetting = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settingForm] = Form.useForm();
  const [settings, setSettings] = useState([]);

  const getSystemSetting = async () => {
    setIsLoading(true);

    const result = await fetchSystemSetting();
    setSettings(result);

    setIsLoading(false);
  };

  const handleSumitForm = async () => {
    try {
      await settingForm.validateFields();
      const data = await settingForm.getFieldsValue();

      const detailData = [];
      Object.keys(data).map((key) => {
        return detailData.push({
          key: key,
          value: data[key] === true ? 1 : data[key] === false ? 0 : data[key],
        });
      });

      const res = await updateSystemSetting(detailData);

      if (res)
        notification.success({
          message: `Thực hiện thành công`,
        });
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    getSystemSetting();
    return () => {};
  }, []);

  const renderFormFields = ({
    key,
    title = "Không rõ",
    description,
    type,
    defaultValue,
  }) => {
    var field;

    switch (type) {
      case "Input":
        field = <Input />;
        break;

      case "Number":
        field = <InputNumber controls={false} min="0" step={1} />;
        break;

      case "Switch":
        field = <Switch></Switch>;
        break;

      default:
        field = <Input />;
        break;
    }

    return (
      <div key={key}>
        <div className="flex">
          <div className="w-full min-w-0">
            <p className="default_header_label mb-1">{title}</p>
            <p className="opacity-40">{description}</p>
          </div>

          <div>
            <Form.Item
              initialValue={
                type === "Switch" ? parseInt(defaultValue) > 0 : defaultValue
              }
              valuePropName={type === "Switch" ? "checked" : "value"}
              name={key}
              style={{
                width: "100%",
                margin: 0,
              }}
              rules={[
                {
                  required: true,
                  message: `Không được trống !`,
                },
              ]}
            >
              {field}
            </Form.Item>
          </div>
        </div>

        <Divider />
      </div>
    );
  };

  return (
    <div
      className="relative flex flex-column h-full"
      style={{ background: "white" }}
    >
      <LoadingComponents text={"Đang tải dữ liệu"} loading={isLoading} />
      <span className="primary_bold_text text-lg line-height-4 p-2 shadow-1">
        Thiết lập hệ thống
      </span>

      <Form form={settingForm} component={false}>
        <div className="h-full min-h-0 overflow-auto px-3 py-2">
          {settings.map((item) =>
            renderFormFields({
              key: item?.key,
              defaultValue: item?.value,
              title: item?.title,
              type: item?.Type,
              description: item?.description,
            })
          )}
        </div>

        <div className="p-2 shadow-2 text-right">
          <Form.Item className="w-fit" style={{ float: "right" }}>
            <Button
              className="default_primary_button"
              icon={<i className="pi pi-send"></i>}
              onClick={handleSumitForm}
            >
              Lưu
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default SystemSetting;
