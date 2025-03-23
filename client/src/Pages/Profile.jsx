import React, { useEffect, useState } from "react";
import arrow from "../assets/arrow_back.png";
import user from "../assets/user.png";
import axios from "axios";
import "./Profile.css";
import { Link, useNavigate } from "react-router-dom";
import DarkMode from "../components/DarkMode";


function Profile() {
    const isDarkMode = DarkMode();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isProfileVisible, setIsProfileVisible] = useState(
      localStorage.getItem("showProfile") === "true" 
    );   
    const [toEditName,setToEditName] = useState(false);
    const [name,setName] = useState("");
    const [message,setMessage] = useState("");
    const [showAccount,setShowAccount] = useState(
        localStorage.getItem("showAccounts") === "true"
    );
    const [Todelete,setToDelete] = useState(false);
    

    useEffect(() => {
        const getProfile = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/user/profile", {
                    withCredentials: true,
                });
                
                const userData = res.data.userData || res.data;
                setProfile(userData);
              
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage("Failed to load profile");
                if (error.response?.status === 401 || error.response?.status === 400 || error.response?.status === 500) {
                    navigate("/login");
                }
            }
        };

        getProfile();
    }, [profile]);
    useEffect(() => {
      localStorage.setItem("showProfile", isProfileVisible);
     }, [isProfileVisible]);
    useEffect(() => {
        localStorage.setItem("showAccounts", showAccount);
    }, [showAccount]);
    if (!profile) {
        return <div>Loading profile...</div>;
    }
    const doProfile = ()=>{
      setIsProfileVisible(prev=>!prev);
      setShowAccount(false);
      setToEditName(false);
      const x = document.getElementById("edit");
      if(x) {
        x.style.display = "block";
      }
      const z = document.getElementById("Delete");
      if(z){
        z.style.display = "none";
      }
    }
    const doAccount = ()=>{
        setShowAccount(prev=>!prev);
        setIsProfileVisible(false);
        setToEditName(false);
        const x = document.getElementById("edit");
        if(x) {
            x.style.display = "none";
          }
          const z = document.getElementById("Delete");
          if(z){
            z.style.display = "block";
          }
    }
  const editName = ()=>{
    setIsProfileVisible(true)
    setToEditName(true);
    document.getElementById("edit").style.display = "none";
  }
  const deleteAccount = async()=>{
    try {
        const response = await axios.delete(
            "http://localhost:3000/api/user/delete",
            { withCredentials: true }
        );
        
        console.log(response)
        localStorage.clear();
        navigate("/login");
        setProfile(null);
        setMessage("Account deleted successfully!");
        console.log("Account deleted successfully!");
        setToEditName(false);
        setName("");
        setToDelete(false);
    } catch (error) {
        console.error("Error updating name:", error.response?.data || error);
        setMessage(error.response?.data?.message || "Failed to update name");
    }
  }
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
    return (
        <div className="">
            <button
                className="rounded-full w-[40px] h-[40px] ml-5 my-5 bg-[#20AFC5] flex justify-center items-center"
                onClick={() => navigate(-1)}>
                <img src={arrow} className="w-7 h-7" alt="Back" />
            </button>
            <div className="grid grid-cols-2 gap-3 ml-10">
                <div className="flex flex-col gap-10 ml-[150px] my-18 justify-center place-content-center">
                    <div className="border-2 rounded-full w-[247px] h-[247px] flex items-center justify-center bg-white">
                        <img src={user} alt="User" />
                    </div>
                    <div className="flex justify-center w-[257px]">
                        <h1 className="font-semibold text-2xl">{profile.name || "Name"}</h1>
                    </div>
                    <div className="box bg-amber-500 w-[300px] my-10 -ml-5">
                        <div className="flex flex-col gap-2">
                            <a
                                className="font-semibold"
                                onClick={doProfile}>
                                <img src={user} className="w-5 inline ml-5 mr-7" alt="Profile" />
                                Profile
                            </a>
                            <a className="font-semibold" >
                                <img src={user} className="w-5 inline ml-5 mr-7" alt="Chats" />
                                Chats
                            </a>
                            <a className="font-semibold"
                                onClick={doAccount}>
                                <img src={user} className="w-5 inline ml-5 mr-7" alt="Account"  />
                                Account
                            </a>
                        </div>
                    </div>
                </div>
                <div className="box w-[780px]  -mx-48">
                    <div className="flex flex-col">
                        <h2 className="ml-5 font-bold text-xl">Profile</h2>
                        {isProfileVisible && <pre>{JSON.stringify(profile, null, 2)}</pre>}
                    </div>
                    {isProfileVisible &&
                        <button className="flex justify-center p-2 my-3 rounded-[3px] text-white border-3 border-black font-semibold bg-[#9655b1]" onClick={editName}
                        id={"edit"}>
                        Edit Name
                        </button>
                       }  
                    {toEditName &&
                        <form className="my-5" onSubmit={handleEditName}>
                            <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} required/>
                            <button className="p-2 border-2 mt-3 rounded-md bg-cyan-500 text-white font-semibold">Submit</button>
                        </form>
                    }
                       {showAccount &&
                            <div>
                                <button className="flex justify-center p-2 my-3 rounded-[3px] text-white border-3 border-black font-semibold bg-[#ff4c4c]"
                               id={"Delete"} onClick={()=>setToDelete(true)}>
                              Delete Account
                               </button>
                            </div> 
                       }
                       {
                        Todelete && 
                        <form className="border-2 w-[30%] flex flex-col items-center rounded-md">
                            <p>Do you want to delete</p>
                            <div className="flex gap-5 ">
                                <button className="ml-5 bg-red-500 p-2 mb-5 mt-5 w-20" onClick={deleteAccount}>Yes</button>
                                <button className="ml-5 p-2 mb-5 mt-5 w-20 bg-cyan-500 mr-5" onClick={()=>setToDelete(false)}>No</button>
                            </div>
                        </form>
                       }
                </div>
            </div>
            <div className="-my-[15px]">
                <Link to="/">
                    <button className="bg-[#20AFC5] rounded-[3px] p-2 ml-5 pl-5 pr-5 border-3 border-[#000000] font-semibold text-white">
                        Log Out
                    </button>
                </Link>
            </div>
        </div>
    );
}
export default Profile;