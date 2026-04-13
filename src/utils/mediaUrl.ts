const API_URL = (import.meta as any).env.VITE_API_URL as string;

const getApiOrigin = () => {
  try {
    if (!API_URL) return window.location.origin;
    return new URL(API_URL).origin;
  } catch {
    return window.location.origin;
  }
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return "";

  // Data/blob URLs should pass through unchanged.
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  // If backend stored localhost URLs, rewrite them to current API origin for deployed frontend.
  if (/^(https?:)?\/\//i.test(url)) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // fall through and return original url
    }
    return url;
  }

  const origin = getApiOrigin();

  if (url.startsWith("/")) {
    return `${origin}${url}`;
  }

  return `${origin}/${url}`;
};
