import express from "express"
import authR from "./Routes/AuthRoutes.js"
import 'dotenv/config'
const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use("/api/auth",authR)

app.get('/',(req,res)=>{
    res.send("Server running")
})

app.listen(PORT,()=>{
    console.log("Listening")
})