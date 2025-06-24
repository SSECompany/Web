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
import { useDispatch, useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import router from "../../router/routes";
import {
  setClaims,
  setRefreshToken,
  setTokenExpiry,
} from "../../store/reducers/claimsSlice";
import {
  login,
  logout,
  refreshToken,
  selectIsValidSession,
  selectNeedsTokenRefresh,
  selectRefreshToken,
} from "../../store/slices/authSlice";
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
  const [isLoginInProgress, setIsLoginInProgress] = useState(false); // Thêm state để track login progress
  const [allUnitsData, setAllUnitsData] = useState([]); // Lưu toàn bộ dữ liệu units từ API

  const dispatch = useDispatch();
  const isValidSession = useSelector(selectIsValidSession);
  const needsTokenRefresh = useSelector(selectNeedsTokenRefresh);
  const storedRefreshToken = useSelector(selectRefreshToken);

  // Kiểm tra token hết hạn và refresh nếu cần
  const checkAndRefreshToken = async () => {
    if (!isValidSession && storedRefreshToken) {
      try {
        const response = await https.post("v1/users/refresh-token", {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (accessToken) {
          jwt.setAccessToken(accessToken, true); // Skip expiry update khi refresh token
          if (newRefreshToken) jwt.setRefreshToken(newRefreshToken);

          // Cập nhật token mới vào store
          dispatch(
            refreshToken({
              token: accessToken,
              refreshToken: newRefreshToken || storedRefreshToken,
            })
          );

          // Cập nhật claims từ token mới
          dispatch(setClaims(jwt.saveClaims(accessToken)));

          // KHÔNG set lại expiry khi refresh token, giữ nguyên thời gian gốc
          // const expiryDate = new Date();
          // expiryDate.setDate(expiryDate.getDate() + 1);
          // dispatch(setTokenExpiry(expiryDate.getTime()));

          return true;
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // Xóa token hết hạn và yêu cầu đăng nhập lại
        dispatch(logout());
        return false;
      }
    }

    return isValidSession;
  };

  // Kiểm tra token sắp hết hạn để refresh trước
  const checkTokenNearExpiry = async () => {
    if (needsTokenRefresh && storedRefreshToken) {
      try {
        const response = await https.post("v1/users/refresh-token", {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (accessToken) {
          jwt.setAccessToken(accessToken, true); // Skip expiry update khi refresh token
          if (newRefreshToken) jwt.setRefreshToken(newRefreshToken);

          dispatch(
            refreshToken({
              token: accessToken,
              refreshToken: newRefreshToken || storedRefreshToken,
            })
          );

          dispatch(setClaims(jwt.saveClaims(accessToken)));
        }
      } catch (error) {
        console.error("Failed to proactively refresh token:", error);
      }
    }
  };

  const preFetchUserMetadata = async () => {
    if (!userName || !password || token || isLoginInProgress) return; // Thêm check isLoginInProgress
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

      // Lưu refreshToken vào jwt utils
      if (refreshToken) {
        jwt.setRefreshToken(refreshToken);
      }

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
    setIsLoginInProgress(true); // Set flag khi bắt đầu login
    setLoginLoading(true);
    if (!userName || !password) {
      setLoginLoading(false);
      notification.warning({
        message: `Vui lòng nhập tài khoản và mật khẩu`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
      setIsLoginInProgress(false);
      return;
    }

    try {
      // Kiểm tra xem đã có token từ preFetch chưa
      let accessToken = token;
      let newRefreshToken;
      let user;

      // Nếu chưa có token (preFetch chưa chạy hoặc failed), thì mới gọi signin
      if (!accessToken) {
        const response = await https.post("v1/users/signin", {
          hostId: "https://vikosan-cloud.sse.net.vn",
          userName,
          password,
          devideToken: "",
          language: "V",
        });

        accessToken = response.data.accessToken;
        newRefreshToken = response.data.refreshToken;
        user = response.data.user;

        jwt.setAccessToken(accessToken); // Set expiry cho lần đầu login
        jwt.setRefreshToken(newRefreshToken);
        setToken(accessToken);

        // Lưu thông tin user
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        // Nếu đã có token từ preFetch, lấy thông tin từ localStorage
        user = JSON.parse(localStorage.getItem("user") || "{}");
        newRefreshToken = jwt.getRefreshToken();
      }

      // Thiết lập thời gian hết hạn (1 ngày) - CHỈ KHI LOGIN LẦN ĐẦU
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      const tokenExpiry = expiryDate.getTime();

      // Cập nhật redux store
      await dispatch(setClaims(jwt.saveClaims(accessToken)));
      await dispatch(setRefreshToken(newRefreshToken));
      await dispatch(setTokenExpiry(tokenExpiry));

      // Cập nhật auth store
      await dispatch(
        login({
          token: accessToken,
          refreshToken: newRefreshToken,
          user,
        })
      );

      // Chỉ gọi fetchCompanies nếu chưa load units (units chỉ có giá trị mặc định "Không")
      if (!unitsLoaded && units.length === 1 && units[0].value === "") {
        await fetchCompanies(accessToken);
      }

      setLoginLoading(false);
      notification.success({
        message: `Đăng nhập thành công`,
      });

      // Navigate sau khi mọi thứ hoàn tất
      setTimeout(() => router.navigate("/"), 100);
    } catch (error) {
      setLoginLoading(false);
      notification.warning({
        message: `Sai tài khoản hoặc mật khẩu`,
        placement: "topLeft",
        icon: <UilExclamationOctagon size="25" color="#ffba00" />,
      });
    } finally {
      setIsLoginInProgress(false); // Reset flag sau khi hoàn tất
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
      const unitsData = unitsResponse.data?.units || [];
      if (unitsData && unitsData.length > 0) {
        // Lưu toàn bộ dữ liệu units
        setAllUnitsData(unitsData);

        // Lưu unit đầu tiên vào localStorage làm mặc định
        localStorage.setItem("unitsResponse", JSON.stringify(unitsData[0]));

        // Map tất cả units thay vì chỉ lấy unit đầu tiên
        const new_Units = unitsData.map((unit) => ({
          value: unit.unitId,
          label: unit.unitName,
        }));
        setUnits(new_Units);
        setUnitSelected(new_Units[0]); // Chọn unit đầu tiên làm mặc định
        setUnitsLoaded(true);
      } else {
        setUnits([{ value: "", label: "Không" }]);
        setUnitSelected({ value: "", label: "Không" });
        setAllUnitsData([]);
        setUnitsLoaded(false);
      }
    } catch (error) {
      setUnits([{ value: "", label: "Không" }]);
      setUnitSelected({ value: "", label: "Không" });
      setAllUnitsData([]);
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
    if (!unitSelected?.value || !token || isLoginInProgress) {
      // Thêm check isLoginInProgress
      return;
    }

    // Kiểm tra xem đã có stores data cho unit này chưa
    const existingStoresData = localStorage.getItem("storesData");
    if (existingStoresData) {
      try {
        const stores = JSON.parse(existingStoresData);
        // Nếu đã có data và cùng unitId thì không cần gọi lại
        if (stores && stores.unitId === unitSelected.value) {
          return;
        }
      } catch (error) {
        // Continue to fetch if parse error
      }
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
      // Lưu store data vào localStorage hoặc state nếu cần
      localStorage.setItem(
        "storesData",
        JSON.stringify({ ...res, unitId: unitSelected.value })
      );

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
    if (unitSelected?.value && token && !isLoginInProgress) {
      // Thêm check isLoginInProgress
      fetchStoreData();
    }
  }, [unitSelected, token]); // Thêm token vào dependencies

  useEffect(() => {
    setUnits([{ value: "", label: "Không" }]);
    setUnitSelected({ value: "", label: "Không" });
    setToken("");
    setIsLoginInProgress(false); // Reset flag khi thay đổi username
    setUnitsLoaded(false); // Reset units loaded state
    setAllUnitsData([]); // Reset toàn bộ dữ liệu units
  }, [userName]); // Chỉ depend vào userName, không cần JSON.stringify

  useEffect(() => {
    if (jwt.checkExistToken()) {
      // Kiểm tra token hết hạn
      checkAndRefreshToken().then((isValid) => {
        if (isValid) {
          dispatch(setClaims(jwt.saveClaims(jwt.getAccessToken())));
          router.navigate("/");
        }
      });
    }
  }, [dispatch]);

  // Kiểm tra token sắp hết hạn mỗi khi component mount
  useEffect(() => {
    if (jwt.checkExistToken()) {
      checkTokenNearExpiry();
    }
  }, []);

  const debouncedPreFetch = useDebouncedCallback(() => {
    if (userName && password && !token && !isLoginInProgress) {
      preFetchUserMetadata();
    }
  }, 800);

  useEffect(() => {
    if (!isLoginInProgress) {
      debouncedPreFetch();
    }
  }, [userName, password, isLoginInProgress]);

  const handleChangeUnit = (item) => {
    const selectedUnit = units.find((unit) => unit.value == item);
    setUnitSelected(selectedUnit);

    // Tìm dữ liệu đầy đủ của unit được chọn từ allUnitsData
    const fullUnitData = allUnitsData.find((unit) => unit.unitId == item);
    if (fullUnitData) {
      // Cập nhật localStorage với dữ liệu của unit được chọn
      localStorage.setItem("unitsResponse", JSON.stringify(fullUnitData));
    }
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
                value={unitSelected?.value}
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
