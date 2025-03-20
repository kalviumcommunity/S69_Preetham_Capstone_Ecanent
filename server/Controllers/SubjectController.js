import SubjectGroup from "../Models/Subjectgroup.js"
import ClassGroup from "../Models/ClassgroupSchema.js"

export const createSubject = async(req,res)=>{
    const {subjectName,classGroupId,faculty,students,managedBy} = req.body;
    if(!subjectName || !classGroupId){
        return res.status(400).json({ success: false, message: "Subject name and classGroupId are required" });
    }
    try{
        const classes = await ClassGroup.findById(classGroupId);
        if(!classes){
            return res.status(404).json({ success: false, message: "Class group not found" });
        }

        const existingSubject = await SubjectGroup.findOne({ subjectName, classGroupId });
    
        if (existingSubject) {
            return res.status(400).json({ success: false, message: "Subject name already exists. Please use another name." });
        }

        const newSubjectGroup = new SubjectGroup({subjectName,classGroup:classGroupId,faculty:faculty||[],students:students||[],managedBy,chat:null})
        await newSubjectGroup.save();
        return res.status(201).json({ success: true, message: "Subject group created successfully", subjectGroup: newSubjectGroup });    
    }catch(error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

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

export const updateSubject = async(req,res)=>{
    const {subjectId} = req.params;
    const {subjectName, addStudents, removeStudents, addFaculty, removeFaculty} = req.body;
    if(!subjectId){
        return res.status(400).json({ success: false, message: "SubjectGroup Id is required" });
    }
    try {
        const updateFields = {};
       
       
        if(subjectName){
            updateFields.subjectName = subjectName;
        }
        if (addStudents && addStudents.length > 0) {
            updateFields.$addToSet = { students: { $each: addStudents } };
        }
        if (removeStudents && removeStudents.length > 0) {
            updateFields.$pull = { students: { $in: removeStudents } };
        }

        if (addFaculty && addFaculty.length > 0) {
            updateFields.$addToSet = updateFields.$addToSet || {};
            updateFields.$addToSet.faculty = { $each: addFaculty };
        }
        if (removeFaculty && removeFaculty.length > 0) {
            updateFields.$pull = updateFields.$pull || {};
            updateFields.$pull.faculty = { $in: removeFaculty };
        }

        const subject = await SubjectGroup.findByIdAndUpdate(
            subjectId,
            updateFields,
            { new: true, runValidators: true }
        ).populate("students", "name email")
         .populate("faculty", "name email");

        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject group not found" });
        }

        await subject.save();
        return res.status(200).json({ success:true,message: "Subject group updated successfully", subject });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });  
    }
}

