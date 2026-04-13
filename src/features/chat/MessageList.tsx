import React, { useLayoutEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { Message } from "./ChatWindow";
import { groupMessagesByDate } from "../../utils/dateHelper";

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onReply: (message: Message) => void;
  onRefresh: () => void;
  onForward?: (message: Message) => void;
  searchQuery?: string;
  highlightedMessageId?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  bottomPadding?: number;
}

export default function MessageList({
  messages,
  currentUser,
  onReply,
  onRefresh,
  onForward,
  searchQuery,
  highlightedMessageId,
  onLoadMore,
  hasMore,
  loadingMore,
  bottomPadding,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstMessageIdRef = useRef<string | null>(null);
  const previousScrollHeightRef = useRef<number>(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    const currentOldestId = messages[0].id;

    if (firstMessageIdRef.current && firstMessageIdRef.current !== currentOldestId) {
      // Historical messages were prepended - adjust scroll synchronously to prevent snap
      const newHeight = container.scrollHeight;
      const oldHeight = previousScrollHeightRef.current;
      container.scrollTop += (newHeight - oldHeight);
    } else {
      // Normal append or initial load
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (previousScrollHeightRef.current === 0 || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    firstMessageIdRef.current = currentOldestId;
    previousScrollHeightRef.current = container.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop < 100 && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      style={{ paddingBottom: `${Math.max(bottomPadding || 120, 120)}px` }}
    >
      <div className="py-4 flex flex-col w-full">
        {loadingMore && (
           <div className="flex justify-center py-2 text-indigo-500 animate-pulse">
             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           </div>
        )}
        
        {Object.keys(groupedMessages).length === 0 && !loadingMore ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400 mx-auto">
            <div className="text-7xl mb-5 opacity-50">💬</div>
            <p className="text-base m-0 text-gray-400 dark:text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((dateLabel) => (
            <div key={dateLabel} className="w-full">
              <div className="flex items-center justify-center my-4 sticky top-2 z-10">
                <span className="bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                  {dateLabel}
                </span>
              </div>
              {groupedMessages[dateLabel].map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isSent={message.sender_mobile === currentUser}
                  currentUser={currentUser}
                  onReply={onReply}
                  onRefresh={onRefresh}
                  onForward={onForward ? () => onForward(message) : undefined}
                  searchQuery={searchQuery}
                  isHighlighted={highlightedMessageId === message.id}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}