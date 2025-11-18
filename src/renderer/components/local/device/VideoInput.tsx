import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Settings,
  Play,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

export function VideoInputComponent() {
  const {
    devices,
    hasPermissions,
    isLoading,
    loadDevices,
    requestPermissions,
  } = useMediaDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set default device
  useEffect(() => {
    if (devices.videoInputs.length > 0 && !selectedDevice) {
      const defaultDevice =
        devices.videoInputs.find((d) => d.deviceId === "default") ||
        devices.videoInputs[0];
      setSelectedDevice(defaultDevice.deviceId);
    }
  }, [devices.videoInputs, selectedDevice]);

  const startStream = async () => {
    try {
      if (!videoRef.current) return;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDevice
          ? {
              deviceId: { exact: selectedDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (error) {
      console.error("Error starting stream:", error);
      alert(
        `Failed to start camera: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl shadow-2xl p-8">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative flex flex-col items-center justify-center gap-6 text-white">
          <div className="p-6 bg-white bg-opacity-20 backdrop-blur-sm rounded-full shadow-2xl">
            <Video className="w-16 h-16" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-white text-opacity-90">
              Grant permission to use your camera
            </p>
          </div>
          <Button
            onClick={requestPermissions}
            className="bg-white text-blue-600 hover:bg-opacity-90 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Grant Permission
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 animate-pulse"></div>

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                isStreaming
                  ? "bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
            >
              {isStreaming ? (
                <Video className="w-8 h-8 text-white" />
              ) : (
                <VideoOff className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Video Input</h3>
              <p className="text-blue-300 text-sm">
                {devices.videoInputs.length} camera
                {devices.videoInputs.length !== 1 ? "s" : ""} detected
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="border-blue-400 text-blue-300 hover:bg-blue-500/20 gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={loadDevices}
              variant="outline"
              size="sm"
              disabled={isLoading || isStreaming}
              className="border-blue-400 text-blue-300 hover:bg-blue-500/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Device Selection (Collapsible) */}
        {showSettings && (
          <div className="mb-6 p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-blue-500/30">
            <label className="block text-sm font-semibold text-blue-300 mb-3">
              Select Camera
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={isStreaming}
              className="w-full px-4 py-3 bg-slate-800 border border-blue-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {devices.videoInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Preview */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-500/30"
          style={{ aspectRatio: "16/9" }}
        >
          <video
            style={{ transform: "scaleX(-1)" }} // <- set to 1 to remove mirroring
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-slate-950"
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
              <div className="text-center text-white">
                <VideoOff className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold mb-2">Camera is off</p>
                <p className="text-sm text-blue-300">Click Start to preview</p>
              </div>
            </div>
          )}
          {isStreaming && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-red-500 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-white text-sm font-bold">LIVE</span>
            </div>
          )}
        </div>

        {/* Control Button */}
        <Button
          onClick={isStreaming ? stopStream : startStream}
          className={`w-full py-6 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 ${
            isStreaming
              ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          }`}
        >
          {isStreaming ? (
            <span className="flex items-center justify-center gap-3">
              <Square className="w-5 h-5" />
              Stop Camera
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              Start Camera
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
