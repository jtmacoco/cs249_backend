class EndPoint {
    static baseUrl = "http://192.168.1.142:8000/api/";

    //static baseUrl = "http://localhost:8000/api/";
    static updateDocument= '/document/update-document'
     static getDocument = '/document/get-document'
    static getFullUrl(endpoint) {
      return `${this.baseUrl}${endpoint}`;
    }
  }
  export default EndPoint;
  