require('dotenv').config();
const express = require("express");
const { LRUCache } = require('lru-cache')
const Server = require("socket.io")
const http = require("http")
const mongoose = require("mongoose");
const { default: VectorClock } = require('./algorithms/lamport/lamport');
const { default: CrdtRga } = require('./algorithms/crdt/crdt');
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
            crdt = new CrdtRga("")
            vc.checkInVec(uid)
            cache.set(DocId, { value: crdt.getDoc(), vectorClock: vc,crdt:crdt })
        }
        const docData = cache.get(DocId)
        socket.emit('firstJoin', {docData:docData.value,vectorClock:docData.vectorClock.get_vector()})
    })
    socket.on('documentUpdate', ({ changes, DocId, uid, vc }) => {
        const docData = cache.get(DocId)
        let curDoc = docData.value
        let crdt = docData.crdt
        const curVc = docData.vectorClock;
        start = changes[0].range.startLineNumber
        startLine = changes[0].range.startLineNumber
        startCol = changes[0].range.startColumn
        lines = curDoc.split('\n')
        crdtChanges = crdt.applyChanges(changes)
        curDoc = crdtChanges.curDoc
        changesLog=crdtChanges.changesLog
        range = { startLineNumber: startLine, startColumn: startCol, endLineNumber: startLine, endColumn: startCol + 1 }
        curVc.receive(vc);
        cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt:crdt});
        socket.to(DocId).emit('documentUpdate', {content:changesLog,vectorClock:curVc})

    })
})
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
