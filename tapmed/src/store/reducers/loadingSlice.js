import { createSlice} from "@reduxjs/toolkit";

const loading = createSlice({
    name:'loading',
    initialState:{
        loading:false
    },
    reducers:{
        setLoading(state,action){
            state.loading = action.payload
        }
    }
});

const loadingReducer = loading.reducer
export default loadingReducer
export const {setLoading} = loading.actions;