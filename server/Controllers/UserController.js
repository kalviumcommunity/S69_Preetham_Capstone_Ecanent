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
export const updateUser = async (req, res) => {
    const {userId} = req.body;
    const {name} = req.body;    

    try {
        if (name) {
            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                { name }, 
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            return res.status(200).json({ success: true, user: updatedUser });
        }

        return res.status(400).json({ success: false, message: "No fields to update" });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const deleteUser = async (req, res) => {
    const { userId } = req.body;

    try {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User deleted successfully", user: deletedUser });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getInstitution = async(req,res)=>{
    try {
        const institute = await Institute.find().select("name -_id");
        const instituteNames = institute.map(inst => inst.name);
        if (instituteNames.length === 0) {
            return res.json({ success: false, message: "No institutes found!" });
        }
        return res.json({
            success:true,
            institute:instituteNames
        })

    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}