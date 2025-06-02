// import jwt from "jsonwebtoken";
// import cookie from "cookie";
// import Chat from "../Models/ChatSchema.js";
// import Message from "../Models/MessageSchema.js";
// import User from "../Models/UserSchema.js";

// const onlineUsers = new Map();

// export default function singleMessage(io) {
//     io.use(async (socket, next) => {
//         try {
//             const cookies = cookie.parse(socket.handshake.headers.cookie || "");
//             const token = cookies.token;
//             if (!token) return next(new Error("Not Authorized, Login Again"));

//             const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//             const userId = decodedToken.id;
//             const user = await User.findById(userId).select("-password");
//             if (!user) return next(new Error("User not found"));

//             socket.userId = user._id.toString();
//             console.log("✅ User Authenticated:", socket.userId);
//             next();
//         } catch (error) {
//             console.log("❌ Socket Auth Error:", error.message);
//             next(new Error("Authentication failed"));
//         }
//     });

//     io.on("connection", (socket) => {
//         console.log("✅ A user connected:", socket.userId);
//         onlineUsers.set(socket.userId, socket.id);

//         const sendChatHistory = async () => {
//             try {
//                 const chats = await Chat.find({
//                     participants: socket.userId,
//                     isGroupChat: false,
//                 }).populate({
//                     path: "messages",
//                     populate: { path: "sender", select: "name email" },
//                 });

//                 const chatHistory = chats.map((chat) => ({
//                     chatId: chat._id.toString(),
//                     participants: chat.participants.map((p) => p.toString()),
//                     messages: chat.messages.map((msg) => ({
//                         senderId: msg.sender._id.toString(),
//                         sender: msg.sender.name,
//                         receiver: chat.participants.find((p) => p.toString() !== msg.sender._id.toString()).toString(),
//                         content: msg.content,
//                         timestamp: msg.createdAt,
//                     })),
//                 }));

//                 socket.emit("chat-history", chatHistory);
//                 console.log("📜 Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
//             } catch (error) {
//                 console.error("Error sending chat history:", error.message);
//                 socket.emit("error-message", "Failed to load chat history");
//             }
//         };

//         sendChatHistory();

//         socket.on("load-chat", async ({ receiverId }) => {
//             try {
//                 // Find existing chat
//                 const chat = await Chat.findOne({
//                     isGroupChat: false,
//                     participants: { $all: [socket.userId, receiverId], $size: 2 },
//                 }).populate({
//                     path: "messages",
//                     populate: { path: "sender receiver", select: "name email" },
//                 });

//                 // Fetch all messages from sender to receiver (not tied to chat)
//                 const givenMessages = await Message.find({
//                     sender: socket.userId,
//                     receiver: receiverId,
//                 }).populate("sender", "name email content");

//                 console.log(givenMessages)

//                 // Fetch messages from receiver to sender for two-way history
//                 const receivedMessages = await Message.find({
//                     sender: receiverId,
//                     receiver: socket.userId,
//                 }).populate("sender", "name email");

//                 // Combine chat messages and loose messages
//                 const chatMessages = chat ? chat.messages : [];
//                 const allMessages = [
//                     ...chatMessages,
//                     ...givenMessages,
//                     ...receivedMessages,
//                 ].map((msg) => ({
//                     senderId: msg.sender._id.toString(),
//                     sender: msg.sender.name,
//                     receiver: (msg.receiver || chat?.participants.find((p) => p.toString() !== msg.sender._id.toString())).toString(),
//                     content: msg.content,
//                     timestamp: msg.createdAt,
//                 }));

//                 // Remove duplicates by timestamp and content
//                 const uniqueMessages = Array.from(
//                     new Map(allMessages.map((msg) => [`${msg.timestamp}-${msg.content}`, msg])).values()
//                 );

//                 socket.emit("chat-messages", { receiverId, messages: uniqueMessages });
//                 console.log("📜 Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
//             } catch (error) {
//                 console.error("Error loading chat:", error.message);
//                 socket.emit("error-message", "Failed to load chat");
//             }
//         });

//         socket.on("send-message", async ({ receiver, content }) => {
//             const sender = socket.userId;
//             console.log("📩 Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

//             if (!receiver || !content) {
//                 return socket.emit("error-message", "Receiver and content are required");
//             }

