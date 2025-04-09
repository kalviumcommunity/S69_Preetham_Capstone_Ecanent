
import jwt from "jsonwebtoken";
import cookie from "cookie";
import Chat from "../Models/ChatSchema.js";
import Message from "../Models/MessageSchema.js";
import User from "../Models/UserSchema.js";
import webpush from "web-push";
import Notification from "../Models/NotificationSchema.js";

const onlineUsers = new Map();
const subscriptions = new Map();

webpush.setVapidDetails(
  "mailto:ecanent1connect@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default function groupMessage(io) {
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
      console.log("User Authenticated for Group Chat:", socket.userId);
      next();
    } catch (error) {
      console.log("Socket Auth Error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected to group chat:", socket.userId);

    // Track multiple sockets per user
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    socket.on("register-push", (subscription) => {
      subscriptions.set(socket.userId, subscription);
      console.log("Push subscription registered for user:", socket.userId);
    });

    const sendGroupChatHistory = async () => {
      try {
        const groupChats = await Chat.find({
          users: socket.userId,
          isGroupChat: true,
        })
          .populate("users", "name email")
          .populate({
            path: "messages",
            populate: { path: "sender", select: "name email" },
          });

        const groupChatHistory = groupChats.map((chat) => ({
          chatId: chat._id.toString(),
          groupName: chat.name || "Unnamed Group",
          users: chat.users.map((user) => ({
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
          })),
          messages: chat.messages.map((msg) => ({
            senderId: msg.sender._id.toString(),
            sender: msg.sender.name,
            content: msg.content,
            timestamp: msg.createdAt,
          })),
        }));

        socket.emit("group-chat-history", groupChatHistory);
        console.log("Sent group chat history to:", socket.userId);
      } catch (error) {
        console.error("Error sending group chat history:", error.message);
        socket.emit("error-message", "Failed to load group chat history");
      }
    };

    sendGroupChatHistory();

    socket.on("load-group-chat", async ({ chatId }) => {
      try {
        const chat = await Chat.findOne({
          _id: chatId,
          isGroupChat: true,
          users: socket.userId,
        })
          .populate("users", "name email")
          .populate({
            path: "messages",
            populate: { path: "sender", select: "name email" },
          });

        if (!chat) {
          return socket.emit("error-message", "Group chat not found or you are not a participant");
        }

        const messages = chat.messages.map((msg) => ({
          senderId: msg.sender._id.toString(),
          sender: msg.sender.name,
          content: msg.content,
          timestamp: msg.createdAt,
        }));

        socket.emit("group-chat-messages", { chatId, messages });
      } catch (error) {
        console.error("Error loading group chat:", error.message);
        socket.emit("error-message", "Failed to load group chat messages");
      }
    });

    socket.on("send-group-message", async ({ chatId, content }) => {
      const sender = socket.userId;
      if (!chatId || !content) {
        return socket.emit("error-message", "Chat ID and content are required");
      }

      try {
        const chat = await Chat.findOne({
          _id: chatId,
          isGroupChat: true,
          users: sender,
        });
        if (!chat) {
          return socket.emit("error-message", "Group chat not found or you are not a participant");
        }

        const message = new Message({
          sender,
          receiver: null,
          chat: chat._id,
          content,
          messageType: "text",
          readBy: [sender],
        });
        await message.save();

        chat.messages.push(message._id);
        await chat.save();

        const senderUser = await User.findById(sender).select("name email");
        const messageData = {
          senderId: sender,
          sender: senderUser.name,
          chatId: chat._id.toString(),
          content,
          timestamp: message.createdAt,
        };

        const users = chat.users.map((user) => user.toString());
        for (const userId of users) {
          const userSocketSet = onlineUsers.get(userId);
          if (userSocketSet) {
            userSocketSet.forEach((socketId) => {
              io.to(socketId).emit("receive-group-message", messageData);
            });
          } else {
            const subscription = subscriptions.get(userId);
            if (subscription) {
              await webpush.sendNotification(
                subscription,
                JSON.stringify({
                  title: chat.name,
                  body: `${senderUser.name}: ${content.substring(0, 100)}`,
                  icon: "../Images/Logo.png",
                  data: { url: `${process.env.FRONTEND_URL}/chat?chatId=${chatId}` },
                })
              ).catch((err) => console.error("Push notification error:", err));
            }

            await new Notification({
              title: chat.name,
              content: `${senderUser.name}: ${content}`,
              recipients: [userId],
              classGroup: chat._id,
              sentBy: sender,
            }).save();
          }
        }

        socket.emit("receive-group-message", messageData);
      } catch (error) {
        console.error("Group Message Send Error:", error.message);
        socket.emit("error-message", "Failed to send group message");
      }
    });

    socket.on("update-group-chat", async ({ chatId, updates }) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, isGroupChat: true });
        if (!chat || !chat.users.includes(socket.userId)) {
          return socket.emit("error-message", "You are not authorized to update this chat");
        }

        const updatedChat = await Chat.findByIdAndUpdate(chatId, updates, { new: true })
          .populate("users", "name email")
          .populate({
            path: "messages",
            populate: { path: "sender", select: "name email" },
          });

        const users = updatedChat.users.map((user) => user._id.toString());
        users.forEach((userId) => {
          const userSocketSet = onlineUsers.get(userId);
          if (userSocketSet) {
            userSocketSet.forEach((socketId) => {
              io.to(socketId).emit("group-chat-updated", {
                chatId: updatedChat._id.toString(),
                groupName: updatedChat.name,
                users: updatedChat.users.map((u) => ({
                  userId: u._id.toString(),
                  name: u.name,
                  email: u.email,
                })),
              });
            });
          }
        });

        socket.emit("chat-updated-success", { chat: updatedChat });
      } catch (error) {
        console.error("Error updating group chat:", error.message);
        socket.emit("error-message", "Failed to update group chat");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 User disconnected from group chat:", socket.userId, "Reason:", reason);
      const userSockets = onlineUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          subscriptions.delete(socket.userId);
        }
      }
    });
  });
}