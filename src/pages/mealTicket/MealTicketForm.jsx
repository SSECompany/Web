import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MealDetailsForm from '../../modules/meal/components/MealDetailsForm/MealDetailsForm';
import RoomSelectionForm from '../../modules/meal/components/RoomSelectionForm/RoomSelectionForm';
import { setBeds, setMealDetails, setShowFormDetails, setShowRoomSelection } from '../../modules/meal/store/meal';
import './MealTicketForm.css';

const MealTicketForm = () => {
    const dispatch = useDispatch();
    const mealDetails = useSelector((state) => state.meals.mealDetails);
    const showFormDetails = useSelector((state) => state.meals.showFormDetails);
    const showRoomSelection = useSelector((state) => state.meals.showRoomSelection);

    const handleChange = (e) => {
        const { name, value } = e.target;
        dispatch(setMealDetails({ [name]: value }));
        if (name === 'roomCode') {
            getBedsByRoomCode(value);
        }
    };

    const handleBedClick = (bed) => {
        dispatch(setMealDetails({ bed }));
        dispatch(setShowFormDetails(true)); 
        dispatch(setShowRoomSelection(false)); 
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(mealDetails);
    };

    const getBedsByRoomCode = (roomCode) => {
        const beds = []; 
        dispatch(setBeds(Array.isArray(beds) ? beds : []));
    };

    return (
        <div>
            {showRoomSelection && !showFormDetails ? (
                <RoomSelectionForm
                    mealDetails={mealDetails}
                    handleChange={handleChange}
                    setBeds={getBedsByRoomCode} 
                    onBedClick={handleBedClick} 
                />
            ) : (
                <MealDetailsForm
                    mealDetails={mealDetails}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    setShowMealDetails={(value) => dispatch(setShowFormDetails(value))}
                />
            )}
        </div>
    );
};

export default MealTicketForm;