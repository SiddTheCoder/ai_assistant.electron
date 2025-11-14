import path from "path";
import { app } from "electron";
import { isDevMode } from "./isDevMode.js"

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDevMode() ? "." : "..",
    "/dist-electron/preload.cjs"
  );
}

export function getUIPath(): string {
  return path.join(app.getAppPath(), "/dist-react/index.html");
}

export function getAssetPath() {
  return path.join(app.getAppPath(), isDevMode() ? "." : "..", "/src/assets");
}
