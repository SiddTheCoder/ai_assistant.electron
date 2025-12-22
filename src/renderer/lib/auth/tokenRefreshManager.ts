// lib/auth/tokenRefreshManager.ts

import type { ApiResponse } from "@/utils/axiosConfig";
import axios from "axios";
import { toast } from "sonner";

interface TokenRefreshQueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

class TokenRefreshManager {
  private isRefreshing = false;
  private failedQueue: TokenRefreshQueueItem[] = [];
  private refreshPromise: Promise<string> | null = null;

  /**
   * ✅ Centralized token refresh logic
   * Used by both Axios interceptor and Socket.IO connection
   */
  async getValidAccessToken(): Promise<string> {
    try {
      // 1. Try to get existing token
      const currentToken = await window.electronApi.getToken("access_token");
      
      if (!currentToken) {
        throw new Error("No access token found");
      }

      // 2. Check if token is expired or about to expire
      const isExpired = this.isTokenExpired(currentToken);
      const isExpiringSoon = this.isTokenExpiringSoon(currentToken);

      // 3. If valid and not expiring soon, return it
      if (!isExpired && !isExpiringSoon) {
        console.log("✅ Token is valid, using existing token");
        return currentToken;
      }

      // 4. If expired or expiring soon, refresh it
      console.log("⚠️ Token expired or expiring soon, refreshing...");
      return await this.refreshAccessToken();

    } catch (error) {
      console.error("❌ Failed to get valid access token:", error);
      throw error;
    }
  }

  /**
   * ✅ Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      if (!payload.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true; // If can't decode, consider expired
    }
  }

  /**
   * ✅ Check if token expires within next 5 minutes
   */
  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      if (!payload.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = now + (5 * 60);
      
      return payload.exp < fiveMinutesFromNow;
    } catch {
      return true;
    }
  }

  /**
   * ✅ Decode JWT without verification (client-side only)
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      throw new Error("Invalid token format");
    }
  }

  /**
   * ✅ Refresh access token using refresh token
   * Ensures only one refresh happens at a time
   */
  async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait for that operation
    if (this.isRefreshing && this.refreshPromise) {
      console.log("⏳ Token refresh already in progress, waiting...");
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    // Create the refresh promise
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await window.electronApi.getToken("refresh_token");
        
        if (!refreshToken) {
            throw new Error("No refresh token found");
        }

        console.log("🔄 Refreshing access token...");

        const response: ApiResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
            { refresh_token: refreshToken }
        );

        console.log("response after refeshint the token :", response)

        // ✅ FIX: Extract from root level, not response.data
        const access_token = response.access_token;
        const newRefreshToken = response.refresh_token

        // Better: Check if tokens are the security message
        if (!access_token || !newRefreshToken || 
            typeof newRefreshToken === 'string' && newRefreshToken.includes('security reasons')) {
            throw new Error("Failed to extract valid tokens from response");
        }

        // Save new tokens
        await window.electronApi.saveToken("access_token", access_token);
        await window.electronApi.saveToken("refresh_token", newRefreshToken);

        console.log("✅ Token refreshed successfully");

        // Process queued requests
        this.processQueue(null, access_token);

        return access_token;

    } catch (error) {
        console.error("❌ Token refresh failed:", error);
        
        // Process queued requests with error
        this.processQueue(error as Error, null);

        // Clear tokens
        await window.electronApi.deleteToken("access_token")
        await window.electronApi.deleteToken("refresh_token")

        // Redirect to login
        toast.error("Session expired. Please login again.");
        window.location.href = "/auth/lander";

        throw error;

      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * ✅ Add request to queue while token is refreshing
   */
  addToQueue(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.failedQueue.push({ resolve, reject });
    });
  }

  /**
   * ✅ Process all queued requests after refresh completes
   */
  private processQueue(error: Error | null, token: string | null) {
    this.failedQueue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else if (token) {
        item.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * ✅ Check if currently refreshing
   */
  get isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();