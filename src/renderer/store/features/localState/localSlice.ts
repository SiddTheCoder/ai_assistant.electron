import { createSlice } from "@reduxjs/toolkit";
import type{ PayloadAction } from "@reduxjs/toolkit";

interface LocalState {
  isMicrophoneListening: boolean;
  isCameraOn: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  lastRecordingTimestamp: number | null;
}

const initialState: LocalState = {
  isMicrophoneListening: true,
  isCameraOn: false,
  isRecording: false,
  isSpeaking: false,
  lastRecordingTimestamp: null,
};

const localSlice = createSlice({
  name: "local",
  initialState,
  reducers: {
    toggleMicrophoneListening: (state) => {
      state.isMicrophoneListening = !state.isMicrophoneListening;
      // Reset recording states when microphone is turned off
      if (!state.isMicrophoneListening) {
        state.isRecording = false;
        state.isSpeaking = false;
      }
    },
    toggleCameraOn: (state) => {
      state.isCameraOn = !state.isCameraOn;
    },
    setIsRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
      if (action.payload) {
        state.lastRecordingTimestamp = Date.now();
      }
    },
    setIsSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isSpeaking = action.payload;
    },
    resetRecordingState: (state) => {
      state.isRecording = false;
      state.isSpeaking = false;
    },
  },
});

export const {
  toggleMicrophoneListening,
  toggleCameraOn,
  setIsRecording,
  setIsSpeaking,
  resetRecordingState,
} = localSlice.actions;

export default localSlice.reducer;
