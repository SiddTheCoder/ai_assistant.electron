// types.d.ts

// FrameWindowAction
export type IFrameWindowAction = "CLOSE" | "MINIMIZE" | "MAXIMIZE";

// Media Types handling
export type IMediaDeviceType = "audioinput" | "audiooutput" | "videoinput";

export interface IMediaDevice {
  deviceId: string;
  kind: IMediaDeviceType;
  label: string;
  groupId: string;
}

export interface IMediaDevices {
  audioInputs: IMediaDevice[];
  audioOutputs: IMediaDevice[];
  videoInputs: IMediaDevice[];
}

export interface IMediaPermissions {
  camera: boolean;
  microphone: boolean;
}

export interface IMediaStream {
  audioDeviceiId?: string;
  cameraDeviceiId?: string;
}

// ----- Python Action Types -----

export type IActionType =
  | "play_song"
  | "make_call"
  | "send_message"
  | "search"
  | "open_app"
  | "navigate"
  | "control_device"
  | "create_task"
  | "empty";

export type IEmotion = "neutral" | "happy" | "excited" | "thinking" | "confused" | "sad";

export interface IActionConfirmation {
  isConfirmed: boolean;
  actionRegardingQuestion: string;
}

export interface IActionDetails {
  type: IActionType;
  query: string;
  title?: string;
  artist?: string;
  topic?: string;
  platforms?: string[];
  app_name?: string;
  target?: string;
  location?: string;
  searchResults?: any[];
  confirmation: IActionConfirmation;
  additional_info?: Record<string, any>;
}

export interface IAnswerDetails {
  content: string;
  sources?: string[];
  references?: string[];
  additional_info?: Record<string, any>;
}

export interface IAiResponsePayload {
  userQuery: string;
  answer: string;
  answerEnglish: string;
  actionCompletedMessage?: string;
  actionCompletedMessageEnglish?: string;
  action: string;
  emotion: IEmotion;
  answerDetails: IAnswerDetails;
  actionDetails: IActionDetails;
}

export interface IPythonActionResponse {
  status: "ok" | "error";
  result?: any;
  message?: string;
}

// Payload Mapper - FIXED: Now includes parameters
export type IEventPayloadMapping = {
  frameWindowAction: IFrameWindowAction;
  getFrameState: IFrameWindowAction;
  isMainWindowMaximized: boolean;

  // Media
  getMediaDevices: IMediaDevices;
  getMediaPermissions: IMediaPermissions;
  checkMediaPermission: IMediaPermissions;
  startMediaStream: IMediaStream;
  stopMediaStream: void;

  // Python Automation - This defines what the handler receives
  runPythonAction: IPythonActionResponse;
};


declare global {
  interface Window {
    electronApi: {
      sendFrameAction: (payload: IFrameWindowAction) => void;
      getFrameState: () => Promise<IFrameWindowAction>;
      isMainWindowMaximized: () => Promise<boolean>;
      onWindowMaximizeStateChange: (callback: (payload: boolean) => void) => () => void;

      // Media APIs
      getMediaDevices: () => Promise<IMediaDevices>;
      getMediaPermissions: () => Promise<IMediaPermissions>;
      checkMediaPermission: () => Promise<IMediaPermissions>;

      // Python Automation API
      runPythonAction: (payload: IAiResponsePayload) => Promise<IPythonActionResponse>;
    };
  }
}