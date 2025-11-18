import { contextBridge, ipcRenderer } from "electron";
import { IEventPayloadMapping, IFrameWindowAction, IMediaDevices, IMediaPermissions } from "../../types"

(() => {
  console.log("Preload Loaded");
})()

contextBridge.exposeInMainWorld("electronApi", {
  //frameWindowAction Apis
  sendFrameAction: (payload: IFrameWindowAction) => ipcSend("frameWindowAction", payload),
  //media APIs
  getMediaDevices: () => ipcInvoke("getMediaDevices"),
  getMediaPermissions: () => ipcInvoke("getMediaPermissions"),
  checkMediaPermission: () => ipcInvoke("checkMediaPermission"),
  getFrameState: () => ipcInvoke("getFrameState", {})
} satisfies Window["electronApi"]);


// ipc-preload-utils
function ipcInvoke<Key extends keyof IEventPayloadMapping>(
  key: Key,
  payload?: any
): Promise<IEventPayloadMapping[Key]> {
  return ipcRenderer.invoke(key, payload);
}

function ipcOn<Key extends keyof IEventPayloadMapping>(
  key: Key,
  callback: (payload: IEventPayloadMapping[Key]) => void
) {
  //cbfun callbackFunction
  const cbfun = (_event: any, payload: IEventPayloadMapping[Key]) =>
    callback(payload);
  ipcRenderer.on(key, cbfun);
  return () => ipcRenderer.off(key, cbfun);
}

function ipcSend<Key extends keyof IEventPayloadMapping>(
  key: Key,
  payload: IEventPayloadMapping[Key]
) {
  ipcRenderer.send(key, payload);
}