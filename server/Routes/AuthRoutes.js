import express from 'express'
import {signup,login,logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword} from "../Controllers/AuthController.js"
import AuthMiddle from '../Middlewares/AuthMiddleware.js';

const AuthRouter = express.Router();
AuthRouter.post("/signup",signup)
AuthRouter.post("/login",login)
AuthRouter.post("/logout",logout)
AuthRouter.post("/send-verify-otp",AuthMiddle,sendVerifyOtp)
AuthRouter.post("/verify-account",AuthMiddle,verifyEmail)
AuthRouter.post("/is-auth",AuthMiddle,isAuthenticated)
AuthRouter.post("/send-reset-otp",sendResetOtp)
AuthRouter.post("/reset-password",resetPassword)



export default AuthRouter;
