import express from "express"
import authR from "./Routes/AuthRoutes.js"
const app = express()
app.use(express.json())
app.use("/api/auth",authR)

app.listen((3000,(req,res)=>{
    console.log("Listening")
}))