//             try {
//                 const senderId = sender;
//                 const receiverId = receiver.toString();
//                 const receiverUser = await User.findById(receiverId);
//                 if (!receiverUser) {
//                     return socket.emit("error-message", "Receiver not found");
//                 }

//                 let chat = await Chat.findOne({
//                     isGroupChat: false,
//                     participants: { $all: [senderId, receiverId], $size: 2 },
//                 });

//                 if (!chat) {
//                     chat = new Chat({
//                         isGroupChat: false,
//                         participants: [senderId, receiverId],
//                         messages: [],
//                     });
//                     await chat.save();
//                     console.log("✅ Chat created:", chat._id);
//                 }

//                 const message = new Message({
//                     sender: senderId,
//                     receiver: receiverId, // Add receiver to Message schema
//                     content,
//                     chat: chat._id,
//                 });
//                 await message.save();
//                 chat.messages = chat.messages || [];
//                 chat.messages.push(message._id);
//                 await chat.save();
//                 console.log("✅ Message saved:", message._id);

//                 const messageData = {
//                     senderId,
//                     sender: (await User.findById(senderId)).name,
//                     receiver: receiverId,
//                     content,
//                     chatId: chat._id.toString(),
//                     timestamp: message.createdAt,
//                 };

//                 socket.emit("receive-message", messageData);
//                 const receiverSocketId = onlineUsers.get(receiverId);
//                 if (receiverSocketId) {
//                     io.to(receiverSocketId).emit("receive-message", messageData);
//                     console.log("📩 Sent to:", receiverSocketId);
//                 }
//             } catch (error) {
//                 console.error("Message Send Error:", error.message);
//                 socket.emit("error-message", "Failed to send message");
//             }
//         });

//         socket.on("disconnect", (reason) => {
//             console.log("🔴 User disconnected:", socket.userId, "Reason:", reason);
//             onlineUsers.delete(socket.userId);
//         });
//     });
// }


// import jwt from "jsonwebtoken";
// import cookie from "cookie";
// import Chat from "../Models/ChatSchema.js";
// import Message from "../Models/MessageSchema.js";
// import User from "../Models/UserSchema.js";
// import webpush from "web-push";
// import Notification from "../Models/NotificationSchema.js";

// const onlineUsers = new Map();
// const subscriptions = new Map(); // Store push subscriptions per user

// // Set VAPID keys from .env
// webpush.setVapidDetails(
//   'mailto:ecanent1connect@gmail.com', // Replace with your contact email
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// export default function singleMessage(io) {
//   io.use(async (socket, next) => {
//     try {
//       const cookies = cookie.parse(socket.handshake.headers.cookie || "");
//       const token = cookies.token;
//       if (!token) return next(new Error("Not Authorized, Login Again"));

//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decodedToken.id;
//       const user = await User.findById(userId).select("-password");
//       if (!user) return next(new Error("User not found"));

//       socket.userId = user._id.toString();
//       console.log("✅ User Authenticated:", socket.userId);
//       next();
//     } catch (error) {
//       console.log("❌ Socket Auth Error:", error.message);
//       next(new Error("Authentication failed"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("✅ A user connected:", socket.userId);
//     onlineUsers.set(socket.userId, socket.id);

//     // Store push subscription when user connects
//     socket.on("register-push", (subscription) => {
//       subscriptions.set(socket.userId, subscription);
//       console.log("Push subscription registered for user:", socket.userId);
//     });

//     const sendChatHistory = async () => {
//       try {
//         const chats = await Chat.find({
//           participants: socket.userId,
//           isGroupChat: false,
//         }).populate({
//           path: "messages",
//           populate: { path: "sender", select: "name email" },
//         });

//         const chatHistory = chats.map((chat) => ({
//           chatId: chat._id.toString(),
//           participants: chat.participants.map((p) => p.toString()),
//           messages: chat.messages.map((msg) => ({
//             senderId: msg.sender._id.toString(),
//             sender: msg.sender.name,
//             receiver: chat.participants.find((p) => p.toString() !== msg.sender._id.toString()).toString(),
//             content: msg.content,
//             timestamp: msg.createdAt,
//           })),
//         }));

//         socket.emit("chat-history", chatHistory);
//         console.log("📜 Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
//       } catch (error) {
//         console.error("Error sending chat history:", error.message);
//         socket.emit("error-message", "Failed to load chat history");
//       }
//     };

