import { useState, useEffect } from "react";
import TextIcon from "../../assets/text-icon.png";
import "../App.css";
import BackgroundImage from "../../assets/bg-paper-icon.jpg";
import { useNavigate } from "react-router-dom";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setDevices,
  setHasDevicePermissions,
  setIsDevicesAlreadyFetchedTrue,
  setSelectedCameraDeviceId,
  setSelectedInputDeviceId,
  setSelectedOutputDeviceId,
} from "@/store/features/device/deviceSlice";
import type { IFrameWindowAction } from "types";

export default function Lander() {
  const dispatch = useAppDispatch();
  const naviagte = useNavigate();
  const { isDevicesAlreadyFetched } = useAppSelector((state) => state.device);
  const [frameState, setFrameState] = useState<IFrameWindowAction>("MINIMIZE");
  const { devices, hasPermissions, isLoading } = useMediaDevices();

  useEffect(() => {
    (async () => {
      await window.electronApi.getFrameState().then((res) => {
        setFrameState(res);
      });
    })()

    if (isDevicesAlreadyFetched) {
      // usecase is home always need to render as full screen
      window.electronApi.sendFrameAction(
        frameState === "MAXIMIZE" ? "MAXIMIZE" : "MAXIMIZE"
      );
      naviagte("/home");
      return;
    }

    if (!isLoading && hasPermissions && devices.audioInputs.length > 0) {
      // console.log("Devices innn", devices);
      dispatch(setDevices(devices));
      dispatch(setHasDevicePermissions(hasPermissions));
      dispatch(setSelectedInputDeviceId(devices.audioInputs[0].deviceId));
      dispatch(setSelectedCameraDeviceId(devices.videoInputs[0].deviceId));
      dispatch(setSelectedOutputDeviceId(devices.audioOutputs[0].deviceId));
      dispatch(setIsDevicesAlreadyFetchedTrue());
      // usecase is home always need to render as full screen
      window.electronApi.sendFrameAction(
        frameState === "MAXIMIZE" ? "MAXIMIZE" : "MAXIMIZE"
      );
      naviagte("/home");
    }
  }, [devices, hasPermissions, isLoading]);

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
      <span className="absolute bottom-10 webkit-drag-nodrag">Version 1.0</span>
    </div>
  );
}
