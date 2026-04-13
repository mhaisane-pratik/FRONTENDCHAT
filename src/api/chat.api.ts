// src/api/chat.api.ts
import axios from "axios";

const API_URL = "https://zatbackend.onrender.com";

// Create axios instance with proper CORS configuration
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for dev user switching
apiClient.interceptors.request.use((config) => {
  const currentUser = localStorage.getItem('current_user_id') || 
                      "11111111-1111-1111-1111-111111111111";
  
  config.headers['x-user-id'] = currentUser;
  
  return config;
});

/* =========================
   GET INBOX / CHAT LIST
========================= */
export async function getInbox() {
  try {
    const res = await apiClient.get(
      `/api/v1/chats/inbox`
    );
    return res.data;
  } catch (error: any) {
    console.error("Error getting inbox:", error);
    
    // Fallback
    if (error.code === 'ERR_NETWORK') {
      const res = await axios.get(
        `${API_URL}/api/v1/chats/inbox`,
        {
          headers: {
            'x-user-id': localStorage.getItem('current_user_id') || 
                        "11111111-1111-1111-1111-111111111111"
          }
        }
      );
      return res.data;
    }
    
    throw error;
  }
}

/* =========================
   GET MESSAGES (WITH STATUS)
========================= */
export async function getMessages(chatId: string) {
  try {
    const res = await apiClient.get(
      `/api/v1/chats/${chatId}/messages`
    );
    return res.data;
  } catch (error: any) {
    console.error("Error getting messages:", error);
    
    // Fallback to direct axios call if apiClient fails
    if (error.code === 'ERR_NETWORK') {
      const res = await axios.get(
        `${API_URL}/api/v1/chats/${chatId}/messages`,
        {
          headers: {
            'x-user-id': localStorage.getItem('current_user_id') || 
                        "11111111-1111-1111-1111-111111111111"
          }
        }
      );
      return res.data;
    }
    
    throw error;
  }
}

/* =========================
   SEND TEXT MESSAGE
========================= */
export async function sendMessage(
  chatId: string,
  content: string,
  tempId?: string
) {
  try {
    const res = await apiClient.post(
      `/api/v1/chats/${chatId}/messages`,
      { content, tempId }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error sending message:", error);
    
    // Fallback
    if (error.code === 'ERR_NETWORK') {
      const res = await axios.post(
        `${API_URL}/api/v1/chats/${chatId}/messages`,
        { content, tempId },
        {
          headers: {
            'x-user-id': localStorage.getItem('current_user_id') || 
                        "11111111-1111-1111-1111-111111111111",
            'Content-Type': 'application/json'
          }
        }
      );
      return res.data;
    }
    
    throw error;
  }
}

/* =========================
   UPLOAD IMAGE / FILE
========================= */
export async function uploadFile(
  chatId: string,
  formData: FormData
) {
  try {
    // Get current user
    const currentUser = localStorage.getItem('current_user_id') || 
                       "11111111-1111-1111-1111-111111111111";
    
    // Add user ID to form data
    formData.append('userId', currentUser);
    
    const res = await axios.post(
      `${API_URL}/api/v1/chats/${chatId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          'x-user-id': currentUser
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/* =========================
   MARK MESSAGES AS SEEN
========================= */
export async function markSeen(chatId: string) {
  try {
    const res = await apiClient.post(
      `/api/v1/chats/${chatId}/seen`
    );
    return res.data;
  } catch (error: any) {
    console.error("Error marking as seen:", error);
    
    // Fallback
    if (error.code === 'ERR_NETWORK') {
      const res = await axios.post(
        `${API_URL}/api/v1/chats/${chatId}/seen`,
        {},
        {
          headers: {
            'x-user-id': localStorage.getItem('current_user_id') || 
                        "11111111-1111-1111-1111-111111111111"
          }
        }
      );
      return res.data;
    }
    
    throw error;
  }
}