import mongoose from "mongoose";
const subjectGroupSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  classGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup", required: true },
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", },
  chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat", default:null }], 
    files: [{
        url: { type: String, required: true }, 
        name: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

export default mongoose.model("SubjectGroup",subjectGroupSchema)