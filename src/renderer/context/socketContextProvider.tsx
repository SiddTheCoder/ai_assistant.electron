import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";

// ==================== TYPES ====================

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
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

  // ⭐ FIX: Remove /socket.io from URL
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:8000";

  console.log("Socket URL:", socketUrl);

  useEffect(() => {
    // Don't connect if no user
    if (!currentUser) return;

    // ⭐ FIX: Prevent reconnecting if already exists
    if (socketRef.current?.connected) {
      console.log("Socket already connected, skipping...");
      return;
    }

    console.log("🔌 Connecting to Socket.IO:", socketUrl);

    // ========= CREATE SOCKET.IO INSTANCE =========
    const newSocket = io(socketUrl, {
      path: "/socket.io", // ⭐ This is the path, NOT part of the URL
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

      // ⭐ Register user with backend
      newSocket.emit("register_user", currentUser._id);

      setIsConnected(true);
    });

    newSocket.on("registered", (data: { userId: string }) => {
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

      // ⭐ MUST re-register user after reconnection
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
  }, [currentUser?._id, socketUrl]); // ⭐ FIX: Depend on _id only, not entire user object

  const contextValue: SocketContextType = {
    socket: socketRef.current,
    isConnected,
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
// ==================== USAGE EXAMPLE ====================

/*
// In your App.tsx or main layout:

import { SocketProvider } from './context/SocketProvider';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <SocketProvider value={currentUser}>
      <YourRoutes />
    </SocketProvider>
  );
}

// In any component:

import { useSocket } from './context/SocketProvider';

function ChatComponent() {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for events
    socket.on('new-message', (data) => {
      console.log('New message:', data);
    });

    socket.on('friend-request-received', (data) => {
      console.log('Friend request from:', data.from);
    });

    // Cleanup
    return () => {
      socket.off('new-message');
      socket.off('friend-request-received');
    };
  }, [socket, isConnected]);

  const sendMessage = () => {
    if (!socket) return;
    
    socket.emit('send-message', {
      senderId: 'user1',
      receiverId: 'user2',
      content: 'Hello!'
    });
  };

  return (
    <div>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <button onClick={sendMessage} disabled={!isConnected}>
        Send Message
      </button>
    </div>
  );
}
*/
