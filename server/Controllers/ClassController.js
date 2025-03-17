import ClassGroup from "../Models/ClassgroupSchema.js"
import User from "../Models/UserSchema.js";

export const getAllClass = async(req,res)=>{
    try{
        const classes = await ClassGroup.find()
        .populate("students faculty subjects createdBy chat")
        .exec();
        return res.json(classes);
    }catch(error){
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });
    }
};

export const getClassById = async(req,res)=>{
    const {id} = req.params;
    try{
        const classes = await ClassGroup.findById(id)
        .populate("students faculty subjects createdBy chat")
        .exec();

        if(!classes){
            return res.status(404).json({ message: "Class group not found" });
        }
        return res.json(classes);
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });   
    }
    
}
