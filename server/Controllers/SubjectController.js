import SubjectGroup from "../Models/Subjectgroup.js"
import ClassGroup from "../Models/ClassgroupSchema.js"



export const getAllSubjects = async(req,res)=>{
    const { classGroupId } = req.params; 
    if(!classGroupId){
        return res.status(400).json({ success: false, message: "classGroupId is required" });
    }
    try {
        const subjects = await SubjectGroup.find({ classGroup: classGroupId })
        .populate("students","name email")
        .populate("faculty","name email")
        .populate("chat")
        .exec();

        if (!subjects || subjects.length === 0) {
            return res.status(404).json({ success: false, message: "No subjects found for this class group." });
        }

        return res.status(200).json({ success: true, subjects });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });
    }
}

export const getSubjectsById = async(req,res)=>{
    const {subjectId} = req.params;
    if(!subjectId){
        return res.status(400).json({ success: false, message: "SubjectGroup Id is required" });
    }
    try {
        const subject = await SubjectGroup.findById(subjectId)
        .populate("students","name email")
        .populate("faculty","name email")
        .populate({
            path: "chat",
            populate: {
                path: "messages", 
                populate: { path: "sender", select: "name email" }
            }
        })
        .exec();

        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject group not found" });
        }
        return res.status(200).json({ success: true, subject });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });
    }
}
