import { RightOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBeds, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import MealDetailsForm from '../MealDetailsForm/MealDetailsForm';
import './RoomSelectionForm.css';

const { Option } = Select;

const RoomSelectionForm = ({ mealDetails, handleChange, roomOptions }) => {
    const dispatch = useDispatch();
    const { showMealDetails } = useSelector(state => state.meals);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [mealItems, setMealItems] = useState([{ mode: '', note: '' }]);

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
        if (mealDetails.name) {
            filterRoomsByDepartment(mealDetails.name);
        }
    }, [mealDetails.name]);

    const handleBedClick = (bed) => {
        dispatch(setBeds([bed]));
        dispatch(setShowMealDetails(true));
        dispatch(setShowRoomSelection(false));
    };

    const handleRoomChange = (value) => {
        const selectedRoom = availableRooms.find(room => room.id === value);
        handleChange({ target: { name: 'roomCode', value } });
        if (selectedRoom) {
            const beds = getBedsByRoomCode(selectedRoom.id);
            dispatch(setBeds(beds));
        } else {
            dispatch(setBeds([]));
        }
    };

    const handleBackToRoomSelection = () => {
        dispatch(setShowMealDetails(false));
        dispatch(setShowRoomSelection(true));
    };

    return (
        <div className="form-container">
            <h2>Meal Ticket Form</h2>
            <div className="input-group">
                <label htmlFor="name">Mã Khoa:</label>
                <Select
                    id="name"
                    name="name"
                    value={mealDetails.name}
                    onChange={value => handleChange({ target: { name: 'name', value } })}
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
                    value={mealDetails.roomCode}
                    onChange={handleRoomChange}
                    required
                    disabled={!mealDetails.name}
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

            {mealDetails.roomCode && mealDetails.roomCode !== '' && Array.isArray(mealDetails.beds) && mealDetails.beds.length > 0 && (
                <div className="list-items">
                    {mealDetails.beds.map((bed, index) => (
                        <div
                            key={index}
                            className="list-item"
                            onClick={() => handleBedClick(bed)}
                        >
                            <span>{bed}</span>
                            <RightOutlined style={{ fontSize: '18px' }} />
                        </div>
                    ))}
                </div>
            )}

            {showMealDetails && (
                <MealDetailsForm
                    mealDetails={mealDetails}
                    handleChange={handleChange}
                    handleSubmit={() => { }}
                    setShowMealDetails={dispatch(setShowMealDetails)}
                    handleBackToRoomSelection={handleBackToRoomSelection}
                />
            )}
        </div>
    );
};

export default RoomSelectionForm;