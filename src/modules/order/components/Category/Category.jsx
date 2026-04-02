import { LeftOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import { setLoading } from "../../../../store/reducers/loadingSlice";
import { setCurrentCategory, setMenuItems } from "../../store/order";
import "./Category.css";

export default function Category({ drinkFilter, setDrinkFilter }) {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.orders.listCategory);
    const selectedCategory = useSelector((state) => state.orders.selectedCategory);
    const { id, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [searchValue, setSearchValue] = useState("");

    const fetchMenuItems = useCallback(async (category, search = "") => {
        dispatch(setLoading(true));
        try {
            const res = await multipleTablePutApi({
                store: "api_getListItem",
                param: {
                    loai_nh: search ? "" : (category?.loai_nh || ""),
                    ma_nh: search ? "" : (category?.ma_nh || ""),
                    Currency: "VND",
                    searchValue: search,
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
            dispatch(setLoading(false));
        }
    }, [dispatch, id, unitId]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value, category) => {
            fetchMenuItems(category, value);
        }, 800),
        [fetchMenuItems]
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        debouncedSearch(value, selectedCategory);
    };

    const handleCategorySelect = async (category) => {
        dispatch(setCurrentCategory(category));
        setSearchValue(""); // Clear search when category changes
        fetchMenuItems(category, "");
    };

    useEffect(() => {
        if (Array.isArray(categories) && categories.length > 0) {
            const firstCategory = categories[0];
            dispatch(setCurrentCategory(firstCategory));
            fetchMenuItems(firstCategory, "");
        }
    }, [categories, dispatch, fetchMenuItems]);

    const updateScrollButtons = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 1);
        }
    }, []);

    useEffect(() => {
        setShowRightArrow(true);
        setTimeout(() => {
            updateScrollButtons();
        }, 100);

        const handleScroll = () => updateScrollButtons();
        const currentScrollRef = scrollRef.current;
        if (currentScrollRef) {
            currentScrollRef.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (currentScrollRef) {
                currentScrollRef.removeEventListener("scroll", handleScroll);
            }
        };
    }, [categories, updateScrollButtons]);


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
            <div className="category-header">
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
                <div className="category-search">
                    <Input
                        placeholder="Tìm món ăn..."
                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                        value={searchValue}
                        onChange={handleSearchChange}
                        allowClear
                        className="search-input"
                    />
                </div>
            </div>
            {!searchValue && (
                <div className="category-container">
                    {showLeftArrow && (
                        <button className="scroll-btn left" onClick={scrollLeft}>
                            <LeftOutlined />
                        </button>
                    )}

                    <div className="categories" ref={scrollRef}>
                        {Array.isArray(categories) && categories.length > 0 &&
                            categories.map((category) => (
                                <button
                                    key={category.ma_nh}
                                    className={`category ${category.ma_nh === selectedCategory?.ma_nh ? "active" : ""}`}
                                    onClick={() => handleCategorySelect(category)}
                                >
                                    {category.ten_nh}
                                </button>
                            ))
                        }
                    </div>

                    {showRightArrow && (
                        <button className="scroll-btn right" onClick={scrollRight}>
                            <RightOutlined />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}