//     sendChatHistory();

//     socket.on("load-chat", async ({ receiverId }) => {
//       try {
//         const chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [socket.userId, receiverId], $size: 2 },
//         }).populate({
//           path: "messages",
//           populate: { path: "sender receiver", select: "name email" },
//         });

//         const givenMessages = await Message.find({
//           sender: socket.userId,
//           receiver: receiverId,
//         }).populate("sender", "name email");

//         const receivedMessages = await Message.find({
//           sender: receiverId,
//           receiver: socket.userId,
//         }).populate("sender", "name email");

//         const allMessages = [
//           ...(chat?.messages || []),
//           ...givenMessages,
//           ...receivedMessages,
//         ].map((msg) => ({
//           senderId: msg.sender._id.toString(),
//           sender: msg.sender.name,
//           receiver: (msg.receiver || chat?.participants.find((p) => p.toString() !== msg.sender._id.toString())).toString(),
//           content: msg.content,
//           timestamp: msg.createdAt,
//         }));

//         const uniqueMessages = Array.from(
//           new Map(allMessages.map((msg) => [`${msg.timestamp}-${msg.content}`, msg])).values()
//         );

//         socket.emit("chat-messages", { receiverId, messages: uniqueMessages });
//         console.log("📜 Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
//       } catch (error) {
//         console.error("Error loading chat:", error.message);
//         socket.emit("error-message", "Failed to load chat");
//       }
//     });

//     socket.on("send-message", async ({ receiver, content }) => {
//       const sender = socket.userId;
//       console.log("📩 Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

//       if (!receiver || !content) {
//         return socket.emit("error-message", "Receiver and content are required");
//       }

//       try {
//         const receiverId = receiver.toString();
//         const receiverUser = await User.findById(receiverId);
//         if (!receiverUser) {
//           return socket.emit("error-message", "Receiver not found");
//         }

//         let chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [sender, receiverId], $size: 2 },
//         });

//         if (!chat) {
//           chat = new Chat({
//             isGroupChat: false,
//             participants: [sender, receiverId],
//             messages: [],
//           });
//           await chat.save();
//           console.log("✅ Chat created:", chat._id);
//         }

//         const message = new Message({
//           sender: sender,
//           receiver: receiverId,
//           content,
//           chat: chat._id,
//         });
//         await message.save();
//         chat.messages = chat.messages || [];
//         chat.messages.push(message._id);
//         await chat.save();
//         console.log("✅ Message saved:", message._id);

//         const messageData = {
//           senderId: sender,
//           sender: (await User.findById(sender)).name,
//           receiver: receiverId,
//           content,
//           chatId: chat._id.toString(),
//           timestamp: message.createdAt,
//         };

//         socket.emit("receive-message", messageData);
//         console.log("Online users map:", onlineUsers);
//         console.log("🔍 Getting socket for:", receiverId, "Online users:", Array.from(onlineUsers.entries()));

//         const receiverSocketId = onlineUsers.get(receiverId);
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("receive-message", messageData);
//           console.log("📩 Sent to:", receiverSocketId);
//         } else {
//           const subscription = subscriptions.get(receiverId);
//           if (subscription) {
//             await webpush.sendNotification(
//               subscription,
//               JSON.stringify({
//                 title: "New Private Message",
//                 body: `${messageData.sender}: ${content.substring(0, 100)}`,
//                 icon: "../Images/Logo.png",
//                 data: { url: `${process.env.FRONTEND_URL}/chat?chatId=${chat._id}` },
//               })
//             ).catch(err => console.error("Push notification error:", err));

//             // Store notification in DB
//             await new Notification({
//               title: "New Private Message",
//               content: `${messageData.sender}: ${content}`,
//               recipients: [receiverId],
//               sentBy: sender,
//             }).save();
//           }
//         }
//       } catch (error) {
//         console.error("Message Send Error:", error.message);
//         socket.emit("error-message", "Failed to send message");
//       }
//     });

//     socket.on("disconnect", (reason) => {
//       console.log("🔴 User disconnected:", socket.userId, "Reason:", reason);
//       onlineUsers.delete(socket.userId);
//       subscriptions.delete(socket.userId); // Clean up subscription on disconnect
//     });
//   });
// }








