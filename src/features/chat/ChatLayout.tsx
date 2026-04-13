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
  const [sidebarHidden, setSidebarHidden] = useState(false);
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
      className={`flex w-screen h-[100dvh] overflow-hidden fixed inset-0 transition-colors duration-500 ${
        theme === "dark" ? "dark bg-[#0b141a]" : "bg-[#f0f2f5]"
      }`}
      data-wallpaper={wallpaper}
    >
      <div 
        className={`
          flex w-full h-full relative overflow-hidden transition-all duration-500
          ${theme === "dark" ? "bg-[#0b141a]" : "bg-white"}
        `}
      >
        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            ${isMobile ? "fixed inset-0 z-50 bg-white dark:bg-[#111b21]" : "relative"}
            ${(isMobile && selectedRoom) || (!isMobile && sidebarHidden) ? "translate-x-[-100%] opacity-0 pointer-events-none w-0" : "translate-x-0 opacity-100 w-full md:w-[300px] lg:w-[320px] xl:w-[360px]"}
            h-full transition-all duration-300 ease-in-out flex-shrink-0 z-[60] border-r border-gray-200/50 dark:border-gray-800/50 shadow-[1px_0_10px_rgba(0,0,0,0.02)]
          `}
        >
          <Sidebar
            onSettingsClick={() => setShowSettings(true)}
            isMobile={isMobile}
          />
        </div>

        {/* ================= CHAT AREA ================= */}
        <div className={`flex-1 h-full min-w-0 relative bg-[#efeae2] dark:bg-[#0b141a] transition-all duration-300 ${isMobile && !selectedRoom ? "hidden" : "block"}`}>
          {selectedRoom ? (
            <div className="absolute inset-0 animate-fadeIn overflow-hidden">
              <ChatWindow 
                onBack={handleBack} 
                toggleSidebar={() => setSidebarHidden(!sidebarHidden)}
                sidebarHidden={sidebarHidden}
              />
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 bg-[#f8f9fa] dark:bg-[#0b141a]">
              <div className="max-w-md animate-scaleUp">
                <div className="mb-8 relative">
                  <div className="absolute -inset-4 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <img 
                    src="file:///C:/Users/prati/.gemini/antigravity/brain/b43f089c-ecbf-44e8-abb7-c551b2a1960c/chat_splash_illustration_1776079793352.png" 
                    alt="ZatChat Welcome" 
                    className="w-72 h-72 mx-auto object-contain relative drop-shadow-2xl"
                  />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
                  ZatChat for Laptop
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
                  Send and receive messages without keeping your phone online. 
                  Keep your conversations secure and fast.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-bold">
                  <span className="w-10 h-[1px] bg-gray-300 dark:bg-gray-700"></span>
                  <span>End-to-End Encrypted</span>
                  <span className="w-10 h-[1px] bg-gray-300 dark:bg-gray-700"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= SETTINGS ================= */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] animate-fadeIn">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
}
