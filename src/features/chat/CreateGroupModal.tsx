import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import "./CreateGroupModal.css";

interface CreateGroupModalProps {
  onClose: () => void;
}

// User interface for group selection
interface User {
  mobile: string;
  display_name: string;
  profile_picture?: string;
  is_online?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { currentUser, chatRooms, refreshRooms, setSelectedRoom } = useChat();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "name">("select");

  // --- Only show users the current user has chatted with! ---
  useEffect(() => {
    loadAvailableUsers();
  }, [chatRooms, currentUser?.mobile]);

  const loadAvailableUsers = () => {
    setLoading(true);
    setError("");

    // Get chat partners from chatRooms (no groups)
    const usersFromRooms = new Set<string>();
    chatRooms.forEach((room) => {
      if (!room.is_group) {
        // For 1:1 chats, get the other user (not self)
        if (room.other_user &&
            room.other_user !== currentUser?.mobile &&
            room.other_user.length > 2 // prevent empty
        ) {
          usersFromRooms.add(room.other_user);
        }
      }
    });

    // Convert to array of User objects
    const userList: User[] = Array.from(usersFromRooms).map((mobile) => ({
      mobile,
      display_name: mobile,
      // Optionally add profile_picture or is_online if you want
    }));

    setAvailableUsers(userList);

    if (userList.length === 0) {
      setError("No users available. Start a chat first to add members to a group.");
    }
    setLoading(false);
  };

  const toggleUser = (mobile: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mobile)) {
        newSet.delete(mobile);
      } else {
        newSet.add(mobile);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (selectedUsers.size < 2) {
      setError("Please select at least 2 members");
      return;
    }
    setError("");
    setStep("name");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (selectedUsers.size < 2) {
      setError("Please select at least 2 members");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const timestamp = Date.now();
      const groupId = `group_${currentUser?.mobile}_${timestamp}`;
      const allParticipants = [
        currentUser?.mobile,
        ...Array.from(selectedUsers),
      ].filter(Boolean);

      const roomRes = await fetch(`${API_URL}/api/v1/chats/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: groupId,
          participant1: currentUser?.mobile,
          participant2: allParticipants.join(","),
          isGroup: true,
          groupName: groupName.trim(),
          groupIcon: getGroupIcon(groupName),
          memberCount: allParticipants.length,
          createdBy: currentUser?.mobile,
        }),
      });

      if (!roomRes.ok) {
        const errorData = await roomRes.json();
        throw new Error(errorData.error || "Failed to create group");
      }

      const result = await roomRes.json();
      socket.emit("new_group_created", {
        groupId,
        groupName: groupName.trim(),
        members: allParticipants,
        creator: currentUser?.mobile,
      });

      onClose();
      await refreshRooms();
      setTimeout(() => {
        setSelectedRoom(groupId);
      }, 800);
      alert(`✅ Group "${groupName}" created with ${allParticipants.length} members!`);
    } catch (err: any) {
      console.error("❌ Failed to create group:", err);
      setError(err.message || "Failed to create group. Please try again.");
      setLoading(false);
    }
  };

  const getGroupIcon = (name: string): string => {
    const icons = ["👥", "🎉", "💼", "🎓", "🏆", "🌟", "🚀", "💡"];
    const index = name.length % icons.length;
    return icons[index];
  };

  const filteredUsers = availableUsers.filter((user) =>
    user.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="create-group-modal">
        <div className="modal-header">
          {step === "name" && (
            <button className="back-btn" onClick={() => setStep("select")}>
              ←
            </button>
          )}
          <h2>
            {step === "select" ? "Add Group Members" : "Group Name"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {step === "select" && (
          <>
            <div className="modal-body">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="search-input"
                    />
                  </div>

                  {selectedUsers.size > 0 && (
                    <div className="selected-count">
                      {selectedUsers.size} member{selectedUsers.size !== 1 ? "s" : ""}{" "}
                      selected
                    </div>
                  )}

                  <div className="users-list">
                    {filteredUsers.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>No users found</p>
                        <span>
                          {availableUsers.length === 0
                            ? "Start a chat to add users to groups"
                            : "Try a different search term"}
                        </span>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.mobile}
                          className={`user-item ${
                            selectedUsers.has(user.mobile) ? "selected" : ""
                          }`}
                          onClick={() => toggleUser(user.mobile)}
                        >
                          <img
                            src={
                              resolveMediaUrl(user.profile_picture) ||
                              `https://ui-avatars.com/api/?name=${user.mobile}&background=random`
                            }
                            alt={user.mobile}
                            className="user-avatar"
                          />
                          <div className="user-info">
                            <span className="user-name">{user.display_name}</span>
                            <span className="user-mobile">@{user.mobile}</span>
                          </div>
                          {selectedUsers.has(user.mobile) && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="next-btn"
                onClick={handleNext}
                disabled={selectedUsers.size < 2 || loading}
              >
                Next {selectedUsers.size > 0 && `(${selectedUsers.size})`}
              </button>
            </div>
          </>
        )}
        {step === "name" && (
          <>
            <div className="modal-body">
              <div className="group-preview">
                <div className="group-icon-large">
                  {getGroupIcon(groupName || "Group")}
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="groupName">Group Name</label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter group name"
                  maxLength={50}
                  autoFocus
                />
                <span className="char-count">{groupName.length}/50</span>
              </div>
              <div className="members-summary">
                <h4>Members ({selectedUsers.size + 1})</h4>
                <div className="members-chips">
                  <div className="member-chip you">You (Admin)</div>
                  {Array.from(selectedUsers).map((mobile) => (
                    <div key={mobile} className="member-chip">
                      {mobile}
                    </div>
                  ))}
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setStep("select")}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="create-btn"
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim()}
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
