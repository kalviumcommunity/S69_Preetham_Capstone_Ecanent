import jwt from "jsonwebtoken";
import 'dotenv/config'
import User from "../Models/UserSchema.js";


const AuthMiddle = async(req,res,next)=>{
    const {token} = req.cookies;
    if(!token){
        return res.json({success:false,message:"Not Authorized, Login Again"})
    }
    try {
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET);
        if(decodedToken.id){
            req.body.userId = decodedToken.id;
            
        }else{
            return res.json({success:false,message:"Not Authorized, Login Again"})
        }

        next();
        
    } catch (error) {
        console.log(error.message)
        return res.json({success:false,message:"Internal Server Error"})
    }
}

export const checkRole = (roles) => {
    return async(req, res, next) => {
        const user = await User.findById(req.body.userId);
        if (!roles.includes(user.role)) {
          return res.status(403).json({ message: "Access Denied" });
        }
        next();
      };
  };


export default AuthMiddle;