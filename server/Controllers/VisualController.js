import express from "express";
import multer from "multer";
import cloudinary from "../Config/cloudinary.js";
import User from "../Models/UserSchema.js";
import AuthMiddle from "../Middlewares/AuthMiddleware.js";

const VisualRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(file.originalname.toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, 
});

VisualRouter.put(
    "/update-profile-pic",
    AuthMiddle,
    upload.single("profilePic"), 
    async (req, res) => {
        try {
            if (!req.file) {
                console.log("No file uploaded. Request body:", req.body); 
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }

            const { userId } = req.body;
            console.log("User ID from req.body:", userId); 
            console.log("req.user from middleware:", req.user); 

            const base64Image = req.file.buffer.toString("base64");
            const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

            const result = await cloudinary.uploader.upload(dataUri, {
                folder: "profile_pics", 
                resource_type: "image",
            });

            console.log("Cloudinary URL:", result.secure_url); 

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: result.secure_url },
                { new: true }
            );

            console.log("Updated user:", updatedUser); 

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            res.status(200).json({
                success: true,
                message: "Profile picture updated successfully",
                user: updatedUser,
            });
        } catch (error) {
            console.error("Error uploading profile picture to Cloudinary:", error);
            res.status(500).json({ success: false, message: "Failed to update profile picture" });
        }
    }
);

export default VisualRouter;