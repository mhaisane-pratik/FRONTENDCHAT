import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import GroupInfoModal from "./GroupInfoModal";
import UserProfileModal from "./UserProfileModal";
import { resolveMediaUrl } from "../../utils/mediaUrl";

import SaveContactModal from "./SaveContactModal";

import {
  LogOut,
  Image,
  Info,
  ArrowLeft,
  Users,
  MoreVertical,
  Video,
  Crown,
  Shield,
  UserCircle2,
  Search,
  Clock,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env.VITE_API_URL as string;

interface ChatHeaderProps {
  receiver: string;
  roomId: string;
  onMediaClick: () => void;
  onBack?: () => void;
  onClearChat?: () => void;
  onSearchAction?: () => void;
  toggleSidebar?: () => void;
  sidebarHidden?: boolean;
}

export default function ChatHeader({
  receiver,
  roomId,
  onMediaClick,
  onBack,
  onClearChat,
  onSearchAction,
  toggleSidebar,
  sidebarHidden,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const { onlineUsers, setCurrentUser, setSelectedRoom, chatRooms, currentUser, userProfiles, typingUsers, getDisplayName } = useChat();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSaveContact, setShowSaveContact] = useState(false);

  const room = chatRooms.find((r) => r.id === roomId);
  const isGroup = room?.is_group || false;
  const memberCount = room?.member_count;
  const groupIcon = room?.group_icon;
  const isAdmin = room?.created_by === currentUser?.mobile;

  const cachedProfile = !isGroup ? userProfiles.get(receiver) : null;
  const rawFallbackName = cachedProfile?.display_name || receiverInfo?.display_name || receiver;
  const displayName = isGroup
    ? room?.group_name
    : getDisplayName(receiver, rawFallbackName);

  const isOnline = !isGroup && onlineUsers.has(receiver);

  useEffect(() => {
    if (!isGroup && receiver && receiver !== currentUser?.mobile && !cachedProfile) {
      fetchReceiverInfo();
    }
  }, [receiver, isGroup, currentUser, cachedProfile]);

  const fetchReceiverInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(receiver)}`);
      if (res.ok) {
        const data = await res.json();
        setReceiverInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch receiver info:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    localStorage.removeItem("selectedRoom");
    if (roomId) socket.emit("leave_room", roomId);
    socket.disconnect();
    setCurrentUser(null);
    setSelectedRoom(null);
    navigate("/chat-login");
  };

  const handleHeaderClick = () => {
    if (isGroup) {
      setShowGroupInfo(true);
      return;
    }
    setShowUserProfile(true);
  };

  const handleClearChat = () => {
    if (onClearChat) {
      onClearChat();
      setShowOptions(false);
    }
  };

  return (
    <>
      <div
        className={`
          flex justify-between items-center z-[20]
          bg-white/95 dark:bg-gray-800/95 backdrop-blur-md
          border-b border-gray-200/50 dark:border-gray-700/50
          px-3 md:px-6 py-2 md:py-3 h-[60px] md:h-[72px] box-border
          transition-all duration-300
          shadow-[0_2px_15px_rgba(0,0,0,0.05)]
          w-full flex-shrink-0
          cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50
        `}
        onClick={handleHeaderClick}
      >
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 max-w-[calc(100%-120px)] md:max-w-none">
          {/* Mobile back button */}
          {onBack && (
            <button
              className={`
                flex md:hidden items-center justify-center
                w-8 h-8 rounded-lg
                bg-gray-100 dark:bg-gray-700
                text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          
          {/* Laptop sidebar toggle */}
          {toggleSidebar && (
            <button
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-750 shadow-sm transition-all duration-200 active:scale-90 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
              title={sidebarHidden ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarHidden ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {isGroup ? (
              <div
                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl
                  bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                  flex items-center justify-center text-white
                  shadow-md
                  text-base md:text-xl
                  ring-2 ring-white dark:ring-gray-800
                `}
              >
                {groupIcon || <Users size={20} className="md:w-6 md:h-6" />}
              </div>
            ) : (
              <>
                <img
                  src={
                    resolveMediaUrl(cachedProfile?.profile_picture || receiverInfo?.profile_picture) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || '')}&background=0D9488&color=fff&size=48&font-size=0.33&bold=true`
                  }
                  alt={receiver}
                  className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover
                    ring-2 ring-white dark:ring-gray-800
                    shadow-md
                  `}
                />
                {!isGroup && (
                  <span
                    className={`
                      absolute -bottom-0.5 -right-0.5
                      w-3 h-3 md:w-3.5 md:h-3.5 rounded-full
                      ${isOnline
                        ? "bg-green-500 ring-2 ring-white dark:ring-gray-800"
                        : "bg-gray-400 ring-2 ring-white dark:ring-gray-800"
                      }
                    `}
                  />
                )}
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <h3
                className="font-bold truncate text-gray-900 dark:text-white text-base md:text-lg lg:text-xl"
              >
                {displayName}
              </h3>
              {isGroup && isAdmin && (
                <Crown size={14} className="text-amber-500 flex-shrink-0 md:w-4 md:h-4" />
              )}
              {isGroup && room?.is_verified && (
                <Shield size={14} className="text-blue-500 flex-shrink-0 md:w-4 md:h-4" />
              )}
            </div>
            
            {isGroup ? (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                <Users size={12} className="flex-shrink-0 md:w-3.5 md:h-3.5" />
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]">
                  {memberCount || 0} member{memberCount !== 1 ? "s" : ""}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1 hidden xs:inline" />
                <span className="hidden xs:inline truncate max-w-[60px]">
                  {room?.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                {isOnline ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 min-w-0">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[60px] xs:max-w-[80px]">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 min-w-0">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[60px] xs:max-w-[80px]">Offline</span>
                  </div>
                )}
                {typingUsers[roomId] && typingUsers[roomId].has(receiver) && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
                    <span className="text-blue-500 dark:text-blue-400 font-medium animate-pulse truncate max-w-[60px] xs:max-w-[80px]">
                      typing...
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          <button
            className={`
              hidden sm:flex items-center justify-center
              w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
              bg-gray-100 dark:bg-gray-700
              text-gray-600 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-gray-600
              hover:text-indigo-600 dark:hover:text-indigo-400
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            `}
            onClick={(e) => { e.stopPropagation(); }}
            title="Video call"
          >
            <Video size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          {isGroup && (
            <button
              className={`
                flex items-center justify-center
                w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
                bg-gray-100 dark:bg-gray-700
                text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                hover:text-indigo-600 dark:hover:text-indigo-400
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); }}
              title="Group info"
            >
              <Info size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          )}

          <button
            className={`
              flex items-center justify-center
              w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
              bg-gray-100 dark:bg-gray-700
              text-gray-600 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-gray-600
              hover:text-emerald-600 dark:hover:text-emerald-400
              active:scale-95
              transition-all duration-200
              flex-shrink-0
            `}
            onClick={(e) => { e.stopPropagation(); onMediaClick(); }}
            title="Shared media"
          >
            <Image size={16} className="md:w-[18px] md:h-[18px]" />
          </button>

          <div className="relative">
            <button
              className={`
                flex items-center justify-center
                w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl
                bg-gray-100 dark:bg-gray-700
                text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600
                active:scale-95
                transition-all duration-200
                flex-shrink-0
              `}
              onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
              title="More options"
            >
              <MoreVertical size={16} className="md:w-[18px] md:h-[18px]" />
            </button>

            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-[999]" 
                  onClick={() => setShowOptions(false)} 
                />
                <div className="absolute right-0 top-10 md:top-12 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] md:min-w-[180px] animate-fadeIn">
                  {!isGroup && (
                    <button
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setShowSaveContact(true); setShowOptions(false); }}
                    >
                      <UserPlus size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">Add / Edit Contact</span>
                    </button>
                  )}
                  {isGroup && (
                    <button
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); setShowOptions(false); }}
                    >
                      <Info size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">View Info</span>
                    </button>
                  )}
                  <button
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    onClick={(e) => { e.stopPropagation(); if (onSearchAction) onSearchAction(); setShowOptions(false); }}
                  >
                    <Search size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Search messages</span>
                  </button>
                  <button
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
                  >
                    <Clock size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Clear chat</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleLogout(); setShowOptions(false); }}
                  >
                    <LogOut size={14} className="md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSaveContact && !isGroup && (
        <SaveContactModal 
          contactUsername={receiver} 
          defaultName={displayName === receiver ? "" : displayName}
          onClose={() => setShowSaveContact(false)} 
        />
      )}

      {showGroupInfo && isGroup && (
        <GroupInfoModal groupId={roomId} onClose={() => setShowGroupInfo(false)} />
      )}

      {!isGroup && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          profile={{
            mobile: receiver,
            display_name: displayName,
            bio: cachedProfile?.bio || receiverInfo?.bio,
            profile_picture:
              cachedProfile?.profile_picture ||
              receiverInfo?.profile_picture,
            is_online: isOnline,
            last_seen: cachedProfile?.last_seen || receiverInfo?.last_seen,
          }}
        />
      )}
    </>
  );
}