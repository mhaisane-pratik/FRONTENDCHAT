import React from "react";
import { useChat } from "../../contexts/ChatContext";
import ChatItem from "./ChatItem";

interface ChatListProps {
  rooms: any[];
  searchTerm?: string;
  activeFilter?: string;
}

export default function ChatList({ rooms }: ChatListProps) {
  const { currentUser, selectedRoom, setSelectedRoom, userProfiles, typingUsers, getDisplayName } = useChat();

  if (!currentUser) return null;

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center min-h-[400px]">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">No chats yet</p>
        <span className="text-sm text-gray-500 dark:text-gray-400">Start a new conversation</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {rooms.map((room) => {
        const isGroup = room.is_group === true;
        const otherMobile = !isGroup
          ? room.other_user ||
            (room.participant_1 === currentUser.mobile
              ? room.participant_2
              : room.participant_1)
          : "";
        const profile = userProfiles.get(otherMobile);
        const fallbackName = profile?.display_name || otherMobile || "Unknown";
        const displayName = isGroup
          ? room.group_name || "Group"
          : getDisplayName(otherMobile, fallbackName);

        return (
          <ChatItem
            key={room.id}
            roomId={room.id}
            displayName={displayName}
            avatarUrl={profile?.profile_picture}
            lastMessage={room.last_message}
            lastMessageSender={room.last_message_sender}
            lastMessageTime={room.last_message_time}
            unreadCount={room.unread_count}
            isGroup={isGroup}
            isPinned={room.is_pinned}
            isMuted={room.is_muted}
            isSelected={selectedRoom === room.id}
            typingUsers={typingUsers[room.id] ? Array.from(typingUsers[room.id]) : undefined}
            onClick={() => setSelectedRoom(room.id)}
          />
        );
      })}
    </div>
  );
}