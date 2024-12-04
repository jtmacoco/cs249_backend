import EndPoint from "./Endpoints.js"
import Api from "./handleApi.js"
async function socketSaveDoc(documentData) {
    try{
        const response = await Api.postMethod(EndPoint.updateDocument, documentData)
        return response
    }catch(error){
        throw error
    }
}
async function socketGetDoc(data){
    try{
        const response = await Api.getMethod(EndPoint.getDocument,data)
        const content = response.data['content']
        const vc = response.data['vc']
        console.log("RESPONE:",vc)
        return {curDoc:content,vc:vc}
    }catch(error){
        throw error
    }
}
export {socketSaveDoc,socketGetDoc}
