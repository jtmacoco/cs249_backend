class EndPoint {
    static baseUrl = "http://3.130.25.213/api/";
    static updateDocument= '/document/update-document'
     static getDocument = '/document/get-document'
    static getFullUrl(endpoint) {
      return `${this.baseUrl}${endpoint}`;
    }
  }
  export default EndPoint;
  