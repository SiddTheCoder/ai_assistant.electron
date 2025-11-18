import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, RefreshCw, Settings, Play, Square } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

export function AudioInput() {
  const {
    devices,
    hasPermissions,
    isLoading,
    loadDevices,
    requestPermissions,
  } = useMediaDevices();

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Set default device
  useEffect(() => {
    if (devices.audioInputs.length > 0 && !selectedDevice) {
      const defaultDevice =
        devices.audioInputs.find((d) => d.deviceId === "default") ||
        devices.audioInputs[0];
      setSelectedDevice(defaultDevice.deviceId);
    }
  }, [devices.audioInputs, selectedDevice]);

  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error("Error setting up audio visualization:", error);
    }
  };

  const startRecording = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
        video: false,
      };

      console.log("Constraints", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log("Stream", stream , "steamRef", streamRef.current);
      setupAudioVisualization(stream);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        `Failed to start recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const stopRecording = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!hasPermissions) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-2xl p-8">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative flex flex-col items-center justify-center gap-6 text-white">
          <div className="p-6 bg-white bg-opacity-20 backdrop-blur-sm rounded-full shadow-2xl">
            <Mic className="w-16 h-16" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">
              Microphone Access Required
            </h3>
            <p className="text-white text-opacity-90">
              Grant permission to use your microphone
            </p>
          </div>
          <Button
            onClick={requestPermissions}
            className="bg-white text-purple-600 hover:bg-opacity-90 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl"
          >
            Grant Permission
          </Button>
        </div>
      </div>
    );
  }

  const levelPercentage = Math.min((audioLevel / 128) * 100, 100);
  const bars = 20;

  return (
    <div className="relative border bg-slate-900 border-purple-200 rounded-2xl shadow-2xl overflow-hidden p-10">

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                isRecording
                  ? "animate-pulse"
                  : ""
              }`}
            >
              {isRecording ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Audio Input</h3>
              <p className="text-purple-300 text-sm">
                {devices.audioInputs.length} device
                {devices.audioInputs.length !== 1 ? "s" : ""} detected
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="border-purple-400 text-purple-300 hover:bg-purple-500/20 gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={loadDevices}
              variant="outline"
              size="sm"
              disabled={isLoading || isRecording}
              className="border-purple-400 text-purple-300 hover:bg-purple-500/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Device Selection (Collapsible) */}
        {showSettings && (
          <div className="mb-6 p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30">
            <label className="block text-sm font-semibold text-purple-300 mb-3">
              Select Microphone
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={isRecording}
              className="w-full px-4 py-3 bg-slate-800 border border-purple-500/50 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {devices.audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Audio Visualization */}
        <div className="mb-8 p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-inner">
          {isRecording ? (
            <div className="space-y-6">
              {/* Waveform bars */}
              <div className="flex items-end justify-center gap-1 h-32">
                {[...Array(bars)].map((_, i) => {
                  const barLevel = Math.max(0, levelPercentage - i * 5);
                  const height = Math.min(100, barLevel * 1.2);
                  return (
                    <div
                      key={i}
                      className="w-3 rounded-full transition-all duration-100 ease-out"
                      style={{
                        height: `${height}%`,
                        background:
                          height > 70
                            ? "linear-gradient(to top, #ef4444, #f97316)"
                            : height > 40
                            ? "linear-gradient(to top, #f59e0b, #eab308)"
                            : "linear-gradient(to top, #10b981, #3b82f6)",
                        opacity: height > 10 ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </div>

              {/* Level indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-purple-300">
                    Level
                  </span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {Math.round(levelPercentage)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full transition-all duration-100 rounded-full"
                    style={{
                      width: `${levelPercentage}%`,
                      background:
                        levelPercentage > 70
                          ? "linear-gradient(to right, #f97316, #ef4444)"
                          : levelPercentage > 40
                          ? "linear-gradient(to right, #eab308, #f59e0b)"
                          : "linear-gradient(to right, #3b82f6, #10b981)",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-purple-300">
              <MicOff className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Microphone is off</p>
              <p className="text-sm opacity-75">Click Start to begin</p>
            </div>
          )}
        </div>

        {/* Control Button */}
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-6 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 ${
            isRecording
              ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          }`}
        >
          {isRecording ? (
            <span className="flex items-center justify-center gap-3">
              <Square className="w-5 h-5" />
              Stop Recording
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              Start Recording
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
