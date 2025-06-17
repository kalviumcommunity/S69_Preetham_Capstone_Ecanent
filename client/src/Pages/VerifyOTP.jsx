import React, { useRef, useState } from 'react'
import DarkMode from "../components/DarkMode";
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'

import "./VerifyOTP.css"

function VerifyOTP() {

  const [errorMessage,setErrorMessage] = useState("")
  const [resendMessage,setResendMessage] = useState("")

  const {isDarkMode} = DarkMode();
  const navigate = useNavigate()

  const inputRef = useRef([])

  const handleInput = (e,index)=>{
    if(e.target.value.length > 0 && index<inputRef.current.length-1){
        inputRef.current[index+1].focus();
    }
  }

  const handleKeyDown = (e,index)=>{
    if(e.key === 'Backspace' && e.target.value === '' && index>0){
        inputRef.current[index-1].focus();
    }
  }

  const handlePaste = (e)=>{
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('');
    pasteArray.forEach((char,index) => {
        if(inputRef.current[index]){
            inputRef.current[index].value = char
        }
    });
  }

  const onSubmit = async(e)=>{
    try{
      e.preventDefault();
      const otpArray = inputRef.current.map(e=>e.value)
      const otp = otpArray.join("")
      const data = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/author/verify-account`,{otp}, { withCredentials: true })
      if(data.status === 200){
        toast.success("User Verified Successfully!")
        
        navigate("/chat");
      }
    }catch(error){
      if (error.response && error.response.status === 400) {
        setErrorMessage("OTP expired");
        toast.error("OTP expired")
      } else if (error.response) {
        setErrorMessage("Check OTP again.");
        toast.error("Check OTP again.")
      } else {
        console.log(error.message)
        setErrorMessage("Server error. Please try again later.");
        toast.error("Server error. Please try again later.")
      }
    }
    }
   
    const handleResendOtp = async()=>{
      setResendMessage("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/author/send-verify-otp`,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        setResendMessage("OTP has been resent. Please check your email.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setResendMessage("Failed to resend OTP. Please try again later.");
    }
    }
   
  
  return (
    <div className={isDarkMode? 'not-main' : 'main'}>
        <div className={isDarkMode? 'bg-[#3B3636] flex flex-col dark-shape' : 'bg-[#FFFFFF] flex flex-col shape'}>
            <h1 className={isDarkMode? 'text-[#00DDFF] text-3xl font-bold my-3 text-center' : 'text-[#20AFC5] text-3xl font-bold my-3 text-center'}>Email Verification</h1>
            <p className={isDarkMode? ' text-center text-white': 'text-center text-black'}>Enter the 6-digit code sent to your email ID.</p>
    

      <form className={isDarkMode? 'not-forgot-1 flex flex-col gap-3 lg:w-500px lg:h-918px my-15' : 'forgot-1 flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF] my-15'} onSubmit={onSubmit} >
        <div className='flex justify-between mb-8 mt-5 gap-1' onPaste={handlePaste}>
            {Array(6).fill(0).map((_,index)=>(
                <input type='text' maxLength='1' key={index} required className={ isDarkMode ? 'bg-[#3B3636] w-12 h-10 text-white text-center text-lg rounded-md' : 'bg-[#FFFFFF] w-12 h-10  text-black text-center text-lg rounded-md'} ref={e=>inputRef.current[index] = e} onInput={(e)=>handleInput(e,index)} onKeyDown={(e)=>handleKeyDown(e,index)} />
            ))}
        </div>
      <button type='submit' className='login-btn bg-[#00DDFF] '>Continue</button>
      {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
      </form>

      <div className="flex flex-col items-center">
          <button onClick={handleResendOtp} className="resend-btn bg-[#00DDFF] p-2 rounded-md">
            Resend OTP
          </button>
          {resendMessage && <p className="text-sm text-center mt-2">{resendMessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP
