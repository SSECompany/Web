import { ArrowLeftOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Checkbox, Input, Select, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setBeds, setPrice, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import './MealDetailsForm.css';

const { TabPane } = Tabs;

const mealData = {
    morning: {
        "Viêm gan man": {
            name: 'Cơm gà hấp',
            description: 'Cơm gà hấp với rau củ tươi.',
            price: 90000,
        },
        "Giảm cân": {
            name: 'Salad trái cây',
            description: 'Salad trái cây tươi ngon.',
            price: 80000,
        },
        "Tiểu đường": {
            name: 'Cơm gà nướng',
            description: 'Cơm gà nướng không dầu.',
            price: 95000,
        },
    },
    afternoon: {
        "Viêm gan man": {
            name: 'Cơm cá hồi',
            description: 'Cơm với cá hồi và rau xanh.',
            price: 120000,
        },
        "Giảm cân": {
            name: 'Gà nướng rau củ',
            description: 'Gà nướng với rau củ tươi.',
            price: 110000,
        },
        "Tiểu đường": {
            name: 'Cơm gà xào nấm',
            description: 'Cơm gà xào nấm và rau củ.',
            price: 100000,
        },
    },
    evening: {
        "Viêm gan man": {
            name: 'Cơm tôm',
            description: 'Cơm tôm với sốt tỏi.',
            price: 130000,
        },
        "Giảm cân": {
            name: 'Súp rau củ',
            description: 'Súp rau củ thanh đạm.',
            price: 70000,
        },
        "Tiểu đường": {
            name: 'Cơm gà luộc',
            description: 'Cơm gà luộc với nước chấm.',
            price: 90000,
        },
    },
};

const MealDetailsForm = ({ roomCode }) => {
    const dispatch = useDispatch();
    const [meals, setMeals] = useState({
        morning: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false }],
        afternoon: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false }],
        evening: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false }],
    });

    useEffect(() => {
        const getBedsByRoomCode = (roomCode) => {
            return ['Bed1', 'Bed2', 'Bed3'];
        };

        const beds = getBedsByRoomCode(roomCode);
        dispatch(setBeds(beds));
    }, [roomCode, dispatch]);

    const handleChange = (timeOfDay, index, e) => {
        const { name, value } = e.target;
        const updatedMeals = { ...meals };
        updatedMeals[timeOfDay][index][name] = value;

        // Kiểm tra lại mealType và giá trị
        if (name === 'mealType') {
            updatedMeals[timeOfDay][index].quantity = 1; // Set quantity to 1 when mealType is selected
            const price = mealData[timeOfDay][value]?.price || 0;
            dispatch(setPrice(price)); // Cập nhật giá khi thay đổi mealType
        }

        setMeals(updatedMeals); // Cập nhật lại state
    };

    const handleModeChange = (timeOfDay, index, value) => {
        const updatedMeals = { ...meals };
        updatedMeals[timeOfDay][index].mode = value;
        updatedMeals[timeOfDay][index].mealType = '';
        updatedMeals[timeOfDay][index].quantity = 0;
        dispatch(setPrice(0));
        setMeals(updatedMeals);
    };

    const handleQuantityChange = (timeOfDay, index, change) => {
        const updatedMeals = { ...meals };
        const newQuantity = Math.max(1, updatedMeals[timeOfDay][index].quantity + change); // Tính số lượng mới
        updatedMeals[timeOfDay][index].quantity = newQuantity;

        // Kiểm tra và lấy giá món ăn
        const mealType = updatedMeals[timeOfDay][index].mealType;
        const price = mealData[timeOfDay][mealType]?.price || 0;

        // Cập nhật lại giá trong Redux store
        dispatch(setPrice(price * newQuantity));

        setMeals(updatedMeals); // Cập nhật lại state với số lượng mới
    };

    const handleAddMeal = (timeOfDay) => {
        const updatedMeals = { ...meals };
        updatedMeals[timeOfDay].push({ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false });
        setMeals(updatedMeals);
    };

    const handleSubmit = () => {
        console.log('Submitted meal details:', meals);
    };

    const handleBackToRoomSelection = () => {
        dispatch(setShowMealDetails(false));
        dispatch(setShowRoomSelection(true));
    };

    const renderMealEntries = (timeOfDay) => (
        meals[timeOfDay].map((meal, index) => (
            <div key={index} className="meal-entry">
                {/* Mode Selection */}
                <div className="mode-selection-group">
                    <label htmlFor={`mode-${index}`} className="mode-label">Chế độ</label>
                    <Select
                        id={`mode-${index}`}
                        name="mode"
                        value={meal.mode}
                        onChange={(value) => handleModeChange(timeOfDay, index, value)}
                        className="mode-dropdown"
                    >
                        <Select.Option value="">Select Chế độ</Select.Option>
                        <Select.Option value="Viêm gan man">Viêm gan man</Select.Option>
                        <Select.Option value="Giảm cân">Giảm cân</Select.Option>
                        <Select.Option value="Tiểu đường">Tiểu đường</Select.Option>
                    </Select>
                </div>

                <div className="meal-selection-group">
                    <div className="meal-type-selection">
                        <Select
                            id={`mealType-${index}`}
                            name="mealType"
                            value={meal.mode ? meal.mealType : ''}
                            onChange={(value) => handleChange(timeOfDay, index, { target: { name: 'mealType', value } })}
                            className="meal-dropdown"
                            disabled={!meal.mode}
                        >
                            <Select.Option value="">Select Món ăn</Select.Option>
                            {meal.mode && Object.keys(mealData[timeOfDay]).map((mode) => (
                                <Select.Option key={mode} value={mode}>
                                    {mealData[timeOfDay][mode].name}
                                </Select.Option>
                            ))}
                        </Select>
                        <div className="meal-description">
                            {meal.mode ? mealData[timeOfDay][meal.mealType]?.description : ''}
                        </div>
                    </div>
                    <div className="quantity-controls">
                        <button onClick={() => handleQuantityChange(timeOfDay, index, -1)} className="quantity-button" disabled={!meal.mode || meal.quantity <= 1}>
                            <MinusOutlined />
                        </button>
                        <span className="quantity-display">{meal.quantity}</span>
                        <button onClick={() => handleQuantityChange(timeOfDay, index, 1)} className="quantity-button" disabled={!meal.mode}>
                            <PlusOutlined />
                        </button>
                    </div>
                </div>

                <div className="price-input-group">
                    <div>
                        <span htmlFor={`collectMoney-${index}`} className="price-label">Bệnh nhân</span>
                        <Checkbox
                            type="checkbox"
                            id={`collectMoney-${index}`}
                            name="collectMoney"
                            checked={meal.collectMoney}
                            onChange={(e) => {
                                const updatedMeals = { ...meals };
                                updatedMeals[timeOfDay][index].collectMoney = e.target.checked;
                                updatedMeals[timeOfDay][index].price = e.target.checked ? 0 : (meal.mode ? mealData[timeOfDay][meal.mealType]?.price || 0 : 0);
                                setMeals(updatedMeals);
                            }}
                            className="price-checkbox"
                            disabled={!meal.mode}
                        />
                    </div>

                    <span className="price-display">{meal.collectMoney ? 0 : (meal.mode ? mealData[timeOfDay][meal.mealType]?.price || 0 : 0)} đ</span>
                </div>

                <div className="notes-input-group">
                    <label htmlFor={`note-${index}`} className="note-label">Ghi chú</label>
                    <Input.TextArea
                        id={`note-${index}`}
                        name="note"
                        value={meal.note}
                        onChange={(e) => handleChange(timeOfDay, index, e)}
                        placeholder="Enter notes"
                        className="note-input"
                        disabled={!meal.mode}
                    />
                </div>
            </div>
        ))
    );

    return (
        <div className="meal-ticket-form">
            <div className="back-button-container">
                <button className="back-button" onClick={handleBackToRoomSelection}>
                    <ArrowLeftOutlined />
                </button>
            </div>
            <h2 className="form-title">Meal Ticket Form</h2>

            <Tabs defaultActiveKey="1">
                <TabPane tab="Sáng" key="1">
                    {renderMealEntries('morning')}
                    <button className="add-row-button" onClick={() => handleAddMeal('morning')} disabled={!meals.morning[0].mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
                <TabPane tab="Chiều" key="2">
                    {renderMealEntries('afternoon')}
                    <button className="add-row-button" onClick={() => handleAddMeal('afternoon')} disabled={!meals.afternoon[0].mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
                <TabPane tab="Tối" key="3">
                    {renderMealEntries('evening')}
                    <button className="add-row-button" onClick={() => handleAddMeal('evening')} disabled={!meals.evening[0].mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
            </Tabs>

            <button className="submit-button" onClick={handleSubmit} disabled={!meals.morning[0].mode && !meals.afternoon[0].mode && !meals.evening[0].mode}>
                Hoàn thành
            </button>
        </div>
    );
};

export default MealDetailsForm;