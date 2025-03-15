import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Signup from './components/Signup'
import VerifyOTP from './Pages/VerifyOTP'
import VerifyOtpMiddle from './Pages/VerifyOtpMiddle'
import {ToastContainer} from 'react-toastify'


function App() {
  
  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/signup' element={<Signup/>}></Route>
        <Route path='/verify-otp' element={<VerifyOTP/>}></Route>
        <Route path='/verify-otp-middle' element={<VerifyOtpMiddle/>}></Route>
      </Routes>
      </div>

  )
}

export default App
