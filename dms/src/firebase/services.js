import { db } from "./config";
import { collection,addDoc, serverTimestamp } from "firebase/firestore";

export const addNotify = async(collections,data)=>{
   try {
    const docRef = await addDoc(collection(db,collections),{
        name:data.name, 
        value: data.value,
        createAt: serverTimestamp()
    })
    return docRef.id
   } catch (error) {
    return console.log(error)
   }
}