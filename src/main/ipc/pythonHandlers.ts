import { ipcMainHandle } from "../utils/ipcUtils.js";
import { sendToPython, isPythonServiceRunning } from "../services/PythonService.js";
import { IAiResponsePayload } from "../../../types.js";

export function registerPythonHandlers() {
  ipcMainHandle("runPythonAction", async (_event, payload: IAiResponsePayload) => {
    console.log("🔵 IPC: runPythonAction called");
    
    try {
      if (!isPythonServiceRunning()) {
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
}
