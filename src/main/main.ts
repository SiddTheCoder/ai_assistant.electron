import { app, BrowserWindow } from "electron"
import * as path from "node:path";
import { getPreloadPath, getUIPath } from "./utils/pathResolver.js";
import { isDevMode } from "./utils/isDevMode.js";
import { createTray } from "./utils/createTray.js";
import { ipcMainHandle, ipcMainOn, ipcWebContentSend } from "./utils/ipcUtils.js";
import { checkMediaPermissions, getMediaDevices, getMediaPermissions } from "./utils/mediaManager.js";

app.on("ready", () => {
  console.log("App Ready");
  const preloadPath = getPreloadPath()
  console.log("Preload Path", preloadPath);

  const mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    webPreferences: {
      preload: getPreloadPath(),
      partition: "persist:spark",
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
  });
  
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDevMode()) {
    console.log("Development window");
    mainWindow.webContents.openDevTools(); // openDevTools
    mainWindow.loadURL("http://localhost:3000");
  } else {
    console.log("Production window");
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  //listen and handle the invoked function (media APIs)
  ipcMainHandle("getMediaPermissions", () => getMediaPermissions(mainWindow));
  ipcMainHandle("getMediaDevices", () => getMediaDevices(mainWindow));
  ipcMainHandle("checkMediaPermission", () => checkMediaPermissions());

  //frameWindowAction Apis
  ipcMainOn("frameWindowAction", (payload) => {
    switch (payload) {
      case "MINIMIZE":
        mainWindow.minimize();
        break;
      case "MAXIMIZE":
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case "CLOSE":
        mainWindow.close();
        break;
    }
  });
 
  mainWindow.on("maximize", () => {
    ipcWebContentSend("isMainWindowMaximized" , mainWindow.webContents, true);
  })

  mainWindow.on("unmaximize", () => { 
    ipcWebContentSend("isMainWindowMaximized" , mainWindow.webContents, false);
  })

  ipcMainHandle("isMainWindowMaximized", () => mainWindow.isMaximized());

  ipcMainHandle("getFrameState", () => {
    return mainWindow.isMinimized() ? "MINIMIZE" : "MAXIMIZE";
  });

  // Tray
  createTray(mainWindow);

  // close event
  handleCloseEvent(mainWindow);
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