import 'dotenv/config'; // dotenv is automatically executed
import express from 'express';
import { LRUCache } from 'lru-cache';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import VectorClock from './algorithms/lamport/lamport.js';
import CrdtRga from './algorithms/crdt/crdt.js';
import { isContext } from 'vm';

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
            const crdt = new CrdtRga("", DocId)
            vc.checkInVec(uid)
            cache.set(DocId, { value: crdt.getDoc(), vectorClock: vc, crdt: crdt })
        }
        const docData = cache.get(DocId)
        socket.emit('firstJoin', { docData: docData.value, vectorClock: docData.vectorClock.get_vector() })
    })
    socket.on('documentUpdate', ({ changes, DocId, uid, vc }) => {
        const docData = cache.get(DocId)
        let curDoc =" "

        let crdt = docData.crdt
        const curVc = docData.vectorClock;
        const {isConcurrent,conflictingNodes} = curVc.isConcurrent(vc,DocId)
        if (isConcurrent)//change later please jonathan remember for god sake
        {
            const conflictData = {
                changes: changes,
                conflictVc: vc,
                conflictingNodes:conflictingNodes,
                uid:uid,
            };
            const mChanges = crdt.merge(conflictData);
            curDoc = mChanges.curDoc
            curVc.event(uid)
            const changesLog = mChanges.changesLog
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt });
            socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector() })
        }
        else {
            const crdtChanges = crdt.applyChanges(changes, vc)
            curDoc = crdtChanges.curDoc
            const changesLog = crdtChanges.changesLog
            curVc.receive(vc);
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt });
            socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector() })
        }

    })
})
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
