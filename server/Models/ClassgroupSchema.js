const mongoose = require("mongoose");

const classgroupSchema = new mongoose.Schema({
  className: { type: String, required: true }, 
  department: { type: String, required: true }, 
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubjectGroup" }], 
}, { timestamps: true });

module.exports = mongoose.model("ClassGroup", classgroupSchema);
