import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import User from "../Models/UserSchema.js"

export const signup = async(req,res)=>{
    const {name,email,password} = req.body;
    if(!name||!email||!password){
        return res.json({success:false,message:"Missing Details"})
    }
    try{
        const emailLower = email.toLowerCase();
        const existinguser = await User.findOne({email:emailLower});
        if(existinguser){
            return res.status(409).json({success:false,message:"User already exists"})
        }

        const hashedpassword = await bcrypt.hash(password,12);

        const user = new User({name,email:emailLower,password:hashedpassword});
        await user.save();

        const token = jwt.sign({id: user.id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production'? 'none':'strict',
            maxAge: 7*24*60*60*1000
        })

        return res.status(201).json({success:true})

    }catch(error){
        console.log(error.message)
        return res.json({success:false,message:"Internal Server Error"})
    }

}

export const login = async(req,res)=>{
    const {email,password} = req.body;
    if(!email||!password){
        return res.json({success:false,message:"Email and Password are required!"})
    }
    try{
        const emailLower = email.toLowerCase();
        const user = await User.findOne({email:emailLower})
        if(!user){
            return res.json({success:false,message:"Invalid Email"})
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.json({success:false,message:"Invalid Password"})
        }
        const token = jwt.sign({id: user.id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production'? 'none':'strict',
            maxAge: 7*24*60*60*1000
        })

        return res.json({success:true});
    }catch(error){
        return res.json({success:false,message:"Internal Server Error"})
    }
}

export const logout = async(req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production'? 'none':'strict',
        })
        return res.json({success:true,message:"User Logged Out"})
    }catch(error){
        return res.json({success:false,message:"Internal Server Error"})
    }
}