import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import type { RegisteredPayload, SocketEvents } from "../types/socket.types";
import type { User } from "../types/user.types";

// type safe emit function
type TypedEmit = <K extends keyof SocketEvents>(
  event: K,
  ...args: Parameters<SocketEvents[K]>
) => void;

// type safe on function
type TypedOn = <K extends keyof SocketEvents>(
  event: K,
  callback: SocketEvents[K]
) => void;

// type safe off function
type TypedOff = <K extends keyof SocketEvents>(
  event: K,
  callback?: SocketEvents[K]
) => void;

// type safe once function
type TypedOnce = <K extends keyof SocketEvents>(
  event: K,
  callback: SocketEvents[K]
) => void;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: TypedEmit;
  on: TypedOn;
  off: TypedOff;
  once: TypedOnce;
}

interface SocketProviderProps {
  children: ReactNode;
  value: User | null; // currentUser
}

// ==================== CONTEXT ====================

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export const SocketProvider = ({
  children,
  value: currentUser,
}: SocketProviderProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketUrl =
    import.meta.env.VITE_API_SOCKET_URL || "http://127.0.0.1:8000";

  console.log("Socket URL:", socketUrl);

  useEffect(() => {
    // Don't connect if no user
    if (!currentUser) return;

    // Prevent reconnecting if already exists
    if (socketRef.current?.connected) {
      console.log("Socket already connected, skipping...");
      return;
    }

    console.log("🔌 Connecting to Socket.IO:", socketUrl);

    // ========= CREATE SOCKET.IO INSTANCE =========
    const newSocket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketRef.current = newSocket;

    // ========= CONNECTION EVENTS =========

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);

      // Register user with backend
      newSocket.emit("register_user", currentUser._id);

      setIsConnected(true);
    });

    newSocket.on("registered", (data: RegisteredPayload) => {
      console.log("🟢 User registered on server:", data.userId);
    });

    newSocket.on("connect_error", (err: Error) => {
      console.error("❌ Socket connection error:", err.message);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber: number) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");

      // MUST re-register user after reconnection
      newSocket.emit("register_user", currentUser._id);

      setIsConnected(true);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log("👋 Disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser?._id, socketUrl]);

  // ========= TYPE-SAFE WRAPPER FUNCTIONS =========

  const emit: TypedEmit = (event, ...args) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event as string, ...args);
    } else {
      console.warn(
        `Cannot emit "${String(event)}": socket ${
          !socketRef.current ? "not initialized" : "not connected"
        }`
      );
    }
  };

  const on: TypedOn = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event as string, callback as any);
    } else {
      console.warn(`Cannot listen to "${String(event)}": socket not initialized`);
    }
  };

  const off: TypedOff = (event, callback) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event as string, callback as any);
      } else {
        socketRef.current.off(event as string);
      }
    }
  };

  const once: TypedOnce = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.once(event as string, callback as any);
    } else {
      console.warn(`Cannot listen once to "${String(event)}": socket not initialized`);
    }
  };

  const contextValue: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    once,
  };

  if (!currentUser) return <>{children}</>;

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// ==================== HOOK ====================

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};