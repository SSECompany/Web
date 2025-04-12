import { RightOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBeds, setCurrentBedIndex, setListBeds, setMasterData, setRoomCode, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import './RoomSelectionForm.css';

const { Option } = Select;

const RoomSelectionForm = () => {
    const dispatch = useDispatch();
    const masterData = useSelector((state) => state.meals.meals.masterData || {});
    const listBeds = useSelector((state) => state.meals.listBeds || []);
    const submittedBeds = useSelector((state) => state.meals.submittedBeds || []);
    const detailData = useSelector((state) => state.meals.meals.detailData || []);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [isRoomSelectable, setIsRoomSelectable] = useState(false);

    const filterRoomsByDepartment = (departmentCode) => {
        if (departmentCode === 'khoa1') {
            setAvailableRooms([
                { id: 'room1', name: 'Room 1' },
                { id: 'room2', name: 'Room 2' },
            ]);
        } else if (departmentCode === 'khoa2') {
            setAvailableRooms([
                { id: 'room3', name: 'Room 3' },
                { id: 'room4', name: 'Room 4' },
            ]);
        } else {
            setAvailableRooms([]);
        }
    };

    const getBedsByRoomCode = (roomCode) => {
        const bedsByRoom = {
            room1: ['Bed 1A', 'Bed 1B'],
            room2: ['Bed 2A', 'Bed 2B'],
            room3: ['Bed 3A', 'Bed 3B'],
            room4: ['Bed 4A', 'Bed 4B'],
        };
        return bedsByRoom[roomCode] || [];
    };

    useEffect(() => {
        if (masterData.name) {
            filterRoomsByDepartment(masterData.name);
            setIsRoomSelectable(true);
        } else {
            setAvailableRooms([]);
            setIsRoomSelectable(false);
        }
    }, [masterData.name]);

    const handleBedClick = (bed, index) => {
        dispatch(setBeds(bed));
        dispatch(setCurrentBedIndex(index));
        dispatch(setShowMealDetails(true));
        dispatch(setShowRoomSelection(false));
    };

    const handleRoomChange = (value) => {
        const selectedRoom = availableRooms.find(room => room.id === value);
        if (selectedRoom) {
            dispatch(setRoomCode(value));
            const beds = getBedsByRoomCode(value);
            dispatch(setListBeds(beds));
        }
    };

    useEffect(() => {
        if (masterData.roomCode) {
            const beds = getBedsByRoomCode(masterData.roomCode);
            dispatch(setBeds(beds));
        }
    }, [masterData.roomCode, dispatch]);

    const handleSubmit = () => {
        console.log('gửi');
    };

    return (
        <div className="form-container">
            <h2 className='form-title'>
                Đăng ký suất ăn
            </h2>
            <div className="input-group">
                <label htmlFor="name">Mã Khoa:</label>
                <Select
                    id="name"
                    name="name"
                    value={masterData.name}
                    onChange={(value) => {
                        dispatch(setMasterData({ name: value, roomCode: '' }));
                        filterRoomsByDepartment(value);
                        dispatch(setListBeds([]));
                        dispatch(setBeds([]));
                    }}
                    required
                    className="custom-select"
                >
                    <Option value="">Select Mã Khoa</Option>
                    <Option value="khoa1">Khoa 1</Option>
                    <Option value="khoa2">Khoa 2</Option>
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
                    disabled={!isRoomSelectable}
                    className="custom-select"
                >
                    <Option value="">Select Mã Phòng</Option>
                    {availableRooms.map((room) => (
                        <Option key={room.id} value={room.id}>
                            {room.name}
                        </Option>
                    ))}
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
                                >
                                    <span>{bed}</span>
                                    <RightOutlined style={{ fontSize: '18px' }} />
                                </div>
                                {isSubmitted && (
                                    <div className="submitted-item">
                                        {Array.isArray(meals.caSang) && meals.caSang.some(m => m.mealType || m.mode) && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p><strong>Ca Sáng:</strong></p>
                                                {meals.caSang.filter(m => m.mealType || m.mode).map((m, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            marginLeft: '16px',
                                                            marginBottom: '8px',
                                                            paddingBottom: '8px',
                                                            borderBottom: '1px solid #ccc'
                                                        }}
                                                    >
                                                        {m.mode && <p>+ Chế độ: {m.mode}</p>}
                                                        {m.mealType && <p>+ Món ăn: {m.mealType}</p>}
                                                        {m.quantity && <p>+ Số lượng: {m.quantity}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {Array.isArray(meals.caTrua) && meals.caTrua.some(m => m.mealType || m.mode) && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p><strong>Ca Trưa:</strong></p>
                                                {meals.caTrua.filter(m => m.mealType || m.mode).map((m, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            marginLeft: '16px',
                                                            marginBottom: '8px',
                                                            paddingBottom: '8px',
                                                            borderBottom: '1px solid #ccc'
                                                        }}
                                                    >
                                                        {m.mode && <p>+ Chế độ: {m.mode}</p>}
                                                        {m.mealType && <p>+ Món ăn: {m.mealType}</p>}
                                                        {m.quantity && <p>+ Số lượng: {m.quantity}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {Array.isArray(meals.caToi) && meals.caToi.some(m => m.mealType || m.mode) && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p><strong>Ca Tối:</strong></p>
                                                {meals.caToi.filter(m => m.mealType || m.mode).map((m, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            marginLeft: '16px',
                                                            marginBottom: '8px',
                                                            paddingBottom: '8px',
                                                            borderBottom: '1px solid #ccc'
                                                        }}
                                                    >
                                                        {m.mode && <p>+ Chế độ: {m.mode}</p>}
                                                        {m.mealType && <p>+ Món ăn: {m.mealType}</p>}
                                                        {m.quantity && <p>+ Số lượng: {m.quantity}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
        </div >
    );
};

export default RoomSelectionForm;