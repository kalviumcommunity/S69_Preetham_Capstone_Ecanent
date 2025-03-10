import bcrypt from "bcryptjs"
import User from "../Models/UserSchema.js"

export const signup = async(req,res)=>{
    const {name,email,password} = req.body;
    if(!name||!email||!password){
        req.json({success:false,message:"Missing Details"})
    }
    try{
        const existinguser = User.findOne({email});
        if(existinguser){
            return res.json({success:false,message:"User already exists"})
        }

        const hashedpassword = await bcrypt.hash(password,12);

        const user = new User({name,email,password:hashedpassword});
        await user.save();

        return res.json({success:true})

    }catch(error){
        return res.json({success:false,message:error.message})
    }

}

export const login = async()=>{
    const {email,password} = req.body;
    if(!email||!password){
        req.json({success:false,message:"Email and Password are required!"})
    }
    try{
        const user = user.findOne({email})
        if(!user){
            return res.json({success:false,message:"Invalid Email"})
        }
        const isMatch = bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.json({success:false,message:"Invalid Password"})
        }
        return res.json({success:true});
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}
