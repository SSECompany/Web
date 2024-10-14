import  datavn from 'assets/lang/vn.json'
const getTextValue = (lang,key) =>{
    try {
        const chars = key.split('.');
        var re = datavn ;
        chars.map((d)=>{
            re =re[d];
        })
        return re;   
    } catch (error) {
        return '';
    }
}

export default getTextValue;