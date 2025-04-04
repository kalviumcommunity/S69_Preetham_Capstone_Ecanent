import express from "express"
import authR from "./Routes/AuthRoutes.js"
import cors from 'cors'
import cookieParser from "cookie-parser";
import authGoogle from "./Routes/Authgoogle.js";
import session from "express-session";
import passport from "passport";
import userRouter from "./Routes/UserRoutes.js";
import classRouter from "./Routes/ClassRoutes.js";
import subjectRouter from "./Routes/SubjectRoutes.js";
import "./Config/Passport.js";
import 'dotenv/config'
import connectToDB from "./DB.js"
import VisualRouter from "./Controllers/VisualController.js";
const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cors({ 
    origin: "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(cookieParser())
app.use("/api/author",authR)
app.use("/api/user",userRouter)
app.use("/api/class",classRouter)
app.use("/api/subject",subjectRouter)
app.use("/api/visual",VisualRouter)

app.use(session({
    secret: process.env.SESSION_SECRET || "some_secret",
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authGoogle);
app.get('/',(req,res)=>{
    res.send("Server running")
})

app.listen(PORT,()=>{
    console.log("Listening")
    connectToDB();

})