import { useState, useEffect } from "react";
import type { IMediaDevices } from "../../../types";

// Shared hook for loading devices (reusable)
export const useMediaDevices = () => {
  const [devices, setDevices] = useState<IMediaDevices>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const permissions = await window.electronApi.getMediaPermissions();
      setHasPermissions(permissions.camera && permissions.microphone);

      const mediaDevices = await window.electronApi.getMediaDevices();
      setDevices(mediaDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      const permissions = await window.electronApi.getMediaPermissions();
      setHasPermissions(permissions.camera && permissions.microphone);

      if (permissions.camera && permissions.microphone) {
        await loadDevices();
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  return {
    devices,
    hasPermissions,
    isLoading,
    loadDevices,
    requestPermissions,
  };
};
