// File: video-call-main/src/features/chat/ChatSelect.tsx

import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");

interface ChatRoom {
  roomId: string;
  otherParticipant: string;
  lastMessage?: string;
  timestamp?: Date;
  unread?: number;
}

export default function ChatSelect() {
  const { currentUser, setSelectedRoom, refreshRooms, loadUserProfile } = useChat();
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      if (!currentUser?.mobile) {
        setChatRooms([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/chats/rooms/${encodeURIComponent(currentUser.mobile)}`);
      if (response.ok) {
        const rooms = await response.json();
        const formattedRooms = await Promise.all(
          rooms.map(async (room: any) => {
            const participants = Array.isArray(room.participants)
              ? room.participants
              : [room.participant_1, room.participant_2].filter(Boolean);
            const otherParticipant =
              room.other_user ||
              room.otherParticipant ||
              participants.find((p: string) => p !== currentUser?.mobile) ||
              "Unknown";
            await loadUserProfile(otherParticipant);
            return {
              roomId: room.roomId || room.id,
              otherParticipant,
              lastMessage: room.lastMessage || room.last_message,
              timestamp: room.timestamp || room.last_message_time,
              unread: room.unread || room.unread_count || 0,
            };
          })
        );
        setChatRooms(formattedRooms);
      }
    } catch (err) {
      console.error("Failed to load chat rooms:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = async () => {
    const trimmedContact = newContact.trim();

    if (!trimmedContact) {
      setError("Please enter a mobile number");
      return;
    }

    if (trimmedContact === currentUser?.mobile) {
      setError("You cannot chat with yourself");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Check if user exists
      const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(trimmedContact)}`);

      if (!res.ok) {
        setError(`User "${trimmedContact}" not found. They need to login first.`);
        setIsLoading(false);
        return;
      }

      // Preload user profile
      await loadUserProfile(trimmedContact);

      // Create room ID
      const participants = [currentUser?.mobile, trimmedContact].sort();
      const roomId = participants.join("__");

      // Create room in database
      const roomRes = await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          participant1: participants[0],
          participant2: participants[1],
        }),
      });

      if (roomRes.ok) {
        localStorage.setItem(`room_${roomId}_receiver`, trimmedContact);
        setSelectedRoom(roomId);
        await refreshRooms();
        setShowNewChat(false);
        setNewContact("");
        loadChatRooms(); // Reload rooms
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      setError("Failed to start chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = async (roomId: string, otherParticipant: string) => {
    await loadUserProfile(otherParticipant);
    localStorage.setItem(`room_${roomId}_receiver`, otherParticipant);
    setSelectedRoom(roomId);
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    navigate("/chat-login");
  };

  const filteredRooms = chatRooms.filter(room =>
    room.otherParticipant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">Z</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ZATCHAT
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser?.display_name?.[0] || currentUser?.mobile?.[0]}
                </div>
                <span className="text-gray-700 font-medium hidden sm:inline">
                  {currentUser?.display_name || currentUser?.mobile}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {currentUser?.display_name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-blue-100">
                Stay connected with your friends and family
              </p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Chat Rooms List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-6">Start a new chat to connect with friends</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => handleOpenChat(room.roomId, room.otherParticipant)}
                className="bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {room.otherParticipant[0].toUpperCase()}
                    </div>
                    {room.unread && room.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {room.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                        {room.otherParticipant}
                      </h3>
                      {room.timestamp && (
                        <span className="text-xs text-gray-400">
                          {new Date(room.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setError("");
                  setNewContact("");
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Enter mobile number
                </label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => {
                    setNewContact(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}
              
              <button
                onClick={handleStartNewChat}
                disabled={!newContact.trim() || isLoading}
                className={`w-full py-2 rounded-lg font-medium transition ${
                  !newContact.trim() || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting chat...</span>
                  </div>
                ) : (
                  "Start Chat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}