import express from "express"
import http from 'http';
import { Server } from "socket.io";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./Config/Passport.js";
import authR from "./Routes/AuthRoutes.js"
import authGoogle from "./Routes/AuthGoogle.js"
import userRouter from "./Routes/UserRoutes.js";
import classRouter from "./Routes/ClassRoutes.js";
import subjectRouter from "./Routes/SubjectRoutes.js";
import singleMessage from "./Controllers/MessageSingle.js";
import groupMessage from "./Controllers/MessageGroup.js";
import connectToDB from "./DB.js"
import cors from "cors"
import 'dotenv/config'
import { group } from "console";
import multer from "multer";
import fileRoutes from "./Routes/fileRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import VisualRouter from "./Controllers/VisualController.js";
const app = express()
const server = http.createServer(app);
connectToDB();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use(cors({ 
    origin: process.env.FRONTEND_URL, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization","Accept", "Cookie"]
}));
app.use(session({
    secret: process.env.SESSION_SECRET || "some_secret",
    resave: false,
    saveUninitialized: false
  }));
  
app.use(passport.initialize());
app.use(passport.session());

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, 
        methods: ["GET", "POST"],
        credentials: true 
    },
    
});
singleMessage(io);
groupMessage(io);


app.use("/api/author",authR)
app.use("/api/user",userRouter)
app.use("/api/class",classRouter)
app.use("/api/subject",subjectRouter)
app.use("/api/visual",VisualRouter)
app.use("/api/files", fileRoutes)


app.use("/api/auth", authGoogle);


app.get('/',(req,res)=>{
    res.send("Server running")
})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });