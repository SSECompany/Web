import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addDataMultiObjectApi, multipleTablePutApi } from "../../api";
import Navbar from '../../components/layout/Navbar/Navbar';
import MealDetailsForm from '../../modules/meal/components/MealDetailsForm/MealDetailsForm';
import RoomSelectionForm from '../../modules/meal/components/RoomSelectionForm/RoomSelectionForm';
import {
    setListBeds,
    setListDepartment,
    setListDietCategory,
    setListFood,
    setListMealCode,
    setListRoom,
    setMasterData,
    setShowMealDetails,
    setShowRoomSelection
} from '../../modules/meal/store/meal';
import jwt from '../../utils/jwt';
import './MealTicketForm.css';

const MealTicketForm = () => {
    const dispatch = useDispatch();
    const mealDetails = useSelector((state) => state.meals.meals.masterData || {});
    const showFormDetails = useSelector((state) => state.meals.showFormDetails);
    const showRoomSelection = useSelector((state) => state.meals.showRoomSelection);
    const listDepartment = useSelector((state) => state.meals.listDepartment || []);
    const listRoom = useSelector((state) => state.meals.listRoom || []);
    const listBeds = useSelector((state) => state.meals.listBeds || []);
    const currentBedList = useSelector((state) => state.meals.listBeds || []);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toLocaleDateString('vi-VN');
    });
    const { userName } = useSelector((state) => state.claimsReducer.userInfo || {});
    const hasFetchedInitialData = useRef(false);

    useEffect(() => {
        if (!userName || hasFetchedInitialData.current) return;

        const fetchData = async () => {
            try {
                const [dietRes, mealCodeRes, foodRes, departmentRes] = await Promise.all([
                    multipleTablePutApi({
                        store: "[api_getListDietCategory]",
                        param: { searchValue: "", pageindex: 1, pagesize: 10 },
                        data: {},
                    }),
                    multipleTablePutApi({
                        store: "[api_getListMealCode]",
                        param: { ma_ca: "", pageindex: 1, pagesize: 10 },
                        data: {},
                    }),
                    multipleTablePutApi({
                        store: "[api_getListFood]",
                        param: {
                            bn_yn: "",
                            ma_ca: "",
                            ma_nh: "",
                            searchValue: "",
                            ngay_an: selectedDate,
                            pageindex: 1,
                            pagesize: 10,
                        },
                        data: {},
                    }),
                    addDataMultiObjectApi({
                        store: "api_getDepartmentRoomService",
                        param: {
                            mabp: "",
                            maphong: "",
                            searchValue: "",
                            username: userName,
                        },
                        data: {},
                        resultSetNames: ["phong", "giuong", "list3"]
                    }),
                ]);

                dispatch(setListDietCategory(dietRes?.listObject?.[0] || []));
                dispatch(setListMealCode(mealCodeRes?.listObject?.[0] || []));
                dispatch(setListFood(foodRes?.listObject?.[0] || []));
                const roomList = departmentRes?.listObject?.dataLists?.giuong || [];
                dispatch(setListDepartment(departmentRes?.listObject?.dataLists?.phong || []));
                if (roomList.length > 0) dispatch(setListRoom(roomList));

                hasFetchedInitialData.current = true;

            } catch (error) {
                console.error("❌ Lỗi khi lấy dữ liệu ăn uống:", error);
            }
        };

        fetchData();
    }, [userName, selectedDate, dispatch]);

    const fetchMealData = useCallback(async (date) => {
        try {
            const mealData = await multipleTablePutApi({
                store: "[api_getListFood]",
                param: {
                    bn_yn: "",
                    ma_ca: "",
                    ma_nh: "",
                    searchValue: "",
                    ngay_an: date,
                    pageindex: 1,
                    pagesize: 10,
                },
                data: {},
            });
            dispatch(setListFood(mealData?.listObject?.[0] || []));
        } catch (error) {
            console.error("Error fetching meals:", error);
        }
    }, [dispatch]);

    const handleDateChange = (dateString) => {
        setSelectedDate(dateString);
        fetchMealData(dateString);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        dispatch(setMasterData({ [name]: value }));
        if (name === 'roomCode') {
            const filteredBeds = listBeds.filter(b => b.ma_phong?.trim() === value);
            dispatch(setListBeds(filteredBeds));
        }
    };

    const handleBedClick = useCallback((bed) => {
        dispatch(setMasterData({ beds: [bed] }));
        dispatch(setShowRoomSelection(false));
    }, [dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    useEffect(() => {
        if (mealDetails.roomCode && Array.isArray(listBeds)) {
            const filteredBeds = listBeds.filter(b => b.ma_phong?.trim() === mealDetails.roomCode);
            const isSame = JSON.stringify(currentBedList) === JSON.stringify(filteredBeds);
            if (!isSame) {
                dispatch(setListBeds(filteredBeds));
            }
        }
    }, [mealDetails.roomCode, listBeds, currentBedList, dispatch]);


    return (

        <div>
            <div>
                {jwt.checkExistToken() && <Navbar />}
            </div>
            {showRoomSelection && !showFormDetails ? (
                <RoomSelectionForm
                    mealDetails={mealDetails}
                    handleChange={handleChange}
                    setBeds={(value) => {
                        const filteredBeds = listBeds.filter(b => b.ma_phong?.trim() === value);
                        dispatch(setListBeds(filteredBeds));
                    }}
                    onBedClick={handleBedClick}
                    listDepartment={listDepartment}
                    listRoom={listRoom}
                />
            ) : (
                <MealDetailsForm
                    mealDetails={mealDetails}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    setShowMealDetails={(value) => dispatch(setShowMealDetails(value))}
                    onDateChange={handleDateChange}
                />
            )}
        </div>
    );
};

export default MealTicketForm;