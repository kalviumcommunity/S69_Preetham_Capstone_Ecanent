import '../components/Signup.css'
import React from 'react'
import google from "../assets/google.jpg"
import dgoogle from '../assets/darkgoogle.png'
import microsoft from "../assets/microsoft.jpg"
import dmicrosoft from '../assets/darkmicrosoft.png'
import apple from "../assets/apple.png"
import dapple from '../assets/darkapple2.png'
import {Link} from 'react-router-dom'   
import { useState,useEffect } from 'react'


function Signup() {
  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [confirmPass,setConfirmPass] = useState("")


  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    function checkTime() {
      const hours = new Date().getHours();
      if (hours >= 18 || hours < 6) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    }

   
    checkTime();
    const intervalId = setInterval(checkTime, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);


  return (
    <div className={isDarkMode? 'not-main' : 'main'}>
      <form className={isDarkMode? 'not-form flex flex-col gap-3 lg:w-500px lg:h-918px ' : 'form flex flex-col gap-3 lg:w-500px lg:h-918px bg-[#FFFFFF]'}>
        <h1 className='signup  font-bold text-[#20AFC5]'>Sign up</h1>
        <input type='text' placeholder='Name' onChange={(e)=>setName(e.target.value)} />
        <input type='email' placeholder='Email' onChange={(e)=>setEmail(e.target.value)}/>
        <input type='password' placeholder='Password' onChange={(e)=>setPassword(e.target.value)} />
        <input type='password' placeholder='Confirm Password' onChange={(e)=>setConfirmPass(e.target.value)} />
        <span><input type='checkbox' className='check'/><p>I accept the terms and conditions</p></span>
        <button type='submit' className='signup-btn bg-[#00DDFF]' >Sign up</button>
          <hr/>
        <p className='text-sm'>Or signup using your account:</p>
        <div className='grid grid-cols-3 '>
          <a><img src={isDarkMode ? dgoogle : google} className='max-w-[40px] ml-[45px]'/></a>
          <a><img src={isDarkMode ? dmicrosoft : microsoft} className='max-w-[40px] ml-5'/><img/></a>
          <a><img src={isDarkMode ? dapple : apple} className={isDarkMode?'max-w-[80px] -mt-2 -ml-2':'max-w-[80px] -mt-2 -ml-5'}/><img/></a>
        </div>
        <p className='text-center font-bold text-sm'>Already have an account?</p>
        <Link to="/login" className='text-center text-[#20AFC5] font-bold'>Log In</Link>
      </form>
    </div>
  )
}

export default Signup
