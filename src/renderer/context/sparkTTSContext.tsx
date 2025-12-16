import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/context/socketContextProvider";

interface SparkTTSContextProps {
  speak: (text: string, voice?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  queueLength: number;
}

const SparkTTSContext = createContext<SparkTTSContextProps | null>(null);

export const SparkTTSProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { socket, emit, on, off } = useSocket();

  // AUDIO STATE
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueue = useRef<Array<{ text: string }>>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentStreamBuffers = useRef<ArrayBuffer[]>([]);
  const isStreamingRef = useRef(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  // Initialize audio context
  useEffect(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as any)["webkitAudioContext"];
      audioCtxRef.current = new AudioContextClass();
    }
  }, []);

  // STRATEGY: Collect all chunks, then play complete audio
  const playCompleteAudio = async () => {
    try {
      if (currentStreamBuffers.current.length === 0) {
        console.warn("No audio data to play");
        playNextInQueue();
        return;
      }

      console.log(
        `🎵 Playing complete audio with ${currentStreamBuffers.current.length} chunks`
      );

      // Combine all chunks into single ArrayBuffer
      const totalLength = currentStreamBuffers.current.reduce(
        (sum, buf) => sum + buf.byteLength,
        0
      );
      const combined = new Uint8Array(totalLength);
      let offset = 0;

      for (const buffer of currentStreamBuffers.current) {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }

      // Create blob and play
      const audioBlob = new Blob([combined], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = "";
      }

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      // Wait for audio to complete
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (e) => {
          // console.error("Audio playback error:", e);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch((err) => {
          console.error("Play failed:", err);
          URL.revokeObjectURL(audioUrl);
          resolve();
        });
      });

      console.log("✅ Audio playback completed");
      playNextInQueue();
    } catch (error) {
      console.error("Error playing audio:", error);
      playNextInQueue();
    }
  };

  // Start next queue item
  const playNextInQueue = () => {
    if (audioQueue.current.length === 0) {
      setIsSpeaking(false);
      setQueueLength(0);
      return;
    }

    const next = audioQueue.current.shift();
    setQueueLength(audioQueue.current.length);
    setIsSpeaking(true);

    // Reset buffers for new stream
    currentStreamBuffers.current = [];
    isStreamingRef.current = true;

    emit("request-tts", {
      text: next?.text,
      user_id : "guest"
    });
  };

  // PUBLIC API: Speak text
  const speak = (text: string) => {
    audioQueue.current.push({ text });
    setQueueLength(audioQueue.current.length);

    if (!isSpeaking) {
      playNextInQueue();
    }
  };

  // PUBLIC API: Stop
  const stop = () => {
    // Stop current audio
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }

    // Clear all state
    currentStreamBuffers.current = [];
    audioQueue.current = [];
    isStreamingRef.current = false;
    setQueueLength(0);
    setIsSpeaking(false);
  };

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    const handleStart = () => {
      console.log("🎤 TTS stream starting...");
      currentStreamBuffers.current = [];
      isStreamingRef.current = true;
    };

    const handleChunk = (binary: ArrayBuffer) => {
      if (!binary || binary.byteLength === 0) {
        console.warn("⚠️ Received empty chunk");
        return;
      }

      console.log(`📦 Received chunk: ${binary.byteLength} bytes`);
      currentStreamBuffers.current.push(binary);
    };

    const handleEnd = () => {
      console.log("✅ TTS stream ended, playing complete audio...");
      isStreamingRef.current = false;
      playCompleteAudio();
    };

    const handleError = (error: { success?: boolean; error?: string }) => {
      console.error("❌ TTS error:", error);
      isStreamingRef.current = false;
      playNextInQueue();
    };

    on("tts-start", handleStart);
    on("tts-chunk", handleChunk);
    on("tts-end", handleEnd);
    on("response-tts", handleError);

    return () => {
      off("tts-start");
      off("tts-chunk");
      off("tts-end");
      off("response-tts");
    };
  }, [socket, on, off, emit]);

  return (
    <SparkTTSContext.Provider
      value={{
        speak,
        stop,
        isSpeaking,
        queueLength,
      }}
    >
      {children}
    </SparkTTSContext.Provider>
  );
};

export const useSparkTTS = () => {
  const ctx = useContext(SparkTTSContext);
  if (!ctx) throw new Error("useSparkTTS must be used inside SparkTTSProvider");
  return ctx;
};
