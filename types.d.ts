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
  speaker: boolean;
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
  status: "ok" | "error" | "confirmation_needed";
  result?: any;
  message?: string;
}

export interface IDeviceUsageStatusManager{
  cpuUsage: number;
  ramUsage: number;
  storageData: { total: number; free: number; usage: number };
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
  requestMediaPermissions: IMediaPermissions;
  checkSystemPermissions: IMediaPermissions;
  startMediaStream: IMediaStream;
  stopMediaStream: void;

  // Token Management
  saveToken: void;
  getToken: string | null;
  deleteToken: void;

  // Device Usage Status
  getDeviceUsageStatus: IDeviceUsageStatusManager
  poolDeviceStatus: void

  // Python Automation - This defines what the handler receives
  runPythonAction: IPythonActionResponse;

  // Secondary Window
  openSecondaryWindow: void;
  resizeSecondaryWindow: void;
  closeAiPanelExpansion: void;
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
      requestMediaPermissions: () => Promise<IMediaPermissions>;
      checkSystemPermissions: () => Promise<IMediaPermissions>;


      // token management APIs
      saveToken: (ACCOUNT_NAME: string, token: string) => Promise<void>;
      getToken: (ACCOUNT_NAME: string) => Promise<string | null>;
      deleteToken: (ACCOUNT_NAME: string) => Promise<void>;

      // Device Usage Status APIs
      getDeviceUsageStatus: () => Promise<IDeviceUsageStatusManager>;
      onDeviceUsageStatusChange: (callback: (payload: IDeviceUsageStatusManager) => void) => () => void;

      // Python Automation API
      runPythonAction: (payload: IAiResponsePayload) => Promise<IPythonActionResponse>;

      // Secondary Window API
      openSecondaryWindow: () => Promise<void>;
      resizeSecondaryWindow: (width: number, height: number) => Promise<void>;
      onCloseAiPanelExpansion: (callback: () => void) => () => void;
    };
  }
}