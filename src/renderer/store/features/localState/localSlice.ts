import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isMicrophoneListening: false,
  isCameraOn: false
}

const localSlice = createSlice({
  name: "local",
  initialState,
  reducers: {
    toggleMicrophoneListening: (state) => {
      state.isMicrophoneListening = !state.isMicrophoneListening
    },
    toggleCameraOn: (state) => {
      state.isCameraOn = !state.isCameraOn
    }
  },
})

export const { toggleMicrophoneListening, toggleCameraOn } = localSlice.actions;

export default localSlice.reducer