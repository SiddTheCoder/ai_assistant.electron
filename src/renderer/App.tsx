import React from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Lander from './pages/Lander'
import Home from './pages/Home'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lander />} />
        <Route path="/home" element={<Home />} />
    </Routes>
    </BrowserRouter>
  )
}
