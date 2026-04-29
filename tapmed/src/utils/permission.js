import store from "../store";
const checkPermission = (key) =>{
    try {
        const { Permision } = store.getState().claimsReducer.claims;
        
        return Permision.includes(key+',');   
    } catch (error) {
        return false;
    }
}

export default checkPermission;