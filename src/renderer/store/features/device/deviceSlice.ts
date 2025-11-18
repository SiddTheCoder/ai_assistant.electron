import { createSlice } from "@reduxjs/toolkit";
import type { IMediaDevice } from "../../../../../types";

const initialState = {
  audioInputDevices: [] as IMediaDevice[],
  audioOutputDevices: [] as IMediaDevice[],
  videoInputDevices: [] as IMediaDevice[],
  selectedInputDeviceId: null,
  selectedCameraDeviceId: null,
  selectedOutputDeviceId: null,
  hasPermissions: false,
  isLoading: false,
  isDevicesAlreadyFetched: false
};

export const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.audioInputDevices = action.payload.audioInputs;
      state.audioOutputDevices = action.payload.audioOutputs;
      state.videoInputDevices = action.payload.videoInputs;
    },
    setSelectedInputDeviceId: (state, action) => {
      state.selectedInputDeviceId = action.payload;
    },
    setSelectedCameraDeviceId: (state, action) => {
      state.selectedCameraDeviceId = action.payload;
    },
    setSelectedOutputDeviceId: (state, action) => {
      state.selectedOutputDeviceId = action.payload;
    },
    setHasDevicePermissions: (state, action) => {
      state.hasPermissions = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsDevicesAlreadyFetchedTrue: (state) => {
      state.isDevicesAlreadyFetched = true
    }
  },
});

export const {
  setDevices,
  setSelectedInputDeviceId,
  setSelectedCameraDeviceId,
  setSelectedOutputDeviceId,
  setHasDevicePermissions,
  setLoading,
  setIsDevicesAlreadyFetchedTrue,
} = deviceSlice.actions;

export default deviceSlice.reducer;
