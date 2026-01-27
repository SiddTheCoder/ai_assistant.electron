import { ChildProcess, spawn } from "node:child_process";
import * as path from "node:path";
import { IAiResponsePayload } from "../../../types.js";

let pythonProcess: ChildProcess | null = null;

export function startPythonService() {
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

export function killPythonService() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

export function isPythonServiceRunning(): boolean {
  return pythonProcess !== null;
}

export async function sendToPython(data: IAiResponsePayload): Promise<any> {
    console.log("📤 sendToPython called with:", data);
  
    if (!pythonProcess) {
      throw new Error("Python process is not running");
    }
  
    return new Promise((resolve, reject) => {
      if (!pythonProcess?.stdout || !pythonProcess?.stdin) {
        return reject(new Error("Python process streams are not available"));
      }
  
      // ============================================
      // SMART TIMEOUT CALCULATION
      // ============================================
      const contentLength = (data as any)?.answerDetails?.content?.length || 0;
  
      // Base timeout for app opening, window focus, etc.
      const baseTimeout = 30000; // 30 seconds
  
      // Additional time for typing (60ms per character)
      const typingTime = contentLength * 60;
  
      // Total timeout with 20% safety buffer
      const calculatedTimeout = (baseTimeout + typingTime) * 1.2;
  
      // Cap at reasonable maximum (5 minutes)
      const finalTimeout = Math.min(calculatedTimeout, 300000);
  
      const timeout = setTimeout(() => {
        pythonProcess?.stdout?.removeListener("data", dataHandler);
        console.error(`⏱️ Action timed out after ${finalTimeout / 1000}s`);
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
        buffer += chunk;
  
        // Try to parse accumulated buffer
        try {
          const parsed = JSON.parse(buffer);
          clearTimeout(timeout);
          pythonProcess?.stdout?.removeListener("data", dataHandler);
          console.log("✅ Parsed Python response:", parsed);
          resolve(parsed);
          buffer = ""; 
        } catch (e) {
          // Incomplete JSON, continue waiting
        }
      };
  
      // Clean up any existing listeners and add the new one
      pythonProcess.stdout.removeAllListeners("data");
      pythonProcess.stdout.on("data", dataHandler);
  
      try {
        const jsonData = JSON.stringify(data) + "\n";
        pythonProcess.stdin.write(jsonData);
      } catch (err) {
        clearTimeout(timeout);
        pythonProcess?.stdout?.removeListener("data", dataHandler);
        reject(new Error(`Failed to write to Python: ${err}`));
      }
    });
  }
