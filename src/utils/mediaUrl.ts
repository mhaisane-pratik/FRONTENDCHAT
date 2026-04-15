// File: src/utils/mediaUrl.ts

// Standard Vite environment variable access
const API_URL = "https://zatbackend.onrender.com";
const SOCKET_URL = "https://zatbackend.onrender.com";

const getApiOrigin = () => {
  try {
    // 1. Primary: Explicit API URL
    if (API_URL && API_URL.trim() !== "") {
      return new URL(API_URL).origin;
    }

    // 2. Secondary: Infer from Socket URL (Common in many deployments)
    if (SOCKET_URL && SOCKET_URL.trim() !== "") {
      const socketUrlObj = new URL(SOCKET_URL);
      // Swap ws/wss to http/https for image requests
      const protocol = socketUrlObj.protocol === "wss:" ? "https:" : "http:";
      const origin = `${protocol}//${socketUrlObj.host}`;
      
      // Only use it if it's a "real" remote origin (not localhost)
      if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return origin;
      }
    }

    // 3. Fallback: Current site origin (Works if same-origin or proxied)
    return window.location.origin;
  } catch (err) {
    console.warn("⚠️ mediaUrl.ts: Failed to parse origins:", err);
    return window.location.origin;
  }
};

const getProductionApiOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return getApiOrigin();
  }
};

/**
 * Resolves a potentially relative or localhost media URL to a correct production URL.
 */
export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === "" || url === "null" || url === "undefined") {
    return "";
  }

  // Pass through data/blob/placeholders
  if (url.startsWith("data:") || url.startsWith("blob:") || url.includes("ui-avatars.com")) {
    return url;
  }

  const origin = getApiOrigin();

  // Handle absolute URLs (especially those saved during local development)
  if (/^(https?:)?\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      const backendOrigin = getProductionApiOrigin();
      const backendHostname = new URL(backendOrigin).hostname;
      const currentIsLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      // CRITICAL FIX: If we are in production but the image URL points to localhost or an insecure backend URL, rewrite it.
      if ((isLocalhost || (parsed.hostname === backendHostname && parsed.protocol === "http:")) && !currentIsLocalhost) {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }

      if (parsed.hostname === backendHostname && parsed.protocol === "http:") {
        return `${backendOrigin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return url;
  }

  // ✅ Handle relative paths (e.g., /uploads/image.png or uploads/image.png)
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const resolved = `${origin}${cleanPath}`;
  
  // Log resolution for debugging
  if (url.includes("/uploads/")) {
    // console.debug(`[mediaUrl] Resolved: ${url} → ${resolved}`);
  }
  
  return resolved;
};
