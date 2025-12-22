export interface IUser{
  id: string;
  username: string | "Guest";
  email: string | "guest@chromoverse.com";

  created_at: string;          // ISO datetime
  last_login?: string | null;
  last_active_at?: string | null;

  is_user_verified: boolean;

  // --- Quota Flags ---
  is_gemini_api_quota_reached: boolean;
  is_openrouter_api_quota_reached: boolean;

  // --- Preferences ---
  accepts_promotional_emails: boolean;
  language: string;
  ai_gender: string;
  theme: string;
  notifications_enabled: boolean;

  categories_of_interest: string[];
  favorite_brands: string[];

  // --- Likes / Habits ---
  liked_items: string[];
  disliked_items: string[];
  activity_habits: Record<string, any>;
  behavioral_tags: string[];

  // --- Memories ---
  personal_memories: Record<string, any>[];
  reminders: Record<string, any>[];

  // --- Metrics ---
  preferences_history: Record<string, any>[];

  // --- Misc ---
  custom_attributes: Record<string, any>;
}
