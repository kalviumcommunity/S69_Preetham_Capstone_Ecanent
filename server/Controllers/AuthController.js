import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import User from "../Models/UserSchema.js"
import OTP from "../Models/OtpSchema.js"
import transporter from "../Config/NodeMailer.js";


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

export const sendVerifyOtp = async(req,res)=>{
    try{
        const {userId} = req.body;
        const user = await User.findById(userId)
        console.log(user)
        // console.log(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if(user.isVerified === true){
            console.log("verified already!")
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
        const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Email Verified Successfully',
            text:`Your Email has been successfully verified. Please start using our website.`
        } 
        await transporter.sendMail(mailOptions);
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