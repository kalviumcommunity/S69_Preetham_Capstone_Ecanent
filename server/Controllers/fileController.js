import File from "../Models/FileSchema.js";
import cloudinary from "../Config/cloudinary.js";
import ClassGroup from "../Models/ClassgroupSchema.js";
import SubjectGroup from "../Models/Subjectgroup.js";
import User from "../Models/UserSchema.js";

export const uploadFile = async (req, res) => {
  const { userId, classGroup, subjectGroup, chatType, receiverId } = req.body;
  console.log("User ID:", userId);
  console.log("Chat Type:", chatType);
  console.log("Class Group:", classGroup);
  console.log("Subject Group:", subjectGroup);
  console.log("Receiver ID:", receiverId);

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    // Permission checks
    if (chatType === "group" && classGroup) {
      const classGroupDoc = await ClassGroup.findById(classGroup);
      if (!classGroupDoc) {
        return res.status(404).json({ success: false, message: "Class group not found" });
      }
      const isStudent = classGroupDoc.students.some((s) => s._id.toString() === userId);
      const isFaculty = classGroupDoc.faculty.some((f) => f._id.toString() === userId);
      const isAdmin = classGroupDoc.createdBy.toString() === userId;
      if (!isStudent && !isFaculty && !isAdmin) {
        return res.status(403).json({ success: false, message: "You are not a participant in this class group" });
      }
    } else if (chatType === "subject" && subjectGroup) {
      const subjectGroupDoc = await SubjectGroup.findById(subjectGroup);
      if (!subjectGroupDoc) {
        return res.status(404).json({ success: false, message: "Subject group not found" });
      }
      const classGroupDoc = await ClassGroup.findById(subjectGroupDoc.classGroup);
      const isStudent = subjectGroupDoc.students.some((s) => s._id.toString() === userId);
      const isFaculty = subjectGroupDoc.faculty.some((f) => f._id.toString() === userId);
      const isAdmin = classGroupDoc.createdBy.toString() === userId;
      if (!isStudent && !isFaculty && !isAdmin) {
        return res.status(403).json({ success: false, message: "You are not a participant in this subject group" });
      }
    } else if (chatType === "single" && !receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID is required for single chats" });
    }

    // Convert the file buffer to a base64 string for Cloudinary upload
    const base64File = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64File}`;

    // Determine the resource type for Cloudinary
    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let resourceType = "auto";
    let fileType;
    if (ext === "pdf") {
      fileType = "pdf";
      resourceType = "raw";
    } else if (ext === "doc" || ext === "docx") {
      fileType = "doc";
      resourceType = "raw";
    } else if (ext === "pptx") {
      fileType = "pptx";
      resourceType = "raw";
    } else if (ext === "txt") {
      fileType = "txt";
      resourceType = "raw";
    } else if (["jpg", "jpeg", "png"].includes(ext)) {
      fileType = "image";
      resourceType = "image";
    } else if (["mp4", "mov"].includes(ext)) {
      fileType = "video";
      resourceType = "video";
    } else {
      fileType = "other";
      resourceType = "raw";
    }

    console.log(`Uploading file: ${req.file.originalname}, fileType: ${fileType}, resourceType: ${resourceType}`);

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `chat_files/${chatType}`,
      resource_type: resourceType,
    });

    // Calculate the file size in KB
    const fileSizeInBytes = req.file.size;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(0);

    // Create a new File document
    const newFile = new File({
      uploadedBy: userId,
      fileUrl: result.secure_url,
      fileType: fileType,
      fileName: req.file.originalname,
      fileSize: fileSizeInKB, // Add fileSize to the File document
      classGroup: chatType === "group" ? classGroup : undefined,
      subjectGroup: chatType === "subject" ? subjectGroup : undefined,
      receiver: chatType === "single" ? receiverId : undefined,
    });

    await newFile.save();

    // Fetch the user details to include in the response
    const user = await User.findById(userId).select("_id name");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prepare the response with the same structure as the File document, but with a nested uploadedBy
    const fileData = {
      ...newFile.toObject(), // Convert Mongoose document to plain object
      uploadedBy: {
        _id: user._id,
        name: user.name,
      },
    };

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      file: fileData,
    });
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getFiles = async (req, res) => {
    const { classGroup, subjectGroup, chatType, receiverId } = req.query;
    const {userId} = req.body;

    try {
        let query = { fileName: { $exists: true, $ne: null } };
        if (chatType === "group" && classGroup) {
            query.classGroup = classGroup;
        } else if (chatType === "subject" && subjectGroup) {
            query.subjectGroup = subjectGroup;
        } else if (chatType === "single" && receiverId) {
            query = {
                ...query,
                $or: [
                    { uploadedBy: userId, receiver: receiverId },
                    { uploadedBy: receiverId, receiver: userId },
                ],
            };
        }

        const files = await File.find(query).populate("uploadedBy", "name");
        return res.status(200).json({ success: true, files });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};