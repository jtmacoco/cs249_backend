require('dotenv').config();
const express = require("express");
const { LRUCache } = require('lru-cache')
const Server = require("socket.io")
const http = require("http")
const mongoose = require("mongoose");
const { default: VectorClock } = require('./algorithms/lamport/lamport');
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
const options = { max: 10, allowStale: false }
const cache = new LRUCache(options)
const uri = `mongodb+srv://${user}:${db_pass}@cluster0.t4uwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
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
io.on('connection', (socket) => {
    socket.on('joinDocument', ({ DocId, uid }) => {
        socket.join(DocId)
        if (!cache.get(DocId)) {
            vc = new VectorClock(DocId)
            vc.checkInVec(uid)
            cache.set(DocId, {value:"",vectorClock:vc})
        }
        const docData = cache.get(DocId)
        socket.emit('documentUpdate', docData.value)
    })
    socket.on('documentUpdate', (content) => {
        value = content.value
        DocId = content.DocId
        uid = content.uid
        vc = content.sendVc
        const docData = cache.get(DocId)
        curVc = docData.vectorClock
        curVc.receive(uid,vc)
        cache.set(DocId, {value:value,vectorClock:curVc})
        socket.to(DocId).emit('documentUpdate', value)
    })

})
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
