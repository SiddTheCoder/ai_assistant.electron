import React from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Lander from './pages/Lander'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lander />} />
    </Routes>
    </BrowserRouter>
  )
}
