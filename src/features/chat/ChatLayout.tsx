import React, { useEffect, useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatSelect from "./ChatSelect";
import SettingsPanel from "./SettingsPanel";
import { socket } from "../../api/socket";

export default function ChatLayout() {
  const navigate = useNavigate();

  const {
    currentUser,
    selectedRoom,
    theme,
    wallpaper,
    setSelectedRoom,
  } = useChat();

  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isReady, setIsReady] = useState(false);

  /* ================= SCREEN RESIZE ================= */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && selectedRoom) {
        setSelectedRoom(selectedRoom); // keep state stable
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const savedUser = localStorage.getItem("chatUser");

    if (!savedUser && !currentUser) {
      navigate("/chat-login", { replace: true });
      return;
    }

    setIsReady(true);
  }, [currentUser, navigate]);

  /* ================= SOCKET JOIN ================= */
  useEffect(() => {
    if (currentUser && socket.connected) {
      socket.emit("user_join", {
        mobile: currentUser.mobile,
      });
    }
  }, [currentUser]);

  /* ================= BACK BUTTON ================= */
  const handleBack = () => {
    setSelectedRoom(null); // THIS is key fix
  };

  /* ================= LOADING ================= */
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-300">
          Initializing...
        </p>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div
      className={`flex w-screen h-[100dvh] overflow-hidden fixed inset-0 ${
        theme === "dark" ? "dark bg-gray-900" : "bg-white"
      }`}
      data-wallpaper={wallpaper}
    >
      {/* ================= SIDEBAR ================= */}
      <div
        className={`
          ${isMobile ? "absolute z-20 bg-white dark:bg-gray-900" : "relative"}
          ${isMobile && selectedRoom ? "hidden" : "block"}
          w-full md:w-[380px] lg:w-[420px] h-full border-r border-gray-200 dark:border-gray-700
        `}
      >
        <Sidebar
          onSettingsClick={() => setShowSettings(true)}
          isMobile={isMobile}
        />
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 h-full min-w-0 relative">
        {selectedRoom ? (
          <ChatWindow onBack={handleBack} />
        ) : (
          <ChatSelect />
        )}
      </div>

      {/* ================= SETTINGS ================= */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
