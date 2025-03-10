import SubjectGroup from "../Models/SubjectgroupSchema"

export const createSubject = async(req,res)=>{
    const {subjectName,classGroup,faculty,managedBy,students} = req.body;
    if(!subjectName || !managedBy || !classGroup){
        return res.json({success:false,message:"Missing Details"})
    }
    try{
        const subjectGroup = new SubjectGroup({subjectName,classGroup,faculty:faculty||[],students:students||[],managedBy})
        await subjectGroup.save();
        res.json({success:true});
    }catch(error){
        return res.json({success:false,message:error.message});
    }
}