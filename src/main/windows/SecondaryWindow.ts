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

  /**
   * Smoothly resize the window with animation
   * Uses setBounds with animate flag for buttery smooth transitions
   */
  public setSize(width: number, height: number) {
    if (!this.window) return;

    const currentBounds = this.window.getBounds();
    const display = screen.getPrimaryDisplay().workAreaSize;

    // Calculate centered X position for the new width
    const newX = Math.round((display.width - width) / 2);

    // Use setBounds with animate flag for smooth transitions
    this.window.setBounds(
      {
        x: newX,
        y: 0, // Keep at top
        width: Math.round(width),
        height: Math.round(height),
      },
      false, // ⚡ DISABLE ANIMATION - Let CSS handle it
    );
  }

  public getBounds(): Electron.Rectangle {
    if (!this.window) throw new Error("Window not initialized");
    return this.window.getBounds();
  }

  /**
   * Set bounds with optional animation
   */
  public setBounds(
    bounds: Partial<Electron.Rectangle>,
    animate: boolean = false,
  ) {
    if (!this.window) return;

    const currentBounds = this.window.getBounds();
    const newBounds = {
      x: bounds.x ?? currentBounds.x,
      y: 0, // Always force Y to 0 (top edge)
      width: bounds.width ?? currentBounds.width,
      height: bounds.height ?? currentBounds.height,
    };

    this.window.setBounds(newBounds, animate);
  }
}
