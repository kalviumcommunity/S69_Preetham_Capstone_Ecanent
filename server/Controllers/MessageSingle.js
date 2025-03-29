import jwt from "jsonwebtoken";
import cookie from "cookie";
import Chat from "../Models/ChatSchema.js";
import Message from "../Models/MessageSchema.js";
import User from "../Models/UserSchema.js";

const onlineUsers = new Map();

export default function singleMessage(io) {
    io.use(async (socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers.cookie || "");
            const token = cookies.token;
            if (!token) return next(new Error("Not Authorized, Login Again"));

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;
            const user = await User.findById(userId).select("-password");
            if (!user) return next(new Error("User not found"));

            socket.userId = user._id.toString();
            console.log("✅ User Authenticated:", socket.userId);
            next();
        } catch (error) {
            console.log("❌ Socket Auth Error:", error.message);
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log("✅ A user connected:", socket.userId);
        onlineUsers.set(socket.userId, socket.id);

        const sendChatHistory = async () => {
            try {
                const chats = await Chat.find({
                    participants: socket.userId,
                    isGroupChat: false,
                }).populate({
                    path: "messages",
                    populate: { path: "sender", select: "name email" },
                });

                const chatHistory = chats.map((chat) => ({
                    chatId: chat._id.toString(),
                    participants: chat.participants.map((p) => p.toString()),
                    messages: chat.messages.map((msg) => ({
                        senderId: msg.sender._id.toString(),
                        sender: msg.sender.name,
                        receiver: chat.participants.find((p) => p.toString() !== msg.sender._id.toString()).toString(),
                        content: msg.content,
                        timestamp: msg.createdAt,
                    })),
                }));

                socket.emit("chat-history", chatHistory);
                console.log("📜 Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
            } catch (error) {
                console.error("Error sending chat history:", error.message);
                socket.emit("error-message", "Failed to load chat history");
            }
        };

        sendChatHistory();

        socket.on("load-chat", async ({ receiverId }) => {
            try {
                const chat = await Chat.findOne({
                    isGroupChat: false,
                    participants: { $all: [socket.userId, receiverId], $size: 2 },
                }).populate({
                    path: "messages",
                    populate: { path: "sender receiver", select: "name email" },
                });

                const givenMessages = await Message.find({
                    sender: socket.userId,
                    receiver: receiverId,
                }).populate("sender", "name email content");

                console.log(givenMessages)

                const receivedMessages = await Message.find({
                    sender: receiverId,
                    receiver: socket.userId,
                }).populate("sender", "name email");

                const chatMessages = chat ? chat.messages : [];
                const allMessages = [
                    ...chatMessages,
                    ...givenMessages,
                    ...receivedMessages,
                ].map((msg) => ({
                    senderId: msg.sender._id.toString(),
                    sender: msg.sender.name,
                    receiver: (msg.receiver || chat?.participants.find((p) => p.toString() !== msg.sender._id.toString())).toString(),
                    content: msg.content,
                    timestamp: msg.createdAt,
                }));

                const uniqueMessages = Array.from(
                    new Map(allMessages.map((msg) => [`${msg.timestamp}-${msg.content}`, msg])).values()
                );

                socket.emit("chat-messages", { receiverId, messages: uniqueMessages });
                console.log("📜 Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
            } catch (error) {
                console.error("Error loading chat:", error.message);
                socket.emit("error-message", "Failed to load chat");
            }
        });

        socket.on("send-message", async ({ receiver, content }) => {
            const sender = socket.userId;
            console.log("📩 Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

            if (!receiver || !content) {
                return socket.emit("error-message", "Receiver and content are required");
            }

            try {
                const senderId = sender;
                const receiverId = receiver.toString();
                const receiverUser = await User.findById(receiverId);
                if (!receiverUser) {
                    return socket.emit("error-message", "Receiver not found");
                }

                let chat = await Chat.findOne({
                    isGroupChat: false,
                    participants: { $all: [senderId, receiverId], $size: 2 },
                });

                if (!chat) {
                    chat = new Chat({
                        isGroupChat: false,
                        participants: [senderId, receiverId],
                        messages: [],
                    });
                    await chat.save();
                    console.log("✅ Chat created:", chat._id);
                }

                const message = new Message({
                    sender: senderId,
                    receiver: receiverId, 
                    content,
                    chat: chat._id,
                });
                await message.save();
                chat.messages = chat.messages || [];
                chat.messages.push(message._id);
                await chat.save();
                console.log("✅ Message saved:", message._id);

                const messageData = {
                    senderId,
                    sender: (await User.findById(senderId)).name,
                    receiver: receiverId,
                    content,
                    chatId: chat._id.toString(),
                    timestamp: message.createdAt,
                };

                socket.emit("receive-message", messageData);
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive-message", messageData);
                    console.log("📩 Sent to:", receiverSocketId);
                }
            } catch (error) {
                console.error("Message Send Error:", error.message);
                socket.emit("error-message", "Failed to send message");
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("🔴 User disconnected:", socket.userId, "Reason:", reason);
            onlineUsers.delete(socket.userId);
        });
    });
}