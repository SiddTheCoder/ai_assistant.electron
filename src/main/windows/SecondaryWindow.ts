import { BrowserWindow, app, screen } from "electron";
import path from "node:path";
import { getPreloadPath } from "../utils/pathResolver.js";
import { isDevMode } from "../utils/isDevMode.js";

export class SecondaryWindow {
  private window: BrowserWindow | null = null;

  constructor() {
    const display = screen.getPrimaryDisplay().workAreaSize;

    this.window = new BrowserWindow({
      width: 220, // 🔥 collapsed size (dynamic resize will expand)
      height: 70,

      x: Math.round((display.width - 220) / 2), // 🎯 centered horizontally
      y: 0, // 📌 attached to top edge (snackbar style)

      frame: false, // ❌ remove OS chrome
      transparent: true, // 🌫 glass effect
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,

      alwaysOnTop: true, // 🧲 stay above apps
      skipTaskbar: true,
      hasShadow: true,

      show: false,

      webPreferences: {
        preload: getPreloadPath(),
        partition: "persist:spark",
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // 🔒 Strongest overlay level
    this.window.setAlwaysOnTop(true, "screen-saver");
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // 🚫 Refuse minimize
    this.window.on("minimize", () => {
      this.window?.restore();
    });

    this.window.on("hide", () => {
      this.window?.show();
    });

    this.window.once("ready-to-show", () => {
      this.window?.show();
    });

    if (isDevMode()) {
      this.window.loadURL("http://localhost:5123/test-ai-window");
    } else {
      this.window.loadFile(
        path.join(app.getAppPath(), "/dist-react/index.html"),
      );
    }

    // 🔒 Lock to top edge
    this.window.on("will-move", (e, newBounds) => {
      // Allow X movement, but force Y to 0
      newBounds.y = 0;
    });

    this.window.on("closed", () => {
      this.window = null;
    });
  }

  public show() {
    this.window?.show();
    this.window?.focus();
  }

  public getBrowserWindow() {
    return this.window;
  }

  public setSize(width: number, height: number) {
    this.window?.setSize(width, height);
  }

  public getBounds(): Electron.Rectangle {
    if (!this.window) throw new Error("Window not initialized");
    return this.window.getBounds();
  }

  public setBounds(bounds: Partial<Electron.Rectangle>) {
    this.window?.setBounds(bounds);
  }
}