// import jwt from "jsonwebtoken";
// import cookie from "cookie";
// import Chat from "../Models/ChatSchema.js";
// import Message from "../Models/MessageSchema.js";
// import User from "../Models/UserSchema.js";
// import webpush from "web-push";
// import Notification from "../Models/NotificationSchema.js";

// const onlineUsers = new Map();
// const subscriptions = new Map(); // Store push subscriptions per user

// // Set VAPID keys from .env
// webpush.setVapidDetails(
//   'mailto:ecanent1connect@gmail.com', // Replace with your contact email
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// export default function singleMessage(io) {
//   io.use(async (socket, next) => {
//     try {
//       const cookies = cookie.parse(socket.handshake.headers.cookie || "");
//       const token = cookies.token;
//       if (!token) return next(new Error("Not Authorized, Login Again"));

//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decodedToken.id;
//       const user = await User.findById(userId).select("-password");
//       if (!user) return next(new Error("User not found"));

//       socket.userId = user._id.toString();
//       console.log("✅ User Authenticated:", socket.userId);
//       next();
//     } catch (error) {
//       console.log("❌ Socket Auth Error:", error.message);
//       next(new Error("Authentication failed"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("✅ A user connected:", socket.userId);
//     onlineUsers.set(socket.userId, socket.id);

//     // Store push subscription when user connects
//     socket.on("register-push", (subscription) => {
//       subscriptions.set(socket.userId, subscription);
//       console.log("Push subscription registered for user:", socket.userId);
//     });

//     const sendChatHistory = async () => {
//       try {
//         const chats = await Chat.find({
//           participants: socket.userId,
//           isGroupChat: false,
//         }).populate({
//           path: "messages",
//           populate: { path: "sender", select: "name email" },
//         });

//         const chatHistory = chats.map((chat) => ({
//           chatId: chat._id.toString(),
//           participants: chat.participants.map((p) => p.toString()),
//           messages: chat.messages.map((msg) => ({
//             senderId: msg.sender._id.toString(),
//             sender: msg.sender.name,
//             receiver: chat.participants.find((p) => p.toString() !== msg.sender._id.toString()).toString(),
//             content: msg.content,
//             timestamp: msg.createdAt,
//           })),
//         }));

//         socket.emit("chat-history", chatHistory);
//         console.log("📜 Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
//       } catch (error) {
//         console.error("Error sending chat history:", error.message);
//         socket.emit("error-message", "Failed to load chat history");
//       }
//     };

//     sendChatHistory();

//     socket.on("load-chat", async ({ receiverId }) => {
//       try {
//         const chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [socket.userId, receiverId], $size: 2 },
//         }).populate({
//           path: "messages",
//           populate: { path: "sender receiver", select: "name email" },
//         });

//         const givenMessages = await Message.find({
//           sender: socket.userId,
//           receiver: receiverId,
//         }).populate("sender", "name email");

//         const receivedMessages = await Message.find({
//           sender: receiverId,
//           receiver: socket.userId,
//         }).populate("sender", "name email");

//         const allMessages = [
//           ...(chat?.messages || []),
//           ...givenMessages,
//           ...receivedMessages,
//         ].map((msg) => ({
//           senderId: msg.sender._id.toString(),
//           sender: msg.sender.name,
//           receiver: (msg.receiver || chat?.participants.find((p) => p.toString() !== msg.sender._id.toString())).toString(),
//           content: msg.content,
//           timestamp: msg.createdAt,
//         }));

//         const uniqueMessages = Array.from(
//           new Map(allMessages.map((msg) => [`${msg.timestamp}-${msg.content}`, msg])).values()
//         );

//         socket.emit("chat-messages", { receiverId, messages: uniqueMessages });
//         console.log("📜 Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
//       } catch (error) {
//         console.error("Error loading chat:", error.message);
//         socket.emit("error-message", "Failed to load chat");
//       }
//     });

//     socket.on("send-message", async ({ receiver, content }) => {
//       const sender = socket.userId;
//       console.log("📩 Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

//       if (!receiver || !content) {
//         return socket.emit("error-message", "Receiver and content are required");
//       }

//       try {
//         const receiverId = receiver.toString();
//         const receiverUser = await User.findById(receiverId);
//         if (!receiverUser) {
//           return socket.emit("error-message", "Receiver not found");
//         }

//         let chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [sender, receiverId], $size: 2 },
//         });

