require('dotenv').config();
const express = require("express");
const Server = require("socket.io")
const http = require("http")
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const db_pass = process.env.DB_PASS

const user = process.env.UNAME
const peers = (process.env.PEER_NODES || "").split(",").filter(peer => peer.trim() !== ""); //Get node ips from system variable

const server = http.createServer(app)
const io = Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const uri = `mongodb+srv://${user}:${db_pass}@cluster0.t4uwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

let documentContent = ""
let documentVersion = 0

async function connectDB() {
    try {
        await mongoose.connect(uri, clientOptions)
        console.log("success connected to db")
    }
    catch (error) {
        console.log(error)
    }
}

// Initialize document content from MongoDB
async function initializeDocumentContent() {
    try {
        const doc = await Document.findOne({});
        if (doc) {
            documentContent = doc.content;
        }
    } catch (error) {
        console.error("Error initializing document content:", error);
    }
}

// Save document content to MongoDB
async function saveDocumentContent(content) {
    try {
        await Document.findOneAndUpdate({}, { content }, { upsert: true });
        console.log("Document content saved to MongoDB");
    } catch (error) {
        console.error("Error saving document content:", error);
    }
}

// Gossip protocol implementation
function gossipToPeers(update) {
    peers.forEach(peer => {
        axios.post(`${peer}/gossip`, update)
            .then(() => console.log(`Gossiped update to ${peer}`))
            .catch(error => console.error(`Failed to gossip to ${peer}:`, error));
    });
}

// Endpoint to receive gossip updates
app.post('/gossip', async (req, res) => {
    const { content, version } = req.body;

    if (version > documentVersion) {
        documentContent = content;
        documentVersion = version;

        // Update all connected clients
        io.emit('documentUpdate', { content: documentContent, version: documentVersion });

        // Save to MongoDB
        await saveDocumentContent(documentContent);
    }

    res.sendStatus(200);
});

io.on('connection', (socket) => {
    socket.emit('documentUpdate', documentContent);

    socket.on('documentUpdate', async (content) => {
        documentVersion ++;
        documentContent = content

        socket.broadcast.emit('documentUpdate', { content: documentContent, version: documentVersion });
        gossipToPeers({ content: documentContent, version: documentVersion });

        await saveDocumentContent(documentContent);
    })

})

connectDB();
initializeDocumentContent();

server.listen(PORT, () => { console.log(`starting server using port ${PORT}`) })
