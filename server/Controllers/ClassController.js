import ClassGroup from "../Models/ClassgroupSchema.js"
import User from "../Models/UserSchema.js";


export const createClass = async (req, res) => {
    const { className, students, faculty, subjects, createdBy } = req.body;

    console.log("Request Body:", req.body);
    console.log("CreatedBy ID:", createdBy);

    if (!className || !createdBy) {
        return res.status(400).json({ success: false, message: "Class name and creator are required" });
    }

    try {
        const userExists = await User.findById(createdBy);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "Creator user not found" });
        }

        const existingClass = await ClassGroup.findOne({ className, createdBy });
        if (existingClass) {
            return res.status(400).json({ success: false, message: "Class name already exists. Please use another name." });
        }

        // Create the Chat document
        const users = [...new Set([createdBy, ...students, ...faculty])];
        const chat = new Chat({
            isGroupChat: true,
            name: className,
            users,
            groupAdmin: createdBy,
            latestMessage: null,
        });
        await chat.save();

        // Create the ClassGroup and link the Chat
        const newClass = new ClassGroup({
            className,
            students: students || [],
            faculty: faculty || [],
            subjects: subjects || [],
            createdBy,
            chat: chat._id, // Link the Chat document
        });
        await newClass.save();

        await User.findByIdAndUpdate(
            createdBy,
            { $push: { classGroups: newClass._id } },
            { new: true }
        );

        return res.status(201).json({ success: true, message: "Class group created successfully", classGroup: newClass });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Class name already exists. Please use another name." });
        }
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const getAllClass = async (req, res) => {
    const { userId } = req.body;

    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const classes = await ClassGroup.find({
            $or: [
                { createdBy: userObjectId },
                { students: userObjectId },
                { faculty: userObjectId }
            ]
        })
        .populate([
            { path: "students", select: "name email" },
            { path: "faculty", select: "name email" },
            { path: "subjects", select: "name" },
            { path: "createdBy", select: "name email" },
            { 
                path: "chat", 
                select: "name users groupAdmin _id",
                match: { isGroupChat: true }, // Ensure it's a group chat
                populate: [
                    { path: "users", select: "name email" },
                    { path: "groupAdmin", select: "name email" },
                ]
            }
        ]);

        // Filter out classes where `chat` is null (i.e., classes without group chats)
        

        return res.status(200).json({
            success: true,
            classes: classes
        });

    } catch (error) {
        console.error("Error in getAllClass:", error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
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
export const updateClass = async(req,res)=>{
    const { id } = req.params;
    const {className, studentsToAdd, studentsToRemove, facultyToAdd, facultyToRemove, subjects } = req.body;
    try {
        const updateFields = {};

        if (className) {
            updateFields.className = className;
        }
       

        if (studentsToAdd && studentsToAdd.length>0) {
            updateFields.$addToSet = { students: { $each: studentsToAdd } };
        }
        if (facultyToAdd && facultyToAdd.length>0) {
            updateFields.$addToSet = updateFields.$addToSet || {};
            updateFields.$addToSet.faculty = { $each: facultyToAdd };
        }

        if (studentsToRemove && studentsToRemove.length>0) {
            updateFields.$pull = { students: { $in: studentsToRemove } };
        }
        if (facultyToRemove && facultyToRemove.length>0) {
            updateFields.$pull = updateFields.$pull || {};
            updateFields.$pull.faculty = { $in: facultyToRemove };
        }

        const classes = await ClassGroup.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });

        if (!classes) {
            return res.status(404).json({ success: false, message: "Class group not found" });
        }

      
        return res.json({ success:true,message: "Class group updated successfully", classes });
        
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });   
    }
}
export const deleteClass = async(req,res)=>{
    const { id } = req.params;
    try {
        const classes = await ClassGroup.findById(id);
        if(!classes){
            return res.status(404).json({ message: "Class group not found" });
        }
        await classes.deleteOne();
        return res.json({ success:true,message: "Class group deleted successfully" });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success:false,message: "Server Error" });   
    }
}
