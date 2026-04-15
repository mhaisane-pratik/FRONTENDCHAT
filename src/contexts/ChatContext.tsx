import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { socket } from "../api/socket";

interface ChatUser {
  id?: string;
  mobile: string;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  theme?: string;
  wallpaper?: string;
  notification_enabled?: boolean;
  sound_enabled?: boolean;
  is_online?: boolean;  
  last_seen?: string;  
  is_admin?: boolean;
  can_create_group?: boolean;
  is_banned?: boolean;
  warning_count?: number;
}

interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  other_user: string;
  last_message: string;
  last_message_time: string;
  last_message_sender: string;
  unread_count: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  is_group?: boolean;
  is_verified?: boolean;
  is_public?: boolean;
  group_name?: string;
  group_icon?: string;
  member_count?: number;
  created_by?: string;
}

interface ChatContextType {
  currentUser: ChatUser | null;
  setCurrentUser: (user: ChatUser | null) => void;
  chatRooms: ChatRoom[];
  setChatRooms: (rooms: ChatRoom[]) => void;
  selectedRoom: string | null;
  setSelectedRoom: (roomId: string | null) => void;
  theme: string;
  setTheme: (theme: string) => void;
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  refreshRooms: () => Promise<void>;
  onlineUsers: Set<string>;
  isSocketConnected: boolean;
  isLoading: boolean;
  userProfiles: Map<string, ChatUser>;
  loadUserProfile: (mobile: string) => Promise<ChatUser | null>;
  allowGroupCreation: boolean;
  appName: string;
  appLogo: string;
  typingUsers: Record<string, Set<string>>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playNotificationSound: (type: "send" | "receive") => void;
  contacts: Map<string, string>;
  fetchContacts: () => Promise<void>;
  getDisplayName: (mobile: string, fallback?: string) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = "https://zatbackend.onrender.com";
const API_KEY = "ZATCHAT_PRATEEK9373";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [theme, setTheme] = useState("light");
  const [wallpaper, setWallpaper] = useState("solid-white");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, ChatUser>>(new Map());
  const [allowGroupCreation, setAllowGroupCreation] = useState(true);
  const [appName, setAppName] = useState("ZatChat");
  const [appLogo, setAppLogo] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [contacts, setContacts] = useState<Map<string, string>>(new Map());

  const hasInitialized = useRef(false);
  const contactsApiUnavailable = useRef(false);
  const refreshInFlight = useRef(false);
  const pendingRefresh = useRef(false);
  const lastRefreshAt = useRef(0);

  const normalizeMobileKey = (value?: string) => (value || "").replace(/\D/g, "");
  const getLocalContactsKey = (mobile?: string) => `local_contacts_${normalizeMobileKey(mobile)}`;

