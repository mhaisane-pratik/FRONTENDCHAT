import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";

interface ChatItemProps {
  roomId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTime?: string;
  isGroup: boolean;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isSelected?: boolean;
  typingUsers?: string[];
  onClick: () => void;
}

export default function ChatItem({
  displayName,
  avatarUrl,
  lastMessage,
  lastMessageSender,
  lastMessageTime,
  isGroup,
  unreadCount = 0,
  isPinned = false,
  isMuted = false,
  isSelected,
  typingUsers,
  onClick,
}: ChatItemProps) {
  const { currentUser, onlineUsers } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || '')}&background=random`;

  const isOnline = !isGroup && onlineUsers.has(displayName);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    
    let safeString = dateString;
    if (!safeString.includes('Z') && !safeString.includes('+')) {
      safeString = safeString.replace(' ', 'T') + 'Z';
    }

    const date = new Date(safeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderPreviewText = () => {
    if (typingUsers && typingUsers.length > 0) {
      return (
        <span className="text-green-500 dark:text-green-400 font-semibold italic animate-pulse">
          {isGroup && typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : 'typing...'}
        </span>
      );
    }
    
    if (!lastMessage) return "No messages yet";
    if (
      lastMessage.startsWith("http") &&
      (lastMessage.includes(".jpg") ||
        lastMessage.includes(".png") ||
        lastMessage.includes(".jpeg") ||
        lastMessage.includes(".webp"))
    ) {
      return "📷 Photo";
    }
    if (lastMessage.startsWith("http") && lastMessage.includes(".")) {
      return "📎 File";
    }
    if (lastMessageSender === currentUser?.mobile) {
      return (
        <>
          <strong>You:</strong> {lastMessage}
        </>
      );
    }
    if (isGroup && lastMessageSender) {
      return (
        <>
          <strong>{lastMessageSender}:</strong> {lastMessage}
        </>
      );
    }
    return lastMessage;
  };

  return (
    <div
      className={`flex items-center px-3 py-1.5 cursor-pointer transition-colors duration-150 border-b border-gray-200 dark:border-gray-700 min-h-[60px] hover:bg-gray-100 dark:hover:bg-white/5 ${
        isSelected ? "bg-gray-100 dark:bg-white/10 border-l-4 border-l-green-500 pl-2.5" : ""
      } ${isPinned ? "" : ""} ${isMuted ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <div className="relative mr-2.5 flex-shrink-0">
        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold uppercase">
            {displayName?.charAt(0)?.toUpperCase()}
          </div>
        ) : (
          <>
            <img
              src={
                resolveMediaUrl(avatarUrl) ||
                avatarFallback
              }
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatarFallback;
              }}
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            )}
          </>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-center gap-1.5 mb-0.5">
          <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[70%]">
            <h4
              className={`m-0 text-sm font-semibold text-gray-900 dark:text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap w-full ${
                unreadCount > 0 ? "font-bold" : ""
              }`}
            >
              {displayName}
            </h4>
            {isPinned && <span className="text-xs text-gray-500 opacity-70">📌</span>}
            {isMuted && <span className="text-xs text-gray-500 opacity-70">🔇</span>}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            {formatTime(lastMessageTime)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-1.5">
          <p
            className={`m-0 text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap flex-1 ${
              unreadCount > 0 ? "font-semibold text-gray-900 dark:text-gray-200" : ""
            }`}
          >
            {renderPreviewText()}
          </p>
          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-green-500 dark:bg-green-600 text-white rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}