import express from 'express';
import userController from '../controllers/UserController.js'
const apiRouter = express.Router()
apiRouter.route("/user/register").post(userController.register)
apiRouter.route("/user/login").post(userController.login)
export default apiRouter

