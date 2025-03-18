import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    googleId: { type: String },
    institute:{type:String,required:false},
    role:{type:String,enum:['Student',"Faculty","HOD","Admin"], required:true},
    department:String,
    profilePic:String,
    isVerified:{type:Boolean,default:false},
    classGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup" }], 
    subjectGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubjectGroup" }],
    onlineStatus: { type: Boolean, default: false },
},{timestamps:true})

export default mongoose.model("User",userSchema)