import mongoose from "mongoose";
const fileSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ["pdf", "doc",,"txt", "pptx", "image", "video", "other"], required: true },
  fileName: { type: String,required: true},
  classGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup" },
  receiver: {type: mongoose.Schema.Types.ObjectId,ref: "User"},
  subjectGroup: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectGroup" },
}, { timestamps: true });
export default mongoose.model("File",fileSchema)