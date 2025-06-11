import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined,
} from "@ant-design/icons";
import { UilExclamationOctagon } from "@iconscout/react-unicons";
import {
  Button,
  Carousel,
  Checkbox,
  Form,
  Input,
  notification,
  Select,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import router from "../../router/routes";
import { setClaims } from "../../store/reducers/claimsSlice";
import https from "../../utils/https";
import jwt from "../../utils/jwt";
import "./Login.css";

const Login = () => {
  const [loginLoading, setLoginLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [units, setUnits] = useState([{ value: "", label: "Không" }]);
  const [unitSelected, setUnitSelected] = useState({
    value: "",
    label: "Không",
  });
  const [token, setToken] = useState(""); // store token after login
  const [unitsLoaded, setUnitsLoaded] = useState(false);
  const [loginWaitingUnits, setLoginWaitingUnits] = useState(false);

  const dispatch = useDispatch();

  const preFetchUserMetadata = async () => {
    if (!userName || !password || token) return;
    try {
      const response = await https.post("v1/users/signin", {
        hostId: "https://vikosan-cloud.sse.net.vn",
        userName,
        password,
        devideToken: "",
        language: "V",
      });
      const { accessToken, refreshToken, user } = response.data;
      setToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      dispatch(setClaims(jwt.saveClaims(accessToken)));
      await fetchCompanies(accessToken);
      await fetchUnits(accessToken);
    } catch (error) {
      // silent fail
    }
  };

  // Handle login and fetch token
  const handleLoginButton = async () => {
    setLoginLoading(true);
    if (!userName || !password) {
      setLoginLoading(false);
      notification.warning({
        message: `Vui lòng nhập tài khoản và mật khẩu`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }
    try {
      // Step 1: Login to get token
      const response = await https.post("v1/users/signin", {
        hostId: "https://vikosan-cloud.sse.net.vn",
        userName,
        password,
        devideToken: "",
        language: "V",
      });
      const { accessToken, refreshToken, user } = response.data;

      jwt.setAccessToken(accessToken);
      jwt.setRefreshToken(refreshToken);
      setToken(accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      await dispatch(setClaims(jwt.saveClaims(accessToken)));
      setTimeout(() => router.navigate("/"), 0);
      await fetchCompanies(accessToken);
      setLoginLoading(false);
      notification.success({
        message: `Đăng nhập thành công`,
      });
    } catch (error) {
      setLoginLoading(false);
      notification.warning({
        message: `Sai tài khoản hoặc mật khẩu`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }
  };

  const fetchCompanies = async (accessToken) => {
    try {
      const companiesResponse = await https.get(
        "v1/users/companies",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const companies = companiesResponse.data;
      if (companies && companies.length > 0) {
        await fetchUnits(accessToken);
      } else {
        setUnits([{ value: "", label: "Không" }]);
        setUnitSelected({ value: "", label: "Không" });
      }
    } catch (error) {
      setUnits([{ value: "", label: "Không" }]);
      setUnitSelected({ value: "", label: "Không" });
      notification.warning({
        message: `Lấy đơn vị thất bại`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }
  };

  const fetchUnits = async (accessToken) => {
    setUnitsLoaded(false);
    try {
      const unitsResponse = await https.get(
        "v1/users/units",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      localStorage.setItem("unitsResponse", JSON.stringify(unitsResponse.data.units[0]));
      const unitsData = unitsResponse.data?.units || [];
      if (unitsData && unitsData.length > 0) {
        const firstUnit = unitsData[0];
        const new_Unit = [{ value: firstUnit.unitId, label: firstUnit.unitName }];
        setUnits(new_Unit);
        setUnitSelected(new_Unit[0]);
        setUnitsLoaded(true);
      } else {
        setUnits([{ value: "", label: "Không" }]);
        setUnitSelected({ value: "", label: "Không" });
        setUnitsLoaded(false);
      }
    } catch (error) {
      setUnits([{ value: "", label: "Không" }]);
      setUnitSelected({ value: "", label: "Không" });
      setUnitsLoaded(false);
      notification.warning({
        message: `Lấy đơn vị thất bại`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }
  };

  // Fetch stores when unit changes
  const fetchStoreData = async () => {
    if (!unitSelected?.value) {
      return;
    }
    setLoginLoading(true);
    try {
      const response = await https.get(
        `v1/users/stores?unitId=${unitSelected.value}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = response.data;

      setLoginLoading(false);
    } catch (error) {
      setLoginLoading(false);
      notification.warning({
        message: `Lấy cửa hàng thất bại`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    }
  };

  useEffect(() => {
    if (unitSelected?.value && token) {
      fetchStoreData();
    }
  }, [unitSelected]);

  useEffect(() => {
    setUnits([{ value: "", label: "Không" }]);
    setUnitSelected({ value: "", label: "Không" });
    setToken("");
  }, [JSON.stringify(userName)]);

  useEffect(() => {
    if (jwt.checkExistToken()) {
      dispatch(setClaims(jwt.saveClaims(jwt.getAccessToken())));
      router.navigate("/");
    }
  }, [dispatch]);

  const debouncedPreFetch = useDebouncedCallback(() => {
    if (userName && password && !token) {
      preFetchUserMetadata();
    }
  }, 800);

  useEffect(() => {
    debouncedPreFetch();
  }, [userName, password]);

  const handleChangeUnit = (item) => {
    setUnitSelected(units.find((unit) => unit.value == item));
  };

  const handleInputUserName = useDebouncedCallback((userName) => {
    setUserName(userName);
  }, 300);

  const onLackInfoLogin = () => {};
  const onEnoughInfo = () => {
    if (!unitsLoaded) {
      setLoginWaitingUnits(true);
      return;
    }
    handleLoginButton();
  };

  useEffect(() => {
    if (unitsLoaded && loginWaitingUnits) {
      setLoginWaitingUnits(false);
      handleLoginButton();
    }
  }, [unitsLoaded, loginWaitingUnits]);

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
                }}
                size="large"
                className="default_select"
                value={unitSelected}
                options={units}
                onSelect={handleChangeUnit}
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
                  loading={loginLoading || loginWaitingUnits}
                  style={{ flexShrink: "0", color: "white", width: "100%" }}
                  disabled={!unitsLoaded && !loginWaitingUnits}
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
