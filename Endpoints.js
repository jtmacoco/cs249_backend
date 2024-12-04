class EndPoint {
    static baseUrl = "http://localhost:8000/api/";
    static updateDocument= '/document/update-document'
     static getDocument = '/document/get-document'
    static getFullUrl(endpoint) {
      return `${this.baseUrl}${endpoint}`;
    }
  }
  export default EndPoint;
  