//         if (!chat) {
//           chat = new Chat({
//             isGroupChat: false,
//             participants: [sender, receiverId],
//             messages: [],
//           });
//           await chat.save();
//           console.log("✅ Chat created:", chat._id);
//         }

//         const message = new Message({
//           sender: sender,
//           receiver: receiverId,
//           content,
//           chat: chat._id,
//         });
//         await message.save();
//         chat.messages = chat.messages || [];
//         chat.messages.push(message._id);
//         await chat.save();
//         console.log("✅ Message saved:", message._id);

//         const messageData = {
//           senderId: sender,
//           sender: (await User.findById(sender)).name,
//           receiver: receiverId,
//           content,
//           chatId: chat._id.toString(),
//           timestamp: message.createdAt,
//         };

//         socket.emit("receive-message", messageData);
//         const receiverSocketId = onlineUsers.get(receiverId);
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("receive-message", messageData);
//           console.log("📩 Sent to:", receiverSocketId);
//         } else {
//           const subscription = subscriptions.get(receiverId);
//           if (subscription) {
//             await webpush.sendNotification(
//               subscription,
//               JSON.stringify({
//                 title: "New Private Message",
//                 body: `${messageData.sender}: ${content.substring(0, 100)}`,
//                 icon: "../Images/Logo.png",
//                 data: { url: `${process.env.FRONTEND_URL}/chat?chatId=${chat._id}` },
//               })
//             ).catch(err => console.error("Push notification error:", err));

//             // Store notification in DB
//             await new Notification({
//               title: "New Private Message",
//               content: `${messageData.sender}: ${content}`,
//               recipients: [receiverId],
//               sentBy: sender,
//             }).save();
//           }
//         }
//       } catch (error) {
//         console.error("Message Send Error:", error.message);
//         socket.emit("error-message", "Failed to send message");
//       }
//     });

//     socket.on("disconnect", (reason) => {
//       console.log("🔴 User disconnected:", socket.userId, "Reason:", reason);
//       onlineUsers.delete(socket.userId);
//       subscriptions.delete(socket.userId); // Clean up subscription on disconnect
//     });
//   });
// }












// import jwt from "jsonwebtoken";
// import cookie from "cookie";
// import Chat from "../Models/ChatSchema.js";
// import Message from "../Models/MessageSchema.js";
// import User from "../Models/UserSchema.js";
// import webpush from "web-push";
// import Notification from "../Models/NotificationSchema.js";

// const onlineUsers = new Map();
// const subscriptions = new Map(); // Store push subscriptions per user

// // Set VAPID keys from .env
// webpush.setVapidDetails(
//   'mailto:ecanent1connect@gmail.com', // Replace with your contact email
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// export default function singleMessage(io) {
//   io.use(async (socket, next) => {
//     try {
//       const cookies = cookie.parse(socket.handshake.headers.cookie || "");
//       const token = cookies.token;
//       if (!token) return next(new Error("Not Authorized, Login Again"));

//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decodedToken.id;
//       const user = await User.findById(userId).select("-password");
//       if (!user) return next(new Error("User not found"));

//       socket.userId = user._id.toString();
//       console.log("✅ User Authenticated:", socket.userId);
//       next();
//     } catch (error) {
//       console.log("❌ Socket Auth Error:", error.message);
//       next(new Error("Authentication failed"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("✅ A user connected:", socket.userId);
//     onlineUsers.set(socket.userId, socket.id);

//     // Store push subscription when user connects
//     socket.on("register-push", (subscription) => {
//       subscriptions.set(socket.userId, subscription);
//       console.log("Push subscription registered for user:", socket.userId);
//     });

//     const sendChatHistory = async () => {
//       try {
//         const chats = await Chat.find({
//           participants: socket.userId,
//           isGroupChat: false,
//         }).populate({
//           path: "messages",
//           populate: { path: "sender", select: "name email" },
//         });

//         const chatHistory = chats.map((chat) => ({
//           chatId: chat._id.toString(),
//           participants: chat.participants.map((p) => p.toString()),
//           messages: chat.messages.map((msg) => ({
//             senderId: msg.sender._id.toString(),
//             sender: msg.sender.name,
//             receiver: chat.participants.find((p) => p.toString() !== msg.sender._id.toString()).toString(),
//             content: msg.content,
//             timestamp: msg.createdAt,
//           })),
//         }));

