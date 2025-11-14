import { systemPreferences, BrowserWindow } from "electron";
import { IMediaDevices, IMediaPermissions, IMediaDevice } from "../../../types.js";

export async function getMediaDevices(
  mainWindow: BrowserWindow
): Promise<IMediaDevices> {
  try {
    // Get all media devices through the renderer process
    const devices = await mainWindow.webContents.executeJavaScript(`
      navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.map(d => ({
          deviceId: d.deviceId,
          label: d.label,
          kind: d.kind,
          groupId: d.groupId
        })))
    `);

    const audioInputs = devices.filter(
      (d: IMediaDevice) => d.kind === "audioinput"
    );
    const audioOutputs = devices.filter(
      (d: IMediaDevice) => d.kind === "audiooutput"
    );
    const videoInputs = devices.filter(
      (d: IMediaDevice) => d.kind === "videoinput"
    );

    return {
      audioInputs,
      audioOutputs,
      videoInputs,
    };
  } catch (error) {
    console.error("Error getting media devices:", error);
    return {
      audioInputs: [],
      audioOutputs: [],
      videoInputs: [],
    };
  }
}

export async function getMediaPermissions(
  mainWindow: BrowserWindow
): Promise<IMediaPermissions> {
  try {
    // Request permissions through the renderer process
    const result = await mainWindow.webContents.executeJavaScript(`
      Promise.all([
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            return true;
          })
          .catch(() => false),
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            return true;
          })
          .catch(() => false)
      ]).then(([camera, microphone]) => ({ camera, microphone }))
    `);

    return result;
  } catch (error) {
    console.error("Error requesting media permissions:", error);
    return {
      camera: false,
      microphone: false,
    };
  }
}

export async function checkMediaPermissions(): Promise<IMediaPermissions> {
  let camera = false;
  let microphone = false;

  if (process.platform === "darwin") {
    // macOS
    const cameraStatus = systemPreferences.getMediaAccessStatus("camera");
    const micStatus = systemPreferences.getMediaAccessStatus("microphone");

    camera = cameraStatus === "granted";
    microphone = micStatus === "granted";
  } else if (process.platform === "win32") {
    // Windows - permissions are typically granted at runtime
    camera = true;
    microphone = true;
  } else {
    // Linux and others
    camera = true;
    microphone = true;
  }

  return { camera, microphone };
}
