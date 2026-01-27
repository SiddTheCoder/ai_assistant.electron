import { useEffect, useRef } from "react";
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
import { tokenRefreshManager } from "@/lib/auth/tokenRefreshManager";
import { getCurrentUser } from "@/store/features/auth/authThunks";

export default function Lander() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {selectedCameraDeviceId,selectedInputDeviceId, selectedOutputDeviceId} = useAppSelector((state) => state.device);
  const { devices, hasPermissions, isLoading } = useMediaDevices();
  const { isDevicesAlreadyFetched } = useAppSelector((state) => state.device);
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Prevent multiple navigations
    if (hasNavigated.current) return;

    const initialize = async () => {
      try {
        // STEP 1: Check authentication FIRST
        const token = await tokenRefreshManager.getValidAccessToken()

        if (!token) {
          console.log("❌ No access token found, navigating to auth.");
          hasNavigated.current = true;
          navigate("/auth/lander");
          return;
        }

        //get current user and add to state
        dispatch(getCurrentUser())
        console.log("✅ Access token found, user is authenticated.");

        // STEP 2: If devices already fetched, go directly to home
        if (isDevicesAlreadyFetched) {
          console.log("✅ Devices already fetched, navigating to home.");
          window.electronApi.sendFrameAction("MAXIMIZE");
          hasNavigated.current = true;
          navigate("/home");
          return;
        }

        // STEP 3: Wait for device loading to complete
        console.log("🔄 Device loading state:", {
          isLoading,
          hasPermissions,
          devices,
        });

        if (isLoading) {
          console.log("⏳ Still loading devices, waiting...");
          return;
        }

        // STEP 4: Debug device state
        console.log("📱 Device check:", {
          hasPermissions,
          audioInputCount: devices.audioInputs.length,
          audioOutputCount: devices.audioOutputs.length,
          videoInputCount: devices.videoInputs.length,
          audioInputs: devices.audioInputs,
          videoInputs: devices.videoInputs,
          audioOutputs: devices.audioOutputs,
        });

        // STEP 5: Setup devices if available
       if (hasPermissions && devices.audioInputs.length > 0) {
         console.log(
           "✅ Device permissions granted and devices found, setting up..."
         );

         dispatch(setDevices(devices));
         dispatch(setHasDevicePermissions(hasPermissions));
         if (selectedInputDeviceId === null && devices.audioInputs.length > 0) {
           dispatch(setSelectedInputDeviceId(devices.audioInputs[0].deviceId));
         }

         // Set speaker if available
         if (selectedOutputDeviceId === null && devices.audioOutputs.length > 0) {
           dispatch(
             setSelectedOutputDeviceId(devices.audioOutputs[0].deviceId)
           );
         }

         // Set camera if available
         if (selectedCameraDeviceId === null && devices.videoInputs.length > 0) {
           dispatch(setSelectedCameraDeviceId(devices.videoInputs[0].deviceId));
         }

         dispatch(setIsDevicesAlreadyFetchedTrue());

         window.electronApi.sendFrameAction("MAXIMIZE");
         hasNavigated.current = true;
         navigate("/home");
         return;
       }

        // STEP 6: Handle missing permissions or devices
        if (!hasPermissions) {
          console.warn(
            "⚠️ Missing device permissions, navigating to home anyway"
          );
        } else if (devices.audioInputs.length === 0) {
          console.warn(
            "⚠️ No audio input devices found, navigating to home anyway"
          );
        }

        // Navigate to home even without devices
        window.electronApi.sendFrameAction("MAXIMIZE");
        hasNavigated.current = true;
        navigate("/home");
      } catch (error) {
        console.error("❌ Initialization error:", error);
        hasNavigated.current = true;
        navigate("/test-ai-window");
      }
    };

    initialize();
  }, [
    devices,
    hasPermissions,
    isLoading,
    isDevicesAlreadyFetched,
    dispatch,
    navigate,
  ]);

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
