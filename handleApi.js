import axios from 'axios'
import EndPoint from './Endpoints.js'
class Api{
    static instance = axios.create({
        baseURL:EndPoint.baseUrl,
        timeout:10000,
    })
    static postMethod = async(url,data)=>{
        try{
            const response = await Api.instance.post(url,data)
            return response
        }catch(e){
            console.log("Axios error details:", e)
            if (e.response) {
            } else if (e.request) {
                console.log("Request error:", e.request)
            } else {
                console.log("Error message:", e.message)
            }
            throw e
        }
    }
    static getMethod = async (url, data) => {
        try {
            const response = await Api.instance.get(url,
                {params: data});
            return response;
        } catch (e) {
            console.log("Axios error details:", e);
            if (e.response) {
                console.log("Response error:", e.response.data);
            } else if (e.request) {
                console.log("Request error:", e.request);
            } else {
                console.log("Error message:", e.message);
            }
            throw e;
        }
    };
}
export default Api