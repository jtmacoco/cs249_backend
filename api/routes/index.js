import express from 'express';
import userController from '../controllers/UserController.js'
import documentController from "../controllers/DocumentController.js";

const apiRouter = express.Router()

apiRouter.route("/user/register").post(userController.register)
apiRouter.route("/user/login").post(userController.login)

// Document routes
apiRouter.route("/document/shared-docs").post(documentController.getSharedDocs)
apiRouter.route("/document/share-doc").post(documentController.shareDocument)
apiRouter.route("/document/my-doc").post(documentController.getMyDocs)
apiRouter.route("/document/create-document").post(documentController.createNewDocument)
apiRouter.route("/document/get-document").post(documentController.getDocument)

export default apiRouter

