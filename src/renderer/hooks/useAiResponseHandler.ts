// src/renderer/hooks/useAiResponseHandler.ts
import { useEffect, useCallback, useState } from "react";
import { useSocket } from "@/context/socketContextProvider";
import { useSparkTTS } from "@/context/sparkTTSContext";
import type { IAiResponsePayload, IPythonActionResponse } from "../../../types";

interface UseAiResponseHandlerOptions {
  autoListen?: boolean; // Auto-listen to socket events
  onSuccess?: (
    response: IPythonActionResponse,
    payload: IAiResponsePayload
  ) => void;
  onError?: (error: string, payload: IAiResponsePayload) => void;
}

export function useAiResponseHandler(
  options: UseAiResponseHandlerOptions = {}
) {
  const { autoListen = true, onSuccess, onError } = options;
  const { socket, isConnected, on, off, emit } = useSocket();
  const { speak, stop: stopTTS, isSpeaking } = useSparkTTS();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPayload, setCurrentPayload] =
    useState<IAiResponsePayload | null>(null);

  /**
   * Main handler: processes the AI response payload
   */
  const handleAiResponse = useCallback(
    async (
      payload: IAiResponsePayload
    ): Promise<IPythonActionResponse | null> => {
      setLoading(true);
      setError(null);
      setCurrentPayload(payload);

      try {
        console.log("🤖 Processing AI Response:", payload);

        // STEP 1: Speak the initial answer if present
        if (payload.answer) {
          console.log("🎤 Speaking answer:", payload.answer);
          speak(payload.answer);

          // Wait for speech to complete before proceeding with action
          // This gives a natural flow: speak -> act
          await waitForSpeechComplete();
        }

        // STEP 2: Check if action exists
        if (
          !payload.action ||
          payload.action === "none" ||
          !payload.actionDetails
        ) {
          console.log("ℹ️ No action to execute");
          setLoading(false);
          return { status: "ok", message: "No action required" };
        }

        // STEP 3: Handle confirmation check
        const confirmation = payload.actionDetails.confirmation;

        if (confirmation && !confirmation.isConfirmed) {
          // Action needs confirmation - speak the question
          const question =
            confirmation.actionRegardingQuestion || "क्या मैं यह कर सकता हूं?";
          console.log("❓ Action needs confirmation:", question);
          speak(question);

          setLoading(false);
          // Return a special status indicating confirmation needed
          return {
            status: "confirmation_needed",
            message: question,
            result: payload,
          };
        }

        // STEP 4: Execute the Python action
        console.log("⚙️ Executing Python action:", payload.action);
        const response = await window.electronApi.runPythonAction(payload);

        console.log("📥 Python action response:", response);

        // STEP 5: Handle action result
        if (response.status === "ok") {
          // Action succeeded - speak completion message
          if (payload.actionCompletedMessage) {
            console.log(
              "✅ Speaking completion message:",
              payload.actionCompletedMessage
            );
            speak(payload.actionCompletedMessage);
          }

          onSuccess?.(response, payload);
        } else {
          // Action failed
          const errorMessage = response.message || "Action execution failed";
          console.error("❌ Action failed:", errorMessage);
          setError(errorMessage);

          // Optional: speak error message
          speak("माफ करें सर, कुछ गड़बड़ हो गई।"); // "Sorry sir, something went wrong"

          onError?.(errorMessage, payload);
        }

        setLoading(false);
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process AI response";
        console.error("💥 Error in handleAiResponse:", err);
        setError(message);
        setLoading(false);

        // Speak error
        speak("माफ करें सर, कुछ गड़बड़ हो गई।");

        onError?.(message, payload);
        return { status: "error", message };
      }
    },
    [speak, onSuccess, onError]
  );

  /**
   * Helper: Wait for current speech to complete
   */
  const waitForSpeechComplete = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // If not speaking, resolve immediately
      if (!isSpeaking) {
        resolve();
        return;
      }

      // Poll until speaking is done
      const checkInterval = setInterval(() => {
        if (!isSpeaking) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }, [isSpeaking]);

  
  /**
   * Manual trigger: process a specific payload
   */
  const processPayload = useCallback(
    (payload: IAiResponsePayload) => {
      return handleAiResponse(payload);
    },
    [handleAiResponse]
  );

  /**
   * Confirm pending action (if confirmation was needed)
   */
  const confirmAction = useCallback(async () => {
    if (!currentPayload) {
      console.warn("⚠️ No pending action to confirm");
      return null;
    }

    // Update confirmation status and re-process
    const updatedPayload: IAiResponsePayload = {
      ...currentPayload,
      actionDetails: {
        ...currentPayload.actionDetails,
        confirmation: {
          ...currentPayload.actionDetails.confirmation,
          isConfirmed: true,
        },
      },
    };

    return handleAiResponse(updatedPayload);
  }, [currentPayload, handleAiResponse]);

  /**
   * Cancel pending action
   */
  const cancelAction = useCallback(() => {
    console.log("🚫 Action cancelled");
    speak("ठीक है सर।"); // "Okay sir"
    setCurrentPayload(null);
    setLoading(false);
  }, [speak]);

  /**
   * Socket listener: auto-handle query-result events
   */
  useEffect(() => {
    if (!autoListen || !socket || !isConnected) return;

    const handleQueryResult = (data: any) => {
      console.log("📡 Received query-result from socket:", data);
      handleAiResponse(data.data);
    };

    on("query-result", handleQueryResult);
    // on("query-error", () => {});

    return () => {
      off("query-result");
      // off("query-error")
    };
  }, [socket, isConnected, autoListen, handleAiResponse, on, off]);

  return {
    // State
    loading,
    error,
    currentPayload,
    isSpeaking,

    // Actions
    processPayload, // Manually process a payload
    confirmAction, // Confirm a pending action
    cancelAction, // Cancel pending action
    stopSpeaking: stopTTS, // Stop current speech
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Auto-listen to socket events (top-level)
function App() {
  useAiResponseHandler({
    autoListen: true,
    onSuccess: (response, payload) => {
      console.log("Action completed successfully!");
    },
    onError: (error, payload) => {
      console.error("Action failed:", error);
    }
  });

  return <YourAppContent />;
}

// Example 2: Manual trigger
function MyComponent() {
  const { processPayload, loading, error } = useAiResponseHandler({
    autoListen: false
  });

  const handleClick = () => {
    const payload: IAiResponsePayload = {
      userQuery: "Open notepad",
      answer: "नोटपैड खोल रहा हूं, सर।",
      actionCompletedMessage: "हो गया सर।",
      action: "open_notepad",
      // ... rest of payload
    };

    processPayload(payload);
  };

  return <button onClick={handleClick}>Execute</button>;
}

// Example 3: Handle confirmation
function ConfirmationComponent() {
  const { currentPayload, confirmAction, cancelAction, loading } = 
    useAiResponseHandler();

  if (!currentPayload?.actionDetails?.confirmation || 
      currentPayload.actionDetails.confirmation.isConfirmed) {
    return null;
  }

  return (
    <div>
      <p>{currentPayload.actionDetails.confirmation.actionRegardingQuestion}</p>
      <button onClick={confirmAction} disabled={loading}>
        Confirm
      </button>
      <button onClick={cancelAction}>
        Cancel
      </button>
    </div>
  );
}
*/
