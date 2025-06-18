import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import arrow from "../assets/arrow_back.png"; 
import DarkMode from "../components/DarkMode";

function SubjectSettings() {
    const {isDarkMode} = DarkMode();
    const navigate = useNavigate();
    const location = useLocation();
    const { subjectId, classId } = location.state || {};
    const [subjectData, setSubjectData] = useState(null);
    const [classData, setClassData] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState("");
    const [editSubjectName, setEditSubjectName] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
    const [showRemoveMembers, setShowRemoveMembers] = useState(false);
    const [selectedMembersToRemove, setSelectedMembersToRemove] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    useEffect(() => {
        const getProfile = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
                    withCredentials: true,
                });
                setProfile(res.data.userData || res.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage("Failed to load profile");
                navigate("/login");
            }
        };

        const getSubjectData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subject/id/${subjectId}`, {
                    withCredentials: true,
                });
                setSubjectData(res.data.subject);
                setNewSubjectName(res.data.subject.subjectName);
            } catch (error) {
                console.error("Error fetching subject data:", error);
                setMessage("Failed to load subject data");
                navigate("/chat");
            }
        };

        const getClassData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/class/${classId}`, {
                    withCredentials: true,
                });
                setClassData(res.data);
            } catch (error) {
                console.error("Error fetching class data:", error);
                setMessage("Failed to load class data");
                navigate("/chat");
            }
        };

        const getAllMembers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/members`, {
                    withCredentials: true,
                });
                setAllMembers(res.data.members || []);
            } catch (error) {
                console.error("Error fetching members:", error);
                setMessage("Failed to load members");
            }
        };

        if (subjectId && classId) {
            getProfile();
            getSubjectData();
            getClassData();
            getAllMembers();
        } else {
            setMessage("Invalid subject or class ID");
            navigate("/chat");
        }
    }, [navigate, subjectId, classId]);

    const availableMembersToAdd = useMemo(() => {
        if (!allMembers || !subjectData || !classData) return [];
        const classMembers = [...classData.students, ...classData.faculty];
        return classMembers.filter(
            (member) =>
                !subjectData.students.some((s) => s._id === member._id) &&
                !subjectData.faculty.some((f) => f._id === member._id)
        );
    }, [allMembers, subjectData, classData]);

    const handleSubjectNameUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/subject/${subjectId}`,
                { subjectName: newSubjectName },
                { withCredentials: true }
            );
            if (response.data.success) {
                setSubjectData((prev) => ({ ...prev, subjectName: newSubjectName }));
                setMessage("Subject name updated successfully!");
                setEditSubjectName(false);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error updating subject name:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                setMessage("Authentication failed. Please log in again.");
                navigate("/login");
            } else if (error.response?.status === 403) {
                setMessage("Access denied. Only Admins, HODs, or faculty can update the subject name.");
            } else {
                setMessage(error.response?.data?.message || "Failed to update subject name");
            }
        }
    };

    const toggleAddMember = (memberId) => {
        if (!memberId) {
            console.error("Invalid memberId:", memberId);
            return;
        }
        setSelectedMembersToAdd((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const addMembersToSubject = async () => {
        try {
            const addStudents = selectedMembersToAdd.filter((memberId) =>
                allMembers.find((member) => member._id === memberId && member.role === "Student")
            );
            const addFaculty = selectedMembersToAdd.filter((memberId) =>
                allMembers.find((member) => 
                    member._id === memberId && 
                    (member.role === "Faculty" || member.role === "HOD")
                )
            );

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/subject/id/${subjectId}`,
                { addStudents, addFaculty },
                { withCredentials: true }
            );

            if (response.data.success) {
                const newStudents = allMembers.filter((member) =>
                    addStudents.includes(member._id)
                );
                const newFaculty = allMembers.filter((member) =>
                    addFaculty.includes(member._id)
                );

                setSubjectData((prev) => ({
                    ...prev,
                    students: [...prev.students, ...newStudents],
                    faculty: [...prev.faculty, ...newFaculty],
                }));
                setMessage("Members added successfully!");
                setSelectedMembersToAdd([]);
                setShowAddMembers(false);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error adding members:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                setMessage("Authentication failed. Please log in again.");
                navigate("/login");
            } else if (error.response?.status === 403) {
                setMessage("Access denied. Only Admins, HODs, or faculty can add members.");
            } else {
                setMessage(error.response?.data?.message || "Failed to add members");
            }
        }
    };

    const toggleRemoveMember = (memberId) => {
        if (!memberId) {
            console.error("Invalid memberId:", memberId);
            return;
        }
        
        setSelectedMembersToRemove((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const removeMembersFromSubject = async () => {
        try {
            const removeStudents = selectedMembersToRemove.filter((memberId) =>
                subjectData.students.some((student) => student._id === memberId)
            );
            const removeFaculty = selectedMembersToRemove.filter((memberId) =>
                subjectData.faculty.some((faculty) => faculty._id === memberId)
            );

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/subject/id/${subjectId}`,
                { removeStudents, removeFaculty },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSubjectData((prev) => ({
                    ...prev,
                    students: prev.students.filter(
                        (s) => !removeStudents.includes(s._id)
                    ),
                    faculty: prev.faculty.filter(
                        (f) => !removeFaculty.includes(f._id)
                    ),
                }));
                setMessage("Members removed successfully!");
                setSelectedMembersToRemove([]);
                setShowRemoveMembers(false);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error removing members:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                setMessage("Authentication failed. Please log in again.");
                navigate("/login");
            } else if (error.response?.status === 403) {
                setMessage("Access denied. Only Admins, HODs, or faculty can remove members.");
            } else {
                setMessage(error.response?.data?.message || "Failed to remove members");
            }
        }
    };

    const deleteSubjectGroup = async () => {
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/subject/id/${subjectId}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setMessage("Subject group deleted successfully!");
                navigate("/chat");
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error deleting subject group:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                setMessage("Authentication failed. Please log in again.");
                navigate("/login");
            } else if (error.response?.status === 403) {
                setMessage("Access denied. Only Admins or HODs can delete subject groups.");
            } else {
                setMessage(error.response?.data?.message || "Failed to delete subject group");
            }
        }
    };

    if (!subjectData || !classData || !profile) {
        return <div>Loading...</div>;
    }

    const subjectMembers = [...subjectData.students, ...subjectData.faculty];

    const canEdit =
        profile.role === "Admin" ||
        profile.role === "HOD" ||
        subjectData.faculty.some((f) => f._id === profile._id);

    return (
        <div
            className={`min-h-screen p-6 ${
                isDarkMode ? "bg-[#423E3E] text-white" : "bg-[#EDEDED] text-black"
            } overflow-hidden`}
        >
            <button
                className="rounded-full w-12 h-12 bg-[#20AFC5] flex justify-center items-center mb-6 shadow-lg hover:bg-[#1a8fa3] transition-all duration-300"
                onClick={() => navigate(-1)}
            >
                <img src={arrow} className="w-7 h-7" alt="Back" />
            </button>

            <h1 className="text-4xl font-bold text-center mb-8 text-[#20AFC5] drop-shadow-lg">
                {subjectData.subjectName} (Class: {classData.className})
            </h1>

            <div className={`grid gap-6 ${
                profile.role === "Admin" || profile.role === "HOD"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1 place-items-center"
            }  `}>  
                <div className={`${isDarkMode ? "bg-[#423E3E]" : "bg-white"} rounded-lg shadow-xl p-6 border-2 border-black w-full max-w-3xl`}>
                    <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-[#20AFC5]" : "text-black"}`}>
                        Subject Information
                    </h2>

                    <div className="mb-4">
                        {editSubjectName ? (
                            <form onSubmit={handleSubjectNameUpdate} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className={`border-2 border-gray-400 p-2 rounded-md ${isDarkMode ? "!bg-gray-700 !text-white" : "!bg-white !text-black"} focus:outline-none focus:ring-2 focus:ring-[#20AFC5]`}
                                    placeholder="Enter new subject name"
                                    required
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="bg-[#20AFC5] text-white p-2 rounded-md hover:bg-[#1a8fa3] transition-all duration-300"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditSubjectName(false)}
                                        className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">
                                    Name: <span className="text-cyan-500">{subjectData.subjectName}</span>
                                </h3>
                                {canEdit && (
                                    <button
                                        onClick={() => setEditSubjectName(true)}
                                        className="bg-[#20AFC5] text-white px-4 py-1 rounded-md hover:bg-[#1a8fa3] transition-all duration-300"
                                    >
                                        Edit Name
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">Current Members</h3>
                        <ul className="max-h-60 overflow-y-auto border rounded-md p-2">
                            {subjectMembers.map((member) => (
                                <li
                                    key={member._id}
                                    className={`p-2 border-b last:border-b-0 ${
                                        isDarkMode ? "hover:bg-gray-900" : "hover:bg-gray-100"
                                    } transition-all duration-200`}
                                >
                                    {member.name} ({member.role})
                                </li>
                            ))}
                            {subjectMembers.length === 0 && (
                                <li className="p-2 text-gray-500">No members in this subject group</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    {canEdit && (
                        <div className={`${isDarkMode ? "bg-[#423E3E]" : "bg-white"} rounded-lg shadow-xl p-6 border-2 border-black`}>
                            <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-[#20AFC5]" : "text-black"}`}>
                                Member Management
                            </h2>

                            <div className="mb-4">
                                <button
                                    onClick={() => setShowAddMembers((prev) => !prev)}
                                    className="bg-[#20AFC5] text-white px-4 py-2 rounded-md hover:bg-[#1a8fa3] transition-all duration-300"
                                >
                                    {showAddMembers ? "Hide Add Members" : "Add Members"}
                                </button>
                                {showAddMembers && (
                                    <div className="mt-4">
                                        <ul className="max-h-40 overflow-y-auto border rounded-md p-2 mb-4">
                                            {Array.isArray(availableMembersToAdd) && availableMembersToAdd.length > 0 ? (
                                                availableMembersToAdd.map((member) => (
                                                    <li
                                                        key={member._id}
                                                        className={`flex justify-between items-center p-2 border-b last:border-b-0 ${
                                                            isDarkMode ? "hover:bg-gray-900" : "hover:bg-gray-100"
                                                        } transition-all duration-200`}
                                                    >
                                                        <span>
                                                            {member.name || "Unknown"} ({member.role || "Unknown"})
                                                        </span>
                                                        <button
                                                            onClick={() => toggleAddMember(member._id)}
                                                            className={`px-3 py-1 rounded-md text-white ${
                                                                selectedMembersToAdd.includes(member._id)
                                                                    ? "bg-green-500 hover:bg-green-600"
                                                                    : "bg-gray-500 hover:bg-gray-600"
                                                            } transition-all duration-200`}
                                                            disabled={!member._id}
                                                        >
                                                            {selectedMembersToAdd.includes(member._id) ? "Selected" : "Add"}
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <p>No members available to add</p>
                                            )}
                                        </ul>
                                        {selectedMembersToAdd.length > 0 && (
                                            <button
                                                onClick={addMembersToSubject}
                                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-300"
                                            >
                                                Confirm Add ({selectedMembersToAdd.length})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    onClick={() => setShowRemoveMembers((prev) => !prev)}
                                    className="bg-[#ff4c4c] text-white px-4 py-2 rounded-md hover:bg-[#e04343] transition-all duration-300"
                                >
                                    {showRemoveMembers ? "Hide Remove Members" : "Remove Members"}
                                </button>
                                {showRemoveMembers && (
                                    <div className="mt-4">
                                        <ul className="max-h-40 overflow-y-auto border rounded-md p-2 mb-4">
                                            {subjectMembers
                                                .filter((member) => member.role !== "Admin")
                                                .map((member) => (
                                                    <li
                                                        key={member._id}
                                                        className={`flex justify-between items-center p-2 border-b last:border-b-0 ${
                                                            isDarkMode ? "hover:bg-gray-900" : "hover:bg-gray-100"
                                                        } transition-all duration-200`}
                                                    >
                                                        <span>
                                                            {member.name || "Unknown"} ({member.role || "Unknown"})
                                                        </span>
                                                        <button
                                                            onClick={() => toggleRemoveMember(member._id)}
                                                            className={`px-3 py-1 rounded-md text-white ${
                                                                selectedMembersToRemove.includes(member._id)
                                                                    ? "bg-red-500 hover:bg-red-600"
                                                                    : "bg-gray-500 hover:bg-gray-600"
                                                            } transition-all duration-200`}
                                                            disabled={!member._id}
                                                        >
                                                            {selectedMembersToRemove.includes(member._id) ? "Selected" : "Remove"}
                                                        </button>
                                                    </li>
                                                ))}
                                            {subjectMembers.filter((member) => member.role !== "Admin").length === 0 && (
                                                <li className="p-2 text-gray-500">No members available to remove</li>
                                            )}
                                        </ul>
                                        {selectedMembersToRemove.length > 0 && (
                                            <button
                                                onClick={removeMembersFromSubject}
                                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-300"
                                            >
                                                Confirm Remove ({selectedMembersToRemove.length})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {canEdit && (
                        <div className={`${isDarkMode ? "bg-[#423E3E]" : "bg-white"} rounded-lg shadow-xl p-6 border-2 border-black`}>
                            <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? "text-[#20AFC5]" : "text-black"}`}>
                                Delete Subject Group
                            </h2>
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                className="bg-[#ff4c4c] text-white px-4 py-2 rounded-md hover:bg-[#e04343] transition-all duration-300"
                            >
                                Delete Subject Group
                            </button>
                            {deleteConfirm && (
                                <div className="mt-4 border-2 border-red-500 p-4 rounded-md">
                                    <p className="mb-4 text-red-500">
                                        Are you sure you want to delete this subject group? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={deleteSubjectGroup}
                                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-300"
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(false)}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {message && (
                <div className="mt-6 p-4 w-[50%] bg-cyan-100 text-cyan-700 rounded-md border-2 border-cyan-500">
                    {message}
                </div>
            )}
        </div>
    );
}

export default SubjectSettings;