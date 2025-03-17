import express from 'express'
import { getUser } from '../Controllers/UserController.js'
import AuthMiddle from '../Middlewares/AuthMiddleware.js'

const userRouter = express.Router();
userRouter.get('/profile',AuthMiddle,getUser);
export default userRouter;