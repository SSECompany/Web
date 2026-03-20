import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined,
} from "@ant-design/icons";
import { UilExclamationOctagon } from "@iconscout/react-unicons";
import {
  App,
  Button,
  Carousel,
  Checkbox,
  Form,
  Input,
  Select,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom"; // Import useLocation
import { useDebouncedCallback } from "use-debounce";
import { apiGetStoreByUser } from "../../api";
import useVersionCheck from "../../hooks/useVersionCheck";
import router from "../../router/routes";
import { setClaims } from "../../store/reducers/claimsSlice";
import https from "../../utils/https";
import jwt from "../../utils/jwt";
import { clearAllTokenData } from "../../utils/tokenUtils";
import "./Login.css";

const Login = () => {
  const { notification } = App.useApp();
  // Check version ngay từ màn login để tránh đăng nhập xong bị logout do lệch version
  useVersionCheck();
  const [loginLoading, setLoginLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [units, setUnits] = useState([{ value: "", label: "Không" }]);
  const [unitSelected, setUnitSelected] = useState({
    value: "",
    label: "Không",
  });
  const [storeOptions, setStoreOptions] = useState([]);

  const dispatch = useDispatch();
  const location = useLocation(); // Initialize useLocation
  const handleLoginButton = async () => {
    setLoginLoading(!loginLoading);
    if (!unitSelected?.value || !unitSelected) {
      setLoginLoading(false);
      return notification.warning({
        message: `Vui lòng chọn đơn vị`,
        placement: "topRight",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }

    await https
      .post("Authentication/Login", {
        userName: userName,
        password: password,
        DVCS: unitSelected.value.toString().trim(),
        Store: "",
      })
      .then((res) => {
        setLoginLoading(false);
        if (typeof res.data == "string") {
          if (res?.status == 203) {
            return notification.warning({
              message: `Sai tài khoản hoặc mật khẩu`,
              placement: "topRight",
              icon: <UilExclamationOctagon size="25" color="#ffba00" />,
            });
          }
        } else {
          jwt.setAccessToken(res.data.token);
          jwt.setRefreshToken(res.data.refreshToken);
          const claims = jwt.saveClaims(res.data.token);
          if (claims.Permision === "") {
            clearAllTokenData();
            return notification.error({
              message: `Lỗi Phân Quyền`,
              description: "Tài khoản không được cấp quyền.",
              placement: "topRight",
            });
          }
          dispatch(setClaims(claims));
          const from = location.state?.from || "/";
          router.navigate(from, { replace: true });
          return notification.success({
            message: `Đăng nhập thành công`,
          });
        }
      })
      .catch((err) => {
        setLoginLoading(false);
        notification.error({
          message: err?.message || "Đăng nhập thất bại",
          placement: "topRight",
        });
      });
  };

  const onLackInfoLogin = () => {};
  const onEnoughInfo = () => {
    handleLoginButton();
  };

  const handleInputUserName = useDebouncedCallback((userName) => {
    setUserName((value) => {
      return (value = userName);
    });
  }, 300);

  const fetchStoreData = async () => {
    setLoginLoading(true);
    await apiGetStoreByUser({
      unitId: unitSelected?.value.trim() || "",
      userName: userName,
    })
      .then((res) => {
        setLoginLoading(false);
        setStoreOptions([
          ...res.map((item) => {
            return {
              value: item.ma_bp,
              label: item.ten_bp,
            };
          }),
        ]);
      })
      .catch(() => setLoginLoading(false));
  };

  useEffect(() => {
    if (unitSelected?.value) {
      fetchStoreData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitSelected?.value]);

  useEffect(() => {
    setUnits([{ value: "", label: "Không" }]);
    setUnitSelected({ value: "", label: "Không" });
    setStoreOptions([{ value: "", label: "Không" }]);

    const getUnits = async () => {
      setLoginLoading(true);
      await https
        .get("Authentication/DVCS", {
          username: userName,
        })
        .then((res) => {
          if (res.data) {
            const new_Units = [];
            res.data.map((item) => {
              return new_Units.push({ value: item.dvcsCode, label: item.name });
            });
            setUnits(new_Units);
            setUnitSelected(new_Units[0]);
          } else {
            setUnits([{ value: "", label: "Không" }]);
            setUnitSelected({ value: "", label: "Không" });
          }
          setLoginLoading(false);
        })
        .catch(() => setLoginLoading(false));
    };

    if (userName) {
      getUnits();
    } else {
      setUnits([{ value: "", label: "Không" }]);
      setUnitSelected({ value: "", label: "Không" });
    }
  }, [userName]);

  useEffect(() => {
    if (jwt.checkExistToken()) {
      dispatch(setClaims(jwt.saveClaims(jwt.getAccessToken())));
      router.navigate("/");
    }
    
    // Check if we were redirected here with an error
    if (location.state?.error) {
      notification.error({
        message: 'Lỗi Phân Quyền',
        description: location.state.error,
        placement: "topRight",
      });
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [dispatch, location.state, notification]);

  const handleChangeUnit = (item) => {
    setUnitSelected(units.find((unit) => unit.value == item));
  };

  const images = [
    {
      url: "https://izisolution.vn/upload/2021/Kinh-nghiem-trien-khai-phan-mem-erp.jpg",
      alt: "",
    },
    {
      url: "https://granderp.com/wp-content/uploads/2024/01/homepagePNG.png",
      alt: "",
    },
    {
      url: "https://blog.vault-erp.com/image.axd?picture=/Invoice%20management/Vault_InvoiceMS_Blog_930x620px_01.png",
      alt: "",
    },
    {
      url: "https://www.technosip.com/wp-content/uploads/2021/04/Healthcare-App-Development-Services-of-Technosip-4.png",
      alt: "",
    },
  ];

  return (
    <div className="login_container">
      <div className="login_container_left">
        <Form
          name="login_form"
          initialValues={{ remember: true }}
          autoComplete="off"
          className="login_form"
          onFinishFailed={onLackInfoLogin}
          onFinish={onEnoughInfo}
        >
          <div className="login_logo_container">
            <span className="login_logo_company_name">
              SS<span style={{ color: "#F57A20" }}>E</span>
            </span>
          </div>
          <div className="login_desciption">
            <h1 className="login_desciption_header">Hí, Chào mừng trở lại</h1>
          </div>
          <Space className="default_space login_detail" direction="vertical">
            <Space
              direction="vertical"
              className="default_space input_login_info"
              size={"small"}
            >
              <span>Tài khoản</span>
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Vui lòng điền tài khoản" }]}
              >
                <Input
                  style={{
                    width: "100%",
                    padding: "10px 8px",
                  }}
                  onChange={(e) => handleInputUserName(e.target.value)}
                  className="default_input"
                  size="middle"
                  prefix={<UserOutlined />}
                />
              </Form.Item>

              <span>Mật khẩu</span>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Vui lòng điền mật khẩu" }]}
              >
                <Input.Password
                  style={{
                    width: "100%",
                    padding: "10px 8px",
                  }}
                  onChange={(e) => setPassword(e.target.value)}
                  className="default_input"
                  size="large"
                  placeholder="Nhập mật khẩu"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <span>Đơn vị: </span>
              <Select
                style={{
                  width: "100%",
                  minWidth: 0,
                }}
                size="large"
                className="default_select"
                value={unitSelected}
                options={units}
                popupMatchSelectWidth={false}
                classNames={{ popup: { root: 'login_unit_select_dropdown' } }}
                onSelect={handleChangeUnit}
                optionLabelProp="label"
                maxTagCount="responsive"
              />
            </Space>

            <Space
              direction="horizontal"
              className="default_space"
              style={{
                justifyContent: "space-between",
                width: "100%",
                paddingBottom: "10px",
              }}
            >
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Button style={{ padding: "0" }} type="link">
                Quên mật khẩu
              </Button>
            </Space>

            <Space direction="vertical" className="default_space login_tools">
              <Form.Item>
                <Button
                  size="large"
                  className="default_button"
                  type="primary"
                  htmlType="submit"
                  loading={loginLoading}
                  style={{ flexShrink: "0", color: "white", width: "100%" }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Space>
          </Space>
        </Form>
      </div>
      <div className="login_container_right">
        <Carousel autoplay draggable effect="fade" autoplaySpeed={2000}>
          {images.map((item, index) => {
            return (
              <div key={index} className="login_images_container">
                <img src={item.url} alt={item.index} className="login_image" />
              </div>
            );
          })}
        </Carousel>
      </div>
    </div>
  );
};

export default Login;
