import User from "../Models/UserSchema.js";

export const getUser = async(req,res)=>{
    try {
        const {userId} = req.body;
        const user = await User.findById(userId);
        if(!user){
            return res.json({success:false,message:"User not found!"});
        }
        return res.json({
            success:true,
            userData:{
                name:user.name,
                email:user.email,
                role:user.role,
                isVerified:user.isVerified
            }
        })

    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}