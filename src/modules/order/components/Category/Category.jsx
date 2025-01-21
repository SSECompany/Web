import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import { setLoading } from "../../../../store/reducers/loadingSlice";
import { setCurrentCategory, setMenuItems } from "../../../../store/reducers/order";
import "./Category.css";

export default function Category() {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.orders.listCategory);
    const selectedCategory = useSelector((state) => state.orders.selectedCategory);

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
                    unitId: "1BVBD",
                    userId: 10036,
                    pageindex: 1,
                    pagesize: 10,
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

    return (
        <div className="main">
            <div className="categories">
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
        </div>
    );
}