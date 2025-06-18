import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { GiSafetyPin } from "react-icons/gi";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";
import DarkMode from "../components/DarkMode";
import { IoSettings } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import Logo from "../assets/Logo.png";
import "./Chat.css";
import { HiMiniMagnifyingGlass } from "react-icons/hi2";
import { motion } from "framer-motion";
import { SendHorizonal } from "lucide-react";
import { toast } from 'react-toastify'
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown } from "react-icons/fa6";

const socket = io(`${import.meta.env.VITE_WEBSOCKETS_URL}`, {
withCredentials: true,
});

function urlBase64ToUint8Array(base64String) {
const padding = '='.repeat((4 - base64String.length % 4) % 4);
const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
const rawData = window.atob(base64);
const outputArray = new Uint8Array(rawData.length);
for (let i = 0; i < rawData.length; ++i) {
outputArray[i] = rawData.charCodeAt(i);
}
return outputArray;
}

function Chat() {
const navigate = useNavigate();
const [profile, setProfile] = useState(null);
const [all, setAll] = useState([]);
const [groupChats, setGroupChats] = useState([]);
const [subjectGroups, setSubjectGroups] = useState({});
const [openChats, setOpenChats] = useState([]);
const [selectedChat, setSelectedChat] = useState(null);
const [chatMessages, setChatMessages] = useState({});
const [input, setInput] = useState("");
const [message, setMessage] = useState("");
const [file, setFile] = useState(null);
const [filePreview, setFilePreview] = useState(null);
const [uploadedFiles, setUploadedFiles] = useState({});
const [isUploading, setIsUploading] = useState(false);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);
const [activeSection, setActiveSection] = useState(() => {
return localStorage.getItem("activeSection") || "group";
});
const [isSidebarVisible, setIsSidebarVisible] = useState(true);
const newMessage = useRef(null);
const fileInputRef = useRef(null);
const {isDarkMode} = DarkMode();
const dragItem = useRef(null);
const messageRef = useRef(null);
const [previewImageUrl, setPreviewImageUrl] = useState(null);
const [previewFileName, setPreviewFileName] = useState(null);
const [zoom, SetZoom] = useState(false);
const [filtered, setFiltered] = useState(all);
const [unreadCounts, setUnreadCounts] = useState({});
const [lastViewed, setLastViewed] = useState({});
const [copied, setCopied] = useState(false);
const [animateRocket, setAnimateRocket] = useState(false);
const [isDataLoaded, setIsDataLoaded] = useState(false);

const getUserColor = (userId) => {
let hash = 0;
for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 6) - hash) + char;
    hash = hash & hash;
}
const hue = Math.abs(hash % 360);
return `hsl(${hue}, 50%, ${isDarkMode ? "40%" : "60%"})`;
};

const getaDate = (timestamp) => {
const now = new Date();
const messageDate = new Date(timestamp);
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

if (messageDay.getTime() === today.getTime()) {
    return "Today";
} else if (messageDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
} else {
    return `${days[messageDay.getDay()]} ${messageDay.getDate()}-${months[messageDay.getMonth()]}-${messageDay.getFullYear()}`;
}
};

const getFileType = (file) => {
if (!file) return null;
const ext = file.name.split(".").pop().toLowerCase();
if (["jpg", "jpeg", "png"].includes(ext)) return "image";
if (["mp4", "mov"].includes(ext)) return "video";
if (ext === "pdf") return "pdf";
if (["doc", "docx"].includes(ext)) return "doc";
if (ext === "pptx") return "pptx";
if (ext === "txt") return "txt";
return "other";
};

const getFileTypeDescription = (file) => {
const ext = file.fileName.split(".").pop().toLowerCase();
switch (ext) {
    case "pdf": return "PDF Document";
    case "doc":
    case "docx": return "Microsoft Word Document";
    case "xlsx": return "Microsoft Excel Worksheet";
    case "jpg":
    case "jpeg": return "JPEG Image";
    case "png": return "PNG Image";
    case "mp4": return "MP4 Video";
    case "mov": return "MOV Video";
    case "pptx": return "PowerPoint Presentation";
    case "txt": return "Text File";
    default: return "File";
}
};

const getFileIcon = (fileType, fileName) => {
const ext = fileName.split(".").pop().toLowerCase();
switch (ext) {
    case "pdf": return <FaFilePdf className="text-red-500 text-2xl mr-2" />;
    case "doc":
    case "docx": return <FaFileWord className="text-black text-2xl mr-2" />;
    case "xlsx": return <FaFileExcel className="text-green-500 text-2xl mr-2" />;
    case "pptx": return <FaFilePowerpoint className="text-orange-500 text-2xl mr-2" />;
    case "txt": return <FaFileAlt className="text-gray-500 text-2xl mr-2" />;
    default: return <FaFile className="text-gray-500 text-2xl mr-2" />;
}
};

const downloadFile = (url, fileName) => {
fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
    console.error("Error downloading file:", error);
    setMessage("Failed to download file");
    });
};

const toggleSidebar = () => {
setIsSidebarVisible((prev) => !prev);
};

const getChatId = (chat) => {
if (chat.type === "single") return chat.data._id;
if (chat.type === "group") return chat.data.chat._id;
if (chat.type === "subject") return chat.data.chat[0]._id;
return null;
};

const handleImageClick = (fileUrl, fileName) => {
setPreviewImageUrl(fileUrl);
setPreviewFileName(fileName);
setIsPreviewOpen(true);
};

const canSendMessages = (chatType) => {
if (!profile) return false;
const role = profile.role.toLowerCase();
if (chatType === "group") {
    return ["faculty", "hod", "admin"].includes(role);
}
return true;
};

useEffect(() => {
const getProfile = async () => {
    try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, { withCredentials: true });
    const userData = res.data.userData || res.data;
    setProfile(userData);
    return userData;
    } catch (error) {
    console.error("Error fetching profile:", error);
    setMessage("Failed to load profile");
    navigate("/login");
    throw error;
    }
};

