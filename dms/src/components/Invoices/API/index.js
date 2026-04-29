import https from "../../../utils/https";

export const ApiGetTourList = async () =>{
    return await https.get(`Job/GetDmTuyen`).then((res)=>{
        return res
    })
}


export const ApiGetTicketList = async () =>{
    return await https.post(`Job/GetTicket`).then((res)=>{
        return res.data
    }).catch((err)=>{return err})
}


