const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
db_pass = process.env.MONGO_PASS
uri = `mongodb+srv://jtmacoco:${db_pass}@cluster0.t4uwd.mongodb.net/`
async function connectDB() {
    try{
        mongoose.connect(uri)
        console.log("success")
    }
    catch(error){
        console.log(error)
    }
}
app.listen(PORT,() => {console.log(`starting server using port ${PORT}`)})
connectDB()

