import React, { useState, useEffect } from "react";
import { X, Search, MessageSquare } from 'lucide-react';

interface SearchMessagesModalProps {
  roomId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

interface SearchResult {
  id: string;
  message: string;
  sender_name: string;
  created_at: string;
  message_type: string;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");
const API_KEY = "ZATCHAT_PRATEEK9373";

export default function SearchMessagesModal({ roomId, onClose, onJumpToMessage }: SearchMessagesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!roomId || searchTerm.trim().length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/chats/search/${roomId}?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search messages. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleResultClick = (messageId: string) => {
    onJumpToMessage(messageId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Search Messages</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for messages..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <p className="text-xs text-gray-500 mt-2">Enter at least 2 characters to search</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && searchTerm.trim().length >= 2 && (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No messages found</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 hover:border-indigo-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <MessageSquare size={16} className="text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {result.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(result.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        {result.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}