const getAll = async () => {
    try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/members`, { withCredentials: true });
    const members = res.data.members || [];
    setAll(members);
    return members;
    } catch (error) {
    console.error("Error fetching members:", error);
    setMessage("Failed to load members");
    navigate("/login");
    throw error;
    }
};

const getGroupChats = async () => {
    try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/class`, { withCredentials: true });
    const classes = res.data.classes || res.data || [];
    setGroupChats(classes);

    const subjectPromises = classes.map(group =>
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subject/${group._id}`, { withCredentials: true })
        .then(subjectRes => ({ id: group._id, subjects: subjectRes.data.subjects || [] }))
        .catch(() => ({ id: group._id, subjects: [] }))
    );

    const subjectResults = await Promise.all(subjectPromises);
    const subjectGroupsData = subjectResults.reduce((acc, { id, subjects }) => {
        acc[id] = subjects;
        return acc;
    }, {});
    setSubjectGroups(subjectGroupsData);
    return classes;
    } catch (error) {
    console.error("Error fetching group chats:", error);
    setMessage("Failed to load group chats");
    navigate("/login");
    throw error;
    }
};

const fetchData = async () => {
    try {
    const [userData, members, classes] = await Promise.all([getProfile(), getAll(), getGroupChats()]);
    setIsDataLoaded(true);
    console.log("Data fetching complete:", { members, classes, subjectGroups });

    if (members.length > 0 && userData) {
        const membersToLoad = members
        .filter(member => member._id !== userData._id)
        .slice(0, 5); // Load only first 5 chats initially
        membersToLoad.forEach(member => {
        socket.emit("load-chat", { receiverId: member._id });
        });
    }
    } catch (error) {
    console.error("Error in fetchData:", error);
    }
};

fetchData();

const storedLastViewed = JSON.parse(localStorage.getItem("lastViewed") || "{}");
setLastViewed(storedLastViewed);

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
    .register("/service-worker.js")
    .then(registration => {
        console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch(err => console.error("Service Worker registration failed:", err));
}

const registerPush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.error("Push notifications not supported in this browser.");
    return;
    }

    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    console.error("VITE_VAPID_PUBLIC_KEY is not defined in .env");
    return;
    }

    try {
    if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
        await subscribeToPush();
        } else if (permission === "denied") {
        console.warn("Notification permission denied. Reset permissions in browser settings.");
        }
    } else if (Notification.permission === "granted") {
        await subscribeToPush();
    } else {
        console.warn("Notification permission denied. Reset permissions in browser settings.");
    }
    } catch (error) {
    console.error("Error handling push notifications:", error);
    }
};

const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
    subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    });
    console.log("Push subscription successful:", subscription);
    } else {
    console.log("Existing subscription found:", subscription);
    }
    socket.emit("register-push", subscription);
};

registerPush();

}, [navigate]);

useEffect(() => {
const fetchFiles = async (chat) => {
    if (!chat) return;
    try {
    let url = `${import.meta.env.VITE_BACKEND_URL}/api/files?`;
    const params = new URLSearchParams();
    params.append("chatType", chat.type);
    if (chat.type === "group") {
        params.append("classGroup", chat.data._id);
    } else if (chat.type === "subject") {
        params.append("subjectGroup", chat.data._id);
    } else if (chat.type === "single") {
        params.append("receiverId", chat.data._id);
    }
    url += params.toString();
    const res = await axios.get(url, { withCredentials: true });
    const files = res.data.files || [];
    const validFiles = files.filter(
        (file) => file && file.fileName && typeof file.fileName === "string" && file.fileUrl && file.fileType
    );
    const chatId = getChatId(chat);
    setUploadedFiles((prev) => ({ ...prev, [chatId]: validFiles }));
    } catch (error) {
    console.error("Error fetching files:", error);
    setMessage("Failed to load files");
    }
};

if (selectedChat) {
    fetchFiles(selectedChat);
}
}, [selectedChat]);

useEffect(() => {
const fetchChatData = () => {
    if (!selectedChat) return;
    const chatId = getChatId(selectedChat);
    if (selectedChat.type === "single" && !chatMessages[chatId]?.length) {
    socket.emit("load-chat", { receiverId: selectedChat.data._id });
    } else if ((selectedChat.type === "group" || selectedChat.type === "subject") && !chatMessages[chatId]?.length) {
    socket.emit("load-group-chat", { chatId });
    }
};

fetchChatData();
const interval = setInterval(fetchChatData, 60 * 1000);

socket.on("chat-history", (history) => {
    const messages = history.flatMap((chat) => chat.messages);
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const chatId = history[0]?.receiverId;
    if (!chatId) {
    console.warn("Invalid chatId in chat-history:", history);
    return;
    }
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    const unread = sortedMessages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
    if (unread > 0 && (!selectedChat || getChatId(selectedChat) !== chatId)) {
    setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: unread,
    }));
    }

    setChatMessages((prev) => ({ ...prev, [chatId]: sortedMessages }));
});

socket.on("chat-messages", ({ receiverId, messages }) => {
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const chatId = receiverId;
    if (!chatId) {
    console.warn("Invalid receiverId in chat-messages:", { receiverId, messages });
    return;
    }
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    const unread = sortedMessages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
    if (unread > 0 && (!selectedChat || getChatId(selectedChat) !== chatId)) {
    setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: unread,
    }));
    }

    setChatMessages((prev) => ({ ...prev, [chatId]: sortedMessages }));
});

socket.on("receive-message", (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
    const chatId = message.senderId === profile._id ? message.receiver : message.senderId;
    const notification = new Notification('New Private Message', {
        body: `${message.sender}: ${message.content.substring(0, 100)}`,
        icon: Logo,
        data: { 
        url: `/chat?type=single&chatId=${chatId}`,
        chatType: "single",
        chatData: { _id: chatId, name: message.sender }
        },
    });

    notification.onclick = (event) => {
        event.preventDefault();
        handleChatSelect(event.target.data.chatData, event.target.data.chatType);
        window.focus();
    };
    }

    const chatId = message.senderId === profile._id ? message.receiver : message.senderId;
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    if (
    new Date(message.timestamp) > new Date(lastViewedTime) &&
    (!selectedChat || getChatId(selectedChat) !== chatId)
    ) {
    setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || 0) + 1,
    }));
    }

    setChatMessages((prev) => {
    const existingMessages = prev[chatId] || [];
    const updated = existingMessages.some(
        (m) => m.timestamp === message.timestamp && m.content === message.content
    ) ? existingMessages : [...existingMessages, message];
    return { ...prev, [chatId]: updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
    });
});

socket.on("group-chat-history", (groupChatHistory) => {
    groupChatHistory.forEach((history) => {
    const chatId = history.chatId;
    const messages = history.messages || [];
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    const unread = sortedMessages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
    if (unread > 0 && (!selectedChat || getChatId(selectedChat) !== chatId)) {
        setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: unread,
        }));
    }

    setChatMessages((prev) => ({ ...prev, [chatId]: sortedMessages }));
    });
});

socket.on("group-chat-messages", ({ chatId, messages }) => {
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    const unread = sortedMessages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
    if (unread > 0 && (!selectedChat || getChatId(selectedChat) !== chatId)) {
    setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: unread,
    }));
    }

    setChatMessages((prev) => ({ ...prev, [chatId]: sortedMessages }));
});

socket.on("receive-group-message", (messageData) => {
    if ('Notification' in window) {
    const handleNotification = (permission) => {
        if (permission === 'granted') {
        let title = "New Group Message";
        let chatType = "group"; 
        let chatData = null;

        const isSubjectChat = subjectGroups && Object.values(subjectGroups).some(subjects =>
            subjects.some(subject => subject.chat && subject.chat[0]?._id === messageData.chatId)
        );

        if (isSubjectChat) {
            chatType = "subject";
            for (const classId in subjectGroups) {
            const subject = subjectGroups[classId].find(s => s.chat && s.chat[0]?._id === messageData.chatId);
            if (subject) {
                chatData = subject;
                title = subject.subjectName || "Subject Chat";
                break;
            }
            }
        } else {
            const group = groupChats.find(g => g.chat && g.chat._id === messageData.chatId);
            if (group) {
            chatData = group;
            title = group.className || "Group Chat";
            }
        }

        if (!chatData) {
            console.warn("Could not find chat data for notification");
            return;
        }

        const notification = new Notification(title, {
            body: `${messageData.sender}: ${messageData.content.substring(0, 100)}`,
            icon: Logo,
            data: { 
            url: `/chat?type=${chatType}&chatId=${messageData.chatId}`,
            chatType: chatType,
            chatData: chatData
            },
        });

        notification.onclick = (event) => {
            event.preventDefault();
            handleChatSelect(event.target.data.chatData, event.target.data.chatType);
            window.focus();
        };
        }
    };

    if (Notification.permission === 'granted') {
        handleNotification('granted');
    } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => handleNotification(permission));
    }
    }

    const chatId = messageData.chatId;
    const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";

    if (
    new Date(messageData.timestamp) > new Date(lastViewedTime) &&
    (!selectedChat || getChatId(selectedChat) !== chatId)
    ) {
    setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || 0) + 1,
    }));
    }

    setChatMessages((prev) => {
    const existingMessages = prev[chatId] || [];
    const updated = existingMessages.some(
        (m) => m.timestamp === messageData.timestamp && m.content === messageData.content
    ) ? existingMessages : [...existingMessages, messageData];
    return { ...prev, [chatId]: updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
    });
});

socket.on("error-message", (err) => {
    console.error("Socket error:", err);
    setMessage(err);
});

return () => {
    clearInterval(interval);
    socket.off("chat-history");
    socket.off("chat-messages");
    socket.off("receive-message");
    socket.off("group-chat-history");
    socket.off("group-chat-messages");
    socket.off("receive-group-message");
    socket.off("error-message");
};
}, [selectedChat, profile, navigate, lastViewed, subjectGroups, groupChats]);


useEffect(() => {
const restoreSingleChat = () => {
    const storedChatId = localStorage.getItem("selectedChatId");
    const storedChatType = localStorage.getItem("selectedChatType");
    console.log("Attempting to restore single chat:", { storedChatType, storedChatId });

    if (storedChatType === "single") {
    const member = all.find((m) => m._id === storedChatId);
    if (member) {
        const newChat = { type: "single", data: member };
        setOpenChats([newChat]);
        setSelectedChat(newChat);
        socket.emit("load-chat", { receiverId: member._id });
        console.log("Restored single chat:", newChat);

        const chatId = member._id;
        const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";
        const messages = chatMessages[chatId] || [];
        const unread = messages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
        if (unread > 0) {
        setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: unread,
        }));
        }
    } else {
        console.log("Single chat restoration failed: member not found");
        setMessage("Selected user not found");
        localStorage.removeItem("selectedChatId");
        localStorage.removeItem("selectedChatType");
    }
    }
};

if (isDataLoaded && all.length > 0 && !selectedChat) {
    restoreSingleChat();
}
}, [isDataLoaded, all, selectedChat, socket, navigate, lastViewed, chatMessages]);

useEffect(() => {
const restoreGroupOrSubjectChat = () => {
    const storedChatId = localStorage.getItem("selectedChatId");
    const storedChatType = localStorage.getItem("selectedChatType");
    console.log("Attempting to restore group/subject chat:", { storedChatType, storedChatId });

    if (!storedChatId || !storedChatType) {
    console.log("No chat to restore: missing storedChatId or storedChatType");
    setMessage("No chat selected to restore");
    return;
    }

    if (storedChatType === "group") {
    const group = groupChats.find((g) => g.chat && g.chat._id === storedChatId);
    if (group) {
        const newChat = { type: "group", data: group };
        setOpenChats([newChat]);
        setSelectedChat(newChat);
        socket.emit("load-group-chat", { chatId: group.chat._id });
        console.log("Restored group chat:", newChat);

        const chatId = group.chat._id;
        const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";
        const messages = chatMessages[chatId] || [];
        const unread = messages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
        if (unread > 0) {
        setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: unread,
        }));
        }
    } else {
        console.log("Group chat restoration failed: group not found");
        setMessage("Selected group chat not found");
        localStorage.removeItem("selectedChatId");
        localStorage.removeItem("selectedChatType");
    }
    } else if (storedChatType === "subject") {
    let selectedSubject = null;
    for (const classId in subjectGroups) {
        const subject = subjectGroups[classId].find(
        (s) => s.chat && s.chat[0]?._id === storedChatId
        );
        if (subject) {
        selectedSubject = subject;
        break;
        }
    }
    if (selectedSubject) {
        const newChat = { type: "subject", data: selectedSubject };
        setOpenChats([newChat]);
        setSelectedChat(newChat);
        socket.emit("load-group-chat", { chatId: selectedSubject.chat[0]._id });
        console.log("Restored subject chat:", newChat);

        const chatId = selectedSubject.chat[0]._id;
        const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";
        const messages = chatMessages[chatId] || [];
        const unread = messages.filter((msg) => new Date(msg.timestamp) > new Date(lastViewedTime)).length;
        if (unread > 0) {
        setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: unread,
        }));
        }
    } else {
        console.log("Subject chat restoration failed: subject not found");
        setMessage("Selected subject chat not found");
        localStorage.removeItem("selectedChatId");
        localStorage.removeItem("selectedChatType");
    }
    }
};

if (isDataLoaded && groupChats.length > 0 && Object.keys(subjectGroups).length > 0 && !selectedChat) {
    restoreGroupOrSubjectChat();
}
}, [isDataLoaded, groupChats, subjectGroups, selectedChat, socket, navigate, lastViewed, chatMessages]);


useEffect(() => {
if (newMessage.current) {
    newMessage.current.scrollIntoView({ behavior: "auto" });
    if (messageRef.current) messageRef.current.focus();
}
}, [chatMessages, uploadedFiles, selectedChat]);

useEffect(() => {
setMessage("");
}, [selectedChat]);

useEffect(() => {
return () => {
    if (filePreview) {
    URL.revokeObjectURL(filePreview);
    }
};
}, [filePreview]);

useEffect(() => {
localStorage.setItem("activeSection", activeSection);
}, [activeSection]);

const handleDragStart = (e, index) => {
dragItem.current = index;
e.dataTransfer.effectAllowed = "move";
console.log("Dragging started at index:", index);
};

const handleDragOver = (e) => {
e.preventDefault();
e.dataTransfer.dropEffect = "move";
};

const handleDrop = (e, dropIndex) => {
e.preventDefault();
const draggedIndex = dragItem.current;
if (draggedIndex === null || draggedIndex === dropIndex) return;

const newOpenChats = [...openChats];
const [draggedChat] = newOpenChats.splice(draggedIndex, 1);
newOpenChats.splice(dropIndex, 0, draggedChat);

setOpenChats(newOpenChats);
console.log("Dropped at index:", dropIndex, "New order:", newOpenChats);
dragItem.current = null;
};

const handleChatSelect = (chat, type, classGroup = null) => {
const newChat = { type, data: chat };
const chatId = getChatId(newChat);

if (type === "group") {
    let userIsParticipant = false;
    const isStudent = chat.students?.find((s) => s._id === profile._id);
    const isFaculty = chat.faculty?.find((s) => s._id === profile._id);
    const isAdmin = chat.createdBy._id === profile._id;
    if (isStudent || isFaculty || isAdmin) userIsParticipant = true;

    if (!userIsParticipant) {
    console.error("User is not a participant in this group chat");
    setMessage("You are not a participant in this group chat");
    return;
    }
} else if (type === "subject") {
    if (!chat.chat || !chat.chat[0]?._id) {
    console.error("Subject group chat is missing:", chat);
    setMessage("This subject group chat is not available");
    return;
    }

    let userIsParticipant = false;
    const isStudent = chat.students?.some((s) => s._id === profile._id);
    const isFaculty = chat.faculty?.some((f) => f._id === profile._id);
    const isAdmin = classGroup?.createdBy._id === profile._id;
    if (isStudent || isFaculty || isAdmin) userIsParticipant = true;

    if (!userIsParticipant) {
    console.error("User is not a participant in this subject group chat");
    setMessage("You are not a participant in this subject group chat");
    return;
    }
}

setOpenChats((prev) => {
    const chatExists = prev.some((c) => c.type === type && getChatId(c) === chatId);
    if (!chatExists) return [...prev, newChat];
    return prev;
});

setSelectedChat(newChat);
setFile(null);
setFilePreview(null);
if (fileInputRef.current) fileInputRef.current.value = "";

const now = new Date().toISOString();
setLastViewed((prev) => ({
    ...prev,
    [chatId]: now,
}));
setUnreadCounts((prev) => ({
    ...prev,
    [chatId]: 0,
}));
localStorage.setItem("lastViewed", JSON.stringify({ ...lastViewed, [chatId]: now }));

if (messageRef.current) messageRef.current.focus();
if (type === "single") {
    socket.emit("load-chat", { receiverId: chat._id });
    localStorage.setItem("selectedChatId", chat._id);
    localStorage.setItem("selectedChatType", "single");
} else if (type === "group") {
    socket.emit("load-group-chat", { chatId: chat.chat._id });
    localStorage.setItem("selectedChatId", chat.chat._id);
    localStorage.setItem("selectedChatType", "group");
} else if (type === "subject") {
    socket.emit("load-group-chat", { chatId: chat.chat[0]._id });
    localStorage.setItem("selectedChatId", chat.chat[0]._id);
    localStorage.setItem("selectedChatType", "subject");
}
};

const handleShiftTabs = (event) => {
if (openChats.length === 0) return;

let currentIndex = openChats.findIndex((chat) => getChatId(chat) === getChatId(selectedChat));
let newIndex;

if (event.key === "Tab") {
    if (!event.shiftKey || (event.shiftKey && event.ctrlKey)) {
    newIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % openChats.length;
    } else if (event.shiftKey && !event.ctrlKey) {
    newIndex = currentIndex === -1 || currentIndex === 0 ? openChats.length - 1 : currentIndex - 1;
    } else {
    return;
    }

    event.preventDefault();
    const type = openChats[newIndex].type;
    const chat = openChats[newIndex];
    setSelectedChat(openChats[newIndex]);
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const chatId = getChatId(chat);
    const now = new Date().toISOString();
    setLastViewed((prev) => ({
    ...prev,
    [chatId]: now,
    }));
    setUnreadCounts((prev) => ({
    ...prev,
    [chatId]: 0,
    }));
    localStorage.setItem("lastViewed", JSON.stringify({ ...lastViewed, [chatId]: now }));

    if (messageRef.current) messageRef.current.focus();
    if (type === "single") {
    socket.emit("load-chat", { receiverId: chat.data._id });
    localStorage.setItem("selectedChatId", chat.data._id);
    localStorage.setItem("selectedChatType", "single");
    } else if (type === "group") {
    socket.emit("load-group-chat", { chatId: chat.data.chat._id });
    localStorage.setItem("selectedChatId", chat.data.chat._id);
    localStorage.setItem("selectedChatType", "group");
    } else if (type === "subject") {
    socket.emit("load-group-chat", { chatId: chat.data.chat[0]._id });
    localStorage.setItem("selectedChatId", chat.data.chat[0]._id);
    localStorage.setItem("selectedChatType", "subject");
    }
}
};

useEffect(() => {
const handleTabMovement = (event) => {
    if (event.key === "Tab") {
    event.preventDefault();
    handleShiftTabs(event);
    }
};

window.addEventListener("keydown", handleTabMovement, { capture: true });
return () => window.removeEventListener("keydown", handleTabMovement, { capture: true });
}, [openChats, selectedChat, lastViewed]);

const handleTabClick = (chat) => {
setSelectedChat(chat);
setFile(null);
setFilePreview(null);
if (fileInputRef.current) fileInputRef.current.value = "";
const chatId = getChatId(chat);

const now = new Date().toISOString();
setLastViewed((prev) => ({
    ...prev,
    [chatId]: now,
}));
setUnreadCounts((prev) => ({
    ...prev,
    [chatId]: 0,
}));
localStorage.setItem("lastViewed", JSON.stringify({ ...lastViewed, [chatId]: now }));

if (messageRef.current) messageRef.current.focus();
if (chat.type === "single") {
    socket.emit("load-chat", { receiverId: chat.data._id });
    localStorage.setItem("selectedChatId", chat.data._id);
    localStorage.setItem("selectedChatType", "single");
} else if (chat.type === "group") {
    socket.emit("load-group-chat", { chatId: chat.data.chat._id });
    localStorage.setItem("selectedChatId", chat.data.chat._id);
    localStorage.setItem("selectedChatType", "group");
} else if (chat.type === "subject") {
    socket.emit("load-group-chat", { chatId: chat.data.chat[0]._id });
    localStorage.setItem("selectedChatId", chat.data.chat[0]._id);
    localStorage.setItem("selectedChatType", "subject");
}
};

const handleTabClose = (chat, e) => {
e.stopPropagation();

const chatId = getChatId(chat);
const updatedOpenChats = openChats.filter((c) => getChatId(c) !== chatId);

setOpenChats(updatedOpenChats);

if (selectedChat && getChatId(selectedChat) === chatId) {
    if (updatedOpenChats.length > 0) {
    const lastChat = updatedOpenChats[updatedOpenChats.length - 1];
    setSelectedChat(lastChat);
    const lastChatId = getChatId(lastChat);

    const now = new Date().toISOString();
    setLastViewed((prev) => ({
        ...prev,
        [lastChatId]: now,
    }));
    setUnreadCounts((prev) => ({
        ...prev,
        [lastChatId]: 0,
    }));
    localStorage.setItem("lastViewed", JSON.stringify({ ...lastViewed, [lastChatId]: now }));

    if (lastChat.type === "single") {
        socket.emit("load-chat", { receiverId: lastChat.data._id });
        localStorage.setItem("selectedChatId", lastChat.data._id);
        localStorage.setItem("selectedChatType", "single");
    } else if (lastChat.type === "group") {
        socket.emit("load-group-chat", { chatId: lastChat.data.chat._id });
        localStorage.setItem("selectedChatId", lastChat.data.chat._id);
        localStorage.setItem("selectedChatType", "group");
    } else if (lastChat.type === "subject") {
        socket.emit("load-group-chat", { chatId: lastChat.data.chat[0]._id });
        localStorage.setItem("selectedChatId", lastChat.data.chat[0]._id);
        localStorage.setItem("selectedChatType", "subject");
    }
    } else {
    setSelectedChat(null);
    setFile(null);
    setFilePreview(null);
    localStorage.removeItem("selectedChatId");
    localStorage.removeItem("selectedChatType");
    }
}
};

const sendMessage = async () => {
if (!selectedChat) {
    setMessage("Select a chat to send a message or file");
    return;
}

if (!canSendMessages(selectedChat.type)) {
    setMessage("You do not have permission to send messages in this general group chat.");
    return;
}

const chatId = getChatId(selectedChat);

if (file) {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatType", selectedChat.type);
    formData.append("userId", profile._id);

    if (selectedChat.type === "group") {
    formData.append("classGroup", selectedChat.data._id);
    } else if (selectedChat.type === "subject") {
    formData.append("subjectGroup", selectedChat.data._id);
    } else if (selectedChat.type === "single") {
    formData.append("receiverId", selectedChat.data._id);
    }

    try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/files/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.success) {
        const updatedFile = { ...res.data.file, uploadedBy: { _id: profile._id, name: profile.name } };
        setUploadedFiles((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), updatedFile].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        ),
        }));
        setMessage("File uploaded successfully!");
        setTimeout(() => setMessage(""), 3000);
        setFile(null);
        setFilePreview(null);
        setIsPreviewOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        console.log(profile._id + ":" + selectedChat.data._id);
    } else {
        setMessage(res.data.message);
        return;
    }
    } catch (error) {
    console.error("Error uploading file:", error);
    setMessage(error.response?.data?.message || "Failed to upload file");
    return;
    } finally {
    setIsUploading(false);
    }
}

if (input) {
    const trimmedInput = input.replace(/\s+$/, '');
    if (selectedChat.type === "single") {
    socket.emit("send-message", { receiver: selectedChat.data._id, content: trimmedInput });
    } else if (selectedChat.type === "group") {
    socket.emit("send-group-message", { chatId: selectedChat.data.chat._id, content: trimmedInput });
    } else if (selectedChat.type === "subject") {
    socket.emit("send-group-message", { chatId: selectedChat.data.chat[0]._id, content: trimmedInput });
    }
    setInput("");
}

if (!file && !input) {
    setMessage("Type a message or select a file to send");
}
};

const handleCopy = async (text) => {
try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Message copied");
    setTimeout(() => setCopied(false), 2000);
} catch (err) {
    console.error('Failed to copy:', err);
}
};

if (!profile) {
return <div>Loading profile...</div>;
}

const handleKeyDown = (e) => {
if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleClick();
}
};

const closePreview = () => {
setPreviewImageUrl(null);
setPreviewFileName(null);
setIsPreviewOpen(false);
};

const combinedMessages = selectedChat
? [
    ...(chatMessages[getChatId(selectedChat)] || []).map((msg) => ({ type: "message", data: msg })),
    ...(uploadedFiles[getChatId(selectedChat)] || []).map((file) => ({ type: "file", data: file })),
    ].sort((a, b) => new Date(a.data.timestamp || a.data.createdAt) - new Date(b.data.timestamp || b.data.createdAt))
: [];

const search = (val) => {
if (activeSection === "single") {
    if (!val.trim()) {
    setFiltered([]);
    return;
    }
    const filtered = all.filter(
    (i) =>
        i.name.toLowerCase().includes(val.toLowerCase()) ||
        i.role.toLowerCase().includes(val.toLowerCase()) ||
        ("you".includes(val.toLowerCase()) && i._id === profile._id)
    );
    setFiltered(filtered);
}
if (activeSection === "group") {
    const subjectChats = Object.values(subjectGroups).flat();
    const combined = [...groupChats, ...subjectChats];
    if (!val.trim()) {
    setFiltered([]);
    return;
    }

    const filtered = combined.filter(
    (i) =>
        (i.className && i.className.toLowerCase().includes(val.toLowerCase())) ||
        (i.subjectName && i.subjectName.toLowerCase().includes(val.toLowerCase()))
    );
    setFiltered(filtered);
}
};

const renderMessagesWithDates = () => {
if (!combinedMessages.length) return <p className="text-sm sm:text-base">No messages or files loaded yet</p>;

const messagesWithDates = [];
let lastDate = null;

combinedMessages.forEach((item, index) => {
    const timestamp = item.data.timestamp || item.data.createdAt;
    const currentDate = getaDate(timestamp);

    if (lastDate !== currentDate) {
    messagesWithDates.push(
        <div key={`date-${index}`} className="text-center my-2 flex justify-center">
        <span className={`${isDarkMode ? "!bg-gray-800" : "!bg-white"} ${isDarkMode ? "!text-gray-300" : "!text-gray-700"} text-xs sm:text-sm px-2 py-1 rounded-sm`}>
            {currentDate}
        </span>
        </div>
    );
    lastDate = currentDate;
    }

    if (item.type === "message") {
    const msg = item.data;
    if (selectedChat.type === "single") {
        const isSender = msg.senderId === profile._id && msg.receiver === selectedChat.data._id;
        const isReceiver = msg.senderId === selectedChat.data._id && msg.receiver === profile._id;
        if (!isSender && !isReceiver) return;

        messagesWithDates.push(

        <div key={index}
        className={`group flex items-start gap-2 my-2 ${
            msg.senderId === profile._id ? "justify-end" : "justify-start"
        }`}
        >

        {msg.senderId === profile._id && (
            <button className="invisible group-hover:visible p-2 text-sm text-black">
                <select defaultValue=""  onChange={(e) => {
                        if (e.target.value === "copy") {
                            handleCopy(msg.content);
                            }
                            e.target.value = "";
                        }}>
                    <option value="" disabled hidden className={`${isDarkMode ? "!bg-gray-700 !!text-white" : "!bg-white !text-black"}`}></option>
                    <option value="copy" className={`group ${isDarkMode ? "!bg-gray-700 !text-white" : "!bg-white !text-black"}`}>Copy Message</option>
                    {/* <option className={`${isDarkMode ? "!bg-gray-700 !text-white" : "!bg-white !text-black"}`}>Delete Message</option> */}
                </select>
            </button>
        )}



        <div
            key={index}
            className={`p-2 my-2 rounded-md w-fit max-w-[80%] sm:max-w-[50%] break-words whitespace-pre-wrap ${
            msg.senderId === profile._id
                ? "sent bg-blue-500 text-white self-end  shadow-md"
                : "received bg-gray-300 text-black shadow-md"
            }`}
        >
            <p className="leading-[20px] text-sm sm:text-base mb-1">{msg.content}</p>
            <p className="p-1 text-[10px] md:text-[11px] font-light justify-self-end">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
        </div>

        {msg.senderId !== profile._id && (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
            <button className="invisible group-hover:visible text-sm text-black px-2 py-1">
                <FaChevronDown />
            </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
            <DropdownMenu.Content
                side="right"
                align="start"
                className="bg-white border rounded shadow-md text-sm z-50"
                sideOffset={4}
            >
                <DropdownMenu.Item
                className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}
                onSelect={() => handleCopy(msg.content)}
                >
                Copy Message
                </DropdownMenu.Item>
                {/* <DropdownMenu.Item
                className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}
                >
                Delete Message
                </DropdownMenu.Item> */}
            </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
        )}


        </div>
        );
    } else {
        messagesWithDates.push(
        <div key={index}
        className={`group flex items-start gap-2 my-2 ${
            msg.senderId === profile._id ? "justify-end" : "justify-start"
        }`}
        >
        {msg.senderId === profile._id && (
            <button className="invisible group-hover:visible p-2 text-sm text-black">
                <select defaultValue=""  onChange={(e) => {
                        if (e.target.value === "copy") {
                            handleCopy(msg.content);
                            }
                            e.target.value = "";
                        }}>
                    <option value="" disabled hidden className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}></option>
                    <option value="copy" className={`group *:${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}>Copy Message</option>
                    {/* <option className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}>Delete Message</option> */}
                </select>
            </button>
        )}

        <div
            key={index}
            className={`p-2 my-2 rounded-md w-fit max-w-[80%] sm:max-w-[50%] break-words whitespace-pre-wrap ${
            msg.senderId === profile._id
                ? "sent bg-blue-500 text-white self-end shadow-md"
                : "received text-black self-start shadow-md"
            }`}
            style={
            msg.senderId !== profile._id
                ? { backgroundColor: getUserColor(msg.senderId) }
                : {}
            }
        >
            <p className="font-bold mb-1 text-sm sm:text-base">
            {msg.senderId === profile._id ? "You " : msg.sender}
            </p>
            <p className="leading-[20px] text-sm sm:text-base mb-1">{msg.content}</p>
            <p className="p-1 text-[10px] md:text-[11px] font-light mt-1 justify-self-end">
            {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}
        </p>
    </div>

    {msg.senderId !== profile._id && (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
            <button className="invisible group-hover:visible text-sm text-black px-2 py-1">
                <FaChevronDown />
            </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
            <DropdownMenu.Content
                side="right"
                align="start"
                className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}
                sideOffset={4}
            >
                <DropdownMenu.Item
                className={`${isDarkMode ? "!bg-gray-700 !text-white hover:!bg-gray-600" : "!bg-white !text-black hover:!bg-gray-100"} px-4 py-2  cursor-pointer`}
                onSelect={() => handleCopy(msg.content)}
                >
                Copy Message
                </DropdownMenu.Item>
                {/* <DropdownMenu.Item
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                Delete Message
                </DropdownMenu.Item> */}
            </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
        )}

    </div>  

        )};
        
    } else if (item.type === "file") {
    const file = item.data;
    if (!file.fileName) {
        console.warn("Skipping file with missing fileName:", file);
        return;
    }
    const isImage = ["image"].includes(file.fileType.toLowerCase());
    const isVideo = ["video"].includes(file.fileType.toLowerCase());
    const isDownloadable = ["pdf", "doc", "pptx", "txt"].includes(file.fileType.toLowerCase());

    messagesWithDates.push(
        <div
        key={index}
        className={`p-2 my-2 rounded-md w-fit max-w-[80%] sm:max-w-[50%] break-words ${
            file.uploadedBy._id === profile._id
            ? "sent bg-blue-500 text-white self-end ml-auto shadow-md"
            : "received text-black self-start shadow-md"
        }`}
        style={file.uploadedBy._id !== profile._id ? { backgroundColor: getUserColor(file.uploadedBy._id) } : {}}
        >
        <p className="font-bold mb-1 text-sm sm:text-base">
            {file.uploadedBy._id === profile._id ? "You " : file.uploadedBy.name + " "}shared a file
        </p>
        {isImage && (
            <img
            src={file.fileUrl}
            alt={file.fileName}
            className="max-w-[150px] sm:max-w-[200px] max-h-[150px] sm:max-h-[200px] rounded-md my-2"
            onError={(e) => {
                console.error("Error loading image:", e);
                e.target.style.display = "none";
            }}
            onClick={() => handleImageClick(file.fileUrl, file.fileName)}
            />
        )}
        {isVideo && (
            <video
            src={file.fileUrl}
            controls
            className="max-w-[150px] sm:max-w-[200px] max-h-[150px] sm:max-h-[200px] rounded-md my-2"
            onError={(e) => {
                console.error("Error loading video:", e);
                e.target.style.display = "none";
            }}
            />
        )}
        {(isDownloadable || (!isImage && !isVideo)) && (
            <>
            <div className="flex items-center my-2">
                {getFileIcon(file.fileType, file.fileName)}
                <div className="flex-1">
                <p className="text-xs sm:text-sm">{file.fileName}</p>
                <p className="text-[10px] sm:text-xs text-gray-200">
                    {file.fileSize} KB, {getFileTypeDescription(file)}
                </p>
                </div>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                onClick={() => {
                    const previewUrl = `/preview?fileUrl=${encodeURIComponent(file.fileUrl)}&fileType=${encodeURIComponent(file.fileType)}&fileName=${encodeURIComponent(file.fileName)}`;
                    window.open(previewUrl, "_blank");
                }}
                className="bg-white text-black p-1 sm:p-2 rounded-md text-xs sm:text-sm w-full"
                >
                Open
                </button>
                <button
                onClick={() => downloadFile(file.fileUrl, file.fileName)}
                className="bg-white text-black px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm w-full"
                >
                Save as...
                </button>
            </div>
            </>
        )}
        <p className="text-[10px] sm:text-[12px] font-light mt-1 justify-self-end">
            {new Date(file.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        </div>
    );
    }
});

