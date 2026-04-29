import { Input, Select } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { getClaims } from "../../../../store/selectors/Selectors";
import { apiGetUnitByUser } from "../../../SystemOptions/API";
import { ApiWebLookup, SoFuckingUltimateGetApi2 } from "../../API";
import ModalDetailImages from "../../Modals/ModalDetailImages/ModalDetailImages";
import {
  setCurrentImageIndex,
  setCurrentImagesList,
} from "../../Store/Sagas/Sagas";
import "./ImagesList.css";

const ImagesList = () => {
  const filterItemStyled = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
  };

  // initialize #########################################################################
  const { state } = useLocation();

  useEffect(() => {
    console.log(state, "Id ở đây");
  }, [state]);

  const moreRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  const userInfo = useSelector(getClaims);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    DateFrom: dayjs().add(-12, "month"),
    DateTo: dayjs(),
    keywords: "",
    unit: "",
    album: "",
    userID: 1,
    admin: 1,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });
  const [totalResults, setTotalResults] = useState(0);
  const [openModalState, setOpenModalState] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({});
  const [isOpenAdvanceFilter, setIsOpenAdvanceFilter] = useState(false);
  const [unitOptions, setUnitOptions] = useState([]);
  const [albumOptions, setAlbumOptions] = useState([]);
  const [isNullData, setIsNullData] = useState(false);

  //functions #########################################################################

  const refreshData = () => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    if (pagination.pageIndex === 1) {
      setLoading(true);
    }
  };
  // const getdata = async () => {
  //   setLoading(true);
  //   await multipleTablePutApi({
  //     store: "Api_Get_Images_Category",
  //     param: {
  //       DateFrom: dayjs().add(-12, "month"),
  //       DateTo: dayjs(),
  //       keywords: "",
  //       unitId,
  //       album: "",
  //       userId,
  //     },
  //     data: {},
  //   }).then((res) => {
  //     console.log(res.data);
  //   });
  // };

  const getdata = async () => {
    setLoading(true);
    await SoFuckingUltimateGetApi2({
      store: "api_get_images",
      data: { ...tableParams, ...pagination },
    }).then((res) => {
      if (res.data.length > 0) {
        setIsNullData(false);
      }

      setLoading(false);
      setData([...data, ...res.data]);
      setCurrentImagesList([...data, ...res.data]);
    });
  };

  const handleShowDetailImage = (item, index) => {
    setOpenModalState(true);
    setCurrentRecord(item);
    setCurrentImageIndex(index);
  };

  const handleFilter = useCallback((item) => {
    console.log(item);
  }, []);

  const handleOpenAdvanceFilter = () => {
    setIsOpenAdvanceFilter(true);
  };

  const getFilterData = () => {
    apiGetUnitByUser({ username: "Admin" }).then((res) => {
      setUnitOptions(
        res.map((item) => {
          return {
            value: item.dvcsCode,
            label: item.name,
          };
        })
      );
    });

    ApiWebLookup({
      userId: "1",
      controller: "dmalbum_lookup",
      pageIndex: 1,
      FilterValueCode: "",
    }).then((res) => {
      const resOptions = res.data.map((item) => {
        return {
          value: item.code.trim(),
          label: item.name.trim(),
        };
      });
      setAlbumOptions(resOptions);
    });
  };

  // effectively #########################################################################
  useEffect(() => {
    if (pagination.pageIndex > 0) {
      getdata();
    }
  }, [JSON.stringify(tableParams), pagination]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!isNullData) {
          setCurrentIndex((old) => {
            return old + 1;
          });
        }
      }
    });
    if (moreRef.current) {
      observer.observe(moreRef.current);
    }
  }, [moreRef]);

  useEffect(() => {
    if (currentIndex > 0) {
      setPagination({ ...pagination, pageIndex: currentIndex });
    }
  }, [currentIndex]);

  useEffect(() => {
    getFilterData();
  }, []);

  return (
    <div
      className="default_list_layout page_default"
      style={{ height: "auto", paddingBottom: "30px" }}
    >
      <div className="split__view__header__bar">
        <div className="split__view__search__bar">
          <div className="flex gap-3 w-full">
            <Input
              style={{
                width: "210px",
                height: "30px",
              }}
              size="middle"
              className="default_input"
              placeholder="Tìm kiếm..."
            />

            <div style={filterItemStyled}>
              <span style={{ whiteSpace: "nowrap" }}>Đơn vị: </span>
              <Select
                allowClear={true}
                className="default_select w-full"
                suffixIcon={false}
                filterOption={false}
                showSearch
                options={unitOptions}
                onChange={(item) => {
                  setIsNullData(true);
                  setPagination({ ...pagination, pageIndex: 1 });
                  setTableParams({ ...tableParams, unit: item ? item : "" });
                  setData([]);
                }}
                placeholder="Chọn đơn vị"
              />
            </div>

            <div style={filterItemStyled}>
              <span style={{ whiteSpace: "nowrap" }}>Albums: </span>
              <Select
                allowClear={true}
                className="default_select w-full"
                suffixIcon={false}
                filterOption={false}
                showSearch
                onChange={(item) => {
                  setIsNullData(true);
                  setPagination({ ...pagination, pageIndex: 1 });
                  setTableParams({ ...tableParams, album: item ? item : "" });
                  setData([]);
                }}
                placeholder="Chọn albums"
                options={albumOptions}
              />
            </div>
          </div>

          {/* <Button
            style={{ borderRadius: "4px", height: "30px" }}
            className="default_button"
            onClick={handleOpenAdvanceFilter}
          >
            <span style={{ fontWeight: "bold" }}>Nâng cao</span>
          </Button> */}
        </div>
      </div>

      <div className="images_list">
        {/* <div className="dashboard__simple__chart__items__container">
          {data.map((item, index) => {
            return (
              <div key={index} className="p-3">
                <Link
                  to={`/images/gallary?month=2024/04`}
                  className="no-underline"
                >
                  <div className="text-center">
                    <FolderOpenTwoTone
                      twoToneColor={"#F58220"}
                      style={{ fontSize: 170, fontWeight: "lighter" }}
                    />
                    <p className="primary_bold_text">Tháng: 4/2024</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div> */}

        {data.map((item, index) => {
          return (
            <div
              key={index}
              className="image__box"
              onClick={(e) => {
                handleShowDetailImage(item, index);
              }}
            >
              <img key={index} src={item.path_l} alt={item.ma_album}></img>
              <div className="image__box_detail">
                <span>
                  Khách hàng: {item.ma_kh} - {item.ten_kh}
                </span>
                <span>Nhân viên: {item.comment}</span>
                <span>
                  Lúc: {dayjs(item.create_date).format("hh:mm")} -{" "}
                  {dayjs(item.create_date).format("DD/MM/YYYY")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={moreRef} style={{ textAlign: "center" }}>
        Loading more...
      </div>

      <ModalDetailImages
        openModalState={openModalState}
        currentRecord={currentRecord}
        handleCloseModal={setOpenModalState}
      />
      {/* <Filter
        isOpenAdvanceFilter={isOpenAdvanceFilter}
        setIsOpenAdvanceFilter={setIsOpenAdvanceFilter}
        onFilter={handleFilter}
      /> */}
    </div>
  );
};

export default ImagesList;
