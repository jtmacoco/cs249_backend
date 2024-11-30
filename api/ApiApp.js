import express from 'express';
import multer  from 'multer'
import cors from 'cors'; 
import apiRouter from './routes/index.js';
const apiApp = express();
const upload = multer()

// Enable CORS for all routes (you can specify options if needed)
apiApp.use(cors());

// Body parsers
apiApp.use(express.json({ extended: false, limit: '50mb' })); // Handle JSONs, also handles flooding
apiApp.use(express.urlencoded({ extended: false, limit: '50mb', parameterLimit: 5000 })); // Handle URL encoding and flooding
apiApp.use(upload.array())//handle file uploads

apiApp.get("/", (req, res) => {
  return res.send("test");
});
apiApp.use('/api', apiRouter);
export default apiApp;
