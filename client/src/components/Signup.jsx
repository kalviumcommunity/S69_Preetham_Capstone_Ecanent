import '../components/Signup.css'
import React from 'react'
import google from "../assets/google.jpg"
import dgoogle from '../assets/darkgoogle.png'
import microsoft from "../assets/microsoft.jpg"
import dmicrosoft from '../assets/darkmicrosoft.png'
import apple from "../assets/apple.png"
import dapple from '../assets/darkapple2.png'
import {Link} from 'react-router-dom'   
import DarkMode from './DarkMode'
import axios from 'axios'
import { useState,useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


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

  const navigate = useNavigate();
  const isDarkMode = DarkMode();

  
  const checkName = (e)=>{
    const value = e.target.value
    setName(value)
    const trimmedValue = value.trim();
    const k = /^[A-Za-z]+([ '-][A-Za-z]+)*$/
    if(!k.test(trimmedValue)){
      setNameMatchErr("Only letters, spaces, hyphens, or apostrophes allowed")
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

  const onSubmit = async(e)=>{
    e.preventDefault();
    setErrorMessage("");
    try{
      const postData = await axios.post("http://localhost:3000/api/author/signup",{name,email,password},{ withCredentials: true })
      console.log("Signup successful:", postData.data);
      console.log(postData.status)
      if (postData.status === 201) {
        navigate("/verify-otp-middle");
      }
     
    }catch(error){
      if (error.response && error.response.status === 409) {
        setErrorMessage("User already exists! Please Log in.");
      } else if (error.response) {
        setErrorMessage(error.response.data.message || "Signup failed. Please try again.");
      } else {
        setErrorMessage("Server error. Please try again later.");
      }
    }
  }



  return (
    <div className={isDarkMode? 'not-main' : 'main'}>
      <form className={isDarkMode? 'not-form flex flex-col gap-3 lg:w-500px lg:h-918px ' : 'form flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF]'} onSubmit={onSubmit}>
        <h1 className='signup  font-bold text-[#20AFC5]'>Sign up</h1>
        <input type='text' placeholder='Name'  pattern="^[A-Za-z]+([ '\-][A-Za-z]+)*$" title='Only letters, spaces, hyphens, or apostrophes allowed' onChange={checkName} className={`${validName === null ? 'input' : validName ? 'input input-success' : 'input input-error'}`} required/>
        {nameMatchErr && <p className="text-red-500 text-sm">{nameMatchErr}</p>}


        <input className="input validator" type="email" required placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/>
        <div className="validator-hint hidden">Enter valid email address</div>
        



        <input type="password" className="input validator" required placeholder="Password" minLength="8" 
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
          title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" onChange={(e)=>setPassword(e.target.value)}/>
        <p className="validator-hint hidden text-center">
          Must be more than 8 characters, including
          <br/>* At least one number
          <br/>* At least one lowercase letter
          <br/>* At least one uppercase letter
        </p>

        <input type='password' placeholder='Confirm Password' onChange={confirmation} className={`${validPass === null ? 'input' : validPass ? 'input input-success': 'input input-error' }`}/>
        {passMatchErr && <p className="text-red-500 text-sm">{passMatchErr}</p>}

        <span><input type='checkbox' className='check'/><p>I accept the terms and conditions</p></span>
        <button type='submit' className='signup-btn bg-[#00DDFF]' >Sign up</button>
        {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
          <div className='hr flex gap-5'><hr className='justify-self-start w-[45%]'/><p className='justify-self-center'>OR</p><hr className='justify-self-end w-[45%]'/></div>
       
        <div>
        <Link to="/login"><button className='google border rounded-[5px]'><img src={isDarkMode ? dgoogle : google} className={`${isDarkMode  ? "max-w-[40px] p-1.5" : "max-w-[35px]"}`}/><p className='ml-0.5 font-semibold'>Continue with Google</p></button></Link> 
        </div>
        <p className='text-center font-bold text-sm'>Already have an account?</p>
        <Link to="/login" className='text-center text-[#20AFC5] font-bold'>Log In</Link>
      </form>
    </div>
  )
}
export default Signup
