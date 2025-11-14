import React from 'react'
// @ts-ignore
import icon from "../../assets/text-icon.png";
import "../App.css"

export default function Lander() {
  return (
    <div className='h-screen w-screen webkit-drag-drag flex items-center justify-center'>
      <img src={icon} alt="ICON" width={600} />
    </div>
  )
}
