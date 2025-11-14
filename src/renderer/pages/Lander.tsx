// import { useState, useEffect, useMemo } from "react";
// @ts-ignore
import TextIcon from "../../assets/text-icon.png";
import "../App.css";
// @ts-ignore
import BackgroundImage from "../../assets/bg-paper-icon.jpg";

export default function Lander() {
  (async () => {
    const devs = await window.electronApi.getMediaDevices();
    console.log("Devs", devs);
  })();
  return (
    <div
      className="h-screen w-screen webkit-drag-drag flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <img src={TextIcon} alt="ICON" width={600} />
      <span className="absolute bottom-10">Version 1.0</span>
    </div>
  );
}
