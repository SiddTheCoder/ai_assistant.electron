import React, { useEffect, useState } from "react";
import PngLogoIcon from "../../../assets/icon-high-ql.png";
import { X, Minus, Square, Copy } from "lucide-react";

export default function Header() {
  const [isMainWindowMaximized, setIsMainWindowMaximized] = useState<boolean>(false);
  
  useEffect(() => {
    (async () => {
      const isMax = await window.electronApi.isMainWindowMaximized()
      setIsMainWindowMaximized(isMax);
    })();

    // continuis listen wndow frame state change 
    window.electronApi.onWindowMaximizeStateChange((isMainWinMaximized) => {
      setIsMainWindowMaximized(isMainWinMaximized);
    })
  }, []);

  console.log("Frame State main", isMainWindowMaximized);

  return (
    <div className="w-full min-h-8 bg-white/5 webkit-drag-drag flex justify-between items-center text-white">
      {/* Left Section */}
      <div className="p-1">
        <img src={PngLogoIcon} alt="icon" width={29} />
      </div>

      {/* Middle Section */}
      <div className="md:w-[70%] sm:w-[50%] w-96 flex justify-center items-center pl-25">
        <div className="border-[0.2px] webkit-drag-nodrag cursor-pointer transition-all duration-150 ease-in-out hover:border-black/50 border-white/5 w-[60%] h-7 rounded-md text-center hover:bg-black/5 bg-white/5 text-gray-300">
          <span className="text-[13px]">SPARK</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center gap-0 h-10 webkit-drag-nodrag">
        <ul
          onClick={() => window.electronApi.sendFrameAction("MINIMIZE")}
          className="hover:bg-white/10 h-full flex items-center justify-center w-12"
        >
          <Minus strokeWidth={0.75} size={20} />
        </ul>
        <ul
          onClick={() => window.electronApi.sendFrameAction("MAXIMIZE")}
          className="hover:bg-white/10 h-full flex items-center justify-center w-12"
        >
          {isMainWindowMaximized ? (
            <Copy strokeWidth={0.75} size={15} />
          ) : (
            <Square strokeWidth={0.75} size={15} />
          )}
        </ul>
        <ul
          onClick={() => window.electronApi.sendFrameAction("CLOSE")}
          className="hover:bg-red-500 h-full flex items-center justify-center w-12"
        >
          <X strokeWidth={0.75} size={20} />
        </ul>
      </div>
    </div>
  );
}
