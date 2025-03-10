import Chat from "../Models/ChatSchema"
import Message from "../Models/MessageSchema"


export const createChat = async(req,res)=>{
    try{
        const newChat = new Chat({
            isGroupChat:req.body.isGroupChat || false,
            users:req.body.users || [],
            groupAdmin:req.body.groupAdmin || null
        })
        await newChat.save();
        return res.json({success:true,message:"Chat created"});
    }catch(error){
        return res.json({success:false,message:error.message});
    }
    
}


export const createMessage = async(req,res)=>{
    const {sender,chat,content,messageType} = req.body;
    if(!sender || !chat){
        return res.json({success:false,message:"Missing Details"})
    }
    try {
        const newMessage = new Message({
          chat: chat,
          sender: sender,
          content: content,
          messageType: messageType || "text",
        });
    
        const savedMessage = await newMessage.save();
        await Chat.findByIdAndUpdate(req.body.chat, { latestMessage: savedMessage._id });
    
        res.json({success:true,message:savedMessage});
    }
    catch(error){
        return res.json({success:false,message:error.message})
    }
}