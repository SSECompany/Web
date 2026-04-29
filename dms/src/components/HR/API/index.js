import https from "../../../utils/https";

export const ApiGetTimekeepingSchedule = async (params) =>{
    return await https.post(`hr/GetSchedule`,params).then((res)=>{
        return res.data
    })
}