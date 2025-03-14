import express from 'express'
import {signup,login,logout,sendVerifyOtp,verifyEmail,isAuthenticated} from "../Controllers/AuthController.js"
import AuthMiddle from '../Middlewares/AuthMiddleware.js';


const AuthRouter = express.Router();
AuthRouter.post("/signup",signup)
AuthRouter.post("/login",login)
AuthRouter.post("/logout",logout)
AuthRouter.post("/send-verify-otp",AuthMiddle,sendVerifyOtp)
AuthRouter.post("/verify-account",AuthMiddle,verifyEmail)
AuthRouter.post("/is-auth",AuthMiddle,isAuthenticated)


export default AuthRouter;
