import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import User from "../Models/UserSchema.js"
import OTP from "../Models/OtpSchema.js"
import transporter from "../Config/NodeMailer.js"

export const signup = async(req,res)=>{
    const {name,email,password,role,institute} = req.body;
    if(!name||!email||!password||!role){
        return res.status(400).json({success:false,message:"Missing Details"})
    }
    try{
        const emailLower = email.toLowerCase();
        const existinguser = await User.findOne({email:emailLower});
        if(existinguser){
            return res.status(409).json({success:false,message:"User already exists"})
        }
        if (role !== "Admin" && (!institute || institute.trim() === "")) {
            return res.status(400).json({ success: false, message: "Institute is required for Students and Faculty" });
        }

        const hashedpassword = await bcrypt.hash(password,12);

        const user = new User({name,email:emailLower,password:hashedpassword,role,institute: role === "Admin" ? null : institute});
        await user.save();

        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge: 7*24*60*60*1000
        })

        const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:'Welcome to Ecanent',
            text:`Welcome, your email ID is ${email}`
        }

        await transporter.sendMail(mailOptions)

        return res.status(201).json({success:true})

    }catch(error){
        console.log(error.message)
        return res.json({success:false,message:"Internal Server Error"})
    }

}

export const login = async(req,res)=>{
    const {email,password} = req.body;
    if(!email||!password){
        return res.status(400).json({success:false,message:"Email and Password are required!"})
    }
    try{
        const emailLower = email.toLowerCase();
        const user = await User.findOne({email:emailLower})
        if(!user){
            return res.status(400).json({success:false,message:"Invalid Email and Password"})
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({success:false,message:"Invalid Email and Password"})
        }
        console.log("🔍 User at Login:", user);
        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        console.log("Generated Token ID:", user._id)
        res.cookie('token',token,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge: 7*24*60*60*1000
        })

        return res.status(200).json({success:true});
    }catch(error){
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const logout = async(req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production'? 'none':'strict',
        })
        localStorage.removeItem("activeSection");
        return res.json({success:true,message:"User Logged Out"})
    }catch(error){
        return res.json({success:false,message:"Internal Server Error"})
    }
}

export const sendVerifyOtp = async(req,res)=>{
    try{
        const {userId} = req.body;
        const user = await User.findById(userId)
        // console.log(user)
        // console.log(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if(user.isVerified){
            return res.status(400).json({success:false,message:"Account already verified"})
        }
        const otp = String(Math.floor(100000 + Math.random()*900000));
        let otpEntry = await OTP.findOne({ user: userId });
        if(!otpEntry){
            otpEntry = new OTP({user:userId});
        }
        console.log(otpEntry)
        otpEntry.otp = otp;
        otpEntry.expiresAt = Date.now() + 60*60*1000

        await user.save();
        await otpEntry.save();
        const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Account Verification OTP',
            text:`Your Verification Code is ${otp}. Verify your account using this OTP.`
        } 
        await transporter.sendMail(mailOptions);
        res.status(200).json({success:true,message:"Verification OTP sent on Email."})
    }catch(error){
        console.log(error.message)
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
}


export const verifyEmail = async(req,res)=>{
    const {userId,otp} = req.body
    // console.log(otp)
    if(!userId||!otp){
        return res.json({success:false,message:"Missing Details"})
    }
    try{
        const user = await User.findById(userId);
        // console.log(user)
        const otpEntry = await OTP.findOne({ user: userId });
        // console.log(otp)

        if(!user || !otpEntry){
            return res.status(404).json({success:false,message:"User not found"})
        }
        if(otpEntry.otp===""|| otpEntry.otp !== otp){
            return res.status(404).json({success:false,message:"Invalid OTP"})
        }
        if(otpEntry.expiresAt<Date.now()){
            return res.status(400).json({success:false,message:"OTP Expired"})
        }
        user.isVerified = true;
       
        await user.save();
        await OTP.deleteOne({ _id: otpEntry._id });
        return res.status(200).json({success:true,message:'Email Verified Successfully'})
    }catch(error){
        console.log(error.message)
        return res.json({success:false,message:"Internal Server Error"})
    }
}

export const isAuthenticated = async(req,res)=>{
    try {
        return res.json({success:true});
    } catch (error) {
        console.log(error.message);
        return res.json({success:false});
    }
}

export const sendResetOtp = async(req,res)=>{
    const {email} = req.body;
        if(!email){
            return res.json({success:false,message:"Email is required."})
        }
    try {
        const user = await User.findOne({email});
        if(!user){
            return res.json({success:false,message:"User not found!"});
        }
        const userId = user._id;
        const otp = String(Math.floor(100000 + Math.random()*900000));
        let otpEntry = await OTP.findOne({ user: userId });
        if(!otpEntry){
            otpEntry = new OTP({user:userId});
        }
        console.log(otpEntry)
        otpEntry.otp = otp;
        otpEntry.expiresAt = Date.now() + 10*60*1000

        await user.save();
        await otpEntry.save();
        const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Password Reset OTP',
            text:`Your OTP for resetting your passord is ${otp}. Use this OTP to proceed with resetting your password.`
        } 
        await transporter.sendMail(mailOptions);
        res.json({success:true,message:"Forgot Password OTP sent on Email."})

        
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}

export const resetPassword = async(req,res)=>{
    const {email,otp,newpassword} = req.body;
    if(!email||!otp||!newpassword){
        return res.json({success:false,message:"Email, OTP and New Password are required."})
    }
    try {
        const user = await User.findOne({email});
        if(!user){
            return res.json({success:false,message:"User not found!"});
        }
        const userId = user._id;
        const otpEntry = await OTP.findOne({ user: userId });
        // console.log(otp)

        if(!otpEntry){
            return res.json({success:false,message:"OTP missing"})
        }
        if(otpEntry.otp===""|| otpEntry.otp !== otp){
            return res.json({success:false,message:"Invalid OTP"})
        }
        if(otpEntry.expiresAt<Date.now()){
            return res.json({success:false,message:"OTP Expired"})
        }
        const hashedpassword = await bcrypt.hash(newpassword,12);
        user.password = hashedpassword;
        await user.save();
        await OTP.deleteOne({ _id: otpEntry._id });
        return res.json({success:true,message:'Password has been reset Successfully.'})
        
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}