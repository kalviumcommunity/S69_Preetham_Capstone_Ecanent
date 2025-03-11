import express from 'express'
import {signup,login,logout} from "../Controllers/AuthController.js"

const AuthRouter = express.Router();
AuthRouter.post("/signup",signup)
AuthRouter.post("/login",login)
AuthRouter.post("/logout",logout)

export default AuthRouter;
