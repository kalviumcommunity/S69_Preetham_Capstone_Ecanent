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
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                institution:user.institute,
                isVerified:user.isVerified,
                profilePic:user.profilePic
            }
        })

    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}
export const updateInstitution = async(req,res)=>{
    try {
        const {userId,institute} = req.body;
        const user = await User.findById(userId);
        if(!user || !userId){
            return res.json({success:false,message:"User not found!"});
        };
        const updatedUser = await User.findByIdAndUpdate(userId,{institute},{new:true,runValidators: true});

        
        let institutes = await Institute.findOne({name:updatedUser.institute})
        
        if(institutes){
            return res.json({success:false,message:"Institute already exists!"});
        }
        institutes = new Institute({name:updatedUser.institute,createdBy:userId});
        institutes.save();
        return res.status(200).json({
            success: true,
            userData: {
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                institute: updatedUser.institute, 
                isVerified: updatedUser.isVerified,
            },
        });
        }catch(error){
        console.log(error.message)
        res.json({success:false,message:"Internal Server Error"})
    }
}
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
export const getMembers = async (req, res) => {
    try {
        const {userId} = req.body;
        const user  = await User.findById(userId).select("institute")

        if (!user || !user.institute) {
            return res.status(400).json({ success: false, message: "Institute not found for the user!" });
        }

        const members = await User.find({ institute:user.institute })
            .select("name role profilePic _id");

        return res.json({
            success: true,
            members
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
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