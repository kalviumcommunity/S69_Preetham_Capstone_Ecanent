import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom'
import { useMediaQuery } from "react-responsive";
import Signup from './components/Signup';
import Login from './components/Login'
import Profile from './Pages/Profile'
import VerifyOTP from './Pages/VerifyOTP'
import VerifyOtpMiddle from './Pages/VerifyOtpMiddle'
import {ToastContainer} from 'react-toastify'
import Chat from './Pages/Chat'
import Settings from './Pages/Settings'
import SubjectSettings from './Pages/subjectSettings'
import FilePreviewPage from './Pages/FilePreviewPage'
import LandingPage from './Pages/LandingPage'
import MobileChat from './Pages/MobileChat'
import ForgetPasswordMiddle from './Pages/ForgetPasswordMiddle';
import ResetPassword from './Pages/ResetPassword';
import Selection from './components/selection';

function App() {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/signup' element={<Signup/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/verify-otp' element={<VerifyOTP/>}></Route>
        <Route path='/verify-otp-middle' element={<VerifyOtpMiddle/>}></Route>
        <Route path='/profile' element={<Profile/>}></Route>
        <Route path="/chat" element={isMobile ? <MobileChat /> : <Chat />} />
        <Route path="/subjectSettings" element={<SubjectSettings/>}></Route>        
        <Route path='/settings' element={<Settings/>}></Route>
        <Route path='/preview' element={<FilePreviewPage/>}></Route>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/forget-middle' element={<ForgetPasswordMiddle/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>
        <Route path='/selection' element={<Selection/>}></Route>
      </Routes>
    </div>  
  )
}

export default App
