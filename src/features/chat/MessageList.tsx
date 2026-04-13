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
  forceScrollToBottomKey?: number;
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
  forceScrollToBottomKey,
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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [forceScrollToBottomKey]);

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
      className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ 
        scrollbarWidth: 'thin',
        paddingBottom: '20px' // Minimal padding for aesthetic
      }}
    >
      <div className="flex flex-col w-full px-0">
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
              <div className="flex items-center justify-center my-6 sticky top-2 z-10 pointer-events-none">
                <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-1 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-400 shadow-sm uppercase tracking-wider border border-gray-100 dark:border-gray-700">
                  {dateLabel}
                </span>
              </div>
              <div className="flex flex-col gap-1 w-full">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}