// import React from 'react'
import { HashRouter, Route, Routes } from "react-router-dom"
import Lander from './pages/Lander'
import Home from './pages/Home'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Lander />} />
        <Route path="/home" element={<Home />} />
    </Routes>
    </HashRouter>
  )
}
