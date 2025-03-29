import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  content: { type: String, required: false  },
  file: {
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    uploadedBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
    },
    createdAt: { type: Date },
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

messageSchema.pre("save", function (next) {
  if (!this.content && !this.file) {
    next(new Error("A message must have either content or a file"));
  }
  next();
});

export default mongoose.model("Message",messageSchema)