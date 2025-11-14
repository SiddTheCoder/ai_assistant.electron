// types.d.ts

// FrameWindowAction
export type IFrameWindowAction = "CLOSE" | "MINIMIZE" | "MAXIMIZE";


// Medai Types handling
export type IMediaDeviceType = "audioinput" | "audiooutput" | "videoinput";

export interface IMediaDevice {
  deviceId: string;
  kind: IMediaDeviceType;
  label: string;
  groupId: string;
}
export interface IMediaDevices {
  audioinput: IMediaDevice[];
  audiooutput: IMediaDevice[];
  videoinput: IMediaDevice[];
}
export interface IMediaPermissions {
  camera : boolean
  microphone : boolean
}

export interface IMediaStream{
  audioDeviceiId ?: string
  cameraDeviceiId ?: string
}

// -----

export type IEventPayloadMapping = {
  frameWindowAction: IFrameWindowAction
  
  // Media 
  getMediaDevices: IMediaDevices
  getMediaPermissions: IMediaPermissions;
  checkMediaPermission: IMediaPermissions;
  startMediaStream: IMediaStream
  stopMediaStream: void
}

declare global {
  interface Window{
    // electron's APIs
    electron: {
      sendFrameAction: (payload: IFrameWindowAction) => void

      //media APIs
      getMediaDevices: () => Promise<IMediaDevices>
      getMediaPermissions: () => Promise<IMediaPermissions>;
      checkMediaPermission: () => Promise<IMediaPermissions>;
    }
  }
}