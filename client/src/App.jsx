import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Signup from './components/Signup'


function App() {
  
  return (

      <Routes>
        <Route path='/signup' element={<Signup/>}></Route>
       
      </Routes>

  )
}

export default App
