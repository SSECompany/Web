import dayjs from "dayjs";
import React from "react";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { ApiWebLookup, SoFuckingUltimateGetApi2 } from "../../API";

const GridImageList = () => {
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
    <div className="images_list">
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
  );
};

export default GridImageList;
