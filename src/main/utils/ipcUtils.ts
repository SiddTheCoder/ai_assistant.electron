import { ipcMain, WebContents, WebFrameMain } from "electron";
import { IEventPayloadMapping } from "../../../types.js";
import { isDevMode } from "./isDevMode.js";
import { getUIPath } from "./pathResolver.js";

export function ipcMainHandle<Key extends keyof IEventPayloadMapping>(
  key: Key,
  handler: () => IEventPayloadMapping[Key] | Promise<IEventPayloadMapping[Key]>
) {
  ipcMain.handle(key, async (event) => {
    validateEventFrame(event.senderFrame);
    return await handler();
  });
}

export function ipcMainOn<Key extends keyof IEventPayloadMapping>(
  key: Key,
  handler: (payload: IEventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    handler(payload);
  });
}

export function ipcWebContentSend<Key extends keyof IEventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: IEventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

function validateEventFrame(frame: WebFrameMain | null) {
  if (!frame) {
    throw new Error("Missing sender frame in IPC event");
  }
  console.log("Inside validation mode Frame", frame);
  console.log("Inside validation mode Frame.url", frame.url);
  if (isDevMode() && new URL(frame.url).host === "localhost:3000") {
    return;
  }
  if (!frame.url.startsWith(getUIPath())) {
    throw new Error(`Not allowed to load URL ${frame.url} $ malacious Event`);
  }
}
