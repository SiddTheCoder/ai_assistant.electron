import { AudioInput } from "@/components/local/device/AudioInput";
import { VideoInputComponent } from "@/components/local/device/VideoInput";
import Header from "@/components/local/Header";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socketContextProvider";
import { useAppSelector } from "@/store/hooks";
import { useEffect, useEffectEvent } from "react";
// import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";


function Home() {
  const {socket, isConnected} = useSocket()
  const navigate = useNavigate();
  // const { audioInputDevices, videoInputDevices, audioOutputDevices } =
  //   useAppSelector((state) => state.device);
  // console.log("Devices", audioInputDevices, videoInputDevices, audioOutputDevices);

  useEffect(() => {
    if (!socket || !isConnected) return;
    console.log("trying to get new message")
    socket.emit("get-new-message");
    socket.on("new-message", (data) => {
      console.log("New message:", data);
    });
    // socket.emit("send-query", "Hello Good Morning Dude");
    // socket.on("query-result", (data) => {
    //   console.log("Query response:", data);
    // });

    return () => {
      socket.off("new-message");
    }
  }, [socket, isConnected]);
  return (
    <div className="h-screen w-screen bg-[#0F0E0E]">
      <Header />
      {/* <AudioInput />
      <VideoInputComponent /> */}
      <Button onClick={() => navigate("/")}>Back to home</Button>
    </div>
  );
}

export default Home;
