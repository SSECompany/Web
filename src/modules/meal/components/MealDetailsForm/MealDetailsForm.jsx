import { ArrowLeftOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Checkbox, Input, Select, Tabs } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markBedAsSubmitted, setMeal, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import './MealDetailsForm.css';

const { TabPane } = Tabs;

const mealData = {
    caSang: {
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
    caTrua: {
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
    caToi: {
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

const MealDetailsForm = () => {
    const dispatch = useDispatch();
    const masterData = useSelector((state) => state.meals.meals.masterData || {});
    const meals = useSelector((state) => state.meals.meals.detailData || []);
    const currentBedIndex = useSelector((state) => state.meals.currentBedIndex);
    const submittedBeds = useSelector((state) => state.meals.submittedBeds || []);

    const defaultMealEntry = [{ mode: '', mealType: '', quantity: 1, note: '', collectMoney: false, totalMoney: 0 }];
    const [mealEntries, setMealEntries] = useState({
        caSang: meals[currentBedIndex]?.caSang?.length ? meals[currentBedIndex].caSang : defaultMealEntry,
        caTrua: meals[currentBedIndex]?.caTrua?.length ? meals[currentBedIndex].caTrua : defaultMealEntry,
        caToi: meals[currentBedIndex]?.caToi?.length ? meals[currentBedIndex].caToi : defaultMealEntry,
    });

    const updateMealEntriesInRedux = (updatedMeals) => {
        dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));
    };

    const handleChange = (timeOfDay, index, e) => {
        const { name, value } = e.target;

        setMealEntries((prev) => {
            const updatedMeals = { ...prev };

            if (!updatedMeals[timeOfDay]) {
                updatedMeals[timeOfDay] = [];
            }

            const updatedMeal = { ...updatedMeals[timeOfDay][index] };

            updatedMeal[name] = value;

            if (name === 'mealType') {
                updatedMeal.quantity = 1;
                updatedMeal.mealType = mealData[timeOfDay][updatedMeal.mode]?.name || value;
                const price = mealData[timeOfDay][value]?.price || 0;
                updatedMeal.price = price; // Set price
                updatedMeal.totalMoney = price * updatedMeal.quantity || 0;
            }

            updatedMeals[timeOfDay][index] = updatedMeal;

            updateMealEntriesInRedux(updatedMeals);

            return updatedMeals;
        });
    };

    const handleQuantityChange = (timeOfDay, index, change) => {
        setMealEntries((prev) => {
            const updatedMeals = { ...prev };
            const updatedMealEntries = [...updatedMeals[timeOfDay]];

            const meal = updatedMealEntries[index];
            const newQuantity = Math.max(1, meal.quantity + change); // Ensure quantity doesn't go below 1
            const price = mealData[timeOfDay] && mealData[timeOfDay][meal.mode]
                ? mealData[timeOfDay][meal.mode].price
                : 0;

            // Recalculate totalMoney
            updatedMealEntries[index] = {
                ...meal,
                quantity: newQuantity,
                price,
                totalMoney: meal.collectMoney ? 0 : price * newQuantity || 0,
            };

            updatedMeals[timeOfDay] = updatedMealEntries;

            updateMealEntriesInRedux(updatedMeals); // Update Redux
            console.log("🚀 ~ setMealEntries ~ totalMoney:", updatedMealEntries)

            return updatedMeals;
        });
    };

    const handleAddMeal = (timeOfDay) => {
        setMealEntries((prev) => {
            const updatedMeals = {
                ...prev,
                [timeOfDay]: [
                    ...(prev[timeOfDay] || []),
                    { mode: '', mealType: '', quantity: 1, note: '', collectMoney: false, totalMoney: 0 }
                ],
            };

            updateMealEntriesInRedux(updatedMeals);

            return updatedMeals;
        });
    };

    const handleCollectMoneyChange = (timeOfDay, index, e) => {
        setMealEntries((prev) => {
            const updatedMeals = { ...prev };
            const updatedTimeOfDayMeals = [...updatedMeals[timeOfDay]];
            const updatedMeal = { ...updatedTimeOfDayMeals[index] };

            updatedMeal.collectMoney = e.target.checked;

            const price = mealData[timeOfDay] && mealData[timeOfDay][updatedMeal.mode]
                ? mealData[timeOfDay][updatedMeal.mode].price
                : 0;

            updatedMeal.totalMoney = e.target.checked
                ? 0
                : price * updatedMeal.quantity || 0;

            updatedTimeOfDayMeals[index] = updatedMeal;
            updatedMeals[timeOfDay] = updatedTimeOfDayMeals;

            updateMealEntriesInRedux(updatedMeals); // Cập nhật Redux

            return updatedMeals;
        });
    };

    const handleModeChange = (timeOfDay, index, value) => {
        setMealEntries((prev) => {
            const updatedMeals = { ...prev };  // Sao chép mealEntries
            if (!updatedMeals[timeOfDay]) {
                updatedMeals[timeOfDay] = [];
            }

            // Tạo bản sao của mảng `updatedMeals[timeOfDay]`
            const updatedTimeOfDayMeals = [...updatedMeals[timeOfDay]];

            // Tạo một bản sao của meal tại index
            updatedTimeOfDayMeals[index] = {
                mode: value,
                mealType: '', // Đặt lại mealType khi thay đổi chế độ
                quantity: 0,
                note: '',
                price: 0,
                collectMoney: false
            };

            // Cập nhật lại mảng `timeOfDay` trong state
            updatedMeals[timeOfDay] = updatedTimeOfDayMeals;

            updateMealEntriesInRedux(updatedMeals);  // Cập nhật Redux

            return updatedMeals;
        });
    };

    const handleSubmit = () => {
        console.log('Submitted meal details:', mealEntries);
        dispatch(markBedAsSubmitted(currentBedIndex)); // Dispatch to mark bed as submitted
        dispatch(setShowMealDetails(false));
        dispatch(setShowRoomSelection(true));
    };

    const handleBackToRoomSelection = () => {
        dispatch(setShowMealDetails(false));
        dispatch(setShowRoomSelection(true));
    };

    const renderMealEntries = (timeOfDay) => {
        return mealEntries[timeOfDay].map((meal, index) => {
            return (
                <div key={index} className="meal-entry">
                    <div className="mode-selection-group">
                        <label htmlFor={`mode-${timeOfDay}-${index}`} className="mode-label">Chế độ</label>
                        <Select
                            id={`mode-${timeOfDay}-${index}`}
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
                                id={`mealType-${timeOfDay}-${index}`}
                                name="mealType"
                                value={meal.mealType || ''}
                                onChange={(value) => {
                                    console.log('MealType changed:', value);
                                    handleChange(timeOfDay, index, { target: { name: 'mealType', value } });
                                }}
                                className="meal-dropdown"
                                disabled={!meal.mode}
                            >
                                <Select.Option value="">Select Món ăn</Select.Option>
                                {meal.mode && Object.keys(mealData[timeOfDay]).map((key) => {
                                    if (key === meal.mode) {
                                        return (
                                            <Select.Option key={key} value={key}>
                                                {mealData[timeOfDay][key].name}
                                            </Select.Option>
                                        );
                                    }
                                    return null;
                                })}
                            </Select>
                            <div className="meal-description">
                                {meal.mode && meal.mealType ? mealData[timeOfDay][meal.mealType]?.description : ''}
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
                            <span htmlFor={`collectMoney-${timeOfDay}-${index}`} className="price-label">Bệnh nhân</span>
                            <Checkbox
                                id={`collectMoney-${timeOfDay}-${index}`}
                                name="collectMoney"
                                checked={meal.collectMoney || false}
                                onChange={(e) => handleCollectMoneyChange(timeOfDay, index, e)}
                                className="price-checkbox"
                                disabled={!meal.mode}
                            />
                        </div>

                        <span className="price-display">
                            {meal.collectMoney
                                ? 0
                                : meal.totalMoney || 0
                            } đ
                        </span>
                    </div>

                    <div className="notes-input-group">
                        <label htmlFor={`note-${timeOfDay}-${index}`} className="note-label">Ghi chú</label>
                        <Input.TextArea
                            id={`note-${timeOfDay}-${index}`}
                            name="note"
                            value={meal.note || ''}
                            onChange={(e) => handleChange(timeOfDay, index, e)}
                            placeholder="Enter notes"
                            className="note-input"
                            disabled={!meal.mode}
                        />
                    </div>
                </div>
            );
        });
    };

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
                    {renderMealEntries('caSang')}
                    <button className="add-row-button" onClick={() => handleAddMeal('caSang')} disabled={!mealEntries.caSang[0]?.mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
                <TabPane tab="Chiều" key="2">
                    {renderMealEntries('caTrua')}
                    <button className="add-row-button" onClick={() => handleAddMeal('caTrua')} disabled={!mealEntries.caTrua[0]?.mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
                <TabPane tab="Tối" key="3">
                    {renderMealEntries('caToi')}
                    <button className="add-row-button" onClick={() => handleAddMeal('caToi')} disabled={!mealEntries.caToi[0]?.mode}>
                        <PlusOutlined />
                    </button>
                </TabPane>
            </Tabs>

            <button className="submit-button" onClick={handleSubmit} disabled={!mealEntries.caSang[0]?.mode && !mealEntries.caTrua[0]?.mode && !mealEntries.caToi[0]?.mode}>
                Hoàn thành
            </button>
        </div>
    );
};

export default MealDetailsForm;