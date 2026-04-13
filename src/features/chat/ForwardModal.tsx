// File: video-call-main/src/features/chat/ForwardModal.tsx

import React, { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { Message } from "./ChatWindow";
import "./ForwardModal.css";

const API_URL = "https://zatbackend.onrender.com"; // ✅ Production API

interface ForwardModalProps {
  messages: Message[];
  onClose: () => void;
}

export default function ForwardModal({ messages, onClose }: ForwardModalProps) {
  const { currentUser, chatRooms } = useChat();
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [forwarding, setForwarding] = useState(false);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleForward = async () => {
    if (selectedRooms.size === 0) return;

    setForwarding(true);

    try {
      const messageIds = messages.map((m) => m.id);

      const toRooms = Array.from(selectedRooms).map((roomId) => {
        const room = chatRooms.find((r) => r.id === roomId);
        return {
          roomId,
          receiver: room?.other_user || "",
        };
      });

      // ✅ FIXED API CALL
      const res = await fetch(`${API_URL}/api/v1/messages/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageIds,
          toRooms,
          sender: currentUser?.mobile,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        socket.emit("forward_message", {
          messages: data.messages,
          toRooms,
        });

        alert("Messages forwarded successfully!");
        onClose();
      } else {
        alert("Forward failed");
      }
    } catch (err) {
      console.error("Failed to forward messages", err);
      alert("Failed to forward messages");
    } finally {
      setForwarding(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="forward-modal">
        <div className="modal-header">
          <h2>Forward to...</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="forward-info">
            Forwarding {messages.length} message
            {messages.length > 1 ? "s" : ""}
          </p>

          <div className="rooms-list">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={`room-item ${
                  selectedRooms.has(room.id) ? "selected" : ""
                }`}
                onClick={() => toggleRoom(room.id)}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${room.other_user}&background=random`}
                  alt={room.other_user}
                  className="room-avatar"
                />
                <span className="room-name">{room.other_user}</span>
                {selectedRooms.has(room.id) && (
                  <span className="check-icon">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={forwarding}
          >
            Cancel
          </button>

          <button
            className="forward-btn"
            onClick={handleForward}
            disabled={selectedRooms.size === 0 || forwarding}
          >
            {forwarding
              ? "Forwarding..."
              : `Forward (${selectedRooms.size})`}
          </button>
        </div>
      </div>
    </>
  );
}
