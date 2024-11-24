require('dotenv').config();
const express = require("express");
const { LRUCache } = require('lru-cache')
const Server = require("socket.io")
const http = require("http")
const mongoose = require("mongoose");
const { default: VectorClock } = require('./algorithms/lamport/lamport');
const { copyFileSync } = require('fs');
const { emit } = require('process');
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
            cache.set(DocId, { value: "", vectorClock: vc })
        }
        const docData = cache.get(DocId)
        socket.emit('firstJoin', {docData:docData.value,vectorClock:docData.vectorClock.get_vector()})
    })
    socket.on('documentUpdate', ({ changes, DocId, uid, vc }) => {
        const docData = cache.get(DocId);
        let curDoc = docData.value;
        start = changes[0].range.startLineNumber
        updates = ""
        startLine = changes[0].range.startLineNumber
        startCol = changes[0].range.startColumn
        lines = curDoc.split('\n')
        let changesLog = []
        for (let { range, text, type } of changes) {
            const { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec } = range
            if (type === 'insert') {//inserting on multiple lines
                if (text === '\n') {
                    const lineBefore = lines[sln - 1].slice(0, sc - 1) 
                    const lineAfter = lines[sln - 1].slice(sc - 1)    
                    lines.splice(sln - 1, 1, lineBefore, lineAfter)
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec + 1 },
                        text: '\n'
                    })
                }
                else {//inserting on same line
                    lines[sln - 1] = lines[sln - 1].slice(0, sc - 1) + text + lines[sln - 1].slice(ec)
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec + 1 },
                        text: text
                    });
                }
            }
            else {
                if (sc === 1 && sln > 1) {//removing a line
                    const curLine = lines[sln - 1]
                    const prevLine = lines[sln - 2]
                    lines[sln - 2] = prevLine + curLine
                    lines.splice(sln - 1, 1)
                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln , endColumn: ec },
                        text: '\n' 
                    });

                }
                else {//deleting on same line
                    const deletedText = lines[sln - 1].slice(sc - 1, ec - 1);
                    lines[sln - 1] = lines[sln - 1].slice(0, sc - 1) + lines[sln - 1].slice(ec - 1);

                    // Log the deletion
                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: deletedText
                    });
                }
            }
        }
        curDoc = lines.join('\n')
        range = { startLineNumber: startLine, startColumn: startCol, endLineNumber: startLine, endColumn: startCol + 1 }
        const curVc = docData.vectorClock;
        curVc.receive(vc);
        cache.set(DocId, { value: curDoc, vectorClock: curVc });
        socket.to(DocId).emit('documentUpdate', {content:changesLog,vectorClock:curVc})

    })
})
connectDB()
server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
