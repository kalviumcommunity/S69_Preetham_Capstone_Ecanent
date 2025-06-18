import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { GiSafetyPin } from "react-icons/gi";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFile, FaFilePowerpoint, FaFileAlt } from "react-icons/fa";
import DarkMode from "../components/DarkMode"
import { IoSettings } from "react-icons/io5";
import { IoMdArrowBack, IoMdClose } from "react-icons/io";
import Logo from "../assets/Logo.png";

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

function MobileChat() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [all, setAll] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState({});
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
  const [hasRestored, setHasRestored] = useState(false);
  const newMessage = useRef(null);
  const fileInputRef = useRef(null);
  const {isDarkMode} = DarkMode();
  const messageRef = useRef(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewFileName, setPreviewFileName] = useState(null);
  const [zoom, SetZoom] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastViewed, setLastViewed] = useState({});
  const [isDataLoaded,setIsDataLoaded] = useState(false);

  const getUserColor = (userId) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 6) - hash) + char;
      hash = hash & hash;
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 50%, 60%)`;
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
      case "pdf": return <FaFilePdf className="text-red-500 text-xl mr-1" />;
      case "doc":
      case "docx": return <FaFileWord className="text-black text-xl mr-1" />;
      case "xlsx": return <FaFileExcel className="text-green-500 text-xl mr-1" />;
      case "pptx": return <FaFilePowerpoint className="text-orange-500 text-xl mr-1" />;
      case "txt": return <FaFileAlt className="text-gray-500 text-xl mr-1" />;
      default: return <FaFile className="text-gray-500 text-xl mr-1" />;
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

  const handleImageClick = (fileUrl, fileName) => {
    setPreviewImageUrl(fileUrl);
    setPreviewFileName(fileName);
    setIsPreviewOpen(true);
  };

  const getChatId = (chat) => {
    if (chat.type === "single") return chat.data._id;
    if (chat.type === "group") return chat.data.chat._id;
    if (chat.type === "subject") return chat.data.chat[0]._id;
    return null;
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
    const fetchFiles = async () => {
      if (!selectedChat) return;
      const chatId = getChatId(selectedChat);
      try {
        let url = `${import.meta.env.VITE_BACKEND_URL}/api/files?`;
        const params = new URLSearchParams();
        params.append("chatType", selectedChat.type);
        if (selectedChat.type === "group") {
          params.append("classGroup", selectedChat.data._id);
        } else if (selectedChat.type === "subject") {
          params.append("subjectGroup", selectedChat.data._id);
        } else if (selectedChat.type === "single") {
          params.append("receiverId", selectedChat.data._id);
        }
        url += params.toString();
        const res = await axios.get(url, { withCredentials: true });
        const files = res.data.files || [];
        const validFiles = files.filter(
          (file) => file && file.fileName && typeof file.fileName === "string" && file.fileUrl && file.fileType
        );
        setUploadedFiles((prev) => ({
          ...prev,
          [chatId]: validFiles.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        }));
      } catch (error) {
        console.error("Error fetching files:", error);
        setMessage("Failed to load files");
      }
    };

    fetchFiles();
  }, [selectedChat]);

  useEffect(() => {
    if (!profile) return;

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
    const interval = setInterval(fetchChatData, 300 * 1000); 

    socket.on("connect", () => console.log("WebSocket connected"));
    socket.on("disconnect", () => console.log("WebSocket disconnected"));
    socket.on("connect_error", (err) => console.error("WebSocket connection error:", err));

    socket.on("chat-history", (history) => {
      const messages = history.flatMap((chat) => chat.messages);
      const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const chatId = history[0]?.receiverId || sortedMessages[0]?.receiver;
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
      console.log("Received message:", message);
      console.log("Profile:", profile);
      console.log("Notification permission:", Notification.permission);

      const chatId = message.senderId === profile._id ? message.receiver : message.senderId;

      setChatMessages((prev) => {
        const existingMessages = prev[chatId] || [];
        const updated = existingMessages.some(
          (m) => m.timestamp === message.timestamp && m.content === message.content
        ) ? existingMessages : [...existingMessages, message];
        return { ...prev, [chatId]: updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
      });

      const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";
      if (
        new Date(message.timestamp) > new Date(lastViewedTime) &&
        (!selectedChat || getChatId(selectedChat) !== chatId)
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));

        if ('Notification' in window) {
          const triggerNotification = (permission) => {
            if (permission === 'granted') {
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
                console.log("Notification clicked, data:", event.currentTarget.data);
                handleChatSelect(event.currentTarget.data.chatData, event.currentTarget.data.chatType);
                window.focus();
              };
            } else if (permission === 'default') {
              Notification.requestPermission().then(newPermission => {
                if (newPermission === 'granted') triggerNotification('granted');
              });
            }
          };

          triggerNotification(Notification.permission);
        }
      }
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
      console.log("Received group message:", messageData);
      console.log("Profile:", profile);
      console.log("Notification permission:", Notification.permission);

      const chatId = messageData.chatId;

      setChatMessages((prev) => {
        const existingMessages = prev[chatId] || [];
        const updated = existingMessages.some(
          (m) => m.timestamp === messageData.timestamp && m.content === messageData.content
        ) ? existingMessages : [...existingMessages, messageData];
        return { ...prev, [chatId]: updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) };
      });

      const lastViewedTime = lastViewed[chatId] || "1970-01-01T00:00:00Z";
      if (
        new Date(messageData.timestamp) > new Date(lastViewedTime) &&
        (!selectedChat || getChatId(selectedChat) !== chatId)
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));

        if ('Notification' in window) {
          const triggerNotification = (permission) => {
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

              if (!chatData) return;

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
                console.log("Notification clicked, data:", event.currentTarget.data);
                handleChatSelect(event.currentTarget.data.chatData, event.currentTarget.data.chatType);
                window.focus();
              };
            } else if (permission === 'default') {
              Notification.requestPermission().then(newPermission => {
                if (newPermission === 'granted') triggerNotification('granted');
              });
            }
          };

          triggerNotification(Notification.permission);
        }
      }
    });

    socket.on("error-message", (err) => {
      console.error("Socket error:", err);
      setMessage(err);
    });

    return () => {
      clearInterval(interval);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("chat-history");
      socket.off("chat-messages");
      socket.off("receive-message");
      socket.off("group-chat-history");
      socket.off("group-chat-messages");
      socket.off("receive-group-message");
      socket.off("error-message");
    };
  }, [profile, selectedChat, lastViewed, subjectGroups, groupChats]);

  useEffect(() => {
    if (newMessage.current) {
      newMessage.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatMessages, uploadedFiles]);

  useEffect(() => {
    const restoreChat = () => {
      const storedChatId = localStorage.getItem("selectedChatId");
      const storedChatType = localStorage.getItem("selectedChatType");
      if (storedChatId && !hasRestored) {
        if (storedChatType === "single") {
          const member = all.find((m) => m._id === storedChatId);
          if (member) {
            setSelectedChat({ type: "single", data: member });
            socket.emit("load-chat", { receiverId: member._id });
          }
        } else if (storedChatType === "group") {
          const group = groupChats.find((g) => g.chat && g.chat._id === storedChatId);
          if (group) {
            setSelectedChat({ type: "group", data: group });
            socket.emit("load-group-chat", { chatId: group.chat._id });
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
            setSelectedChat({ type: "subject", data: selectedSubject });
            socket.emit("load-group-chat", { chatId: selectedSubject.chat[0]._id });
          }
        }
        setHasRestored(true);
      }
    };

    if (all.length > 0 && groupChats.length > 0 && Object.keys(subjectGroups).length > 0 && !hasRestored) {
      restoreChat();
    }
  }, [all, groupChats, subjectGroups, hasRestored]);

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

  const handleBack = () => {
    setSelectedChat(null);
    localStorage.removeItem("selectedChatId");
    localStorage.removeItem("selectedChatType");
  };

  const sendMessage = async () => {
    if (!selectedChat) {
      setMessage("Select a chat to send a message or file");
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

    if (input.trim()) {
      const messageData = {
        senderId: profile._id,
        sender: profile.name,
        content: input,
        timestamp: new Date().toISOString(),
        receiver: selectedChat.type === "single" ? selectedChat.data._id : undefined,
        chatId: selectedChat.type !== "single" ? chatId : undefined,
      };

      if (selectedChat.type === "single") {
        socket.emit("send-message", { receiver: selectedChat.data._id, content: input });
      } else if (selectedChat.type === "group") {
        socket.emit("send-group-message", { chatId: selectedChat.data.chat._id, content: input });
      } else if (selectedChat.type === "subject") {
        socket.emit("send-group-message", { chatId: selectedChat.data.chat[0]._id, content: input });
      }

      setInput("");
    }

    if (!file && !input.trim()) {
      setMessage("Type a message or select a file to send");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setInput((prev) => prev + "\n");
      if (newMessage.current) newMessage.current.scrollIntoView({ behavior: "auto" });
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

  const renderMessagesWithDates = () => {
    if (!combinedMessages.length) return <p className="text-sm text-center">No messages yet</p>;

    const messagesWithDates = [];
    let lastDate = null;

    combinedMessages.forEach((item, index) => {
      const timestamp = item.data.timestamp || item.data.createdAt;
      const currentDate = getaDate(timestamp);

      if (lastDate !== currentDate) {
        messagesWithDates.push(
          <div key={`date-${index}`} className="text-center my-2 flex justify-center">
            <span className="bg-white text-gray-700 text-xs px-2 py-1 rounded-sm">
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
            <div
              key={index}
              className={`p-2 my-2 rounded-md w-fit max-w-[80%] break-words ${
                msg.senderId === profile._id
                  ? "sent bg-blue-500 text-white self-end ml-auto"
                  : "received bg-white text-black"
              }`}
            >
              {msg.content.split("\n").map((line, i) => (
                <p key={i} className="text-sm">{line}</p>
              ))}
              <p className="text-[10px] font-light mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        } else {
          messagesWithDates.push(
            <div
              key={index}
              className={`p-2 my-2 rounded-md w-fit max-w-[80%] break-words ${
                msg.senderId === profile._id
                  ? "sent bg-blue-500 text-white self-end ml-auto"
                  : "received bg-white text-black"
              }`}
              style={msg.senderId !== profile._id ? { backgroundColor: getUserColor(msg.senderId) } : {}}
            >
              <p className="font-bold mb-1 text-sm">
                {msg.senderId === profile._id ? "You" : msg.sender}
              </p>
              {msg.content.split("\n").map((line, i) => (
                <p key={i} className="text-sm">{line}</p>
              ))}
              <p className="text-[10px] font-light mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        }
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
            className={`p-2 my-2 rounded-md w-fit max-w-[80%] break-words ${
              file.uploadedBy._id === profile._id
                ? "sent bg-blue-500 text-white self-end ml-auto"
                : "received bg-white text-black"
            }`}
            style={file.uploadedBy._id !== profile._id ? { backgroundColor: getUserColor(file.uploadedBy._id) } : {}}
          >
            <p className="font-bold mb-1 text-sm">
              {file.uploadedBy._id === profile._id ? "You" : file.uploadedBy.name} shared a file
            </p>
            {isImage && (
              <img
                src={file.fileUrl}
                alt={file.fileName}
                className="max-w-[150px] max-h-[150px] rounded-md my-2"
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
                className="max-w-[150px] max-h-[150px] rounded-md my-2"
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
                    <p className="text-xs">{file.fileName}</p>
                    <p className="text-[10px] text-gray-200">
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
                    className="bg-white text-black p-1 rounded text-xs w-full"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => downloadFile(file.fileUrl, file.fileName)}
                    className="bg-white text-black px-2 py-1 rounded text-xs w-full"
                  >
                    Save as...
                  </button>
                </div>
              </>
            )}
            <p className="text-[10px] font-light mt-1">
              {new Date(file.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        );
      }
    });

    messagesWithDates.reverse();

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
        <p key="no-messages" className="text-sm text-center">No messages between You and {selectedChat.data.name}</p>
      );
    }

    return messagesWithDates;
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {!selectedChat ? (
        <div className="flex flex-col h-full w-screen">
          <div className="grid grid-cols-3 items-center p-2 bg-cyan-500 text-white ">
            <img
              src={Logo}
              className="size-10 cursor-pointer justify-self-start ml-0"
              alt="Logo"
              onClick={() => navigate("/")}
            />
            <p className="justify-self-center text-2xl font-semibold ">Ecanent</p>
            <button onClick={() => navigate("/profile")} className="justify-self-end mr-0">
              <IoSettings className="text-2xl" />
            </button>
          </div>
          <div className="flex bg-gray-200 p-2">
            <button
              onClick={() => setActiveSection("group")}
              className={`flex-1 py-2 text-sm font-semibold ${
                activeSection === "group" ? "bg-white text-black rounded-sm" : "text-gray-700"
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveSection("single")}
              className={`flex-1 py-2 text-sm font-semibold ${
                activeSection === "single" ? "bg-white text-black rounded-sm" : "text-gray-700"
              }`}
            >
              Single
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {activeSection === "single" && (
              <>
                {all.map((member) => {
                  const chatId = member._id;
                  const unread = unreadCounts[chatId] || 0;

                  return (
                    <li
                      key={member._id}
                      className="cursor-pointer p-4 border-b hover:bg-gray-100 flex items-center"
                      onClick={() => handleChatSelect(member, "single")}
                    >
                      <div className="flex items-center">
                        <img
                          src={member.profilePic}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                          alt="Profile"
                        />
                        <div>
                          <p className="text-sm font-semibold">
                            {member._id === profile._id ? "You" : member.name}
                          </p>
                          <p className="text-xs text-gray-500">({member.role})</p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </li>
                  );
                })}
              </>
            )}
            {activeSection === "group" && (
              <>
                {groupChats.map((group) =>
                  group.chat ? (
                    <details key={group._id} className=" flex flex-col border-b">
                      <summary className="cursor-pointer p-4 bg-gray-100 hover:bg-gray-200  grid grid-cols-[5fr_1fr] w-full items-center">
                        <span className="text-sm font-semibold">{group.className}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/settings", { state: { classId: group._id } });
                          }}
                          className="text-blue-500 hover:underline"
                        >
                          <IoSettings className="text-lg justify-self-center" />
                        </button>
                      </summary>
                      <ul className="flex flex-col">
                        <li
                          className="p-4 cursor-pointer hover:bg-gray-100 flex items-center"
                          onClick={() => handleChatSelect(group, "group")}
                        >
                          <span>General</span>
                          {unreadCounts[group.chat._id] > 0 && (
                            <span className="bg-cyan-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCounts[group.chat._id]}
                            </span>
                          )}
                        </li>
                        {(subjectGroups[group._id] || []).map((subject) => (
                          <li
                            key={subject._id}
                            className="p-4 cursor-pointer hover:bg-gray-100 grid grid-cols-[5fr_1fr] items-center"
                          >
                            <span
                              className="text-sm italic"
                              onClick={() => handleChatSelect(subject, "subject", group)}
                            >
                              {subject.subjectName}
                            </span>
                            <div className="flex items-center justify-self-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/subjectSettings", {
                                    state: { subjectId: subject._id, classId: group._id },
                                  });
                                }}
                                className="text-blue-500 hover:underline"
                              >
                                <IoSettings className="text-lg justify-self-center" />
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
                          <li className="p-4 text-gray-500 italic text-sm">No subject groups</li>
                        )}
                      </ul>
                    </details>
                  ) : null
                )}
              </>
            )}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full ">
          <div className="fixed w-full top-0 bg-cyan-500 text-white p-4 grid grid-cols-2 justify-between items-center z-10">
            <div className="flex items-center justify-self-start">
              <button onClick={handleBack} className="mr-4">
                <IoMdArrowBack className="text-2xl" />
              </button>
              <h2 className="text-lg font-semibold">
                {selectedChat.type === "single"
                  ? selectedChat.data.name
                  : selectedChat.type === "group"
                  ? selectedChat.data.className
                  : selectedChat.data.subjectName}
              </h2>
            </div>
            {selectedChat.type !== "single" && (
              <button
                onClick={() =>
                  navigate(
                    selectedChat.type === "group" ? "/settings" : "/subjectSettings",
                    {
                      state:
                        selectedChat.type === "group"
                          ? { classId: selectedChat.data._id }
                          : { subjectId: selectedChat.data._id, classId: selectedChat.data.classGroup },
                    }
                  )
                }
                className="justify-self-end"
              >
                <IoSettings className="text-2xl" />
              </button>
            )}
          </div>
          <div ref={newMessage} className="flex flex-col-reverse overflow-y-auto h-[calc(88vh-30px)] bg-gray-100 p-4 mt-16 pt-2">
            {renderMessagesWithDates()}
            <div ref={newMessage} />
          </div>

          {isPreviewOpen && previewImageUrl && (
            <div className="fixed inset-0 bg-black/20 bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative bg-white p-4 rounded-lg max-w-xl w-[90%] max-h-[90vh] ">
                <div className="flex justify-between items-center mb-4 break-all text-center ">
                  <h2 className="text-md font-semibold mr-10">Image Preview: {previewFileName}</h2>
                  <button
                    onClick={() => downloadFile(previewImageUrl, previewFileName)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition "
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
                  className={`max-w-full max-h-[70vh] rounded-md flex justify-self-center cursor-zoom-in  transition-transform duration-500 ${zoom ? "z-[100] scale-120 cursor-zoom-out  max-w-[80%]" : "scale-100 cursor-zoom-in"}`}
                  onError={(e) => {
                    console.error("Error loading image preview:", e);
                    closePreview();
                    setMessage("Failed to load image preview");
                  }}
                />
              </div>
            </div>
          )}

          <div className="fixed bottom-0 w-full bg-white p-2 border-t shadow-lg z-10">
            {isPreviewOpen && file && (
              <div className="bg-white p-2 rounded-md border border-gray-300 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">File Preview</h3>
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setFilePreview(null);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Close
                  </button>
                </div>
                {getFileType(file) === "image" && filePreview && (
                  <img
                    src={filePreview}
                    alt="File preview"
                    className="max-w-[200px] max-h-[200px] rounded-md"
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
                    className="max-w-[200px] max-h-[200px] rounded-md"
                    onError={(e) => {
                      console.error("Error loading video preview:", e);
                      setFilePreview(null);
                      setIsPreviewOpen(false);
                    }}
                  />
                )}
              </div>
            )}

            <div className="flex items-center">
              <div className="flex-1 flex flex-col">
                {file && getFileType(file) !== "image" && getFileType(file) !== "video" && (
                  <div className="bg-gray-200 p-2 rounded-md mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      {getFileIcon(getFileType(file), file.name)}
                      <span className="text-xs text-gray-800">{file.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                        setIsPreviewOpen(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <textarea
                  className="border border-gray-400 p-2 rounded-l-md resize-none overflow-y-auto text-sm w-full"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows="1"
                  ref={messageRef}
                  style={{ minHeight: "38px", maxHeight: "120px", lineHeight: "12px", paddingTop: "12px" }}
                />
              </div>
              <div className="flex items-center ml-2">
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
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`${isDarkMode ? "bg-black" : "bg-white"} border border-black text-black p-2 rounded`}
                >
                  <GiSafetyPin className="text-cyan-500 text-xl" />
                </button>
              </div>
              <button
                className="bg-cyan-500 text-white p-2 rounded-r-md ml-2 text-sm"
                onClick={sendMessage}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Send"}
              </button>
            </div>
            {message && <p className="p-2 text-red-500 text-sm">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}


export default MobileChat;