if (
    selectedChat.type === "single" &&
    combinedMessages.length > 0 &&
    combinedMessages.every(
    (item) =>
        item.type === "file" ||
        !(
        (item.data.senderId === profile._id && item.data.receiver === selectedChat.data._id) ||
        (item.data.senderId === selectedChat.data._id && item.data.receiver === profile._id)
        )
    )
) {
    messagesWithDates.push(
    <p key="no-messages" className="text-sm sm:text-base">No messages between You and {selectedChat.data.name}</p>
    );
}

return messagesWithDates;
};


const handleClick = () => {
if (!isUploading && canSendMessages(selectedChat?.type)) {
    setAnimateRocket(true);
    setTimeout(() => {
    setAnimateRocket(false);
    sendMessage();
    }, 500); 
}
};


return (
<div className={`min-h-screen overflow-clip ${isDarkMode ? "!bg-[#3B3636] !text-white" : "!bg-[#EDEDED] !text-black"}`}>
    <div className="flex items-start w-full">
    <div className="group relative">
        <img
        src={Logo}
        className="mt-1 size-10 max-w-lg md:my-2 cursor-pointer"
        alt="Logo"
        onClick={toggleSidebar}
        />
        <span className={`absolute left-12 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-300 text-black"} text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
        {isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        </span>
    </div>
    <div
        className={`flex flex-col md:grid ${
        isSidebarVisible ? "md:grid-cols-[1fr_5fr]" : "md:grid-cols-[5fr_0fr]"
        } md:grid-rows-[90vh] min-h-[80vh] md:min-h-[90vh] w-full ml-1 mr-2 sm:ml-2 gap-2 sm:gap-3 mt-6 sm:mt-10 md:mr-2 transition-all duration-800`}
    >
        {isSidebarVisible && (
        <div className="flex flex-col h-[80vh] md:h-full md:min-w-[250px] md:max-w-[300px]">
            <div className={`flex flex-col h-full ${isDarkMode ? "bg-[#464242] text-white border-2 border-gray-800" : "bg-white text-black border-2"} shadow-md shadow-black p-2 rounded-sm`}>
            <div className="flex-1 overflow-y-auto">
                <div className="flex mb-4">
                <button
                    onClick={() => setActiveSection("group")}
                    className={`flex-1 py-2 text-sm sm:text-base font-semibold rounded-l-md ${
                    activeSection === "group" ? "bg-blue-500 text-white" : `${isDarkMode ? "bg-[#3B3636] text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`
                    }`}
                    aria-label="Show Group Chats"
                >
                    Group
                </button>
                <button
                    onClick={() => setActiveSection("single")}
                    className={`flex-1 py-2 text-sm sm:text-base font-semibold rounded-r-md ${
                    activeSection === "single" ? "bg-blue-500 text-white" : `${isDarkMode ? "bg-[#3B3636] text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`
                    }`}
                    aria-label="Show Single Chats"
                >
                    Single
                </button>
                </div>

                <div className="relative w-[98%] justify-self-center">
                <input
                    placeholder="Search"
                    className={`focus:outline-1 focus:outline-cyan-500 w-full p-2 border border-gray-300 rounded-md ${isDarkMode ? "!bg-gray-700 !text-white " : "!bg-white !text-black "}`}
                    onChange={(e) => search(e.target.value)}
                />
                <HiMiniMagnifyingGlass className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-white" : "text-gray-400"}`} />
                </div>

                <ul className="w-full pl-1 pr-1 mt-2">
                {activeSection === "single" && (
                    <>
                    <h3 className="font-bold text-sm sm:text-base mb-2">Single Chats</h3>
                    {(filtered.length ? filtered : all).map((member) => {
                        const chatId = member._id;
                        const unread = unreadCounts[chatId] || 0;

                        return (
                        <li
                            key={member._id}
                            className={`cursor-pointer ${isDarkMode ? " hover:bg-gray-800 " : "hover:bg-gray-300 "} p-1 rounded-md ${
                            selectedChat?.type === "single" && selectedChat.data._id === member._id ? `${isDarkMode ? " hover:bg-gray-900 " : "hover:bg-gray-200 "}` : ""
                            }`}
                            onClick={() => handleChatSelect(member, "single")}
                        >
                            <div className="flex items-center justify-between">
                            <div className="flex ml-3 gap-3 sm:gap-5 items-center w-0 flex-1">
                                <img
                                src={member.profilePic}
                                className="w-8 h-8 sm:w-[47px] sm:h-[47px] rounded-full object-cover"
                                alt="Profile"
                                />
                                <p className="text-sm sm:text-base truncate w-0 flex-1">
                                {member._id === profile._id ? "You" : member.name} ({member.role})
                                </p>
                            </div>
                            {unread > 0 && (
                                <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mr-2 p-1">
                                {unread}
                                </span>
                            )}
                            </div>
                        </li>
                        );
                    })}
                    </>
                )}

                {activeSection === "group" && (
                    <>
                    <h3 className="font-bold text-sm sm:text-base mb-2">Group Chats</h3>
                    {(filtered.length ? filtered : groupChats).map((group) =>
                        group.subjectName ? (
                        <li
                            key={group._id}
                            className={`flex justify-between items-center p-1 rounded-md ${
                            selectedChat?.type === "subject" && selectedChat.data._id === group._id
                                ? `${isDarkMode ? "!bg-[#3B3636] !text-white " : "!bg-gray-300 !text-gray-700 "}`
                                : ` ${isDarkMode ? " !hover:bg-[#3B3636] !text-white" : "!hover:bg-gray-300 !text-black"}`
                            }`}
                        >
                            <span
                            className="cursor-pointer flex-1 text-sm sm:text-base truncate"
                            onClick={() => handleChatSelect(group, "subject")}
                            >
                            {group.subjectName}
                            </span>
                            <div className="flex items-center">
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                navigate("/subjectSettings", {
                                    state: { subjectId: group._id, classId: group.classGroup },
                                });
                                }}
                                className="text-blue-500 hover:underline text-xs sm:text-sm"
                            >
                                <IoSettings className="text-lg sm:text-xl" />
                            </button>
                            {unreadCounts[group._id] > 0 && (
                                <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                {unreadCounts[group._id]}
                                </span>
                            )}
                            </div>
                        </li>
                        ) : group.chat ? (
                        <details key={group._id} className="mb-2">
                            <summary className={`cursor-pointer p-1 ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} rounded-md`}>
                            <div className="flex flex-row justify-between items-center">
                                <p className="text-sm sm:text-base truncate">{group.className}</p>
                                <div className="flex items-center">
                                <button
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/settings", { state: { classId: group._id } });
                                    }}
                                    className="text-blue-500 hover:underline"
                                >
                                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                                    <IoSettings className="text-lg sm:text-xl" />
                                    </motion.div>
                                </button>
                                {unreadCounts[group.chat._id] > 0 && (
                                    <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                    {unreadCounts[group.chat._id]}
                                    </span>
                                )}
                                </div>
                            </div>
                            </summary>
                            <ul className="ml-4 mt-1">
                            <li
                                className={`cursor-pointer p-1 rounded-md ${
                                selectedChat?.type === "group" && selectedChat.data.chat._id === group.chat._id
                                    ? `${isDarkMode ? "bg-gray-900 text-white " : "bg-gray-300 text-gray-700 "}`
                                    : ` ${isDarkMode ? " hover:bg-gray-800 " : "hover:bg-gray-300 "}`
                                }`}
                                onClick={() => handleChatSelect(group, "group")}
                            >
                                <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base">Announcements</span>
                                {unreadCounts[group.chat._id] > 0 && (
                                    <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCounts[group.chat._id]}
                                    </span>
                                )}
                                </div>
                            </li>
                            {(subjectGroups[group._id] || []).map((subject) => (
                                <li
                                key={subject._id}
                                className={`flex justify-between items-center p-1 rounded-md ${
                                    selectedChat?.type === "subject" && selectedChat.data._id === subject._id
                                        ? `${isDarkMode ? "bg-gray-900 text-white " : "bg-gray-300 text-gray-700 "}`
                                    : ` ${isDarkMode ? " hover:bg-gray-800 " : "hover:bg-gray-300 "}`
                                }`}
                                >
                                <span
                                    className="cursor-pointer flex-1 text-sm sm:text-base truncate"
                                    onClick={() => handleChatSelect(subject, "subject", group)}
                                >
                                    {subject.subjectName}
                                </span>
                                <div className="flex items-center">
                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate("/subjectSettings", {
                                        state: { subjectId: subject._id, classId: group._id },
                                        });
                                    }}
                                    className="text-blue-500 hover:underline text-xs sm:text-sm"
                                    >
                                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                                        <IoSettings className="text-lg sm:text-xl" />
                                    </motion.div>
                                    </button>
                                    {unreadCounts[subject.chat?.[0]?._id] > 0 && (
                                    <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                        {unreadCounts[subject.chat?.[0]?._id]}
                                    </span>
                                    )}
                                </div>
                                </li>
                            ))}
                            {(!subjectGroups[group._id] || subjectGroups[group._id].length === 0) && (
                                <li className="p-1 text-gray-500 italic text-sm sm:text-base">No subject groups</li>
                            )}
                            </ul>
                        </details>
                        ) : null
                    )}
                    </>
                )}
                </ul>
            </div>
            </div>
        </div>
        )}

        <div className={`flex flex-col h-[80vh] md:h-full ${isDarkMode ? "!bg-[#464242] text-white" : "!bg-gray-100 text-black"} border-2 border-black overflow-y-hidden shadow-sm shadow-black`}>
        <div className="tab-bar">
            {openChats.map((chat, index) => {
            const chatId = getChatId(chat);
            const unread = unreadCounts[chatId] || 0;

            return (
                <div
                key={chatId}
                className={`tab ${
                    selectedChat && getChatId(selectedChat) === chatId ? "active" : ""
                }`}
                onClick={() => handleTabClick(chat)}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                style={{ cursor: "grab" }}
                >
                <span>
                    {chat.type === "single"
                    ? chat.data.name
                    : chat.type === "group"
                    ? `${chat.data.className} (Ann's)`
                    : `${chat.data.subjectName} (Subject)`}
                </span>
                {unread > 0 && (
                    <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {unread}
                    </span>
                )}
                <button onClick={(e) => handleTabClose(chat, e)}>
                    <IoMdClose className="text-lg" />
                </button>
                </div>
            );
            })}
        </div>

        {selectedChat ? (
            <>
            <div className={`flex-1 overflow-y-auto p-3 rounded-md ${isDarkMode ? "bg-[#423E3E] text-white" : "bg-gray-200 text-black"}`}>
                {renderMessagesWithDates()}
                <div ref={newMessage} />
            </div>

            {isPreviewOpen && previewImageUrl && (
                            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className={`relative ${isDarkMode ? "bg-[#423E3E] text-white" : "bg-gray-300 text-black"} p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto`}>
                                <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Image Preview: {previewFileName}</h2>
                                <button
                                    onClick={() => downloadFile(previewImageUrl, previewFileName)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition mr-10"
                                >
                                    Download
                                </button>
                                </div>
                                <button
                                onClick={closePreview}
                                className="absolute top-2 right-2 text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition"
                                >
                                <IoMdClose className="text-2xl" />
                                </button>
                                <img
                                src={previewImageUrl}
                                alt={previewFileName}
                                onClick={() => SetZoom((prev) => !prev)}
                                className={`max-w-full max-h-[70vh] rounded-md flex justify-self-center cursor-zoom-in transition-transform duration-500 ${
                                    zoom ? "z-[100] scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                                }`}
                                onError={(e) => {
                                    console.error("Error loading image preview:", e);
                                    closePreview();
                                    setMessage("Failed to load image preview");
                                }}
                                />
                            </div>
                            </div>
                        )}

                        {isPreviewOpen && file && (
                            <div className="bg-white p-4 rounded-md border border-gray-300 mb-3">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm sm:text-base">File Preview</h3>
                                <button
                                onClick={() => {
                                    setIsPreviewOpen(false);
                                    setFilePreview(null);
                                }}
                                className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm"
                                >
                                Close
                                </button>
                            </div>
                            {getFileType(file) === "image" && filePreview && (
                                <img
                                src={filePreview}
                                alt="File preview"
                                className="max-w-[200px] sm:max-w-[300px] max-h-[200px] sm:max-h-[300px] rounded-md"
                                onError={(e) => {
                                    console.error("Error loading image preview:", e);
                                    setFilePreview(null);
                                    setIsPreviewOpen(false);
                                }}
                                />
                            )}
                            {getFileType(file) === "video" && filePreview && (
                                <video
                                src={filePreview}
                                controls
                                className="max-w-[200px] sm:max-w-[300px] max-h-[200px] sm:max-h-[300px] rounded-md"
                                onError={(e) => {
                                    console.error("Error loading video preview:", e);
                                    setFilePreview(null);
                                    setIsPreviewOpen(false);
                                }}
                                />
                            )}
                            </div>
                        )}

            <div className="flex mt-3 pb-2 pl-2 pr-2">
                <div className="flex-1 flex flex-col">
                {file && getFileType(file) !== "image" && getFileType(file) !== "video" && (
                    <div className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} p-2 rounded-md mb-2 flex items-center justify-between`}>
                    <div className="flex items-center">
                        {getFileIcon(getFileType(file), file.name)}
                        <span className="text-xs sm:text-sm text-gray-800">{file.name}</span>
                    </div>
                    <button
                        onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                        setIsPreviewOpen(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded-md text-xs sm:text-sm"
                    >
                        Remove
                    </button>
                    </div>
                )}
                {canSendMessages(selectedChat.type) ? (
                    <textarea
                    type="text"
                    className="border border-gray-400 p-2 rounded-l-md resize-none overflow-y-auto align-middle text-sm sm:text-base"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows="3"
                    ref={messageRef}
                    style={{ minHeight: "40px", maxHeight: "40px", lineHeight: "20px", paddingTop: "12px" }}
                    />
                ) : (
                    <div className="border border-gray-400 p-2 rounded-l-md bg-gray-300 text-gray-600 text-sm sm:text-base flex items-center justify-center h-[40px]">
                    You cannot send messages in this general group chat.
                    </div>
                )}
                </div>
                <div className="flex items-center mr-1 ml-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                    const selectedFile = e.target.files[0];
                    setFile(selectedFile);
                    if (selectedFile) {
                        const fileType = getFileType(selectedFile);
                        if (fileType === "image" || fileType === "video") {
                        const previewUrl = URL.createObjectURL(selectedFile);
                        console.log("Generated preview URL:", previewUrl);
                        setFilePreview(previewUrl);
                        setIsPreviewOpen(true);
                        } else {
                        setFilePreview(null);
                        setIsPreviewOpen(false);
                        }
                    } else {
                        setFilePreview(null);
                        setIsPreviewOpen(false);
                    }
                    }}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.txt,.pptx"
                    disabled={!canSendMessages(selectedChat.type)}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`${isDarkMode ? "bg-[#423E3E] hover:bg-gray-800" : "bg-white hover:bg-gray-100"} z-0 border-1 border-black text-black px-2 sm:px-4 py-1 rounded-md ${!canSendMessages(selectedChat.type) ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ minHeight: "40px", maxHeight: "40px" }}
                    disabled={!canSendMessages(selectedChat.type)}
                >
                    <GiSafetyPin className="z-1 text-cyan-500 text-2xl sm:text-3xl" />
                </button>
                </div>
                <button
                className={`bg-blue-500 text-white px-6 sm:px-10 py-2 rounded-r-md ml-1 text-sm sm:text-base relative overflow-hidden ${!canSendMessages(selectedChat.type) ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleClick}
                disabled={isUploading || !canSendMessages(selectedChat.type)}
                >
                {isUploading ? (
                    <div className="flex space-x-1">
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                    </div>
                ) : (
                    <motion.div
                    initial={{ x: 0, opacity: 1 }}
                    animate={animateRocket ? { x: [0, 100, -100, 0], opacity: [1, 0, 0, 1] } : { x: 0, opacity: 1 }}
                    transition={{ duration: 2, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
                    className="flex items-center justify-center"
                    >
                    <SendHorizonal className="w-4 h-4" />
                    </motion.div>
                )}
                </button>
            </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center">
            <p className="text-sm sm:text-base">Select a user or group to start chatting</p>
            </div>
        )}
        {message && <p className="mt-2 text-red-500 text-sm sm:text-base">{message}</p>}
        </div>
    </div>
    </div>
    <button className="ml-3" onClick={() => navigate("/profile")}>
    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
        <IoSettings className="text-2xl md:text-3xl mb-1 hover:text-cyan-500" />
    </motion.div>
    </button>
</div>
);
}

export default Chat;