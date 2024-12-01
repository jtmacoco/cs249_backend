import express from 'express';
import userController from '../controllers/UserController.js'
import documentController from "../controllers/DocumentController.js";

const apiRouter = express.Router()

apiRouter.route("/user/register").post(userController.register)
apiRouter.route("/user/login").post(userController.login)

// Document routes
apiRouter.get("/document/:username/shared-docs", documentController.getSharedDocs);
apiRouter.post("/document/:username/share-doc", documentController.shareDocument);

export default apiRouter

