import React, { useEffect, useState } from "react";
import arrow from "../assets/arrow_back.png";
import user from "../assets/user.png";
import axios from "axios";
import "./Profile.css";
import { Link, useNavigate } from "react-router-dom";
import DarkMode from "../components/DarkMode";
import { toast } from "react-toastify";
import { MdVerified } from "react-icons/md";


function Profile() {
    const isDarkMode = DarkMode();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isProfileVisible, setIsProfileVisible] = useState(
        localStorage.getItem("showProfile") === "true"
    );
    const [showInstitutionInput, setShowInstitutionInput] = useState(false);
    const [institution, setInstitution] = useState("");
    const [all, setAll] = useState([]);
    const [chatall, setChatAll] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [showAll, setShowAll] = useState(
        localStorage.getItem("showChats") === "true"
    );
    const [addition, setAddition] = useState(false);
    const [createClass, setCreateClass] = useState(false);
    const [group, setGroup] = useState("");
    const [faculty, setFaculty] = useState([]);
    const [students, setStudents] = useState([]);
    const [toEditName, setToEditName] = useState(false);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [showAccount, setShowAccount] = useState(
        localStorage.getItem("showAccounts") === "true"
    );
    const [Todelete, setToDelete] = useState(false);
    const [editProfile, setEditProfile] = useState(true);
    const [editConfirm, setEditConfirm] = useState(false);
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const getProfile = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/profile", {
                    withCredentials: true,
                });
                const userData = res.data.userData || res.data;
                setProfile(userData);
                if (userData.role === "Admin" && (!userData.institution || userData.institution === "")) {
                    setShowInstitutionInput(true);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage("Failed to load profile");
                if (error.response?.status === 401 || error.response?.status === 400) {
                    navigate("/login");
                }
            }
        };

        const getAll = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/members", {
                    withCredentials: true,
                });
                setAll(res.data.members || []);
            } catch (error) {
                console.error("Error fetching members:", error);
                if (error.response?.status === 401 || error.response?.status === 400) {
                    navigate("/login");
                }
            }
        };

        getProfile();
        getAll();
        if (!showAll && !showAccount) {
            setIsProfileVisible(true);
        }
    }, [navigate]); 

    useEffect(() => {
        localStorage.setItem("showProfile", isProfileVisible);
    }, [isProfileVisible]);

    useEffect(() => {
        localStorage.setItem("showChats", showAll);
    }, [showAll]);

    useEffect(() => {
        localStorage.setItem("showAccounts", showAccount);
    }, [showAccount]);

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(
                "http://localhost:3000/api/class/create",
                { className: group, students: students, faculty: faculty, createdBy: profile._id },
                { withCredentials: true }
            );
            if (res.data.success) {
                console.log("Success");
                setAddition(false);

                toast.success("Class created")
                let it = document.getElementById("checker");
                if(it){
                    it.style.display = "none";
                }
                isProfileVisible(true);
            } else {
                console.error("Error creating group:", res.data.message);
            }
        } catch (error) {
            console.error("Error fetching members:", error.message);
        }
    };

    const handleInstitutionSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                "http://localhost:3000/api/user/update-institution",
                { institute: institution },
                { withCredentials: true }
            );
            if (response.data.success) {
                setProfile((prev) => ({ ...prev, institution: institution }));
                setShowInstitutionInput(false);
                setMessage("Institution updated successfully!");
                setInstitution("");
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error updating institution:", error.response?.data || error);
            setMessage(error.response?.data?.message || "Failed to update institution");
        }
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

            if (!allowedTypes.includes(file.type)) {
                toast.error("Invalid file type! Please upload a JPG or PNG image.");
                return;
            }
            setProfilePicFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleProfilePicSubmit = async () => {
        if (!profilePicFile) {
            setMessage("Please select an image to upload");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("profilePic", profilePicFile);
        formData.append("userId", profile._id);

        try {
            const response = await axios.put(
                "http://localhost:3000/api/visual/update-profile-pic",
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                setProfile((prev) => ({ ...prev, profilePic: response.data.user.profilePic }));
                setMessage("Profile picture updated successfully!");
                setProfilePicFile(null);
                setPreview(null);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error.response?.data || error);
            setMessage(error.response?.data?.message || "Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    if (!profile) {
        return <div>Loading profile...</div>;
    }

    const doProfile = () => {
        setIsProfileVisible((prev) => !prev);
        setShowAll(false);
        setShowAccount(false);
        setAddition(false);
        setToDelete(false);
        const x = document.getElementById("edit");
        if (x) {
            x.style.display = "block";
        }
        const y = document.getElementById("newGroup");
        if (y) {
            y.style.display = "none";
        }
        const z = document.getElementById("delete");
        if (z) {
            z.style.display = "none";
        }
        setSelectedMembers([]);
    };

    const doAll = () => {
        setShowAll((prev) => !prev);
        setIsProfileVisible(false);
        setAddition(false);
        setShowAccount(false);
        setToEditName(false);
        setToDelete(false);
        const x = document.getElementById("edit");
        if (x) {
            x.style.display = "none";
        }
        const y = document.getElementById("newGroup");
        if (y) {
            y.style.display = "block";
        }
        const z = document.getElementById("delete");
        if (z) {
            z.style.display = "none";
        }
        setSelectedMembers([]);
    };

    const doAccount = () => {
        setShowAccount((prev) => !prev);
        setShowAll(false);
        setAddition(false);
        setIsProfileVisible(false);
        setToEditName(false);
        const x = document.getElementById("edit");
        if (x) {
            x.style.display = "none";
        }
        const y = document.getElementById("newGroup");
        if (y) {
            y.style.display = "none";
        }
        const z = document.getElementById("delete");
        if (z) {
            z.style.display = "block";
        }
    };

    const newGroup = () => {
        setChatAll(all.filter((k) => k.role !== "Admin"));
        setIsProfileVisible(false);
        setShowAll(false);
        setAddition(true);
        setToDelete(false);
        const x = document.getElementById("edit");
        if (x) {
            x.style.display = "none";
        }
        const y = document.getElementById("newGroup");
        if (y) {
            y.style.display = "none";
        }
        const z = document.getElementById("delete");
        if (z) {
            z.style.display = "none";
        }
    };

    const toggleSelection = (memberId, role) => {
        setSelectedMembers((prevSelected) =>
            prevSelected.includes(memberId)
                ? prevSelected.filter((id) => id !== memberId)
                : [...prevSelected, memberId]
        );
        if (role !== "Student") {
            setFaculty((prevFaculty) =>
                prevFaculty.includes(memberId)
                    ? prevFaculty.filter((id) => id !== memberId)
                    : [...prevFaculty, memberId]
            );
        } else {
            setStudents((prevStudents) =>
                prevStudents.includes(memberId)
                    ? prevStudents.filter((id) => id !== memberId)
                    : [...prevStudents, memberId]
            );
        }
    };

    const editName = () => {
        setShowAll(false);
        setAddition(false);
        setIsProfileVisible(true);
        setToEditName(true);
        document.getElementById("newGroup").style.display = "none";
        document.getElementById("edit").style.display = "none";
    };

    const deleteAccount = async () => {
        try {
            const response = await axios.delete("http://localhost:3000/api/user/delete", {
                withCredentials: true,
            });
            localStorage.clear();
            navigate("/signup");
            setProfile(null);
            setMessage("Account deleted successfully!");
            setToEditName(false);
            setName("");
            setToDelete(false);
        } catch (error) {
            console.error("Error deleting account:", error.response?.data || error);
            setMessage(error.response?.data?.message || "Failed to delete account");
        }
    };

    const handleEditName = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                "http://localhost:3000/api/user/update-name",
                { name: name },
                { withCredentials: true }
            );
            if (response.data.success) {
                setProfile((prev) => ({ ...prev, name: name }));
                setMessage("Name updated successfully!");
                setToEditName(false);
                setName("");
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error updating name:", error.response?.data || error);
            setMessage(error.response?.data?.message || "Failed to update name");
        }
    };

    const changeProfile = () => {
        setEditProfile(false);
        setEditConfirm(true);
    };

    const confirmChangeProfile = () => {
        setEditConfirm(false);
        setEditProfile(true);
        handleProfilePicSubmit();
    };

    const cancelChangeProfile = () => {
        setEditConfirm(false);
        setEditProfile(true);
        setProfilePicFile(null);
        setPreview(null);
    };

    return (
        <div className="min-h-screen p-4 lg:p-6 overflow-hidden">
            <button
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-[#20AFC5] flex justify-center items-center mb-4 lg:mb-6"
                onClick={() => navigate(-1)}
            >
                <img src={arrow} className="w-6 h-6 lg:w-7 lg:h-7" alt="Back" />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-2">
                <div className="flex flex-col items-center lg:items-center gap-8 lg:gap-10">
                    <div className="border-2 rounded-full w-[150px] h-[150px] lg:w-[200px] lg:h-[200px] xl:w-[247px] xl:h-[247px] flex items-center justify-center bg-white overflow-hidden">
                        <img
                            src={preview || (profile.profilePic ? profile.profilePic : user)}
                            alt="User"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="flex justify-center w-full lg:w-[257px] -mt-6 lg:-mt-8 mb-4 lg:mb-5">
                        {editProfile && (
                            <button
                                className="border-2 bg-red-500 p-2 text-white font-semibold rounded-md text-sm sm:text-base"
                                onClick={changeProfile}
                            >
                                Edit
                            </button>
                        )}
                        {editConfirm && (
                            <div className="flex gap-2">
                                <button
                                    className="border-2 bg-green-500 p-2 text-white font-semibold rounded-md text-sm sm:text-base"
                                    onClick={confirmChangeProfile}
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : "Confirm"}
                                </button>
                                <button
                                    className="border-2 bg-gray-500 p-2 text-white font-semibold rounded-md text-sm sm:text-base"
                                    onClick={cancelChangeProfile}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    {editConfirm && (
                        <div className="flex flex-col items-center w-full sm:w-[50%] gap-4 sm:gap-5 cursor-pointer">
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleProfilePicChange}
                                className="mb-2 cursor-pointer text-sm sm:text-base"
                            />
                        </div>
                    )}
                    <div className="flex justify-center w-full lg:w-[257px]">
                        <h1 className="font-semibold text-xl sm:text-2xl">{profile.name || "Name"}</h1>
                    </div>
                    <div className="box bg-amber-500 w-full lg:w-[300px] my-6 lg:my-8">
                        <div className="flex flex-col gap-2 p-4">
                            <a className="font-semibold text-sm sm:text-base" onClick={doProfile}>
                                <img src={user} className="w-4 sm:w-5 inline mr-4 sm:mr-7" alt="Profile" />
                                Profile
                            </a>
                            <a className="font-semibold text-sm sm:text-base" onClick={doAll}>
                                <img src={user} className="w-4 sm:w-5 inline mr-4 sm:mr-7" alt="Chats" />
                                Chats
                            </a>
                            <a className="font-semibold text-sm sm:text-base" onClick={doAccount}>
                                <img src={user} className="w-4 sm:w-5 inline mr-4 sm:mr-7" alt="Account" />
                                Account
                            </a>
                        </div>
                    </div>
                </div>
                <div className="box w-full shadow-md ">
                <div className="flex flex-col   ">
      {isProfileVisible && (
        <div className="w-full max-w-2xl p-6 sm:p-8 rounded-lg shadow-md">
          {/* Modified: Added max-w-2xl to constrain the width on larger screens, added padding, background, rounded corners, and shadow for a card-like appearance */}
          <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl underline mb-6 hover:text-cyan-500">
            Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl w-32 hover:text-cyan-500">
                Name:
              </span>
              {/* Modified: Adjusted font size, added w-32 to align labels consistently */}
              <p className="text-cyan-500 text-lg sm:text-xl flex-1 font-semibold">
                {profile.name}
              </p>
              {/* Modified: Adjusted font size, used flex-1 to take remaining space */}
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl w-32 hover:text-cyan-500">
                Email:
              </span>
              <p className="text-cyan-500 text-lg sm:text-xl flex-1 font-semibold">
                {profile.email}
              </p>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl w-32 hover:text-cyan-500">
                Institution:
              </span>
              <p className="text-cyan-500 text-lg sm:text-xl flex-1 font-semibold">
                {profile.institution}
              </p>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl w-32 hover:text-cyan-500">
                Role:
              </span>
              <p className="text-cyan-500 text-lg sm:text-xl flex-1 font-semibold">
                {profile.role}
              </p>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl w-32 hover:text-cyan-500">
                Email Verified:
              </span>
              <p className="text-cyan-500 text-lg sm:text-xl flex items-center font-semibold">
                {profile.isVerified ? (
                  <MdVerified className="ml-2 text-cyan-500" />
                ) : (
                  "Not Verified"
                )}
              </p>
              {/* Modified: Added conditional styling for the verification icon based on isVerified */}
            </div>
          </div>
        </div>
      )}

                        {profile.role === "Admin" &&
                        (!profile.institution || profile.institution === "") &&
                        showInstitutionInput ? (
                            <form onSubmit={handleInstitutionSubmit} className="flex flex-col gap-2">
                                <input
                                    placeholder="Enter your Institution"
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    className="border p-2 rounded text-sm sm:text-base"
                                />
                                <button className="bg-green-400 p-2 rounded-md text-sm sm:text-base">Submit</button>
                            </form>
                        ) : null}
                        {showAll && (
                            <div>
                                <h2 className="font-bold text-lg lg:text-3xl underline mb-4">Chat</h2>

                                <ul className="mt-2  overflow-y-auto border rounded text-sm sm:text-base">
                                    {all.map((member, index) => (
                                        <li key={index} className="cursor-pointer hover:bg-gray-200 p-2">
                                            {profile.name === member.name ? "You" : member.name} ({member.role})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        {profile.role === "Admin" ? (
                            <div className="h-[98%] max-h-full">
                                {isProfileVisible && (
                                    <button
                                        className="flex justify-center p-2 my-3 rounded text-white border-2 border-black font-semibold bg-[#9655b1] text-sm sm:text-base w-full sm:w-auto"
                                        onClick={editName}
                                        id="edit"
                                    >
                                        Edit Name
                                    </button>
                                )}
                                {toEditName && (
                                    <form className="my-4 flex flex-col gap-2" onSubmit={handleEditName}>
                                        <input
                                            placeholder="Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="border p-2 rounded text-sm sm:text-base"
                                        />
                                        <button className="p-2 border-2 rounded-md bg-cyan-500 text-white font-semibold text-sm sm:text-base">
                                            Submit
                                        </button>
                                    </form>
                                )}
                                {showAll && (
                                    <button
                                        className="flex justify-center p-2 my-3 rounded text-white border-2 border-black font-semibold bg-[#20AFC5] text-sm sm:text-base w-full sm:w-auto"
                                        onClick={newGroup}
                                        id="newGroup"
                                    >
                                        Create New Group
                                    </button>
                                )}
                                {addition && (
                                    <ul className="mt-2 max-h-[80%] overflow-y-auto border rounded text-sm sm:text-base">
                                        {chatall.map((member, index) => (
                                            <div key={member._id} className="flex justify-between border-b-2 p-2">
                                                <li className="cursor-pointer p-1">
                                                    {member.name} ({member.role})
                                                </li>
                                                <button
                                                    className={`border-2 p-1 ${
                                                        selectedMembers.includes(member._id)
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-200"
                                                    } text-sm sm:text-base`}
                                                    onClick={() => toggleSelection(member._id, member.role)}
                                                >
                                                    {selectedMembers.includes(member._id) ? "Selected" : "Add"}
                                                </button>
                                            </div>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : null}
                    </div>
                    {selectedMembers.length > 0 ? (
                        <div className="mt-4" id="checker">
                            <p className="mb-2 text-sm sm:text-base">
                                {selectedMembers.length > 0 ? `Total Selected: ${selectedMembers.length}` : ""}
                            </p>
                            <form className="flex flex-col sm:flex-row gap-2" onSubmit={onSubmit}>
                                <input
                                    placeholder="Enter Class group name"
                                    value={group}
                                    className="border p-2 rounded text-sm sm:text-base"
                                    required
                                    onChange={(e) => setGroup(e.target.value)}
                                />
                                <button
                                    className="border-2 border-black bg-cyan-500 p-2 rounded text-white font-semibold text-sm sm:text-base"
                                    onClick={() => setCreateClass(true)}
                                >
                                    Create
                                </button>
                            </form>
                        </div>
                    ) : null}
                    {showAccount && (
                        <div className="mt-4">
                            <h2 className="font-bold text-lg lg:text-3xl underline mb-4">Account</h2>

                            <button
                                className="flex justify-center p-2 my-3 rounded text-white border-2 border-black font-semibold bg-[#ff4c4c] text-sm sm:text-base w-full sm:w-auto"
                                id="delete"
                                onClick={() => setToDelete(true)}
                            >
                                Delete Account
                            </button>
                        </div>
                    )}
                    {Todelete && (
                        <form className="border-2 w-full sm:w-[30%] flex flex-col items-center rounded-md mt-4 p-4">
                            <p className="mb-4 text-sm sm:text-base">Do you want to delete</p>
                            <div className="flex gap-2 sm:gap-5">
                                <button
                                    className="bg-red-500 p-2 w-20 text-sm sm:text-base"
                                    onClick={deleteAccount}
                                >
                                    Yes
                                </button>
                                <button
                                    className="bg-cyan-500 p-2 w-20 text-sm sm:text-base"
                                    onClick={() => setToDelete(false)}
                                >
                                    No
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <Link to="/">
                    <button className="bg-[#20AFC5] rounded p-2 border-2 border-[#000000] font-semibold text-white text-sm sm:text-base">
                        Log Out
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Profile;