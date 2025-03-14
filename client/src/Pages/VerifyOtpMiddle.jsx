import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';



function VerifyOtpMiddle() {
    const navigate = useNavigate();
    useEffect(()=>{
        const postOtp =async()=>{
            try{
                const postData = await axios.post("http://localhost:3000/api/author/send-verify-otp",{}, { withCredentials: true })
                // console.log("Signup successful:", postData.data);
                console.log(postData.status)
                if (postData.status === 200) {
                  navigate("/verify-otp");
                }
               
              }catch(error){
                console.log(error.message)
                if (error.response) {
                //   navigate('/'); 
                  console.log(error.message)

              } else {
                  console.error("Network or server error");
                  console.log(error.message)

                //   navigate('/'); 
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
