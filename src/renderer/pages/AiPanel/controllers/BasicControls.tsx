import { useState } from 'react';
import { Volume2, VolumeOff, Video, VideoOff, MessageCircle } from 'lucide-react';
import type { ControllerProps } from '../types';

export function BasicControls({ isActive }: ControllerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-2.5 px-4">
      {/* Mute Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          bg-indigo-300/10 border border-indigo-300/15
          hover:bg-indigo-300/20 hover:border-indigo-300/25
          hover:-translate-y-0.5 active:scale-95
          transition-all duration-200 outline-none
        `}
        aria-label="Toggle microphone"
      >
        {isMuted ? (
          <VolumeOff className="w-[18px] h-[18px] text-red-400" />
        ) : (
          <Volume2 className="w-[18px] h-[18px] text-indigo-100" />
        )}
      </button>

      {/* Video Toggle */}
      <button
        onClick={() => setIsVideoOff(!isVideoOff)}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          bg-indigo-300/10 border border-indigo-300/15
          hover:bg-indigo-300/20 hover:border-indigo-300/25
          hover:-translate-y-0.5 active:scale-95
          transition-all duration-200 outline-none
        `}
        aria-label="Toggle video"
      >
        {isVideoOff ? (
          <VideoOff className="w-[18px] h-[18px] text-red-400" />
        ) : (
          <Video className="w-[18px] h-[18px] text-indigo-100" />
        )}
      </button>

      {/* Chat Mode */}
      <button
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          bg-indigo-300/10 border border-indigo-300/15
          hover:bg-indigo-300/20 hover:border-indigo-300/25
          hover:-translate-y-0.5 active:scale-95
          transition-all duration-200 outline-none
        `}
        aria-label="Switch mode"
      >
        <MessageCircle className="w-[18px] h-[18px] text-indigo-100" />
      </button>
    </div>
  );
}

// Plugin config
export const basicControlsPlugin = {
  id: 'basic-controls',
  name: 'Controls',
  component: BasicControls,
  order: 1,
};
