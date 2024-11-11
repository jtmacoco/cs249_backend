require('dotenv').config();
const express = require("express");
const Server = require("socket.io")
const http = require("http")
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
const db_pass = process.env.DB_PASS
const user = process.env.UNAME
const server = http.createServer(app)
const io = Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const uri = `mongodb+srv://${user}:${db_pass}@cluster0.t4uwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
async function connectDB() {
    try{
        await mongoose.connect(uri,clientOptions)
        console.log("success connected to db")
    }
    catch(error){
        console.log(error)
    }
}
io.on('connection',(socket)=>{
    console.log('a user connected')
})
connectDB()
server.listen(PORT,() => {console.log(`starting server using port ${PORT}`)})
