
export interface SocketEvents {
  // ========= Client -> Server events =========
  register_user: (userId: string) => void;
  "send-user-voice-query": (data: UserQueryPayload) => void;
  "send-user-text-query": (query: string) => void;
  "request-tts": (data: TTSPayload) => void;
  "test-ws": (data?:any) => void;

  // ========= Server -> Client events =========
  registered: (data: RegisteredPayload) => void;
  "query-result": (data: any) => void;
  "query-error": (data: any) => void;
  "tts-start": () => void;
  "tts-chunk": (chunk: ArrayBuffer) => void;
  "tts-end": () => void;
  "response-tts": (res : any) => void;
  "transcription-result": (data: TranscriptionPayload) => void;
  "server-status": (data: ServerStatus) => void;
  
  error: (error: ErrorPayload) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  processing: (data: any) => void;
}

// Payload sent when user speaks
export interface UserQueryPayload {
  audio: ArrayBuffer | string; // ArrayBuffer or base64 string
  mimeType: string; // e.g., "audio/webm", "audio/ogg"
  timestamp: number;
  duration?: number; // Duration in milliseconds
  userId?: string; // Optional user identifier
  sessionId?: string; // Optional session identifier
}

export interface TTSPayload{
  text: string | undefined
  user_id : string
  voice?: string
}

export interface RegisteredPayload {
  userId: string;
  socketId?: string;
}

// Response from server with query result
export interface QueryResultPayload {
  answer: string;
  action: string;
  emotion: string;

  answerDetails: {
    content: string; // Extended content ONLY for poems/code/tutorials/explanations
    sources: string[];
    references: string[];
    additional_info: Record<string, unknown>;
  };

  actionDetails: {
    type: string; // Action type or empty string
    query: string; // Parsed query for action
    title: string;
    artist: string;
    topic: string;
    platforms: string[];
    app_name: string;
    target: string;
    location: string;
    task_description: string;
    due_date?: string;
    priority?: string;
    searchResults?: any[];
    confirmation: {
      isConfirmed: boolean;
      actionRegardingQuestion: string;
    };
    additional_info: Record<string, unknown>;
  };
}


/**
 * Transcription result from audio
 */
export interface TranscriptionPayload {
  text: string;
  confidence: number;
  duration: number;
  timestamp: number;
}


/**
 * Payload for sending messages
*/
export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp?: number;
}

// Error payload from server
export interface ErrorPayload {
  code: string;
  message: string;
  timestamp: number;
  details?: any;
}

export type ServerStatusFlag = "INFO" | "WARN" | "ERROR";

export interface ServerStatus {
  status: string;
  timestamp: string; // ISO string from backend (UTC)
  flag: ServerStatusFlag;
}