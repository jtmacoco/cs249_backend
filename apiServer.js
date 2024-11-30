import http from 'http';
import mongoose from 'mongoose';
import apiApp from './api/ApiApp.js'
import dotenv from 'dotenv';
dotenv.config();
const app = apiApp
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH
const db_pass = process.env.DB_PASS;
const server = http.createServer(app);
const uri = DB_PATH
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
async function connectDB() {
    try {
        await mongoose.connect(uri, clientOptions)
        console.log("success connected to db")
    }
    catch (error) {
        console.log(error)
    }
}
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })