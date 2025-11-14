import { app, BrowserWindow } from "electron"
import * as path from "node:path";
import { getPreloadPath } from "./utils/pathResolver.js";
import { isDevMode } from "./utils/isDevMode.js";
import { createTray } from "./utils/createTray.js";

app.on("ready", () => {
  console.log("App Ready");

  const mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    },
    frame: false
  });

  if (isDevMode()) {
    console.log("Development window");
    mainWindow.webContents.openDevTools(); // openDevTools
    mainWindow.loadURL("http://localhost:3000");
  } else {
    console.log("Production window");
    mainWindow.loadFile(path.join(__dirname, "../dist-react/index.html"));
  }

  // Tray
  createTray(mainWindow)

  // close event
  handleCloseEvent(mainWindow)
})


function handleCloseEvent(mainWindow: BrowserWindow) {
  let willClose = false;

  mainWindow.on("close", (event) => {
    if (willClose) {
      return;
    } else {
      event.preventDefault();
      mainWindow.hide()
      if (app.dock) {
        app.dock.hide();
     }
    }
  });
  
  app.on("before-quit", () => {
    willClose = true;
  });

  mainWindow.on("show", () => {
    willClose = false;
  })
}