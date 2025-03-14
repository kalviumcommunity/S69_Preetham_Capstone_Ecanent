import express from "express"
import authR from "./Routes/AuthRoutes.js"
import cors from 'cors'
import cookieParser from "cookie-parser";

import 'dotenv/config'
import connectToDB from "./DB.js"
const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cors({origin: "http://localhost:5173",credentials:true}))
app.use(cookieParser())
app.use("/api/author",authR)

app.get('/',(req,res)=>{
    res.send("Server running")
})

app.listen(PORT,()=>{
    console.log("Listening")
    connectToDB();

})