const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ["pdf", "doc", "image", "video", "other"], required: true },
  classGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup" },
  subjectGroup: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectGroup" },
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);
