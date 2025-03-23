import './Login.css'
import React from 'react'
import google from "../assets/google.jpg"
import dgoogle from '../assets/darkgoogle.png'
import {Link} from 'react-router-dom'
import { useState,useEffect } from 'react'
import DarkMode from "../components/DarkMode.jsx";
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'



function Login() {
  const [email,setEmail] = useState(localStorage.getItem("rememberedEmail") || "");
  const [password,setPassword] = useState("")
  const navigate = useNavigate();
  const [errorMessage,setErrorMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberedEmail") ? true : false);


  const isDarkMode = DarkMode();

  const onSubmit = async(e)=>{
    e.preventDefault();
    try {
      const data = await axios.post("http://localhost:3000/api/author/login",{email,password},{ withCredentials: true });
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


  return (
    
    <div className={isDarkMode? 'no-main' : 'mmain'}>
      <div className='contain'>
        <span className='span'><h1 className='font-extrabold text-[48px] pl-10 py-10' id='welcome'>WELCOME<br/> BACK!</h1></span>
        

        <form className={isDarkMode? 'no-form flex flex-col gap-3 lg:w-500px lg:h-918px' : 'mform flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF]'} onSubmit={onSubmit}>
        <h1 className='login  font-bold text-[#20AFC5]'>Log In</h1>
        <br/>
        <input type='text' placeholder='Email' value={email} onChange={(e)=>setEmail(e.target.value)}/>
        <input type='password' placeholder='Password' onChange={(e)=>setPassword(e.target.value)} />
      
        <span><input type='checkbox' className='check bg-[#423E3E] text-[#423E3E] ml-2 cursor-pointer' checked={rememberMe}
         onChange={() => setRememberMe(!rememberMe)} /><p>Remember Me</p>
        <Link to="/" className='text-center text-[#20AFC5] font-bold text-[12px]  self-end ml-8'>Forgot Password?</Link>
        </span>
        <button type='submit' className='login-btn bg-[#00DDFF] '>Log in</button>
        {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
        <div className='hr flex gap-5'><hr className='justify-self-start w-[45%]'/><p className='justify-self-center'>OR</p><hr className='justify-self-end w-[45%]'/></div>

          
  
        <Link to="/login"><button className='google-login border rounded-[5px]'><img src={isDarkMode ? dgoogle : google} className='max-w-[30px]'/><p className='ml-0.5 font-semibold'>Continue with Google</p></button></Link> 
        <p className='text-center font-bold text-sm'>Already have an account?</p>
        <Link to="/signup" className='text-center text-[#20AFC5] font-bold'>Sign Up</Link>
      </form>
   
      </div>
      
    </div>
  )
}

export default Login
