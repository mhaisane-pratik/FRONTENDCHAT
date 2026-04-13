import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";

const API_URL = "https://zatbackend.onrender.com";
const API_KEY = "ZATCHAT_PRATEEK9373";

interface NewChatModalProps {
  onClose: () => void;
}

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const { currentUser, setSelectedRoom, refreshRooms } = useChat();
  const [mobileNo, setMobileNo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatMobileNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return "+91" + cleaned;
    }
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return "+" + cleaned;
    }
    return phone; // fallback for non-standard or testing usernames
  };

  const handleStartChat = async () => {
    if (!mobileNo.trim()) {
      setError("Please enter a mobile number");
      return;
    }

    const rawInput = mobileNo.trim();
    const normalizedMobile = formatMobileNumber(rawInput);

    if (rawInput === currentUser?.mobile || normalizedMobile === currentUser?.mobile) {
      setError("You cannot chat with yourself");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let finalTargetMobile = normalizedMobile;
      
      // 1. Try normalized match first (canonical for OTP users)
      // Must encode URI component for the + sign to pass safely
      let res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(normalizedMobile)}`, {
        headers: { "x-api-key": API_KEY }
      });
      let userData = null;
      
      if (res.ok) {
        userData = await res.json();
      }

      // 2. If canonical match fails, try exact match (legacy password login)
      if (!userData && rawInput !== normalizedMobile) {
        // Special character safe URI encoding for the '+' sign
        res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(rawInput)}`, {
          headers: { "x-api-key": API_KEY }
        });
        if (res.ok) {
           const normData = await res.json();
           // Try formatting exact match if not formatted correctly
           if (normData) {
             userData = normData;
             finalTargetMobile = normData.mobile || rawInput;
           }
        }
      }

      // 3. If neither exists, create a placeholder profile using the normalized one
      if (!userData) {
        finalTargetMobile = normalizedMobile;
        const createRes = await fetch(`${API_URL}/api/v1/users`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": API_KEY 
          },
          body: JSON.stringify({
            mobile: finalTargetMobile,
            display_name: mobileNo,
          }),
        });
        
        if (!createRes.ok) {
          setError("Failed to start chat with new user");
          setLoading(false);
          return;
        }
        
        userData = await createRes.json();
      }

      const roomId = [currentUser?.mobile, finalTargetMobile].sort().join("__");
      
      // Ensure the room exists in the database
      const roomRes = await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({
          roomId: roomId,
          participant1: currentUser?.mobile,
          participant2: finalTargetMobile,
          isGroup: false
        }),
      });

      if (!roomRes.ok) {
        setError("Failed to initialize chat room");
        setLoading(false);
        return;
      }
      
      // Notify the server so the other user instantly receives the new chat room
      socket.emit("new_chat_created", {
        roomId,
        participants: [currentUser?.mobile, finalTargetMobile]
      });

      await refreshRooms();
      setSelectedRoom(roomId);
      onClose();
    } catch (err) {
      console.error("Failed to start chat", err);
      setError("Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStartChat();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[10000]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md flex flex-col z-[10001] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="m-0 text-xl font-semibold text-gray-800 dark:text-white">New Chat</h2>
          <button
            className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter the mobile number of the person you want to chat with
          </p>

          <div className="mb-4">
            <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mobile Number
            </label>
            <div className="flex bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
              <div className="bg-gray-100 dark:bg-gray-600 px-4 py-3 flex items-center justify-center border-r border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium">
                +91
              </div>
              <input
                id="mobileNo"
                type="text"
                value={mobileNo}
                onChange={(e) => {
                  setMobileNo(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyPress}
                placeholder="Enter 10-digit number"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-medium mb-4">{error}</div>}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            className="flex-1 py-3.5 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-3.5 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartChat}
            disabled={loading || !mobileNo.trim()}
          >
            {loading ? "Starting..." : "Start Chat"}
          </button>
        </div>
      </div>
    </>
  );
}