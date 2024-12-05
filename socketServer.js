import 'dotenv/config';
import express from 'express';
import { LRUCache } from 'lru-cache';
import { Server } from 'socket.io';
import http from 'http';
import VectorClock from './algorithms/vectorClock/vectorClock.js';
import CrdtRga from './algorithms/crdt/crdt.js';
import DocumentController from './api/controllers/DocumentController.js';
import DocumentService from './api/services/DocumentService.js';
import Api from './handleApi.js';
import { socketGetDoc, socketSaveDoc } from './socketCtrl.js';



const app = express();
const PORT = process.env.SOCKET_PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    path: "/socket.io/",  
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const options = {
    max: 10, allowStale: false, ttl: 300000,
    updateAgeOnGet: true,
    updateAgeOnHas: true,
    noDisposeOnSet: true,
    allowStale: true,
    disposeAfter: (value, key) => {
        const curDoc = value['value']
        const curVc= value['vectorClock']
        socketSaveDoc({_id:key, content:curDoc, vectorClock:curVc})
    }
}
const cache = new LRUCache(options)
setInterval(() => {
    for (const [key] of cache.entries()) {
        cache.get(key); 
    }
}, 11000); 

setInterval(() => {
    for (const [key, value] of cache.entries()) {
        const curDoc = value['value']
        const curVc = value ['vectorClock']
        socketSaveDoc({_id:key, content:curDoc, VectorClock:curVc})
    }
}, 10000); 
io.on('connection', (socket) => {
    socket.on('joinDocument', async ({ DocId, uid }) => {
        socket.join(DocId)
        if (!cache.get(DocId)) {//change this to grab from mongodb later
            let crdt = null
            const curTime = Math.floor(Date.now() / 1000);
            let {curDoc,vc} = await socketGetDoc({_id:DocId})
            vc = new VectorClock(DocId)
            if(curDoc===undefined){
                curDoc=""
                crdt= new CrdtRga("", DocId)
            }
            else{
                crdt= new CrdtRga(curDoc,DocId)
            }
            vc.checkInVec(uid)
            cache.set(DocId, { value: curDoc, vectorClock: vc, crdt: crdt, recentTime: curTime })
        }
        const docData = cache.get(DocId)
        socket.emit('firstJoin', { docData: docData.value, vectorClock: docData.vectorClock.get_vector() })
    })
    socket.on('documentUpdate', async ({ changes, DocId, uid, vc, curTime }) => {
        let docData = null
        let curVc =  null
        let crdt = null
        let recentTime = null
        let curDoc = null
        if(!cache.get(DocId))
        {
            const result = await socketGetDoc({_id:DocId})
            curDoc=result.curDoc
            curVc = new VectorClock(DocId)//idle for to long basically
            curVc.checkInVec(uid)
            if(curDoc===undefined){//if someone deletes whole doc basically
                curDoc=""
            }
            crdt = new CrdtRga(curDoc, DocId)
            recentTime = Math.floor(Date.now() / 1000);
        }
        else{
            docData = cache.get(DocId)
            curDoc =docData.value
            curVc = docData.vectorClock;
            crdt = docData.crdt
            recentTime = docData.recentTime
        }
        const { isConcurrent, conflictingNodes } = curVc.isConcurrent(vc, DocId)
        const interval = Number(curTime) - Number(recentTime);
        if (isConcurrent || interval < 3 ) {
            const conflictData = {
                changes: changes,
                conflictVc: vc,
                conflictingNodes: conflictingNodes,
                uid: uid,
            };
            const mChanges = crdt.merge(conflictData);
            curDoc = mChanges.curDoc
            const changesLog = mChanges.changesLog
            const conflict = mChanges.conflict
            curVc = mChanges.vc
            const curTime = Math.floor(Date.now() / 1000);
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt, recentTime: curTime });
            if (conflict) {
                io.to(DocId).emit('documentUpdate', { content: mChanges.mergedLine, vectorClock: curVc.get_vector(), conflict: conflict })
            }
            else {
                socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector(), conflict: conflict })
            }
        }
        else {
            const crdtChanges = crdt.applyChanges(changes, vc)
            curDoc = crdtChanges.curDoc
            const changesLog = crdtChanges.changesLog
            curVc.receive(vc);
            const curTime = Math.floor(Date.now() / 1000);
            cache.set(DocId, { value: curDoc, vectorClock: curVc, crdt: crdt, recentTime: curTime });
            socket.to(DocId).emit('documentUpdate', { content: changesLog, vectorClock: curVc.get_vector(), conflict: false })
        }
    })
})

app.post('/socket.io/checkhealth', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        socketConnections: io.engine.clientsCount,
    };
    res.status(200).json(healthStatus);
});

console.log("SockeServer")

server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })