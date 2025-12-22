import AuthLanderBg from "../../assets/AuthLanderBg.jpg";
import SparkIcon from "../../assets/icon.png";
import MinimalHeader from "@/components/local/MinimalHeader";
import { useNavigate } from "react-router-dom";
import { RippleButton } from "@/components/ui/ripple-button";
import { Button } from "@/components/ui/button";

import Icon from "../../assets/icon.png"
import {toast} from "sonner"
import { useAppDispatch } from "@/store/hooks";
import { getCurrentUser } from "@/store/features/auth/authThunks";

function Title() {
  return (
    <div className="webkit-drag-nodrag flex items-center mr-10 mt-10">
      <img src={SparkIcon} className="mt-8 w-16 lg:w-35" />
      <span className="relative font-science text-black/75 lg:text-8xl md:text-6xl text-4xl font-bold mt-10">
        S P A R K
        <span className="webkit-drag-nodrag text-[12px] absolute top-0 border-2 rounded-full p-1 hover:scale-110 right-[-25px]">
          AI
        </span>
      </span>
    </div>
  );
}

function DescribeApp() {
  return (
    <div className="webkit-drag-nodrag mt-5 text-gray-800/75 lg:text-2xl md:text-xl text-lg font-medium">
      Your Personal AI Assistant for Effortless Productivity
    </div>
  );
}

function EntranceMaker() {
  const navigate = useNavigate();
  return (
    <div className="webkit-drag-nodrag mt-60 flex flex-col gap-4 items-center">
      <RippleButton
        onClick={() => navigate("/auth/register")}
        rippleColor="#ADD8E6"
      >
        Create a new Account
      </RippleButton>
      <span className="text-gray-800 text-[15px]">
        Already have an Account?{" "}
        <span onClick={() => navigate("/auth/sign-in")} className="hover:underline cursor-pointer">Login</span>
      </span>
    </div>
  );
}


export default function AuthLander() {

  const dispatch = useAppDispatch()
  const addToken = async() => {
    console.log("adding token")
    await window.electronApi.saveToken("access_token","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTJmZGNmOTcyYzg3ZTUxMjMyNTZlYzAiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2MzA1MTk3LCJleHAiOjE3NjYzMDY5OTcsImlzcyI6InNwYXJrLWFwaSJ9.gGQ5icR7IqZdPolY7EEV5ynbK8MplSSbocGUtNJxp8g")
    await window.electronApi.saveToken("refresh_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTJmZGNmOTcyYzg3ZTUxMjMyNTZlYzAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2NjMwNTE5NywiZXhwIjoxNzY2OTA5OTk3LCJpc3MiOiJzcGFyay1hcGkifQ.qI948w5CdtkBMVrwK_LSKlKIeM_ENsM_5svbJwNE83o")
    const access_token = await window.electronApi.getToken("access_token")
    const refresh_token = await window.electronApi.getToken("refresh_token")
    console.log("access_toekn ", access_token)
    console.log("refresh_token ", refresh_token)
  }

  const hey = () => {
    toast.error("Error occured while getting current user from authThunk", 
      {description:"Error", icon : Icon}
  )
  }

  return (
    <div
      className="h-screen w-screen webkit-drag-drag select-none"
      style={{
        backgroundImage: `url(${AuthLanderBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full h-full flex items-center relative flex-col backdrop-blur-xs">
        <MinimalHeader />
        <Title />
        <DescribeApp />
        <EntranceMaker />
        <Button className="webkit-drag-nodrag" onClick={() => addToken()}>hey</Button>
        <span className="absolute bottom-5 text-sm text-gray-900">V.1.0.0</span>
      </div>
    </div>
  );
}
