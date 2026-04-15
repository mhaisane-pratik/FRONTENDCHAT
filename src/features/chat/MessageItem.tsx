import React, { useState, useRef, useEffect } from "react";
import { Message } from "./ChatWindow";
import { socket } from "../../api/socket";
import { useChat } from "../../contexts/ChatContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  currentUser: string;
  onReply: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  searchQuery?: string;
  isHighlighted?: boolean;
  onRefresh: () => void;
}

const API_URL = "https://zatbackend.onrender.com";

export default function MessageItem({ 
  message, 
  isSent, 
  currentUser,
  onReply, 
  onDelete,
  onForward,
  searchQuery,
  isHighlighted,
  onRefresh 
}: MessageItemProps) {
  const { getDisplayName } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{url: string, type: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    let safeString = dateString;
    if (!safeString.includes('Z') && !safeString.includes('+')) {
      safeString = safeString.replace(' ', 'T') + 'Z';
    }
    const date = new Date(safeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageStatus = () => {
    if (!isSent) return null;
    if (message.is_seen) {
      return <span className="text-cyan-300 font-bold text-[11px] ml-1 drop-shadow-sm leading-none">✓✓</span>;
    }
    if (message.is_delivered) {
      return <span className="text-white/90 text-[11px] ml-1 font-medium leading-none">✓✓</span>;
    }
    return <span className="text-white/60 text-[11px] ml-1 font-medium leading-none">✓</span>;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  useEffect(() => {
    if (isHighlighted && wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const renderMessageContent = (text: string | null | undefined) => {
    if (!text) return null;
    if (!searchQuery) return text;
    try {
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, i) => {
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <mark 
              key={i} 
              className={`${isHighlighted ? 'bg-orange-500 text-white animate-pulse' : 'bg-yellow-300 text-black'} rounded-sm px-[2px] shadow-sm transition-colors duration-300`}
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch (e) {
      return text;
    }
  };

  const handleMessageClick = () => {
    setShowActions(!showActions);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (message.message) {
        await navigator.clipboard.writeText(message.message);
        showNotification("✓ Message copied", "success");
        setShowActions(false);
      }
    } catch (err) {
      showNotification("Failed to copy message", "error");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setShowActions(false);
    setShowDeleteModal(true);
  };

  const executeDelete = async (e: React.MouseEvent, deleteType: "me" | "everyone") => {
    e.stopPropagation();
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      socket.emit("delete_message", {
        messageId: message.id,
        mobile: currentUser,
        deleteFor: deleteType,
        roomId: message.room_id
      });
      showNotification(`✓ Message deleted`, "success");
      setTimeout(() => onRefresh(), 500);
    } catch (err) {
      showNotification("Failed to delete message", "error");
      setIsDeleting(false);
    }
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    if (onForward) onForward(message);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onReply(message);
  };

  const showNotification = (text: string, type: "success" | "error") => {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-lg text-sm font-semibold shadow-lg z-[1000000] animate-slideDownNotification ${type === 'success' ? 'bg-indigo-500' : 'bg-red-500'} text-white`;
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const mediaUrl = resolveMediaUrl(message.file_url || "");
  const apiOrigin = (() => {
    try {
      return new URL(API_URL).origin;
    } catch {
      return API_URL;
    }
  })();
  const rawFileUrl = (message.file_url || "").trim();
  const normalizedRawPath = rawFileUrl.replace(/\\/g, "/");
  const normalizedUploadPath = normalizedRawPath
    .replace(/^\/?src\/uploads\//i, "/uploads/")
    .replace(/^uploads\//i, "/uploads/");
  const directNormalizedUploadUrl = normalizedUploadPath
    ? resolveMediaUrl(normalizedUploadPath)
    : "";
  const localhostRewrittenUrl = normalizedRawPath
    ? normalizedRawPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, apiOrigin)
    : "";

  const toAbsoluteBackendUrl = (candidate: string) => {
    if (!candidate) return "";
    if (/^https?:\/\//i.test(candidate)) return candidate;
    const clean = candidate.startsWith("/") ? candidate : `/${candidate}`;
    return `${apiOrigin}${clean}`;
  };

  const directImageCandidates = Array.from(
    new Set(
      [
        // ✅ Prioritize direct backend URL first (most likely to work)
        toAbsoluteBackendUrl(normalizedUploadPath),
        toAbsoluteBackendUrl(normalizedRawPath),
        // Then try other resolved URLs
        mediaUrl,
        directNormalizedUploadUrl,
        localhostRewrittenUrl,
        // Finally, try raw external URLs
        /^https?:\/\//i.test(rawFileUrl) ? rawFileUrl : "",
      ].filter(Boolean)
    )
  );

  const proxyImageCandidates = directImageCandidates.map(
    (candidate) => `${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(candidate)}`
  );

  // ✅ Optimized candidates order: try direct first, then proxy
  const imageCandidates = Array.from(
    new Set([
      ...directImageCandidates.slice(0, 2), // Try top 2 direct URLs first
      ...proxyImageCandidates.slice(0, 2), // Then try top 2 proxy versions
      ...directImageCandidates.slice(2),   // Then remaining direct URLs
      ...proxyImageCandidates.slice(2),    // Finally, remaining proxy URLs
    ])
  );
  const fileRef = `${message.file_url || ""} ${message.file_name || ""}`.toLowerCase();
  const looksLikeImage = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)(\?|$)/.test(fileRef);
  const looksLikeVideo = /\.(mp4|webm|mov|m4v|avi|mkv|3gp)(\?|$)/.test(fileRef);
  const isImageMessage = Boolean(message.file_url) && (
    message.message_type === "image" || (message.message_type === "file" && looksLikeImage)
  );
  const isVideoMessage = Boolean(message.file_url) && (
    message.message_type === "video" || (message.message_type === "file" && looksLikeVideo)
  );
  const isGenericFileMessage = Boolean(message.file_url) && !isImageMessage && !isVideoMessage;
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [imageLoadAttempts, setImageLoadAttempts] = useState(0);
  const imageRenderSrc = imageCandidates[imageCandidateIndex] || "";

  useEffect(() => {
    setImageCandidateIndex(0);
    setImageLoadAttempts(0);
  }, [rawFileUrl, mediaUrl]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.stopPropagation();
    setImageLoadAttempts((prev) => prev + 1);
    
    // ✅ Improved fallback logic: prioritize proxy URLs after direct attempt fails
    setImageCandidateIndex((prev) => {
      const currentAttempt = imageLoadAttempts + 1;
      
      // Strategy: Try direct URLs first, then fallback to proxy versions
      if (currentAttempt === 1 && directImageCandidates.length > 0) {
        // First attempt failed, try the next direct candidate if available
        const nextDirect = prev + 1;
        if (nextDirect < directImageCandidates.length) {
          console.warn(`[Image][Attempt ${currentAttempt}] Direct URL failed, trying next direct URL:`, imageRenderSrc);
          return nextDirect;
        }
      }
      
      // If all direct URLs failed, move to proxy URLs
      if (currentAttempt > directImageCandidates.length) {
        const proxyIndex = currentAttempt - directImageCandidates.length - 1;
        if (proxyIndex < proxyImageCandidates.length) {
          console.warn(`[Image][Attempt ${currentAttempt}] Trying proxy URL:`, proxyImageCandidates[proxyIndex]);
          return directImageCandidates.length + proxyIndex;
        }
      }
      
      // All candidates exhausted
      console.error(`[Image][Attempt ${currentAttempt}] All URL candidates failed for:`, message.file_name);
      return -1;
    });
  };

  if (isDeleting) {
    return (
      <div className={`flex mb-2 px-4 ${isSent ? "justify-end" : "justify-start"}`}>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 italic px-3 py-2 rounded-2xl border border-yellow-300 dark:border-yellow-700 flex items-center gap-2 animate-pulse">
          <span className="animate-spin">⏳</span>
          <span className="text-xs font-semibold">Deleting...</span>
        </div>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div className={`flex mb-2 px-4 ${isSent ? "justify-end" : "justify-start"}`}>
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic px-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 flex items-center gap-2">
          <span>🚫</span>
          <span className="text-xs font-medium">
            {message.deleted_for === "everyone" 
              ? "This message was deleted" 
              : "You deleted this message"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`flex mb-2 px-4 relative transition-all duration-500 ${isSent ? "justify-end" : "justify-start"} ${isHighlighted ? "bg-black/5 dark:bg-white/5 py-1 rounded-lg" : ""}`}
      >
        <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] group ${isSent ? "items-end" : "items-start"}`} onClick={handleMessageClick}>
          {message.message_type === "text" && (
            <div
              className={`relative px-3 py-2 pb-6 shadow-sm rounded-2xl ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none self-end"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none self-start"
              }`}
            >

              {message.reply_to && (
                <div className="mb-1.5 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {getDisplayName(message.reply_to.sender_mobile)}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message.is_forwarded && (
                <div className="flex items-center gap-1 text-[10px] italic opacity-80 mb-1 font-medium">
                  <span>↪️</span>
                  <span>Forwarded</span>
                </div>
              )}

              <p className="m-0 text-[14.5px] leading-snug break-words whitespace-pre-wrap select-text relative">
                {renderMessageContent(message.message)}
                <span className="inline-block w-[60px] h-0"></span>
              </p>
              
              <div className="absolute bottom-1 right-2 flex items-center gap-1.5 bg-gradient-to-l from-black/5 to-transparent px-1 rounded">
                <span className={`text-[10px] font-medium ${isSent ? "text-white/90" : "text-gray-500 dark:text-gray-400"}`}>
                  {formatTime(message.created_at)}
                </span>
                {isSent && (
                   <span className="flex items-center">
                     {message.is_seen ? (
                       <span className="text-cyan-300 font-bold text-[11px] leading-none drop-shadow-sm">✓✓</span>
                     ) : (
                       <span className="text-white/70 text-[11px] leading-none">
                         {message.is_delivered ? "✓✓" : "✓"}
                       </span>
                     )}
                   </span>
                )}
              </div>
            </div>
          )}

          {isImageMessage && (
            <div
              className={`relative rounded-2xl p-1 max-w-[320px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.reply_to && (
                <div className="m-1 mb-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {getDisplayName(message.reply_to.sender_mobile)}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {imageRenderSrc && (
                <img
                  src={imageRenderSrc}
                  alt="Shared"
                  className="block w-[min(320px,70vw)] max-w-full max-h-[380px] h-auto object-contain bg-black/5 dark:bg-black/20 rounded-xl cursor-pointer transition-transform hover:scale-[1.01]"
                  onError={handleImageError}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imageRenderSrc) {
                      setFullscreenMedia({ url: imageRenderSrc, type: 'image' });
                    }
                  }}
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              )}

              {!imageRenderSrc && (
                <div className="w-[min(320px,70vw)] max-w-full h-[180px] rounded-xl bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-300">
                  <span>Unable to load image</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`[Image] Manual retry clicked for: ${message.file_name}`);
                      setImageCandidateIndex(0);
                      setImageLoadAttempts(0);
                    }}
                    className="px-3 py-1.5 rounded-md bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition"
                  >
                    Retry
                  </button>
                </div>
              )}
              
                {message.message && (
                  <p className={`m-1 text-sm break-words select-text relative ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {renderMessageContent(message.message)}
                    <span className="inline-block w-[60px] h-0"></span>
                  </p>
                )}
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                <span className="text-[10px] text-white font-medium">
                  {formatTime(message.created_at)}
                </span>
                {isSent && (
                  <span className="flex items-center">
                    {message.is_seen ? (
                      <span className="text-cyan-300 font-bold text-[11px] leading-none drop-shadow-sm">✓✓</span>
                    ) : (
                      <span className="text-white/80 text-[11px] leading-none">
                        {message.is_delivered ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {isVideoMessage && (
            <div
              className={`relative rounded-2xl p-1 max-w-[280px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.reply_to && (
                <div className="m-1 mb-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {getDisplayName(message.reply_to.sender_mobile)}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <video
                src={mediaUrl}
                className="w-full max-h-[300px] object-cover rounded-xl cursor-pointer"
                controls
                preload="metadata"
                controlsList="nodownload"
                crossOrigin="anonymous"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenMedia({ url: mediaUrl, type: 'video' });
                }}
              />
              
                {message.message && (
                  <p className={`m-1 text-sm break-words select-text relative ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {renderMessageContent(message.message)}
                    <span className="inline-block w-[60px] h-0"></span>
                  </p>
                )}
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                <span className="text-[10px] text-white font-medium">
                  {formatTime(message.created_at)}
                </span>
                {isSent && (
                  <span className="flex items-center">
                    {message.is_seen ? (
                      <span className="text-cyan-300 font-bold text-[11px] leading-none drop-shadow-sm">✓✓</span>
                    ) : (
                      <span className="text-white/80 text-[11px] leading-none">
                        {message.is_delivered ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {isGenericFileMessage && (
            <div
              className={`relative rounded-2xl p-2 min-w-[240px] max-w-[320px] shadow-sm ${
                isSent
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.reply_to && (
                <div className="mb-1.5 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${isSent ? "bg-white/90" : "bg-indigo-500"}`}></div>
                    <div className={`flex-1 p-1 ${isSent ? "bg-white/15" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                      <div className={`font-semibold text-[10px] mb-0.5 ${isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {getDisplayName(message.reply_to.sender_mobile)}
                      </div>
                      <div className="text-[10px] line-clamp-2 opacity-85 text-gray-700 dark:text-gray-300">
                        {message.reply_to.message || "📎 Attachment"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-1.5 rounded-lg no-underline text-inherit hover:bg-black/5 dark:hover:bg-white/10 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                  isSent ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                }`}>
                  📎
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {message.file_name || "Download File"}
                  </div>
                  {message.file_size && (
                    <div className={`text-[10px] mt-0.5 ${isSent ? "text-white/75" : "text-gray-500 dark:text-gray-400"}`}>
                      {(message.file_size / 1024).toFixed(2)} KB
                    </div>
                  )}
                </div>
              </a>
              {message.message && (
                <p className={`mt-1.5 mb-2 text-sm break-words select-text relative ${isSent ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {renderMessageContent(message.message)}
                  <span className="inline-block w-[60px] h-0"></span>
                </p>
              )}
              <div className="absolute bottom-1 right-2 flex items-center gap-1 bg-black/5 dark:bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                <span className={`text-[10px] font-medium ${isSent ? "text-white/90" : "text-gray-500 dark:text-gray-400"}`}>
                  {formatTime(message.created_at)}
                </span>
                {isSent && (
                  <span className="flex items-center">
                    {message.is_seen ? (
                      <span className="text-cyan-300 font-bold text-[11px] leading-none drop-shadow-sm">✓✓</span>
                    ) : (
                      <span className="text-white/80 text-[11px] leading-none">
                        {message.is_delivered ? "✓✓" : "✓"}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {showActions && (
            <div className={`absolute flex gap-1 p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[100000] animate-slideInActions ${
              isSent ? "bottom-full right-0" : "bottom-full left-0"
            }`}>
              <button
                onClick={handleReply}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <span>↩️</span>
                <span>Reply</span>
              </button>

              {message.message && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition"
                >
                  <span>📋</span>
                  <span>Copy</span>
                </button>
              )}

              <button
                onClick={handleForward}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <span>➡️</span>
                <span>Forward</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {fullscreenMedia && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-[999999] animate-fadeIn"
            onClick={() => setFullscreenMedia(null)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000000] max-w-[90vw] max-h-[90vh] flex flex-col items-center animate-zoomIn">
            <button
              className="absolute -top-12 right-0 w-10 h-10 bg-white/90 rounded-full text-3xl cursor-pointer flex items-center justify-center hover:bg-white transition hover:rotate-90"
              onClick={() => setFullscreenMedia(null)}
            >
              ×
            </button>
            {fullscreenMedia.type === 'image' ? (
              <img
                src={`${API_URL}/api/v1/proxy-image?url=${encodeURIComponent(fullscreenMedia.url)}`}
                alt="Full size"
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              />
            )}
            <a
              href={fullscreenMedia.url}
              download
              className="mt-6 bg-white/90 px-6 py-2.5 rounded-xl no-underline text-gray-900 font-bold text-sm hover:bg-white transition hover:-translate-y-1 shadow-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Download Media
            </a>
          </div>
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col animate-scaleUp border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-base font-bold text-gray-900 dark:text-white text-center m-0">Delete message?</h3>
            </div>
            <div className="flex flex-col p-2 space-y-1">
              {isSent && (
                <button
                  onClick={(e) => executeDelete(e, "everyone")}
                  className="w-full py-3 px-4 text-red-500 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-sm disabled:opacity-50"
                  disabled={isDeleting}
                >
                  Delete for everyone
                </button>
              )}
              <button
                onClick={(e) => executeDelete(e, "me")}
                className="w-full py-3 px-4 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-sm disabled:opacity-50"
                disabled={isDeleting}
              >
                Delete for me
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}
                className="w-full py-3 px-4 text-indigo-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition mt-1 text-sm disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}