  const fetchContacts = async () => {
    if (!currentUser) return;
    try {
      const localRaw = localStorage.getItem(getLocalContactsKey(currentUser.mobile));
      const localData = localRaw ? (JSON.parse(localRaw) as Array<{ contact_mobile: string; contact_name: string }>) : [];

      if (contactsApiUnavailable.current) {
        const localMap = new Map<string, string>();
        localData.forEach((c) => {
          const key = normalizeMobileKey(c.contact_mobile);
          if (key) localMap.set(key, c.contact_name);
        });
        setContacts(localMap);
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/contacts/${encodeURIComponent(currentUser.mobile)}`);
      if (res.ok) {
        const data = await res.json();
        const contactMap = new Map<string, string>();
        [...localData, ...(data || [])].forEach((c: any) => {
          const key = normalizeMobileKey(c.contact_mobile);
          if (key) contactMap.set(key, c.contact_name);
        });
        setContacts(contactMap);
      } else if (res.status === 404) {
        contactsApiUnavailable.current = true;
        const contactMap = new Map<string, string>();
        localData.forEach((c) => {
          const key = normalizeMobileKey(c.contact_mobile);
          if (key) contactMap.set(key, c.contact_name);
        });
        setContacts(contactMap);
      }
    } catch (err) {
      console.error("❌ Failed to fetch contacts", err);
    }
  };

  const getDisplayName = (targetMobile: string, fallback?: string) => {
    const normalizedTarget = normalizeMobileKey(targetMobile);
    if (contacts.has(normalizedTarget)) {
      return contacts.get(normalizedTarget) as string;
    }
    // Also try checking the userProfiles for backend display_name
    if (userProfiles.has(targetMobile)) {
      return userProfiles.get(targetMobile)?.display_name || targetMobile;
    }
    return fallback || targetMobile;
  };

  // --- Fast initialization from localStorage ---
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const savedUsername = localStorage.getItem("chatUser");
    const savedTheme = localStorage.getItem("chatTheme") || "light"; // default light
    const savedWallpaper = localStorage.getItem("chatWallpaper") || "solid-white";
    const savedRoomId = localStorage.getItem("selectedRoom");
    const savedSound = localStorage.getItem("chatSoundEnabled");

    setTheme(savedTheme);
    setWallpaper(savedWallpaper);
    if (savedRoomId) setSelectedRoom(savedRoomId);
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }

    if (savedUsername) {
      setCurrentUser({
        mobile: savedUsername,
        display_name: savedUsername,
        theme: savedTheme,
        wallpaper: savedWallpaper,
      });
      fetchUserProfile(savedUsername);
    }
  }, []);

  // --- Fetch App Config ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/admin/dashboard`);
        if (!res.ok) {
          if (res.status !== 404) {
            console.warn("⚠️ Failed to fetch app config", res.status);
          }
          return;
        }

        const data = await res.json();
        if (data.applications && data.applications.length > 0) {
          const defaultApp = data.applications.find((app: any) => app.app_name === "ZatChat Default") || data.applications[0];
          if (defaultApp) {
            if (defaultApp.allow_group_creation !== undefined) setAllowGroupCreation(defaultApp.allow_group_creation);
            if (defaultApp.app_name) setAppName(defaultApp.app_name);
            if (defaultApp.app_logo) setAppLogo(defaultApp.app_logo);
          }
        }
      } catch (err) {
        console.error("❌ Failed to fetch app config", err);
      }
    };
    fetchConfig();
  }, []);

  // --- Save preferences and apply theme to html element ---
  useEffect(() => {
    if (selectedRoom) localStorage.setItem("selectedRoom", selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
    // For Tailwind dark mode: add/remove dark class on html element
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Also set data-theme attribute if needed (optional)
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatWallpaper", wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    const syncUserPreferences = async () => {
      if (!currentUser?.mobile) return;
      try {
        await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(currentUser.mobile)}/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            theme,
            wallpaper,
            sound_enabled: soundEnabled,
          }),
        });
      } catch (err) {
        console.error("❌ Failed to sync user preferences:", err);
      }
    };

    syncUserPreferences();
  }, [currentUser?.mobile, theme, wallpaper, soundEnabled]);

  useEffect(() => {
    localStorage.setItem("chatSoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  // Using real high-quality MP3 UI notification sounds
  const audioSend = useRef<HTMLAudioElement | null>(null);
  const audioReceive = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio files
    audioSend.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    audioReceive.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    audioSend.current.volume = 0.5;
    audioReceive.current.volume = 0.7;
  }, []);

  const playNotificationSound = (type: "send" | "receive") => {
    if (!soundEnabled) return;
    try {
      if (type === "send" && audioSend.current) {
        audioSend.current.currentTime = 0;
        const playPromise = audioSend.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.warn("Audio blocked by browser policy:", e));
        }
      } else if (type === "receive" && audioReceive.current) {
        audioReceive.current.currentTime = 0;
        const playPromise = audioReceive.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.warn("Audio blocked by browser policy:", e));
        }
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  // --- Socket connection ---
  useEffect(() => {
    const handleConnect = () => {
      setIsSocketConnected(true);
      if (currentUser) socket.emit("user_join", { mobile: currentUser.mobile });
      if (selectedRoom) socket.emit("join_room", selectedRoom);
      
      // Actively subscribe to all ambient chats to receive Global Typing + Unread Badges universally
      chatRooms.forEach(room => {
        socket.emit("join_room", room.id);
      });
    };
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentUser, selectedRoom]);

  // --- Room listeners ---
  useEffect(() => {
    const handleRoomUpdated = ({ roomId, lastMessage, sender, timestamp }: any) => {
      setChatRooms((prev) => {
        const exists = prev.some((r) => r.id === roomId);
        if (!exists) {
          // Room not heavily cached, pull it and return previous explicitly
          setTimeout(refreshRooms, 200);
          return prev;
        }
        return prev
          .map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  last_message: lastMessage,
                  last_message_sender: sender,
                  last_message_time: timestamp,
                  unread_count:
                    sender !== currentUser?.mobile && selectedRoom !== roomId
                      ? room.unread_count + 1
                      : room.unread_count,
                 }
              : room
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
          );
      });
    };

    const handleUserOnline = ({ mobile }: any) => {
      setOnlineUsers((prev) => new Set(prev).add(mobile));
    };

    const handleUserOffline = ({ mobile, last_seen }: any) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mobile);
        return newSet;
      });
      if (last_seen) {
        setUserProfiles((prev) => {
          const profile = prev.get(mobile);
          if (profile) {
            const newMap = new Map(prev);
            newMap.set(mobile, { ...profile, last_seen });
            return newMap;
          }
          return prev;
        });
      }
    };

    const handleNewGroupCreated = () => refreshRooms();

    const handlePermissionUpdated = ({ mobile, is_admin, can_create_group }: any) => {
      if (currentUser && currentUser.mobile === mobile) {
        setCurrentUser(prev => prev ? { ...prev, is_admin, can_create_group } : prev);
      }
    };
    
    const handleUserBanned = ({ mobile }: any) => {
      if (currentUser && currentUser.mobile === mobile) {
        setCurrentUser(prev => prev ? { ...prev, is_banned: true } : prev);
        socket.disconnect(); // violently disconnect them
      }
    };
    
    const handleUserWarned = ({ mobile, message, warning_count }: any) => {
      if (currentUser && currentUser.mobile === mobile) {
        alert(`🚨 ADMIN WARNING (${warning_count}):\n\n${message}`);
      }
    };

    const handleGlobalTyping = ({ roomId, sender }: any) => {
      if (currentUser && sender === currentUser.mobile) return;
      setTypingUsers(prev => {
        const roomSet = new Set(prev[roomId] || []);
        roomSet.add(sender);
        return { ...prev, [roomId]: roomSet };
      });
    };

    const handleGlobalStopTyping = ({ roomId, sender }: any) => {
      setTypingUsers(prev => {
        if (!prev[roomId]) return prev;
        const roomSet = new Set(prev[roomId]);
        roomSet.delete(sender);
        if (roomSet.size === 0) {
          const next = { ...prev };
          delete next[roomId];
          return next;
        }
        return { ...prev, [roomId]: roomSet };
      });
    };

    const handleGlobalReceiveMessage = (msg: any) => {
      if (currentUser && msg.receiver_mobile === currentUser.mobile) {
        if (selectedRoom !== msg.room_id) {
          socket.emit("message_delivered", { roomId: msg.room_id, messageId: msg.id });
        }
      }
    };

    const handleNewChatCreated = () => refreshRooms();

    socket.on("room_updated", handleRoomUpdated);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("new_group_created", handleNewGroupCreated);
    socket.on("new_chat_created", handleNewChatCreated);
    socket.on("user_permission_updated", handlePermissionUpdated);
    socket.on("user_banned", handleUserBanned);
    socket.on("user_warned", handleUserWarned);
    socket.on("typing", handleGlobalTyping);
    socket.on("stop_typing", handleGlobalStopTyping);
    socket.on("receive_message", handleGlobalReceiveMessage);

    return () => {
      socket.off("room_updated", handleRoomUpdated);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("new_group_created", handleNewGroupCreated);
      socket.off("new_chat_created", handleNewChatCreated);
      socket.off("user_permission_updated", handlePermissionUpdated);
      socket.off("user_banned", handleUserBanned);
      socket.off("user_warned", handleUserWarned);
      socket.off("typing", handleGlobalTyping);
      socket.off("stop_typing", handleGlobalStopTyping);
      socket.off("receive_message", handleGlobalReceiveMessage);
    };
  }, [currentUser, selectedRoom]);

  // --- Fetch current user profile (used at login) ---
  const fetchUserProfile = async (mobile: string) => {
    try {
      let res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(mobile)}`, {
        headers: { "x-api-key": API_KEY },
      });
      let userData;

      if (res.ok) {
        userData = await res.json();
      } else {
        res = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({ mobile, display_name: mobile }),
        });
        if (res.ok) userData = await res.json();
      }

      if (userData) {
        const localTheme = localStorage.getItem("chatTheme");
        const localWallpaper = localStorage.getItem("chatWallpaper");
        const resolvedTheme = localTheme || userData.theme || "light";
        const resolvedWallpaper = localWallpaper || userData.wallpaper || "solid-white";

        setCurrentUser({
          ...userData,
          theme: resolvedTheme,
          wallpaper: resolvedWallpaper,
        });
        setTheme(resolvedTheme);
        setWallpaper(resolvedWallpaper);
        if (socket.connected) socket.emit("user_join", { mobile: userData.mobile });
      }
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    }
  };

  // --- Load a single user profile (cached) ---
  const loadUserProfile = async (mobile: string): Promise<ChatUser | null> => {
    if (userProfiles.has(mobile)) {
      return userProfiles.get(mobile) || null;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(mobile)}`, {
        headers: { "x-api-key": API_KEY },
      });
      if (!res.ok) return null;
      const userData = await res.json();
      setUserProfiles((prev) => new Map(prev).set(mobile, userData));
      return userData;
    } catch (err) {
      console.error(`❌ Failed to load profile for ${mobile}:`, err);
      return null;
    }
  };

  // --- Refresh rooms and preload profiles of all chat partners ---
  const refreshRooms = async (force = false) => {
    if (!currentUser) return;
    const now = Date.now();
    const minRefreshIntervalMs = 1200;
    if (
      !force &&
      (refreshInFlight.current || now - lastRefreshAt.current < minRefreshIntervalMs)
    ) {
      pendingRefresh.current = true;
      return;
    }

    refreshInFlight.current = true;
    lastRefreshAt.current = now;
    setIsLoading(true);
    try {
      const url = `${API_URL}/api/v1/chats/rooms/${currentUser.mobile}`;
      const res = await fetch(url, {
        headers: { "x-api-key": API_KEY },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatRoom[] = await res.json();
      setChatRooms(data);
      
      // Wire up infinite listeners for all our rooms
      if (socket.connected) {
        data.forEach((room) => {
          socket.emit("join_room", room.id);
        });
      }

      const otherUsernames = data
        .filter((room) => !room.is_group)
        .map((room) => {
          if (room.other_user) return room.other_user;
          return room.participant_1 === currentUser.mobile
            ? room.participant_2
            : room.participant_1;
        })
        .filter(Boolean);

      const uniqueOthers = [...new Set(otherUsernames)];

      await Promise.all(
        uniqueOthers.map(async (mobile) => {
          if (!userProfiles.has(mobile)) {
            try {
              const userRes = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(mobile)}`, {
                headers: { "x-api-key": API_KEY },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                setUserProfiles((prev) => new Map(prev).set(mobile, userData));
              }
            } catch (err) {
              console.error(`Failed to preload ${mobile}:`, err);
            }
          }
        })
      );
    } catch (err) {
      console.error("❌ Error refreshing rooms:", err);
      setChatRooms([]);
    } finally {
      setIsLoading(false);
      refreshInFlight.current = false;
      if (pendingRefresh.current) {
        pendingRefresh.current = false;
        setTimeout(() => {
          refreshRooms(true);
        }, 250);
      }
    }
  };

  useEffect(() => {
    if (currentUser?.mobile) {
      refreshRooms();
      fetchContacts();
    }
  }, [currentUser?.mobile]);

  // Combine Global limits with Individual child-admin Overrides
  const effectiveAllowGroupCreation = currentUser?.can_create_group || allowGroupCreation;

  if (currentUser?.is_banned) {
    return (
      <div className="fixed inset-0 z-50 bg-red-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="bg-white/10 p-10 rounded-3xl backdrop-blur-md border border-white/20">
          <svg className="w-24 h-24 text-white mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-4">ACCOUNT SUSPENDED</h1>
          <p className="text-xl text-red-100 font-medium max-w-lg mx-auto">Your access has been permanently revoked by the administration for violating community guidelines.</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        chatRooms,
        setChatRooms,
        selectedRoom,
        setSelectedRoom,
        theme,
        setTheme,
        wallpaper,
        setWallpaper,
        refreshRooms,
        onlineUsers,
        isSocketConnected,
        isLoading,
        userProfiles,
        loadUserProfile,
        allowGroupCreation: effectiveAllowGroupCreation,
        appName,
        appLogo,
        typingUsers,
        soundEnabled,
        setSoundEnabled,
        playNotificationSound,
        contacts,
        fetchContacts,
        getDisplayName
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};