import 'dotenv/config'; 
import express from 'express';
import { LRUCache } from 'lru-cache';
import { Server } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';
import VectorClock from './algorithms/vectorClock/vectorClock.js';
import CrdtRga from './algorithms/crdt/crdt.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const options = { max: 10, allowStale: false }
const cache = new LRUCache(options)
io.on('connection', (socket) => {
    socket.on('joinDocument', ({ DocId, uid }) => {
        socket.join(DocId)
        if (!cache.get(DocId)) {//change this to grab from mongodb later
            const vc = new VectorClock(DocId)
            const crdt = new CrdtRga("", DocId)
            vc.checkInVec(uid)
            const curTime= Math.floor(Date.now() / 1000);
            cache.set(DocId, { value: crdt.getDoc(), vectorClock: vc, crdt: crdt,recentTime:curTime })
        }
        const docData = cache.get(DocId)
        socket.emit('firstJoin', { docData: docData.value, vectorClock: docData.vectorClock.get_vector() })
    })
    socket.on('documentUpdate', ({ changes, DocId, uid, vc, curTime }) => {
        const docData = cache.get(DocId)
        let curDoc =docData.value
        let curChanges = changes
        let crdt = docData.crdt
        let curVc = docData.vectorClock;
        let recentTime = docData.recentTime
        const {isConcurrent,conflictingNodes} = curVc.isConcurrent(vc,DocId)
        const interval = Number(curTime) - Number(recentTime);
        if (isConcurrent||interval<=1)
        {
            const conflictData = {
                changes: changes,
                conflictVc: vc,
                conflictingNodes:conflictingNodes,
                uid:uid,
            };
            const mChanges = crdt.merge(conflictData);
            curDoc = mChanges.curDoc
            const changesLog = mChanges.changesLog
            const conflict = mChanges.conflict
            curVc=mChanges.vc
            const curTime= Math.floor(Date.now() / 1000);
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt,recentTime:curTime });
            if(conflict){
                io.to(DocId).emit('documentUpdate', { content: mChanges.mergedLine, vectorClock: curVc.get_vector(), conflict:conflict})
            }
            else{
                socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector(), conflict:conflict})
            }
        }
        else {
            const crdtChanges = crdt.applyChanges(changes, vc)
            curDoc = crdtChanges.curDoc
            const changesLog = crdtChanges.changesLog
            curVc.receive(vc);
            const curTime= Math.floor(Date.now() / 1000);
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt,recentTime:curTime });
            socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector(),conflict:false })
        }

    })
})
console.log("SockeServer")

server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })