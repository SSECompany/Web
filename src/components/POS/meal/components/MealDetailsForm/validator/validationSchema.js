import * as Yup from 'yup';

export const mealSchema = Yup.object().shape({
    mealType: Yup.string().required('Vui lòng chọn món ăn'),
});