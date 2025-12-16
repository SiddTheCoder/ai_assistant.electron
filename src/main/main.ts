import { app, BrowserWindow } from "electron"
import * as path from "node:path";
import { getPreloadPath, getUIPath } from "./utils/pathResolver.js";
import { isDevMode } from "./utils/isDevMode.js";
import { createTray } from "./utils/createTray.js";
import { ipcMainHandle, ipcMainOn, ipcWebContentSend } from "./utils/ipcUtils.js";
import { checkMediaPermissions, checkSystemPermissions, getMediaDevices, getMediaPermissions, requestMediaPermissions } from "./utils/mediaManager.js";
import { spawn, ChildProcess } from "node:child_process"
import { IAiResponsePayload } from "../../types.js";

// python process
let pythonProcess: ChildProcess | null = null;

function startPythonService() {
  const scriptPath = path.join(
    process.cwd(),
    "python-service",
    "main_service.py"
  );
  const pythonCommand = process.platform === "win32" ? "python" : "python3";

  console.log("=== STARTING PYTHON SERVICE ===");
  console.log("Script path:", scriptPath);
  console.log("Python command:", pythonCommand);

  pythonProcess = spawn(pythonCommand, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  console.log("Python Process Spawned with PID:", pythonProcess.pid);

  if (pythonProcess.stdout) {
    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python stdout: ${data}`);
    });
  }

  if (pythonProcess.stderr) {
    pythonProcess.stderr.on("data", (data) => {
      const message = data.toString();

      // Check for progress updates
      if (message.includes("PROGRESS:")) {
        const match = message.match(/PROGRESS:(\d+)%/);
        if (match) {
          const progress = parseInt(match[1]);
          console.log(`⏳ Action Progress: ${progress}%`);

          // Send to renderer if you want to show progress bar
          // ipcWebContentSend("pythonProgress", mainWindow.webContents, { progress });
        }
      } else {
        console.error(`Python stderr: ${data}`);
      }
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
    mainWindow.loadURL("http://localhost:5123");
  } else {
    console.log("Production window");
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  //listen and handle the invoked function (media APIs)
  ipcMainHandle("getMediaPermissions", () => getMediaPermissions(mainWindow));
  ipcMainHandle("getMediaDevices", () => getMediaDevices(mainWindow));
  ipcMainHandle("checkMediaPermission", () => checkMediaPermissions(mainWindow));
  ipcMainHandle("requestMediaPermissions", () => requestMediaPermissions(mainWindow));
  ipcMainHandle("checkSystemPermissions", () => checkSystemPermissions());

  // token management handlers
  ipcMainHandle("saveToken", async (_event, { ACCOUNT_NAME, token }) => {
    const { saveToken } = await import("./utils/keytarTokenManagement.js");
    return await saveToken(ACCOUNT_NAME, token);
  });

  ipcMainHandle("getToken", async (_event, { ACCOUNT_NAME }) => {
    const { getToken } = await import("./utils/keytarTokenManagement.js");
    return await getToken(ACCOUNT_NAME);
  });
  ipcMainHandle("deleteToken", async (_event, { ACCOUNT_NAME }) => {
    const { deleteToken } = await import("./utils/keytarTokenManagement.js");
    return await deleteToken(ACCOUNT_NAME);
  });

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
    return Promise.reject(new Error("Python process is not running"));
  }

  return new Promise((resolve, reject) => {
    if (!pythonProcess?.stdout || !pythonProcess?.stdin) {
      return reject(new Error("Python process streams are not available"));
    }

    // ============================================
    // SMART TIMEOUT CALCULATION
    // ============================================
    const contentLength = data?.answerDetails?.content?.length || 0;
    const actionType = data?.actionDetails?.type || "unknown";

    // Base timeout for app opening, window focus, etc.
    const baseTimeout = 30000; // 30 seconds

    // Additional time for typing (60ms per character)
    const typingTime = contentLength * 60;

    // Total timeout with 20% safety buffer
    const calculatedTimeout = (baseTimeout + typingTime) * 1.2;

    // Cap at reasonable maximum (5 minutes)
    const finalTimeout = Math.min(calculatedTimeout, 300000);

    // console.log(`⏱️ Timeout settings:
    //   Action: ${actionType}
    //   Content length: ${contentLength} chars
    //   Base timeout: ${baseTimeout / 1000}s
    //   Typing time: ${typingTime / 1000}s
    //   Final timeout: ${finalTimeout / 1000}s`);

    const timeout = setTimeout(() => {
      pythonProcess?.stdout?.removeListener("data", dataHandler);
      console.error(`⏱️ Action timed out after ${finalTimeout / 1000}s`);
      console.error(`💡 This might indicate:
        1. The action is still executing (increase timeout)
        2. Python crashed (check Python logs)
        3. Response wasn't sent (check Python code)`);
      reject(
        new Error(
          `Action timed out after ${
            finalTimeout / 1000
          }s - action may still be executing`
        )
      );
    }, finalTimeout);

    let buffer = "";

    const dataHandler = (raw: Buffer) => {
      const chunk = raw.toString();
      console.log(
        "📨 Received chunk from Python:",
        chunk.substring(0, 100) + (chunk.length > 100 ? "..." : "")
      );
      buffer += chunk;

      // Try to parse accumulated buffer
      try {
        const parsed = JSON.parse(buffer);
        clearTimeout(timeout);
        pythonProcess?.stdout?.removeListener("data", dataHandler);
        console.log("✅ Parsed Python response:", parsed);
        resolve(parsed);
        buffer = ""; // Clear buffer after successful parse
      } catch (e) {
        // Incomplete JSON, continue waiting
        console.log(
          `⏳ Waiting for more data... (buffer length: ${buffer.length})`
        );
      }
    };

    // Clean up any existing listeners
    pythonProcess.stdout.removeAllListeners("data");
    pythonProcess.stdout.on("data", dataHandler);

    try {
      const jsonData = JSON.stringify(data) + "\n";
      console.log(
        "📝 Writing to Python stdin:",
        jsonData.substring(0, 200) + "..."
      );
      pythonProcess.stdin.write(jsonData);
      console.log("✅ Data written to Python");
    } catch (err) {
      clearTimeout(timeout);
      pythonProcess?.stdout?.removeListener("data", dataHandler);
      reject(new Error(`Failed to write to Python: ${err}`));
    }
  });
}