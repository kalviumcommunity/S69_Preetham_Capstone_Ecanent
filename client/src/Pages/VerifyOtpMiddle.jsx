import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';



function VerifyOtpMiddle() {
    const navigate = useNavigate();
    useEffect(()=>{
        const postOtp =async()=>{
            try{
                const postData = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/author/send-verify-otp`,{}, { withCredentials: true })
                // console.log("Signup successful:", postData.data);
                console.log(postData.status)
                if (postData.status === 200) {
                  navigate("/verify-otp");
                }
               
              }catch(error){
                console.log(error.message)
                if (error.response) {
                  navigate('/'); 
                  // console.log(error.message)

              } else {
                  console.error("Network or server error");
                  navigate('/'); 
              }
              }
        }
        postOtp();
    },[])
    
    
  return (
    <div>
      <h3>Loading ...</h3>
    </div>
  )
}

export default VerifyOtpMiddle
