import React from "react";
import AudioInput from "../device/AudioInput";
import AudioOutput from "../device/AudioOutput";

export default function LeftPanel() {
  return (
    <div className="w-full h-full">
      <AudioInput />
      <AudioOutput />
    </div>
  );
}
