import ClassGroup from "../Models/ClassgroupSchema"

export const createClass = async(req,res)=>{
    const {className,department,students} = req.body;
    if(!className || !department){
        return res.json({success:false,message:"Missing Details"})
    }
    try{
        const classGroup = new ClassGroup({className,department,students:students||[]})
        await classGroup.save();
        res.json({success:true});
    }catch(error){
        return res.json({success:false,message:error.message});
    }
}