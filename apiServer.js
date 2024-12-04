import http from 'http';
import mongoose from 'mongoose';
import apiApp from './api/ApiApp.js';
import dotenv from 'dotenv';

dotenv.config();

const app = apiApp;
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH;
const clientOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    },
};

async function startServer() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(DB_PATH, clientOptions);
        console.log('✅ Successfully connected to MongoDB');

        // Start the HTTP server
        const server = http.createServer(app);
        server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server is running on http://192.168.1.142:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start the server:', error);
        process.exit(1); // Exit process with failure code
    }
}

startServer();
