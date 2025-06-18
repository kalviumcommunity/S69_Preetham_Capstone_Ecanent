import './Login.css'
import React from 'react'
import google from "../assets/google.jpg"
import dgoogle from '../assets/darkgoogle.png'
import {Link} from 'react-router-dom'
import { useState,useEffect } from 'react'
import DarkMode from './DarkMode'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'



function Login() {
  const [email,setEmail] = useState(localStorage.getItem("rememberedEmail") || "");
  const [password,setPassword] = useState("")
  const navigate = useNavigate();
  const [errorMessage,setErrorMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberedEmail") ? true : false);
  const [showPassword, setShowPassword] = useState(false);


  const {isDarkMode} = DarkMode();

  const onSubmit = async(e)=>{
    e.preventDefault();
    try {
      const data = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/author/login`,{email,password},{ withCredentials: true });
      if(data.status===200){
        toast.success("Logged in Successfully!")
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        navigate("/chat");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage("User doesn't exist! Please Sign up, Or check your email and password.");
        toast.error("User doesn't exist! Please Sign up, Or check your email and password.")
      } else if (error.response) {
        setErrorMessage(error.response.data.message || "Login failed. Please try again.");
        toast.error("Login failed. Please try again.")

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
    
    <div className={isDarkMode? 'no-main' : 'mmain'}>
      <div className='contain'>
      <span className="span">
            <div className="gradient-overlay"></div>
            <h1 className="font-extrabold text-[48px] pl-10 py-10 relative z-10" id="welcome">
              WELCOME<br /> BACK!
            </h1>
          </span>
        

        <form className={isDarkMode? 'no-form flex flex-col gap-3 lg:w-500px lg:h-918px' : 'mform flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF]'} onSubmit={onSubmit}>
        <h1 className={`login  font-bold ${isDarkMode ? "!text-[#0adeff] " : "!text-[#20AFC5] "} `}>Log In</h1>
        <br/>
        <input type='text' placeholder='Email' value={email} onChange={(e)=>setEmail(e.target.value)} className={`${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} required/>
        <div>
            <input type={showPassword ? "text" : "password"} placeholder='Password' onChange={(e)=>setPassword(e.target.value)} className={`${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`}/>
            <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-7 translate-y-2 text-gray-500 hover:text-cyan-600"
          >
        {showPassword ? <FaEye size={20}/> : <FaRegEyeSlash size={20} />}
      </button>
      </div>      
        <span><input type='checkbox' className={`check bg-[#423E3E] text-[#423E3E] ml-2 cursor-pointer ${isDarkMode? '!text-white !bg-[#3B3636]' : '!text-black !bg-white'}`} checked={rememberMe}
         onChange={() => setRememberMe(!rememberMe)} /><p>Remember Me</p>
        <Link to="/forget-middle" className='text-center text-[#20AFC5] font-bold text-[12px]  self-end ml-8'>Forgot Password?</Link>
        </span>
        <button type='submit' className={`login-btn bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-cyan-600 hover:to-teal-500 transition-all duration-300 ${isDarkMode ? "!text-white " : "!text-white "} `}>Log in</button>
        {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
        <div className='hr flex gap-5'><hr className='justify-self-start w-[45%]'/><p className='justify-self-center'>OR</p><hr className='justify-self-end w-[45%]'/></div>

          
  
        <Link to="/login"><button className='google-login border rounded-[5px]'  onClick={googleMove}><img src={isDarkMode ? dgoogle : google} className='max-w-[30px]'/><p className='ml-0.5 font-semibold'>Continue with Google</p></button></Link> 
        <p className='text-center font-light text-sm'>Don't have an account?</p>
        <Link to="/signup" className='text-center text-[#20AFC5] font-bold'>Sign Up</Link>
      </form>
   
      </div>
      
    </div>
  )
}

export default Login
