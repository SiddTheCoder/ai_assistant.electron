import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedInputDeviceId } from "@/store/features/device/deviceSlice";
import { toggleMicrophoneListening } from "@/store/features/localState/localSlice";
import AudioLevelProgress from "./AudioLevelProgress";

export function AudioInput() {
  const dispatch = useAppDispatch();

  // Get state from Redux
  const audioInputDevices = useAppSelector(
    (state) => state.device.audioInputDevices
  );
  const selectedInputDeviceId = useAppSelector(
    (state) => state.device.selectedInputDeviceId
  );
  const hasPermissions = useAppSelector((state) => state.device.hasPermissions);
  const isMicrophoneListening = useAppSelector(
    (state) => state.localState.isMicrophoneListening
  );

  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAutoStartedRef = useRef(false);

  // Auto-start listening when component mounts and has permissions
  useEffect(() => {
    if (
      hasPermissions &&
      audioInputDevices.length > 0 &&
      !isMicrophoneListening &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true;
      dispatch(toggleMicrophoneListening());
    }
  }, [hasPermissions, audioInputDevices, dispatch]);

  // React to Redux state changes
  useEffect(() => {
    if (isMicrophoneListening) {
      startListening();
    } else {
      stopListening();
    }
  }, [isMicrophoneListening]);

  // Restart when device changes (only if currently listening)
  useEffect(() => {
    if (isMicrophoneListening && selectedInputDeviceId) {
      startListening();
    }
  }, [selectedInputDeviceId]);

  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
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

  const startListening = async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const deviceId = selectedInputDeviceId || audioInputDevices[0]?.deviceId;

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setupAudioVisualization(stream);
    } catch (error) {
      console.error("Error starting audio:", error);
      // If there's an error, turn off the listening state
      if (isMicrophoneListening) {
        dispatch(toggleMicrophoneListening());
      }
    }
  };

  const stopListening = () => {
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
      streamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    dispatch(setSelectedInputDeviceId(deviceId));
  };

  const handleToggleListening = () => {
    dispatch(toggleMicrophoneListening());
  };

  const levelPercentage = Math.min((audioLevel / 128) * 100, 100);

  if (!hasPermissions) {
    return (
      <div className="w-64 bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="text-center text-white">
          <p className="text-sm mb-2">Microphone access needed</p>
          <Button
            onClick={() => {
              // Trigger permission request through your existing flow
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Grant Permission
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800">
        <div className="flex items-center gap-2">
          {isMicrophoneListening ? (
            <Mic className="w-4 h-4 text-green-500" />
          ) : (
            <MicOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-white text-sm font-medium">Microphone</span>
        </div>
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <label className="block text-xs text-gray-300 mb-2">
            Select Microphone
          </label>
          <select
            value={
              selectedInputDeviceId || audioInputDevices[0]?.deviceId || ""
            }
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {audioInputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Audio Level Indicator */}
      <div className="p-3 bg-gray-900">
        <div className="mb-1 flex justify-between items-center">
          <span className="text-xs text-gray-400">Audio Level</span>
          <span className="text-xs text-white font-mono">
            {Math.round(levelPercentage)}%
          </span>
        </div>
        <AudioLevelProgress level={audioLevel} />
      </div>

      {/* Control Button */}
      <div className="p-2 bg-gray-800 border-t border-gray-700">
        <Button
          onClick={handleToggleListening}
          size="sm"
          className={`w-full ${
            isMicrophoneListening
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isMicrophoneListening ? "Stop" : "Start"}
        </Button>
      </div>
    </div>
  );
}

export default AudioInput;
