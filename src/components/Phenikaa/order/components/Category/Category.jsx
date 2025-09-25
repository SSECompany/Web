import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../API/phenikaaApi";
import { setCurrentCategory, setMenuItems } from "../../../Store/order";
import "./Category.css";

export default function Category({ drinkFilter, setDrinkFilter }) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.orders.listCategory);
  const selectedCategory = useSelector(
    (state) => state.orders.selectedCategory
  );
  const { id, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const fetchMenuItems = async (category) => {
    dispatch(setLoading(true));
    try {
      const res = await multipleTablePutApi({
        store: "api_getListItem",
        param: {
          loai_nh: category.loai_nh,
          ma_nh: category.ma_nh,
          Currency: "VND",
          searchValue: "",
          unitId: unitId,
          userId: id,
          pageindex: 1,
          pagesize: 1000,
        },
        data: {},
      });
      const data = res?.listObject[0] || [];
      dispatch(setMenuItems(data));
      dispatch(setLoading(false));
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleCategorySelect = async (category) => {
    dispatch(setCurrentCategory(category));
    fetchMenuItems(category);
  };

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      const firstCategory = categories[0];
      dispatch(setCurrentCategory(firstCategory));
      fetchMenuItems(firstCategory);
    }
  }, [categories, dispatch]);

  useEffect(() => {}, [drinkFilter]);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(
        scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 1
      );
    }
  };

  useEffect(() => {
    setShowRightArrow(true);
    setTimeout(() => {
      updateScrollButtons();
    }, 100);

    const handleScroll = () => updateScrollButtons();
    if (scrollRef.current) {
      scrollRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [categories]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="category-filter">
        <button
          className={`category ${drinkFilter === "1" ? "active" : ""}`}
          onClick={() => setDrinkFilter(drinkFilter === "1" ? null : "1")}
        >
          Đồ uống
        </button>
        <button
          className={`category ${drinkFilter === "0" ? "active" : ""}`}
          onClick={() => setDrinkFilter(drinkFilter === "0" ? null : "0")}
        >
          Đồ ăn
        </button>
        <button
          className={`category ${drinkFilter === "" ? "active" : ""}`}
          onClick={() => setDrinkFilter(drinkFilter === "" ? null : "")}
        >
          Tất cả
        </button>
      </div>
      <div className="category-container">
        {showLeftArrow && (
          <button className="scroll-btn left" onClick={scrollLeft}>
            <LeftOutlined />
          </button>
        )}

        <div className="categories" ref={scrollRef}>
          {Array.isArray(categories) &&
            categories.length > 0 &&
            categories.map((category) => (
              <button
                key={category.ma_nh}
                className={`category ${
                  category.ma_nh === selectedCategory?.ma_nh ? "active" : ""
                }`}
                onClick={() => handleCategorySelect(category)}
              >
                {category.ten_nh}
              </button>
            ))}
        </div>

        {showRightArrow && (
          <button className="scroll-btn right" onClick={scrollRight}>
            <RightOutlined />
          </button>
        )}
      </div>
    </>
  );
}
