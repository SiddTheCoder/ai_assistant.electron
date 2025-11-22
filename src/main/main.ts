import { app, BrowserWindow } from "electron"
import * as path from "node:path";
import { getPreloadPath, getUIPath } from "./utils/pathResolver.js";
import { isDevMode } from "./utils/isDevMode.js";
import { createTray } from "./utils/createTray.js";
import { ipcMainHandle, ipcMainOn, ipcWebContentSend } from "./utils/ipcUtils.js";
import { checkMediaPermissions, getMediaDevices, getMediaPermissions } from "./utils/mediaManager.js";
import { spawn, ChildProcess } from "node:child_process"
import { IAiResponsePayload } from "../../types.js";

// python process
let pythonProcess: ChildProcess | null = null;

function startPythonService() {
  const scriptPath = path.join(process.cwd(), "python-service", "main_service.py");
  const pythonCommand = process.platform === "win32" ? "python" : "python3";

  console.log("=== STARTING PYTHON SERVICE ===");
  console.log("Script path:", scriptPath);
  console.log("Python command:", pythonCommand);

  pythonProcess = spawn(pythonCommand, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  
  console.log("Python Process Spawned with PID:", pythonProcess.pid);

  if (pythonProcess.stdout) {
    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python stdout: ${data}`);
    });
  }

  if (pythonProcess.stderr) {
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python stderr: ${data}`);
    });
  }

  pythonProcess.on("error", (error) => {
    console.error(`Failed to start Python process:`, error);
  });

  pythonProcess.on("exit", (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
  });
}

app.on("ready", () => {
  console.log("App Ready - Starting Python Service");
  startPythonService();
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

 
   // python action handler
  ipcMainHandle("runPythonAction", async (_event, payload: IAiResponsePayload) => {
    console.log("🔵 IPC: runPythonAction called");
    console.log("🔵 Payload:", JSON.stringify(payload, null, 2));
    
    try {
      if (!pythonProcess) {
        console.error("❌ Python process is not running!");
        return {
          status: "error" as const,
          message: "Python process is not running"
        };
      }

      console.log("🔵 Sending to Python...");
      const result = await sendToPython(payload);
      console.log("🔵 Received from Python:", result);
      
      return {
        status: "ok" as const,
        result,
      };
    } catch (err: any) {
      console.error("❌ Error in runPythonAction:", err);
      return {
        status: "error" as const,
        message: err.message,
      };
    }
  });

  // Tray
  createTray(mainWindow);

  // close event
  handleCloseEvent(mainWindow);

  app.on("will-quit", () => {
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
})


// close event for window
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
  
  app.on("will-quit", () => {
    willClose = true;
  });

  mainWindow.on("show", () => {
    willClose = false;
  })
}

// send actionDetails to python process
function sendToPython(data: any): Promise<any> {
  console.log("📤 sendToPython called with:", data);

  if (!pythonProcess) {
    console.error("❌ pythonProcess is null");
    return Promise.reject(new Error("Python process is not running"));
  }

  return new Promise((resolve, reject) => {
    if (!pythonProcess?.stdout || !pythonProcess?.stdin) {
      console.error("❌ Python process streams unavailable");
      return reject(new Error("Python process streams are not available"));
    }

    const timeout = setTimeout(() => {
      console.error("⏰ Python response timeout");
      reject(new Error("Python response timeout"));
    }, 15000); // ⬅️ INCREASED FROM 5000 to 15000 (15 seconds)

    // Listen for data ONCE
    const dataHandler = (raw: Buffer) => {
      clearTimeout(timeout);
      console.log("📥 Received raw data from Python:", raw.toString());
      try {
        const parsed = JSON.parse(raw.toString());
        console.log("✅ Parsed Python response:", parsed);
        resolve(parsed);
      } catch (error) {
        console.error("❌ JSON parse error:", error);
        reject(error);
      }
    };

    // Remove any existing listeners to prevent multiple responses
    pythonProcess.stdout.removeAllListeners("data");
    pythonProcess.stdout.once("data", dataHandler);

    const jsonData = JSON.stringify(data) + "\n";
    console.log("📤 Writing to Python stdin:", jsonData);
    pythonProcess.stdin.write(jsonData);
  });
}