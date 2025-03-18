import ClassGroup from "../Models/ClassgroupSchema.js"
import User from "../Models/UserSchema.js";


export const createClass = async(req,res)=>{
    const {className,department,students,faculty,subjects,createdBy} = req.body;
    if(!className||!department||!createdBy){
        return res.status(400).json({success:false,message: "Class name, department, and creator are required" })
    }
    try {
        
        const userExists = await User.findById(createdBy);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "Creator user not found" });
        }
        console.log(userExists)
        
        const existingClass = await ClassGroup.findOne({ className, createdBy });

        if (existingClass) {
            return res.status(400).json({ success: false, message: "Class name already exists. Please use another name." });
        }

        const newClass = new ClassGroup({
             className,
             department,
             students: students || [],
             faculty: faculty   || [],
             subjects: subjects || [],
             createdBy,
        })
        await newClass.save();

        await User.findByIdAndUpdate(
            createdBy, 
            { $push: { classGroups: newClass._id } }, 
            { new: true }
        );
        
        return res.status(201).json({ message: "Class group created successfully", classGroup: newClass });
        
    } catch (error) {
        if (error.code === 11000) {  
            return res.status(400).json({ success: false, message: "Class name already exists. Please use another name." });
        }
        console.log(error.message);
        return res.status(500).json({success:false,message:"Server Error"})
    }
};

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
