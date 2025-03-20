import mongoose from "mongoose";
import subjectGroupSchema from "../Models/Subjectgroup.js"
import ChatSchema from "../Models/ChatSchema.js"


const classgroupSchema = new mongoose.Schema({
  className: { type: String, required: true }, 
  department: { type: String, required: true }, 
      // Reference
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubjectGroup" }], 
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
}, { timestamps: true });

classgroupSchema.index({ className: 1, createdBy: 1 }, { unique: true });


export default mongoose.model("ClassGroup",classgroupSchema)  