import React, { useEffect, useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { getWallpaperById } from "./wallpapers";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import MediaViewer from "./MediaViewer";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = "https://zatbackend.onrender.com";
const API_KEY = "ZATCHAT_PRATEEK9373";

export interface Message {
  id: string;
  room_id?: string;
  sender_mobile: string;
  receiver_mobile: string;
  message?: string;
  message_type: "text" | "image" | "file" | "video" | "audio";
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_delivered: boolean;
  is_seen: boolean;
  is_deleted?: boolean;
  deleted_for?: string;
  deleted_at?: string;
  reply_to_id?: string;
  reply_to?: Message | null;
  is_forwarded?: boolean;
  forwarded_from?: string;
  created_at: string;
  is_temp?: boolean;
}

const getWallpaperStyle = (wallpaperId: string): React.CSSProperties => {
  const wallpaperConfig = getWallpaperById(wallpaperId);
  if (wallpaperConfig) {
    return { background: wallpaperConfig.css };
  }
  return { background: "#efeae2" };
};

interface ChatWindowProps {
  onBack?: () => void;
  toggleSidebar?: () => void;
  sidebarHidden?: boolean;
}

export default function ChatWindow({ onBack, toggleSidebar, sidebarHidden }: ChatWindowProps) {
  const { currentUser, selectedRoom, chatRooms, wallpaper, typingUsers, playNotificationSound } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [receiver, setReceiver] = useState<string>("");
  const [showMedia, setShowMedia] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [forwardSelectedRooms, setForwardSelectedRooms] = useState<string[]>([]);
  const [forceScrollToBottomKey, setForceScrollToBottomKey] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileViewportTopOffset, setMobileViewportTopOffset] = useState(0);
  const [mobileKeyboardInset, setMobileKeyboardInset] = useState(0);


  useEffect(() => {
    if (!isSearching || !searchQuery) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = messages
      .filter((m) => m.message_type === "text" && m.message?.toLowerCase().includes(query))
      .map((m) => m.id);
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? results.length - 1 : -1);
  }, [searchQuery, messages, isSearching]);

  const handleSearchNext = () => {
    if (currentSearchIndex > 0) {
      setCurrentSearchIndex((prev) => prev - 1);
    }
  };

  const handleSearchPrev = () => {
    if (currentSearchIndex < searchResults.length - 1) {
      setCurrentSearchIndex((prev) => prev + 1);
    }
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  const room = chatRooms.find((r) => r.id === selectedRoom);
  const hasJoinedRoom = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!selectedRoom || !currentUser) return;
    let receiverName = "";
    if (room?.other_user) {
      receiverName = room.other_user;
    } else {
      const stored = localStorage.getItem(`room_${selectedRoom}_receiver`);
      if (stored) {
        receiverName = stored;
      } else {
        const participants = selectedRoom.split("__");
        receiverName = participants.find((p) => p !== currentUser.mobile) || "";
      }
    }
    if (receiverName) {
      setReceiver(receiverName);
      localStorage.setItem(`room_${selectedRoom}_receiver`, receiverName);
    }
  }, [selectedRoom, currentUser, room]);

  useEffect(() => {
    if (!selectedRoom || !currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setMessages([]);
    setError(null);
    setReplyingTo(null);
    setShowMedia(false);
    loadMessages();
    if (!hasJoinedRoom.current && socket.connected) {
      socket.emit("join_room", selectedRoom);
      hasJoinedRoom.current = true;
    }
  }, [selectedRoom, currentUser]);

  useEffect(() => {
    const updateViewportState = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);
      if (!mobile) {
        setMobileViewportTopOffset(0);
        setMobileKeyboardInset(0);
        return;
      }

      const vv = window.visualViewport;
      if (!vv) {
        setMobileViewportTopOffset(0);
        setMobileKeyboardInset(0);
        return;
      }

      const topOffset = Math.max(0, Math.round(vv.offsetTop));
      const keyboardInset = Math.max(
        0,
        Math.round(window.innerHeight - (vv.height + vv.offsetTop))
      );
      setMobileViewportTopOffset(topOffset);
      setMobileKeyboardInset(keyboardInset);
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    window.visualViewport?.addEventListener("resize", updateViewportState);
    window.visualViewport?.addEventListener("scroll", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      window.visualViewport?.removeEventListener("resize", updateViewportState);
      window.visualViewport?.removeEventListener("scroll", updateViewportState);
    };
  }, []);

  useEffect(() => {
    if (!selectedRoom || !currentUser) return;
    const handleReceiveMessage = (msg: Message) => {
      if (msg.room_id !== selectedRoom) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;

        // Reconcile optimistic local message when server copy arrives.
        if (currentUser && msg.sender_mobile === currentUser.mobile) {
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.is_temp &&
              m.sender_mobile === msg.sender_mobile &&
              m.message_type === msg.message_type &&
              // If it's a media message, don't strictly match the file_url since blob != server URL
              (msg.message_type !== "text" ? true : (m.message || "") === (msg.message || ""))
          );

          if (optimisticIdx >= 0) {
            const next = [...prev];
            // Preserve local blob URL if the server URL is not yet ready or for immediate playback
            next[optimisticIdx] = { ...msg, is_temp: false };
            return next;
          }
        }

        if (msg.reply_to_id && !msg.reply_to) {
          const replyToMsg = prev.find((m) => m.id === msg.reply_to_id);
          if (replyToMsg) msg.reply_to = replyToMsg;
        }
        return [...prev, msg];
      });
      setForceScrollToBottomKey((k) => k + 1);
      if (msg.sender_mobile !== currentUser.mobile) {
        playNotificationSound("receive");
        setTimeout(() => {
          socket.emit("message_seen", {
            roomId: selectedRoom,
            viewer: currentUser.mobile,
            messageIds: [msg.id],
          });
        }, 500);
      }
    };
    const handleMessageDelivered = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_delivered: true } : m))
      );
    };
    const handleMessageSeen = ({ messageIds }: { messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id) ? { ...m, is_seen: true, is_delivered: true } : m
        )
      );
    };
    const handleMessageDeleted = ({ messageId, deletedFor }: any) => {
      if (deletedFor === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, deleted_for: "everyone" } : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    };
    const handleError = (err: any) => {
      console.error("Backend Error:", err);
      alert(`Oops! Backend rejected message: ${err.message}`);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_seen", handleMessageSeen);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("error", handleError);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("message_seen", handleMessageSeen);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("error", handleError);
    };
  }, [selectedRoom, currentUser]);

  const loadMessages = async () => {
    if (isLoadingRef.current || !selectedRoom || !currentUser) {
      setLoading(false);
      return;
    }
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/v1/chats/history/${selectedRoom}?mobile=${currentUser.mobile}`;
      const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      
      const fetchedMessages: Message[] = Array.isArray(data) ? data : data.messages || [];
      const newHasMore = typeof data.hasMore === 'boolean' ? data.hasMore : false;

      const processedMessages = fetchedMessages.map((msg) => {
        if (msg.reply_to_id) {
          const replyToMsg = fetchedMessages.find((m) => m.id === msg.reply_to_id);
          if (replyToMsg) msg.reply_to = replyToMsg;
        }
        return msg;
      });
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
      setForceScrollToBottomKey((k) => k + 1);
      setHasMore(newHasMore);
      if (sortedMessages.length > 0) markAsRead(sortedMessages);
    } catch (err: any) {
      console.error("❌ Failed to load messages:", err);
      setError("Failed to load messages. Please try again.");
      setMessages([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0 || !selectedRoom || !currentUser) return;
    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const url = `${API_URL}/api/v1/chats/history/${selectedRoom}?mobile=${currentUser.mobile}&before=${encodeURIComponent(oldestMessage.created_at)}`;
      const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      const fetchedMessages: Message[] = Array.isArray(data) ? data : data.messages || [];
      const newHasMore = typeof data.hasMore === 'boolean' ? data.hasMore : false;
      
      if (fetchedMessages.length === 0) {
        setHasMore(false);
        return;
      }

      const processedMessages = fetchedMessages.map((msg) => {
        if (msg.reply_to_id) {
          const replyToMsg = fetchedMessages.find((m) => m.id === msg.reply_to_id);
          if (replyToMsg) msg.reply_to = replyToMsg;
        }
        return msg;
      });
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setMessages(prev => [...sortedMessages, ...prev]);
      setHasMore(newHasMore);
    } catch (err) {
      console.error("❌ Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const markAsRead = async (msgsToMark: Message[] = messages) => {
    if (!selectedRoom || !currentUser) return;
    
    // Immediately compute explicit IDs instead of relying on the backend, 
    // to prevent the HTTP update from clearing the dirty rows before the Socket fires.
    const unseenIds = msgsToMark
      .filter(m => m.sender_mobile !== currentUser.mobile && !m.is_seen)
      .map(m => m.id);

    // Update locally instantly to feel real-time
    if (unseenIds.length > 0) {
      setMessages(prev => prev.map(m => 
        unseenIds.includes(m.id) ? { ...m, is_seen: true, is_delivered: true } : m
      ));
      
      socket.emit("message_seen", {
        roomId: selectedRoom,
        viewer: currentUser.mobile,
        messageIds: unseenIds,
      });
    }

    try {
      await fetch(`${API_URL}/api/v1/chats/mark-read/${selectedRoom}/${currentUser.mobile}`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
      });
    } catch (err) {
      console.error("❌ Mark as read failed:", err);
    }
  };

  const handleReply = (message: Message) => setReplyingTo(message);
  const handleCancelReply = () => setReplyingTo(null);
  const handleDeleteRefresh = () => setTimeout(() => loadMessages(), 500);
  const handleMediaClick = () => setShowMedia(true);
  const handleMediaClose = () => setShowMedia(false);

  const handleLocalMessage = (localMsg: Message) => {
    setMessages((prev) => [...prev, localMsg]);
    setForceScrollToBottomKey((k) => k + 1);
  };

  const handleClearChatSubmit = async () => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to permanently delete this chat? This action cannot be undone.")) return;
    try {
      // Permanent clear: do not send mobile query param, so backend performs full room wipe.
      const res = await fetch(`${API_URL}/api/v1/chats/clear/${selectedRoom}`, {
        method: 'DELETE',
        headers: { "x-api-key": API_KEY }
      });
      if (res.ok) {
        setMessages([]);
      }
      else alert("Failed to clear chat");
    } catch (err) { console.error(err); }
  };

  const handleForwardMessage = (msg: Message) => {
    setForwardingMessage(msg);
    setForwardSelectedRooms([]);
  };

  const handleForwardSubmit = () => {
    if (!forwardingMessage || forwardSelectedRooms.length === 0 || !currentUser) return;
    
    forwardSelectedRooms.forEach(fRoomId => {
      const fRoom = chatRooms.find(r => r.id === fRoomId);
      if (!fRoom) return;
      
      let fReceiver = "";
      if (fRoom.is_group) {
        fReceiver = fRoom.id;
      } else {
        fReceiver = fRoom.participant_1 === currentUser.mobile ? fRoom.participant_2 : fRoom.participant_1;
      }
      
      if (forwardingMessage.message_type === "text") {
        socket.emit("send_message", {
          roomId: fRoomId,
          sender: currentUser.mobile,
          receiver: fReceiver,
          message: forwardingMessage.message,
          reply_to_id: null,
          is_forwarded: true,
        });
      } else {
        socket.emit("send_file", {
          roomId: fRoomId,
          sender: currentUser.mobile,
          receiver: fReceiver,
          message_type: forwardingMessage.message_type,
          file_url: forwardingMessage.file_url,
          file_name: forwardingMessage.file_name,
          file_size: forwardingMessage.file_size,
          is_forwarded: true,
        });
      }
    });

    playNotificationSound("send");
    setForwardingMessage(null);
    setForwardSelectedRooms([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-300 text-base">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Error Loading Chat</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">{error}</p>
          <button
            onClick={loadMessages}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-base font-semibold hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!receiver || !currentUser) {
    return (
      <div className="flex flex-col h-[100dvh] bg-cover" style={getWallpaperStyle(wallpaper)}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Invalid Chat</h3>
          <p className="text-gray-600 dark:text-gray-300 text-base">Could not load chat session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] md:h-full min-h-0 bg-cover relative overflow-hidden" style={getWallpaperStyle(wallpaper)}>
      <div
        className="fixed md:sticky top-0 left-0 right-0 md:left-auto md:right-auto z-[120] flex-shrink-0 pt-[env(safe-area-inset-top)]"
        style={isMobileViewport ? { top: `${mobileViewportTopOffset}px` } : undefined}
      >
        <ChatHeader
          receiver={receiver}
          roomId={selectedRoom || ""}
          onMediaClick={handleMediaClick}
          onBack={onBack}
          toggleSidebar={toggleSidebar}
          sidebarHidden={sidebarHidden}
          onClearChat={handleClearChatSubmit}
          onSearchAction={() => setIsSearching(true)}
        />
      </div>

      {isSearching && (
        <div className="sticky top-[calc(60px+env(safe-area-inset-top))] md:top-[72px] z-[110] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 md:p-3 flex items-center gap-2 md:gap-3 shadow-sm animate-slideDown">
          <button 
            onClick={handleCloseSearch}
            className="p-1.5 md:p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Close Search"
          >
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 md:py-2.5 rounded-full outline-none text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow"
            autoFocus
          />
          {searchResults.length > 0 && (
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap hidden xs:inline-block">
              {searchResults.length - currentSearchIndex} of {searchResults.length}
            </span>
          )}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
            <button 
              onClick={handleSearchPrev}
              disabled={currentSearchIndex >= searchResults.length - 1 || searchResults.length === 0}
              className="p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-full transition disabled:opacity-30 shadow-sm"
              title="Previous Match"
            >
              <ChevronUp size={18} />
            </button>
            <button 
              onClick={handleSearchNext}
              disabled={currentSearchIndex <= 0 || searchResults.length === 0}
              className="p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-full transition disabled:opacity-30 shadow-sm"
              title="Next Match"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden pt-[72px] md:pt-0 pb-[96px] md:pb-0">
        <MessageList
          messages={messages}
          currentUser={currentUser.mobile}
          onReply={handleReply}
          onForward={handleForwardMessage}
          onRefresh={handleDeleteRefresh}
          onLoadMore={loadMoreMessages}
          hasMore={hasMore}
          loadingMore={loadingMore}
          searchQuery={isSearching ? searchQuery : ""}
          highlightedMessageId={isSearching && searchResults.length > 0 ? searchResults[currentSearchIndex] : undefined}
          forceScrollToBottomKey={forceScrollToBottomKey}
        />
      </div>

      {selectedRoom && typingUsers[selectedRoom] && typingUsers[selectedRoom].size > 0 && (
        <div
          className="fixed md:relative left-0 right-0 bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-auto px-4 py-1.5 flex gap-2.5 pointer-events-none z-[125]"
          style={
            isMobileViewport
              ? { bottom: `calc(${mobileKeyboardInset}px + 88px + env(safe-area-inset-bottom))` }
              : undefined
          }
        >
          <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl shadow-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
            {Array.from(typingUsers[selectedRoom]).join(", ")} is typing...
          </span>
        </div>
      )}

      <div
        className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto w-full flex-shrink-0 z-[130]"
        style={isMobileViewport ? { bottom: `${mobileKeyboardInset}px` } : undefined}
      >
        <InputArea
          roomId={selectedRoom || ""}
          sender={currentUser.mobile}
          receiver={receiver}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onLocalMessage={handleLocalMessage}
        />
      </div>

      {showMedia && <MediaViewer roomId={selectedRoom || ""} onClose={handleMediaClose} />}

      {forwardingMessage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-lg flex justify-between items-center text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-900/50">
              <span>Forward Message</span>
              <button 
                onClick={() => setForwardingMessage(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white dark:bg-gray-800">
              {chatRooms.filter(r => r.id !== selectedRoom).map(room => {
                const isSelected = forwardSelectedRooms.includes(room.id);
                const roomName = room.is_group 
                  ? room.group_name 
                  : (room.participant_1 === currentUser.mobile ? room.participant_2 : room.participant_1);
                  
                return (
                  <div 
                    key={room.id}
                    onClick={() => {
                      setForwardSelectedRooms(prev => 
                        isSelected ? prev.filter(r => r !== room.id) : [...prev, room.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm text-lg flex-shrink-0">
                      {roomName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{roomName}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full">
                        {room.is_group ? `${room.member_count || 3} members` : 'Direct Chat'}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <span className="text-xs font-bold leading-none mb-[1px]">✓</span>}
                    </div>
                  </div>
                );
              })}
              {chatRooms.length <= 1 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                  You don't have any other active chats to forward to.
                </div>
              )}
            </div>
            
            {forwardSelectedRooms.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 animate-slideUp">
                <button
                  onClick={handleForwardSubmit}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95"
                >
                  Forward to {forwardSelectedRooms.length} chat{forwardSelectedRooms.length > 1 ? 's' : ''} 
                  <span className="text-xl">🚀</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}