//         socket.emit("chat-history", chatHistory);
//         console.log("📜 Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
//       } catch (error) {
//         console.error("Error sending chat history:", error.message);
//         socket.emit("error-message", "Failed to load chat history");
//       }
//     };

//     sendChatHistory();

//     socket.on("load-chat", async ({ receiverId }) => {
//       try {
//         const chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [socket.userId, receiverId], $size: 2 },
//         }).populate({
//           path: "messages",
//           populate: { path: "sender receiver", select: "name email" },
//         });

//         const givenMessages = await Message.find({
//           sender: socket.userId,
//           receiver: receiverId,
//         }).populate("sender", "name email");

//         const receivedMessages = await Message.find({
//           sender: receiverId,
//           receiver: socket.userId,
//         }).populate("sender", "name email");

//         const allMessages = [
//           ...(chat?.messages || []),
//           ...givenMessages,
//           ...receivedMessages,
//         ].map((msg) => ({
//           senderId: msg.sender._id.toString(),
//           sender: msg.sender.name,
//           receiver: (msg.receiver || chat?.participants.find((p) => p.toString() !== msg.sender._id.toString())).toString(),
//           content: msg.content,
//           timestamp: msg.createdAt,
//         }));

//         const uniqueMessages = Array.from(
//           new Map(allMessages.map((msg) => [`${msg.timestamp}-${msg.content}`, msg])).values()
//         );

//         socket.emit("chat-messages", { receiverId, messages: uniqueMessages });
//         console.log("📜 Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
//       } catch (error) {
//         console.error("Error loading chat:", error.message);
//         socket.emit("error-message", "Failed to load chat");
//       }
//     });

//     socket.on("send-message", async ({ receiver, content }) => {
//       const sender = socket.userId;
//       console.log("📩 Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

//       if (!receiver || !content) {
//         return socket.emit("error-message", "Receiver and content are required");
//       }

//       try {
//         const receiverId = receiver.toString();
//         const receiverUser = await User.findById(receiverId);
//         if (!receiverUser) {
//           return socket.emit("error-message", "Receiver not found");
//         }

//         let chat = await Chat.findOne({
//           isGroupChat: false,
//           participants: { $all: [sender, receiverId], $size: 2 },
//         });

//         if (!chat) {
//           chat = new Chat({
//             isGroupChat: false,
//             participants: [sender, receiverId],
//             messages: [],
//           });
//           await chat.save();
//           console.log("✅ Chat created:", chat._id);
//         }

//         const message = new Message({
//           sender: sender,
//           receiver: receiverId,
//           content,
//           chat: chat._id,
//         });
//         await message.save();
//         chat.messages = chat.messages || [];
//         chat.messages.push(message._id);
//         await chat.save();
//         console.log("✅ Message saved:", message._id);

//         const messageData = {
//           senderId: sender,
//           sender: (await User.findById(sender)).name,
//           receiver: receiverId,
//           content,
//           chatId: chat._id.toString(),
//           timestamp: message.createdAt,
//         };

//         // Emit to both sender and receiver
//         const senderSocketId = onlineUsers.get(sender);
//         const receiverSocketId = onlineUsers.get(receiverId);

//         // Send to sender (for confirmation)
//         if (senderSocketId) {
//           io.to(senderSocketId).emit("receive-message", messageData);
//           console.log("📩 Sent to sender:", senderSocketId);
//           if(receiverSocketId){
//             io.to(receiverSocketId).emit("receive-message", messageData);
//           }
//             // socket.emit("receive-message", messageData);

//         }

//         // Send to receiver
        
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("receive-message", messageData);
//           console.log("📩 Sent to receiver:", receiverSocketId);
//         } else {
//           // If receiver is offline, send notification
//           const subscription = subscriptions.get(receiverId);
//           if (subscription) {
//             await webpush.sendNotification(
//               subscription,
//               JSON.stringify({
//                 title: "New Private Message",
//                 body: `${messageData.sender}: ${content.substring(0, 100)}`,
//                 icon: "../Images/Logo.png",
//                 data: { url: `${process.env.FRONTEND_URL}/chat?chatId=${chat._id}` },
//               })
//             ).catch(err => console.error("Push notification error:", err));

