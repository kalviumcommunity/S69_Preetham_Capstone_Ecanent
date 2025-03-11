const mongoose = require("mongoose");

const subjectGroupSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  classGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup", required: true },
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("SubjectGroup",subjectGroupSchema)