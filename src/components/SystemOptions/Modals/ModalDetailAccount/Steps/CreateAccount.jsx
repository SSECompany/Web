import { Form, Input, message, Upload } from "antd";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { formatData } from "../../../../../app/hooks/dataFormatHelper";
import {
  emailRegex,
  passwordRegex,
  phoneNumberRegex,
  userNameRegex,
} from "../../../../../app/regex/regex";
import { SoFuckingUltimateGetApi } from "../../../../DMS/API";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import {
  setCurrentAccount,
  setCurrentAvatar,
  setCurrentStep,
} from "../../../Store/Actions";
import { getCreateAccInfo } from "../../../Store/Selectors";

const CreateAccount = ({ userId: propUserId, record }, ref) => {
  const avatarStyled = {
    width: "100%",
    borderRadius: "50000px",
  };

  const avatarContainerStyled = {
    textAlign: "center",
    marginBottom: "25px",
  };

  const [infoForm] = Form.useForm();
  const createInfo = useSelector(getCreateAccInfo);

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(createInfo.currentAvatar);
  const [initValues, setInitValues] = useState({
    ...createInfo.currentAccount,
  });

  useImperativeHandle(ref, () => ({
    nextStep: async () => {
      try {
        await infoForm.validateFields();
        setCurrentAccount({
          ...infoForm.getFieldsValue(),
          user_id: propUserId,
        });
        setCurrentAvatar(imageUrl);
        setCurrentStep(createInfo.currentSteps + 1);
      } catch (error) {
        return;
      }
    },
  }));

  const getDetailData = () => {
    setLoading(true);
    SoFuckingUltimateGetApi({
      store: "api_Get_Users",
      data: { id: propUserId ? propUserId : null, pageindex: 1, pageSize: 10 },
    }).then((res) => {
      const data = formatData(res?.data[0], res?.reportLayoutModel);
      res?.reportLayoutModel.map((item) => {
        return infoForm.setFieldValue(`${item.field}`, data[`${item.field}`]);
      });
      setLoading(false);
    });
  };

  const checkUserName = async (user_name) => {
    var valid = true;
    await SoFuckingUltimateGetApi({
      store: "api_Check_valid_value",
      data: { value: user_name, key: "username" },
    }).then((res) => {
      if (res?.data[0]?.validation === 1 && !propUserId) {
        valid = false;
      } else {
        valid = true;
      }
    });
    return valid;
  };

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }

    getBase64(file, (url) => {
      setImageUrl(url);
    });
    return isLt2M;
  };

  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      setLoading(false);
    }
  };

  const props = {
    name: "file",
    listType: "picture-circle",
    showUploadList: false,
    multiple: false,
    maxCount: 1,
    accept: "image/*",
    customRequest({ file, onSuccess, onError }) {
      console.log(file);
    },
  };

  const uploadButton = (
    <div
      style={{
        marginTop: 8,
      }}
    >
      Avatar
    </div>
  );

  useEffect(() => {
    if (propUserId) {
      infoForm.resetFields();
      getDetailData();
    } else {
      infoForm.resetFields();
    }
  }, [record]);

  return (
    <div>
      <div style={avatarContainerStyled}>
        <Upload {...props} beforeUpload={beforeUpload} onChange={handleChange}>
          {imageUrl ? (
            <img src={imageUrl} alt="avatar" style={avatarStyled} />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>
      <Form
        form={infoForm}
        className="default_modal_container"
        style={{ gap: "15px" }}
        initialValues={initValues}
      >
        <LoadingComponents loading={loading} />
        <div className="default_modal_group_items" style={{ gap: "35px" }}>
          <div>
            <span className="default_bold_label">
              Tên đăng nhập <span className="danger_text_color">*</span>
            </span>
            <Form.Item
              name="user_name"
              hasFeedback
              rules={[
                { required: true, message: "Điền tên đăng nhập" },

                {
                  validator: async (_, value) => {
                    return (await checkUserName(value)) == true
                      ? Promise.resolve()
                      : Promise.reject(new Error("Trùng tài khoản"));
                  },
                },

                {
                  validator: async (_, value) => {
                    return ((await userNameRegex.test(value)) || !value) == true
                      ? Promise.resolve()
                      : Promise.reject(new Error("Tối thiểu 8 ký tự"));
                  },
                },
              ]}
            >
              <Input
                disabled={propUserId ? true : false}
                autoComplete="one-time-code"
                maxLength={32}
                placeholder="Nhập tên đăng nhập"
              />
            </Form.Item>
          </div>

          <div>
            <span className="default_bold_label">
              Tên đầy đủ <span className="danger_text_color">*</span>
            </span>
            <Form.Item
              name="full_name"
              rules={[{ required: true, message: "Điền tên đầy đủ" }]}
            >
              <Input
                disabled={propUserId ? true : false}
                autoComplete="one-time-code"
                placeholder="Nhập tên "
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items" style={{ gap: "35px" }}>
          <div>
            <span className="default_bold_label">
              Mật khẩu <span className="danger_text_color">*</span>
            </span>
            <Form.Item
              name="password"
              rules={[
                {
                  required: propUserId ? false : true,
                  message: "Điền mật khẩu",
                },
                {
                  validator: async (_, value) => {
                    return ((await passwordRegex.test(value)) || !value) == true
                      ? Promise.resolve()
                      : Promise.reject(new Error("Tối thiểu 8 ký tự"));
                  },
                },
              ]}
            >
              <Input.Password
                autoComplete="one-time-code"
                disabled={propUserId ? true : false}
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>
          </div>

          <div>
            <span className="default_bold_label">
              Nhập lại mật khẩu <span className="danger_text_color">*</span>
            </span>
            <Form.Item
              name="password2"
              rules={[
                {
                  required: propUserId ? false : true,
                  message: "Điền lại mật khẩu",
                },

                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Không trùng mật khẩu"));
                  },
                }),
              ]}
            >
              <Input.Password
                autoComplete="one-time-code"
                disabled={propUserId ? true : false}
                placeholder="Nhập lại mật khẩu"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items" style={{ gap: "35px" }}>
          <div>
            <span className="default_bold_label">Email</span>
            <Form.Item
              name="e_mail"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      emailRegex.test(value) ||
                      value?.trim() == "" ||
                      value == null
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Không đúng định dạng email")
                    );
                  },
                }),
              ]}
            >
              <Input
                disabled={propUserId ? true : false}
                placeholder="Nhập email"
              />
            </Form.Item>
          </div>

          <div>
            <span className="default_bold_label">Điện thoại</span>
            <Form.Item
              name="dien_thoai"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      phoneNumberRegex.test(value) ||
                      value?.trim() == "" ||
                      value == null
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Không đúng định dạng số điện thoại")
                    );
                  },
                }),
              ]}
            >
              <Input
                disabled={propUserId ? true : false}
                maxLength={15}
                placeholder="Nhập điện thoại"
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default forwardRef(CreateAccount);
