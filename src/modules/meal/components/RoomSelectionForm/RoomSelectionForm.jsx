import { RightOutlined } from '@ant-design/icons';
import { notification, Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addDataMultiObjectApi, multipleTablePutApi } from '../../../../api';
import { resetAllMeals, setCurrentBedIndex, setListBeds, setListRoom, setMasterData, setMeal, setRoomCode, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import './RoomSelectionForm.css';

const { Option } = Select;

const RoomSelectionForm = () => {
    const dispatch = useDispatch();
    const {
        meals: { masterData = {}, detailData = [] },
        listDepartment = [],
        listRoom = [],
        listBeds = [],
        submittedBeds = [],
        listFood = [],
        listDietCategory = [],
    } = useSelector((state) => state.meals);
    const { userName, unitId, id } = useSelector((state) => state.claimsReducer.userInfo || {});

    const handleBedClick = useCallback((bed, index) => {
        const currentMealEntries = JSON.parse(JSON.stringify(detailData));
        const currentBedMeals = currentMealEntries[masterData.beds?.[0]?.index || 0];

        if (currentBedMeals && Object.keys(currentBedMeals).some(key => currentBedMeals[key]?.some(m => m.mode || m.mealType))) {
            dispatch(setMeal({ mealEntries: currentMealEntries, bedIndex: masterData.beds?.[0]?.index || 0 }));
        }

        dispatch(setMasterData({ beds: [bed] }));
        dispatch(setCurrentBedIndex(index));
        dispatch(setShowMealDetails(true));
        dispatch(setShowRoomSelection(false));
    }, [dispatch, detailData, masterData.beds]);

    const handleRoomChange = useCallback(async (value) => {
        if (masterData.roomCode === value) return;

        dispatch(setListBeds([]));
        dispatch(setRoomCode(value));

        try {
            const response = await addDataMultiObjectApi({
                store: "api_getDepartmentRoomService",
                param: {
                    mabp: masterData.name,
                    maphong: value,
                    searchValue: "",
                    username: userName,
                },
                data: {},
                resultSetNames: ["phong", "giuong", "list3"],
            });

            const bedList = response?.listObject?.dataLists?.list3 || [];
            dispatch(setListBeds(bedList));
        } catch (err) {
            console.error("❌ Error fetching bed data for room:", err);
            dispatch(setListBeds([]));
        }
    }, [dispatch, masterData]);

    const handleDepartmentChange = useCallback(async (value) => {
        if (!userName) {
            console.warn('⚠️ Username chưa load xong, không gọi API.');
            return;
        }

        dispatch(setMasterData({ name: value, roomCode: '', beds: [] }));
        dispatch(setListBeds([]));
        dispatch(setListRoom([]));

        try {
            const response = await addDataMultiObjectApi({
                store: "api_getDepartmentRoomService",
                param: {
                    mabp: value,
                    maphong: "",
                    searchValue: "",
                    username: userName,
                },
                data: {},
                resultSetNames: ["phong", "giuong", "list3"],
            });

            const roomList = response?.listObject?.dataLists?.giuong || [];
            dispatch(setListRoom(roomList));
        } catch (error) {
            console.error("❌ Error fetching room list by department:", error);
            dispatch(setListRoom([]));
        }
    }, [dispatch, userName]);

    useEffect(() => {
        if (masterData.roomCode && Array.isArray(listBeds)) {
            const filteredBeds = listBeds.filter(b => b.ma_phong?.trim() === masterData.roomCode);
            const isSame = _.isEqual(filteredBeds, listBeds);

            if (!isSame) {
                dispatch(setListBeds(filteredBeds));
            }
        }
    }, [masterData.roomCode, listBeds, dispatch]);

    const handleSubmit = useCallback(async () => {
        if (!masterData.name || !masterData.roomCode) {
            console.warn("⚠️ Vui lòng chọn đủ Mã khoa và Mã phòng trước khi gửi.");
            return;
        }

        if (!Array.isArray(detailData) || detailData.length === 0) {
            console.warn("⚠️ Chưa có dữ liệu suất ăn để gửi.");
            return;
        }

        const master = [
            {
                ngay_ct: new Date().toLocaleDateString('vi-VN'),
                ma_khoa: masterData.name,
                ma_phong: masterData.roomCode,
            }
        ];

        const detail = [];

        detailData.forEach((bedMeals, bedIndex) => {
            const bed = listBeds[bedIndex];
            if (!bed) return;

            ['CA1', 'CA2', 'CA3'].forEach((shift) => {
                const meals = bedMeals[shift] || [];
                meals.forEach((meal) => {
                    if (!meal.mealType) return;
                    detail.push({
                        ma_giuong: bed.ma_giuong,
                        ma_ca: shift,
                        ma_che_do: meal.mode || '',
                        ma_mon: meal.mealType,
                        so_luong: meal.quantity,
                        don_gia: meal.price || 0,
                        thanh_tien: meal.totalMoney || 0,
                        benh_nhan_yn: meal.collectMoney ? 1 : 0,
                        ghi_chu: meal.note || '',
                        thu_tien_yn: meal.isPaid ? 1 : 0,
                    });
                });
            });
        });

        const payload = {
            store: "Api_create_register_for_patient_meals",
            param: {
                StoreID: masterData.name,
                unitId: unitId,
                userId: id,
            },
            data: {
                master,
                detail,
            },
        };

        try {
            const response = await multipleTablePutApi(payload);
            if (response?.responseModel?.isSucceded) {
                notification.success({ message: "Đơn hàng đã được gửi thành công!" });
                setTimeout(() => {
                    dispatch(resetAllMeals());
                    dispatch(setShowMealDetails(false));
                    dispatch(setShowRoomSelection(true));
                }, 500);
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            console.error('Lỗi gửi đơn hàng:', error);
        }
    }, [masterData, detailData, listBeds]);

    return (
        <div className="form-container">
            <h2 className="form-title">Đăng ký suất ăn</h2>

            <div className="input-group">
                <label htmlFor="name">Mã Khoa:</label>
                <Select
                    id="name"
                    name="name"
                    value={masterData.name}
                    onChange={handleDepartmentChange}
                    required
                    className="custom-select"
                >
                    <Option value="">Select Mã Khoa</Option>
                    {listDepartment.map((dept) => (
                        <Option key={dept.ma_bp?.trim?.()} value={dept.ma_bp?.trim?.()}>
                            {dept.ten_bp}
                        </Option>
                    ))}
                </Select>
            </div>

            <div className="input-group">
                <label htmlFor="roomCode">Mã Phòng:</label>
                <Select
                    id="roomCode"
                    name="roomCode"
                    value={masterData.roomCode}
                    onChange={handleRoomChange}
                    required
                    className="custom-select"
                >
                    <Option value="">Select Mã Phòng</Option>
                    {listRoom.map((room) => {
                        const maPhong = room?.ma_phong?.trim?.() || "";
                        return (
                            <Option key={maPhong} value={maPhong}>
                                {room?.ten_phong || "Không tên"}
                            </Option>
                        );
                    })}
                </Select>
            </div>

            {Array.isArray(listBeds) && listBeds.length > 0 && (
                <div className="list-items">
                    {listBeds.map((bed, index) => {
                        const isSubmitted = submittedBeds.includes(index);
                        const meals = detailData[index] || {};

                        return (
                            <div key={index}>
                                <div
                                    className="list-item"
                                    onClick={() => handleBedClick(bed, index)}
                                    style={{ backgroundColor: isSubmitted ? '#e6fffb' : 'white' }}
                                >
                                    <span>{bed?.ten_giuong || 'Không rõ tên giường'}</span>
                                    <RightOutlined style={{ fontSize: '18px' }} />
                                </div>

                                {isSubmitted && (
                                    <div className="submitted-item">
                                        {['CA1', 'CA2', 'CA3'].map((mealType) => {
                                            const caMeals = meals[mealType] || [];
                                            const hasMeals = caMeals.some(m => m.mode || m.mealType);

                                            if (!hasMeals) return null;

                                            return (
                                                <div key={mealType} style={{ marginBottom: '16px' }}>
                                                    <p style={{ fontWeight: 'bold' }}>
                                                        {mealType === 'CA1' ? 'Ca Sáng' : mealType === 'CA2' ? 'Ca Trưa' : 'Ca Tối'}
                                                    </p>

                                                    {caMeals.map((m, idx) => {
                                                        const foodName = listFood.find(food => food.ma_mon === m.mealType)?.ten_mon || m.mealType || 'Chưa chọn món';
                                                        const dietName = listDietCategory.find(d => d.ma_nh === m.mode)?.ten_nh || m.mode || 'Chưa chọn chế độ';

                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    marginLeft: '16px',
                                                                    marginBottom: '8px',
                                                                    paddingBottom: '8px',
                                                                    borderBottom: '1px solid #ccc'
                                                                }}
                                                            >
                                                                {m.mode && <p>+ Chế độ: {dietName}</p>}
                                                                {m.mealType && <p>+ Món ăn: {foodName}</p>}
                                                                {m.quantity > 0 && <p>+ Số lượng: {m.quantity}</p>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <button className="submit-button" onClick={handleSubmit}>
                Gửi
            </button>
        </div>
    );
};

export default RoomSelectionForm;