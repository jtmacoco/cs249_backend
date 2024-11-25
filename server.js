import 'dotenv/config'; // dotenv is automatically executed
import express from 'express';
import { LRUCache } from 'lru-cache';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import VectorClock from './algorithms/lamport/lamport.js';
import CrdtRga from './algorithms/crdt/crdt.js';

const app = express();
const PORT = process.env.PORT || 3000;
const db_pass = process.env.DB_PASS;
const user = process.env.UNAME;
const server = http.createServer(app);

const io = new Server(server, {
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
        if (!cache.get(DocId)) {//change this to grab from mongodb later
            const vc = new VectorClock(DocId)
            const crdt = new CrdtRga("",DocId)
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
        if(curVc.isConcurrent(vc))
        {
            console.log("yes it works I think lol")
            const conflictData = {
                changes: changes, 
                conflictVc: vc    
            };
            crdt.merge(conflictData);
        }
        const start = changes[0].range.startLineNumber
        const startLine = changes[0].range.startLineNumber
        const startCol = changes[0].range.startColumn
        const lines = curDoc.split('\n')
        const crdtChanges = crdt.applyChanges(changes,vc)
        curDoc = crdtChanges.curDoc
        const changesLog=crdtChanges.changesLog
        const range = { startLineNumber: startLine, startColumn: startCol, endLineNumber: startLine, endColumn: startCol + 1 }
        curVc.receive(vc);
        cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt:crdt});
        socket.to(DocId).emit('documentUpdate', {content:changesLog,vectorClock:curVc})

    })
})
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
