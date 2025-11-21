import Header from "@/components/local/Header";
import CenterPanel from "@/components/local/home/CenterPanel";
import LeftPanel from "@/components/local/home/LeftPanel";
import RightPanel from "@/components/local/home/RightPanel";
import { useSocket } from "@/context/socketContextProvider";
import { useEffect } from "react";

function Home() {
  const { socket, isConnected } = useSocket();
  // const { audioInputDevices, videoInputDevices, audioOutputDevices } =
  //   useAppSelector((state) => state.device);
  // console.log("Devices", audioInputDevices, videoInputDevices, audioOutputDevices);

  // useEffect(() => {
  //   if (!socket || !isConnected) return;
  //   // console.log("trying to get new message");
  //   // socket.emit("get-new-message");
  //   // socket.on("new-message", (data) => {
  //   //   console.log("New message:", data);
  //   // });
  //   // socket.emit("send-query", "Hello Good Morning Dude");
  //   // socket.on("query-result", (data) => {
  //   //   console.log("Query response:", data);
  //   // });

  //   return () => {
  //     socket.off("new-message");
  //   };
  // }, [socket, isConnected]);

  return (
    <div className="h-screen w-screen bg-[#070818] text-white overflow-hidden">
      <Header />
      <div className="w-full h-full flex justify-between">
        <div className="h-full lg:w-[300px] w-60">
          <LeftPanel />
        </div>
        <div className="h-full flex-1 border-r border-l border-white/5">
          <CenterPanel />
        </div>
        <div className="h-full lg:w-[300px] w-60">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default Home;
