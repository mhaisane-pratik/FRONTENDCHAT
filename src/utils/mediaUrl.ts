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

  // Already absolute (http, https), data URL, or blob URL.
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  const origin = getApiOrigin();

  if (url.startsWith("/")) {
    return `${origin}${url}`;
  }

  return `${origin}/${url}`;
};
