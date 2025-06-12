import mongoose from 'mongoose'

const institutionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Institution", institutionSchema);