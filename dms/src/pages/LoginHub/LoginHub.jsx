import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UilAnalysis } from "@iconscout/react-unicons";
import { Button, Form, Input, notification, Select, Space } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { apiGetStoreByUser, refreshToken } from "../../api";
import { apiGetUnitByUser } from "../../components/SystemOptions/API";
import router from "../../router/routes";
import { setClaims } from "../../store/reducers/claimsSlice";
import https from "../../utils/https";
import jwt from "../../utils/jwt";
import "./LoginHub.css";

const LoginHub = () => {
  const [loginForm] = Form.useForm();
  const userName = Form.useWatch("userName", loginForm);
  const unit = Form.useWatch("DVCS", loginForm);
  const [unitOptions, setUnitOptions] = useState([]);
  const [initUnit, setInitUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeOptions, setStoreOptions] = useState([]);

  const dispatch = useDispatch();

  const fetchUnitsData = (data) => {
    setLoading(true);
    apiGetUnitByUser({ username: data }).then((res) => {
      const options = res.map((item) => {
        return {
          value: item?.dvcsCode?.trim() || "",
          label: item.name,
        };
      });

      setUnitOptions(options);
      loginForm.setFieldValue("DVCS", _.first(options)?.value || null);
      setLoading(false);
    });
  };

  const fetchStoreDate = async () => {
    setLoading(true);
    await apiGetStoreByUser({
      unitId: unit.trim() || "",
      userName: userName,
    }).then((res) => {
      loginForm.setFieldValue("Store", _.first(res)?.ma_bp || null);

      setStoreOptions([
        ...res.map((item) => {
          return {
            value: item.ma_bp,
            label: item.ten_bp,
          };
        }),
      ]);
      setLoading(false);
    });
  };

  const handleLogin = async (data) => {
    setLoading(true);
    await https
      .post("Authentication/Login", {
        ...data,
      })
      .then((res) => {
        if (typeof res.data == "string") {
          if (res?.data?.toLowerCase()?.includes("login failed")) {
            return notification.warning({
              message: `Sai tài khoản hoặc mật khẩu`,
              placement: "topLeft",
            });
          }
        } else {
          jwt.setAccessToken(res.data.token);
          jwt.setRefreshToken(res.data.refreshToken);
          dispatch(setClaims(jwt.saveClaims(res.data.token)));
          router.navigate("/RO/Reatailorder");
          return notification.success({
            message: `Đăng nhập thành công`,
          });
        }

        setLoading(false);
      });
  };

  const handleQuickLogin = async () => {
    const url = new URL(document.URL);
    const urlsp = url.searchParams;
    const token = encodeURI(urlsp.get("token"));
    const refreshTokenParams = encodeURI(urlsp.get("refreshToken")).replaceAll(
      "%20",
      "+"
    );

    if (token && refreshTokenParams) {
      await jwt.setRefreshToken(refreshTokenParams);
      await jwt.setAccessToken(token);
      await refreshToken()
        .then((res) => {
          jwt.setRefreshToken(res.refreshToken);
          jwt.setAccessToken(res.token);
          router.navigate("/RO/Reatailorder");
        })
        .catch((err) => {
          jwt.resetAccessToken();
          router.navigate("/login");
        });
    }
  };

  useEffect(() => {
    handleQuickLogin();
  }, []);

  useEffect(() => {
    if (unit) {
      fetchStoreDate();
    }
  }, [unit]);

  useEffect(() => {
    if (userName) {
      fetchUnitsData(userName);
    }
    return () => {};
  }, [userName]);

  return (
    <div className="login_hub_container relative">
      <div className="login_hub p-4 border-round-2xl">
        <div className="login_logo_container flex align-items-center">
          <UilAnalysis
            className="login_logo_company_logo"
            size="70"
            color="#1677ff"
          />
          <div>
            <b style={{ fontSize: 70 }}>SS</b>
            <b style={{ color: "#F57A20", fontSize: 70 }}>E</b>
          </div>
        </div>

        <div>
          <p className="font-bold">
            <span
              className="sub_text_color font-bold"
              style={{ fontSize: "20pt" }}
            >
              Hi,
            </span>
            <span
              className="primary_color font-bold"
              style={{ fontSize: "14pt" }}
            >
              {" "}
              Chào mừng đến phần mềm DMS SSE
            </span>
          </p>
          <p>Vui lòng đăng nhập tài khoản để tiếp tục</p>
        </div>
        <div className="mt-3">
          <Form
            form={loginForm}
            name="loginForm"
            initialValues={{ remember: true }}
            autoComplete="true"
            onFinish={handleLogin}
          >
            <Space className="login_detail w-full" direction="vertical">
              <Space direction="vertical" className="w-full" size={"small"}>
                <label>Tài khoản</label>
                <Form.Item
                  name="userName"
                  rules={[
                    { required: true, message: "Vui lòng điền tài khoản" },
                  ]}
                >
                  <Input
                    style={{
                      width: "100%",
                    }}
                  />
                </Form.Item>

                <span>Mật khẩu</span>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Vui lòng điền mật khẩu" },
                  ]}
                >
                  <Input.Password
                    style={{
                      width: "100%",
                    }}
                    placeholder="Nhập mật khẩu"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>

                <span>Đơn vị: </span>
                <Form.Item
                  name="DVCS"
                  rules={[{ required: true, message: "Vui lòng chọn đơn vị" }]}
                >
                  <Select className="w-full" options={unitOptions} />
                </Form.Item>

                <span>Cửa hàng: </span>
                <Form.Item
                  name="Store"
                  rules={[
                    { required: true, message: "Vui lòng chọn cửa hàng" },
                  ]}
                >
                  <Select className="w-full" options={storeOptions} />
                </Form.Item>
              </Space>

              <Space
                direction="horizontal"
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                  paddingBottom: "10px",
                }}
              >
                <Button style={{ padding: "0" }} type="link">
                  Quên mật khẩu
                </Button>
              </Space>

              <Button
                className="w-full"
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Space>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginHub;