//             // Store notification in DB
//             await new Notification({
//               title: "New Private Message",
//               content: `${messageData.sender}: ${content}`,
//               recipients: [receiverId],
//               sentBy: sender,
//             }).save();
//           }        
//           socket.emit("receive-message", messageData);
//         }

//       } catch (error) {
//         console.error("Message Send Error:", error.message);
//         socket.emit("error-message", "Failed to send message");
//       }
//     });

//     socket.on("disconnect", (reason) => {
//       console.log("🔴 User disconnected:", socket.userId, "Reason:", reason);
//       onlineUsers.delete(socket.userId);
//       subscriptions.delete(socket.userId); // Clean up subscription on disconnect
//     });
//   });
// }





















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
  'mailto:ecanent1connect@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
      console.log("User Authenticated:", socket.userId);
      next();
    } catch (error) {
      console.log("Socket Auth Error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.userId);

    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    socket.on("register-push", (subscription) => {
      subscriptions.set(socket.userId, subscription);
      console.log("Push subscription registered for user:", socket.userId);
    });

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
        console.log("Sent chat history to:", socket.userId, "Chats:", chatHistory.length);
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
        }).populate("sender", "name email");

        const receivedMessages = await Message.find({
          sender: receiverId,
          receiver: socket.userId,
        }).populate("sender", "name email");

        const allMessages = [
          ...(chat?.messages || []),
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
        console.log("Sent chat messages for:", receiverId, "Count:", uniqueMessages.length);
      } catch (error) {
        console.error("Error loading chat:", error.message);
        socket.emit("error-message", "Failed to load chat");
      }
    });

    socket.on("send-message", async ({ receiver, content }) => {
      const sender = socket.userId;
      console.log("Send Message - Sender:", sender, "Receiver:", receiver, "Content:", content);

      if (!receiver || !content) {
        return socket.emit("error-message", "Receiver and content are required");
      }

      try {
        const receiverId = receiver.toString();
        const receiverUser = await User.findById(receiverId);
        if (!receiverUser) {
          return socket.emit("error-message", "Receiver not found");
        }

        let chat = await Chat.findOne({
          isGroupChat: false,
          participants: { $all: [sender, receiverId], $size: 2 },
        });

        if (!chat) {
          chat = new Chat({
            isGroupChat: false,
            participants: [sender, receiverId],
            messages: [],
          });
          await chat.save();
          console.log("Chat created:", chat._id);
        }

        const message = new Message({
          sender: sender,
          receiver: receiverId,
          content,
          chat: chat._id,
        });
        await message.save();
        chat.messages = chat.messages || [];
        chat.messages.push(message._id);
        await chat.save();
        console.log("Message saved:", message._id);

        const messageData = {
          senderId: sender,
          sender: (await User.findById(sender)).name,
          receiver: receiverId,
          content,
          chatId: chat._id.toString(),
          timestamp: message.createdAt,
        };

        const senderSockets = onlineUsers.get(sender);
        const receiverSockets = onlineUsers.get(receiverId);

        if (senderSockets) {
          senderSockets.forEach(socketId => {
            io.to(socketId).emit("receive-message", messageData);
          });
          console.log("Sent to sender sockets:", [...senderSockets]);
        }

        if (receiverSockets) {
          receiverSockets.forEach(socketId => {
            io.to(socketId).emit("receive-message", messageData);
          });
          console.log("Sent to receiver sockets:", [...receiverSockets]);
        } else {
          const subscription = subscriptions.get(receiverId);
          if (subscription) {
            await webpush.sendNotification(
              subscription,
              JSON.stringify({
                title: "New Private Message",
                body: `${messageData.sender}: ${content.substring(0, 100)}`,
                icon: "../Images/Logo.png",
                data: { url: `${process.env.FRONTEND_URL}/chat?chatId=${chat._id}` },
              })
            ).catch(err => console.error("Push notification error:", err));

            await new Notification({
              title: "New Private Message",
              content: `${messageData.sender}: ${content}`,
              recipients: [receiverId],
              sentBy: sender,
            }).save();
          }

          if (senderSockets) {
            senderSockets.forEach(socketId => {
              io.to(socketId).emit("receive-message", messageData);
            });
          }
        }

      } catch (error) {
        console.error("Message Send Error:", error.message);
        socket.emit("error-message", "Failed to send message");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.userId, "Reason:", reason);
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