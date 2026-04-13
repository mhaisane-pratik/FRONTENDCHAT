import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { socket } from "../../api/socket";
import { resolveMediaUrl } from "../../utils/mediaUrl";

interface GroupInfoModalProps {
  groupId: string;
  onClose: () => void;
}

interface GroupMember {
  mobile: string;
  display_name: string;
  profile_picture?: string;
  is_online?: boolean;
}

const API_URL = "https://zatbackend.onrender.com";

export default function GroupInfoModal({ groupId, onClose }: GroupInfoModalProps) {
  const { currentUser, chatRooms, refreshRooms, setSelectedRoom } = useChat();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<GroupMember[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(new Set());

  const room = chatRooms.find((r) => r.id === groupId);
  const isAdmin = room?.created_by === currentUser?.mobile;

  useEffect(() => {
    if (room) {
      setNewGroupName(room.group_name || "");
      loadGroupMembers();
    }
  }, [room]);

  const loadGroupMembers = async () => {
    if (!room?.participant_2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const membermobiles = room.participant_2.split(",").map((u) => u.trim());
      const memberPromises = membermobiles.map(async (mobile) => {
        try {
          const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(mobile)}`);
          if (res.ok) {
            const userData = await res.json();
            return {
              mobile: userData.mobile,
              display_name: userData.display_name || userData.mobile,
              profile_picture: userData.profile_picture,
              is_online: userData.is_online,
            };
          }
        } catch (err) {
          console.error(`Failed to load user ${mobile}:`, err);
        }
        return { mobile, display_name: mobile };
      });
      const loadedMembers = await Promise.all(memberPromises);
      setMembers(loadedMembers.filter(Boolean) as GroupMember[]);
    } catch (err) {
      console.error("❌ Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users`);
      if (response.ok) {
        const allUsers = await response.json();
        const currentMembermobiles = members.map((m) => m.mobile);
        const filtered = allUsers
          .filter(
            (u: any) =>
              !currentMembermobiles.includes(u.mobile) &&
              u.mobile !== currentUser?.mobile
          )
          .map((u: any) => ({
            mobile: u.mobile,
            display_name: u.display_name || u.mobile,
            profile_picture: u.profile_picture,
            is_online: u.is_online,
          }));
        setAvailableUsers(filtered);
      }
    } catch (err) {
      console.error("Failed to load available users:", err);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, groupName: newGroupName.trim() }),
      });
      if (res.ok) {
        await refreshRooms();
        setEditingName(false);
        alert("✅ Group name updated!");
      }
    } catch (err) {
      console.error("Failed to update group name:", err);
      alert("❌ Failed to update group name");
    }
  };

  const handleRemoveMember = async (mobile: string) => {
    if (!isAdmin) return;
    if (!confirm(`Remove ${mobile} from the group?`)) return;
    try {
      const updatedMembers = members.filter((m) => m.mobile !== mobile).map((m) => m.mobile);
      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: updatedMembers.join(","),
          memberCount: updatedMembers.length,
        }),
      });
      if (res.ok) {
        socket.emit("member_removed", {
          groupId,
          removedUser: mobile,
          groupName: room?.group_name,
        });
        await refreshRooms();
        loadGroupMembers();
        alert(`✅ ${mobile} removed from group`);
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("❌ Failed to remove member");
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.size === 0) return;
    try {
      const currentMembers = members.map((m) => m.mobile);
      const newMembers = Array.from(selectedNewMembers);
      const allMembers = [...currentMembers, ...newMembers];
      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: allMembers.join(","),
          memberCount: allMembers.length,
        }),
      });
      if (res.ok) {
        socket.emit("members_added", {
          groupId,
          groupName: room?.group_name,
          newMembers,
          addedBy: currentUser?.mobile,
        });
        await refreshRooms();
        loadGroupMembers();
        setShowAddMembers(false);
        setSelectedNewMembers(new Set());
        alert(`✅ ${newMembers.length} member(s) added!`);
      }
    } catch (err) {
      console.error("Failed to add members:", err);
      alert("❌ Failed to add members");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const updatedMembers = members
        .filter((m) => m.mobile !== currentUser?.mobile)
        .map((m) => m.mobile);
      if (updatedMembers.length === 0) {
        alert("You are the last member. The group will be deleted.");
        setSelectedRoom(null);
        await refreshRooms();
        onClose();
        return;
      }
      const res = await fetch(`${API_URL}/api/v1/chats/update-group`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          participants: updatedMembers.join(","),
          memberCount: updatedMembers.length,
        }),
      });
      if (res.ok) {
        socket.emit("member_left", {
          groupId,
          mobile: currentUser?.mobile,
          groupName: room?.group_name,
        });
        setSelectedRoom(null);
        await refreshRooms();
        onClose();
        alert("✅ You left the group");
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
      alert("❌ Failed to leave group");
    }
  };

  if (!room || !room.is_group) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[10000]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col z-[10001] overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <button
            className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
            onClick={onClose}
          >
            ←
          </button>
          <h2 className="flex-1 m-0 text-xl font-semibold text-gray-800 dark:text-white">Group Info</h2>
          <button
            className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-9 h-9 rounded flex items-center justify-center"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-gray-800">
          <div className="text-center py-5 border-b border-gray-200 dark:border-gray-700 mb-5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg">
              {room.group_icon || "👥"}
            </div>

            {editingName && isAdmin ? (
              <div className="flex flex-col gap-3 mt-4">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={50}
                  className="w-full max-w-xs mx-auto px-3.5 py-2.5 border-2 border-blue-500 rounded-lg text-lg text-center outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroupName}
                    className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="m-0 text-2xl text-gray-900 dark:text-white">{room.group_name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 p-1.5 rounded"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}

            <p className="mt-3 mb-1 text-sm text-gray-500 dark:text-gray-400">
              Group · {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            <p className="m-0 text-xs text-gray-400 dark:text-gray-500">
              Created by {room.created_by === currentUser?.mobile ? "you" : room.created_by}
            </p>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="m-0 text-base font-semibold text-gray-800 dark:text-white">{members.length} Members</h4>
              {isAdmin && (
                <button
                  onClick={() => {
                    loadAvailableUsers();
                    setShowAddMembers(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600"
                >
                  + Add
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Loading members...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((member) => (
                  <div key={member.mobile} className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <img
                      src={
                        resolveMediaUrl(member.profile_picture) ||
                        `https://ui-avatars.com/api/?name=${member.mobile}&background=random`
                      }
                      alt={member.mobile}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {member.display_name}
                        {member.mobile === currentUser?.mobile && " (You)"}
                        {member.mobile === room.created_by && " 👑"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{member.mobile}</div>
                    </div>
                    {member.is_online && <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0"></span>}
                    {isAdmin &&
                      member.mobile !== currentUser?.mobile &&
                      member.mobile !== room.created_by && (
                        <button
                          onClick={() => handleRemoveMember(member.mobile)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-semibold hover:bg-blue-600 flex-shrink-0"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddMembers && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-5 border-2 border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h4 className="m-0 text-base font-semibold text-gray-800 dark:text-white">Add Members</h4>
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="text-2xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 w-8 h-8 rounded flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto mb-3">
                {availableUsers.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-5">No more users available to add</p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.mobile}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${
                        selectedNewMembers.has(user.mobile)
                          ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                          : "hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => {
                        setSelectedNewMembers((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(user.mobile)) {
                            newSet.delete(user.mobile);
                          } else {
                            newSet.add(user.mobile);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <img
                        src={
                          resolveMediaUrl(user.profile_picture) ||
                          `https://ui-avatars.com/api/?name=${user.mobile}&background=random`
                        }
                        alt={user.mobile}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{user.display_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.mobile}</div>
                      </div>
                      {selectedNewMembers.has(user.mobile) && (
                        <span className="text-blue-500 text-xl font-bold flex-shrink-0">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedNewMembers.size > 0 && (
                <button
                  onClick={handleAddMembers}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Add {selectedNewMembers.size} Member{selectedNewMembers.size !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLeaveGroup}
              className="w-full py-3.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              🚪 Leave Group
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
