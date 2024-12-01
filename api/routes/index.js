import express from 'express';
import userController from '../controllers/UserController.js'
import documentController from "../controllers/DocumentController.js";

const apiRouter = express.Router()

apiRouter.route("/user/register").post(userController.register)
apiRouter.route("/user/login").post(userController.login)

// Document routes
apiRouter.route("/document/shared-docs").post(documentController.getSharedDocs)
apiRouter.route("/document/share-doc").post(documentController.shareDocument)

export default apiRouter

