import './Signup.css'
import React from 'react'
import google from "../assets/google.jpg"
import dgoogle from '../assets/darkgoogle.png'
import {Link,useNavigate} from 'react-router-dom'
import { useState,useEffect } from 'react'
import axios from 'axios'
import DarkMode from './DarkMode'
import { toast } from 'react-toastify'


function Signup() {
  const [name,setName] = useState("")
  
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPass,setConfirmPass] = useState("")
  const [passMatchErr,setPassMatchErr] = useState("")
  const [nameMatchErr,setNameMatchErr] = useState("")
  const [validName,setValidName] = useState(null)
  const [validPass,setValidPass] = useState(null)
  const [errorMessage, setErrorMessage] = useState("");
  const [institute,setInstitute] = useState("")
  const [role, setRole] = useState("");
  const [department,setDepartment] = useState("")



  const navigate = useNavigate();
  const [institutes,setInstitutes] = useState([]);

  useEffect(()=>{
    const res = async()=>{
      try {
        const data = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/institute`)
        console.log(data.data.institute)
        setInstitutes(data.data.institute); 
      } catch (error) {
        console.log(error.message);
      }
    }
    res();
  },[])

  const departments = ["CS","Physics","Chemistry"]


  const checkName = (e)=>{
    const value = e.target.value
    setName(value)
    const trimmedValue = value.trim();
    const k = /^[A-Za-z]+( [A-Za-z]+)*$/;
    if(!k.test(trimmedValue)){
      setNameMatchErr("Only letters allowed")
      setValidName(false)
    }else{
      setNameMatchErr("")
      setValidName(true)
    }
  }



  const confirmation = (e) => {
    setConfirmPass(e.target.value);

    if(e.target.value !== password){
        setPassMatchErr("Passwords do not match!");
        setValidPass(false)
    }else{
        setPassMatchErr("");
        setValidPass(true)
    }
  }


  const {isDarkMode} = DarkMode();

  const onSubmit = async(e)=>{
    e.preventDefault();
    setErrorMessage("");
    try{
      const postData = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/author/signup`,{name,email,password,institute, role},{ withCredentials: true })
      console.log("Signup successful:", postData.data);
      console.log(postData.status)
      if (postData.status === 201) {
        toast.success("Signed up Successfully!")
        navigate("/verify-otp-middle");
      }
     
    }catch(error){
      if (error.response && error.response.status === 409) {
        setErrorMessage("User already exists! Please Log in.");
        toast.error("User already exists! Please Log in.")
      } else if (error.response) {
        setErrorMessage(error.response.data.message || "Signup failed. Please try again.");
        toast.error("Signup failed. Please try again.")
      } else {
        setErrorMessage("Server error. Please try again later.");
        toast.error("Server error. Please try again later.")
      }
    }
  }

  const googleMove = ()=>{
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
  }



  return (
    <div className={isDarkMode? 'not-main' : 'main'}>
      <form className={isDarkMode? 'not-form flex flex-col gap-3 lg:w-500px lg:h-918px ' : 'form flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF]'} onSubmit={onSubmit}>
        <h1 className='signup  font-bold text-[#20AFC5]'>Sign up</h1>
        <input type='text' placeholder='Name'  pattern="^[A-Za-z]+([ '\-][A-Za-z]+)*$" title='Only letters allowed' onChange={checkName} className={`${validName === null ? 'input' : validName ? 'input input-success' : 'input input-error'} ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} required/>
        {nameMatchErr && <p className="text-red-500 text-sm">{nameMatchErr}</p>}


        <input className={`input validator ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} type="email" required placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/>
        <div className="validator-hint hidden">Enter valid email address</div>
        
        <select className={`border p-2 rounded-md ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="" disabled>
            Select your Role
          </option>
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
          <option value="Admin">Admin</option>
         </select>

         {role==="" || role !== "Admin" && (
                    <select
                        className="border p-2 rounded-md"
                        value={institute}
                        onChange={(e) => setInstitute(e.target.value)}
                        required={role !== "Admin"}
                    >
                        <option value="" disabled>
                            Select your Institute
                        </option>
                        {institutes.map((inst, index) => (
                            <option key={index} value={inst}>{inst}</option>
                        ))}
                    </select>
                )}

                {role==="Faculty" && (
                    <select
                        className="border p-2 rounded-md"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required={role !== ""}
                    >
                        <option value="" disabled>
                            Select your Department
                        </option>
                        {departments.map((inst, index) => (
                            <option key={index} value={inst}>{inst}</option>
                        ))}
                    </select>
                )}


        <input type="password" className={`input validator ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} required placeholder="Password" minLength="8" 
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
          title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" onChange={(e)=>setPassword(e.target.value)}/>
        <p className="validator-hint hidden text-center">
          Must be more than 8 characters, including
          <br/>* At least one number
          <br/>* At least one lowercase letter
          <br/>* At least one uppercase letter
        </p>

        <input type='password' placeholder='Confirm Password' onChange={confirmation} className={`${validPass === null ? 'input' : validPass ? 'input input-success': 'input input-error' } ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} required/>
        {passMatchErr && <p className="text-red-500 text-sm">{passMatchErr}</p>}

        <span ><input type='checkbox' className={`check cursor-pointer ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} required/><p>I accept the terms and conditions</p></span>
        <button type='submit' className='signup-btn bg-[#00DDFF]' >Sign up</button>
        {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
          <div className='hr flex gap-5'><hr className='justify-self-start w-[45%]'/><p className='justify-self-center'>OR</p><hr className='justify-self-end w-[45%]'/></div>
       
        <div>
        <button className='google border rounded-[5px]' onClick={googleMove}><img src={isDarkMode ? dgoogle : google} className={`${isDarkMode  ? "max-w-[40px] p-1.5" : "max-w-[35px]"}`}/><p className='ml-0.5 font-semibold'>Continue with Google</p></button>
        </div>
        <p className='text-center font-light text-sm'>Already have an account?</p>
        <Link to="/login" className='text-center text-[#20AFC5] font-bold'>Log In</Link>
      </form>
    </div>
  )
}

export default Signup
