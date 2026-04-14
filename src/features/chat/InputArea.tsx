import React, { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { socket } from "../../api/socket";
import { Message } from "./ChatWindow";
import { useChat } from "../../contexts/ChatContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = "https://zatbackend.onrender.com";

import {
  Smile,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Archive,
  Mic,
  CornerUpRight,
  Loader2,
  AlertCircle,
  Paperclip as PaperclipIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface InputAreaProps {
  roomId: string;
  sender: string;
  receiver: string;
  replyingTo: Message | null;
  onCancelReply: () => void;
  onLocalMessage?: (message: Message) => void;
}

export default function InputArea({
  roomId,
  sender,
  receiver,
  replyingTo,
  onCancelReply,
  onLocalMessage,
}: InputAreaProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGiphy, setShowGiphy] = useState(false);
  const [giphySearch, setGiphySearch] = useState("");
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);

  const { playNotificationSound } = useChat();

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 90); // reduced max height
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [text]);

  const quickReplies = [
    "Thanks! 👍",
    "I'll get back to you soon",
    "Got it, thanks!",
    "Let me check",
    "Perfect! 👌",
    "On it! 🚀"
  ];

  useEffect(() => {
    if (text.startsWith('/')) {
      const commands = ['/help', '/status', '/clear', '/mute', '/block'];
      setSuggestions(commands.filter(cmd => cmd.startsWith(text)));
      setShowSuggestions(true);
    } else if (text.length > 2) {
      setSuggestions(quickReplies.filter(reply => 
        reply.toLowerCase().includes(text.toLowerCase())
      ));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [text]);

  useEffect(() => {
    if (showGiphy) {
      const fetchGifs = async () => {
        setGiphyLoading(true);
        try {
          const endpoint = giphySearch 
            ? `https://g.tenor.com/v1/search?key=LIVDSRZULELA&q=${encodeURIComponent(giphySearch)}&limit=20`
            : `https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=20`;
          const res = await fetch(endpoint);
          const data = await res.json();
          setGiphyResults(data.results || []);
        } catch (e) {
          console.error("Giphy fetch error", e);
        } finally {
          setGiphyLoading(false);
        }
      };
      
      const timeout = setTimeout(fetchGifs, giphySearch ? 500 : 0);
      return () => clearTimeout(timeout);
    }
  }, [showGiphy, giphySearch]);

  const handleTyping = (value: string) => {
    setText(value);
    socket.emit("typing", { roomId, sender });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId, sender });
    }, 1000);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 50MB");
      return;
    }
    const allowedTypes = [
      'image/', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument', 'text/plain',
      'application/zip', 'audio/', 'video/'
    ];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      setUploadError("File type not supported");
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setUploadProgress(0);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendGif = (gif: any) => {
    const gifUrl =
      gif?.media_formats?.gif?.url ||
      gif?.media_formats?.mediumgif?.url ||
      gif?.media?.[0]?.gif?.url ||
      gif?.media?.[0]?.mediumgif?.url ||
      gif?.url ||
      "";

    if (!gifUrl) return;

    socket.emit("send_file", {
      roomId,
      sender,
      receiver,
      message_type: "image",
      file_url: gifUrl,
      file_name: "giphy.gif",
      file_size: 0,
    });
    playNotificationSound("send");
    socket.emit("stop_typing", { roomId, sender });
    setShowGiphy(false);
    setGiphySearch("");
    onCancelReply();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      setUploadError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!receiver) {
      alert("Error: Receiver not set. Please restart the chat.");
      return;
    }
    if (!trimmedText && !selectedFile) return;

    if (trimmedText) {
      const tempTextMessage: Message = {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        room_id: roomId,
        sender_mobile: sender,
        receiver_mobile: receiver,
        message: trimmedText,
        message_type: "text",
        is_delivered: false,
        is_seen: false,
        reply_to_id: replyingTo?.id || undefined,
        reply_to: replyingTo || null,
        created_at: new Date().toISOString(),
        is_temp: true,
      };
      onLocalMessage?.(tempTextMessage);

      socket.emit("send_message", {
        roomId,
        sender,
        receiver,
        message: trimmedText,
        reply_to_id: replyingTo?.id || null,
      });
      playNotificationSound("send");
    }

    if (selectedFile) {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("roomId", roomId);
      formData.append("sender", sender);
      formData.append("receiver", receiver);
      try {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        const res = await fetch(`${API_URL}/api/v1/chats/upload`, {
          method: "POST",
          body: formData,
        });
        clearInterval(progressInterval);
        setUploadProgress(100);
        if (!res.ok) throw new Error(`Upload failed with status: ${res.status}`);
        const data = await res.json();
        if (data?.file_url) {
          const tempFileMessage: Message = {
            id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            room_id: roomId,
            sender_mobile: sender,
            receiver_mobile: receiver,
            message_type: data.message_type,
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size,
            is_delivered: false,
            is_seen: false,
            reply_to_id: replyingTo?.id || null,
            reply_to: replyingTo || null,
            created_at: new Date().toISOString(),
            is_temp: true,
          } as Message;
          onLocalMessage?.(tempFileMessage);

          socket.emit("send_file", {
            roomId,
            sender,
            receiver,
            message_type: data.message_type,
            file_url: data.file_url,
            file_name: data.file_name,
            file_size: data.file_size,
          });
          playNotificationSound("send");
        } else {
          throw new Error("No file URL in response");
        }
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error: any) {
        setUploadError("Upload failed. Please try again.");
        setUploadProgress(0);
        setUploading(false);
        return;
      }
    }

    socket.emit("stop_typing", { roomId, sender });
    setText("");
    clearFileSelection();
    setShowEmoji(false);
    setShowGiphy(false);
    onCancelReply();
    setUploading(false);
    textareaRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={20} />;
    if (file.type.includes('pdf')) return <FileText size={20} />;
    if (file.type.includes('zip')) return <Archive size={20} />;
    return <PaperclipIcon size={20} />;
  };

  return (
    <div className="relative w-full flex-shrink-0 z-[20] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] px-3 sm:px-6 md:px-8 py-2 sm:py-3">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-3 mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp z-[100]">
            <div className="p-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-200 flex items-center gap-3 group"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Sparkles size={16} className="text-indigo-500 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 flex-1 truncate font-medium">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center gap-3 py-2 px-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 animate-slideDown mb-1">
            <div className="w-1 h-8 bg-indigo-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                <CornerUpRight size={12} />
                Replying to {replyingTo.sender_mobile}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate italic">
                {replyingTo.message || "Attachment"}
              </span>
            </div>
            <button
              className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              onClick={onCancelReply}
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        )}

        {selectedFile && (
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 animate-slideDown mb-1">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                {filePreview ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded-xl shadow-sm border border-white dark:border-gray-700" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                    {getFileIcon(selectedFile)}
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white text-[10px] font-bold">
                    {uploadProgress}%
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px] xs:max-w-[240px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
            <button
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
              onClick={clearFileSelection}
              disabled={uploading}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {showGiphy && (
          <div className="mb-2 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-slideUp">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold">
                <Sparkles size={16} className="text-indigo-500" />
                GIFs
              </div>
              <input
                type="text"
                value={giphySearch}
                onChange={(e) => setGiphySearch(e.target.value)}
                placeholder="Search GIFs"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowGiphy(false)}
                aria-label="Close GIF picker"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-3 custom-scrollbar">
              {giphyLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Loading GIFs...
                </div>
              ) : giphyResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {giphyResults.map((gif, index) => {
                    const gifUrl =
                      gif?.media_formats?.tinygif?.url ||
                      gif?.media_formats?.gif?.url ||
                      gif?.media?.[0]?.tinygif?.url ||
                      gif?.media?.[0]?.gif?.url ||
                      gif?.url ||
                      "";

                    if (!gifUrl) return null;

                    return (
                      <button
                        key={`${gifUrl}-${index}`}
                        type="button"
                        className="group overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all duration-200"
                        onClick={() => sendGif(gif)}
                        title="Send GIF"
                      >
                        <img
                          src={gifUrl}
                          alt={gif?.content_description || "GIF"}
                          className="w-full aspect-square object-cover group-hover:scale-[1.03] transition-transform duration-200"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                  No GIFs found
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 flex items-end gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-[24px] sm:rounded-[32px] px-2 py-1.5 sm:py-2 border border-transparent focus-within:border-indigo-500/30 focus-within:bg-white dark:focus-within:bg-gray-700 transition-all duration-300 shadow-inner">
            <div className="flex items-center">
              <button
                className={`p-2 sm:p-2.5 rounded-full transition-colors duration-200 flex-shrink-0 ${showEmoji ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                onClick={() => { setShowEmoji(!showEmoji); setShowGiphy(false); }}
                title="Emoji"
              >
                <Smile size={22} className="sm:w-6 sm:h-6" />
              </button>

              <label className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,audio/*,video/*"
                  disabled={uploading}
                />
                <Paperclip size={22} className="sm:w-6 sm:h-6" />
              </label>
            </div>

            <div className="flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                rows={1}
                className="w-full bg-transparent border-none text-[15px] sm:text-[16px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 outline-none resize-none min-h-[24px] max-h-[150px] overflow-y-auto leading-relaxed"
                disabled={uploading}
              />
            </div>
            
            <button
               className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200 flex-shrink-0"
               onClick={() => setShowGiphy(!showGiphy)}
               title="GIFs"
            >
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold tracking-[0.14em] uppercase">
                <Sparkles size={18} className={`${showGiphy ? 'text-indigo-500' : ''} sm:w-5 sm:h-5`} />
                GIF
              </span>
            </button>
          </div>

          <button
            className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg flex-shrink-0 ${
              text.trim() || selectedFile 
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white scale-100 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-90' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
            onClick={sendMessage}
            disabled={(!text.trim() && !selectedFile) || uploading}
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Send size={22} className={`${text.trim() || selectedFile ? 'ml-0.5' : ''} sm:w-7 sm:h-7`} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


