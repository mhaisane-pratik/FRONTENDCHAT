import React, { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { socket } from "../../api/socket";
import { Message } from "./ChatWindow";
import { useChat } from "../../contexts/ChatContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env.VITE_API_URL as string;

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
}

export default function InputArea({
  roomId,
  sender,
  receiver,
  replyingTo,
  onCancelReply,
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
    const gifUrl = gif.media[0].gif.url;
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
    <div className="w-full flex-shrink-0 z-[95] p-2 sm:p-3 md:px-6 bg-transparent sticky bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto flex flex-col bg-white dark:bg-gray-800 rounded-[28px] shadow-md border border-gray-200 dark:border-gray-700 transition-colors">
        
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 sm:mx-4 md:mx-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp">
          <div className="p-2 max-h-[200px] overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {text.startsWith('/') ? (
                  <Sparkles size={16} className="text-indigo-500 flex-shrink-0" />
                ) : (
                  <CornerUpRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                )}
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 flex-1 truncate">{suggestion}</span>
                <ChevronRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {replyingTo && (
        <div className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-t-[28px] border-b border-indigo-200 dark:border-indigo-800 animate-slideDown">
          <div className="w-1 h-6 sm:h-7 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full flex-shrink-0"></div>
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 lowercase flex items-center gap-1">
              <CornerUpRight size={12} className="sm:w-4 sm:h-4" />
              <span className="truncate">Replying to {replyingTo.sender_name}</span>
            </span>
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
              {replyingTo.message || `${replyingTo.message_type}`}
            </span>
          </div>
          <button
            className="w-6 h-6 sm:w-8 sm:h-8 border-none bg-white/50 dark:bg-gray-700/50 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all flex-shrink-0 backdrop-blur-sm group"
            onClick={onCancelReply}
          >
            <X size={14} className="sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center justify-between py-2 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 rounded-t-[28px] border-b border-gray-200 dark:border-gray-700 animate-slideDown">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              {filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg sm:rounded-xl shadow-md"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                  {getFileIcon(selectedFile)}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                  {uploadProgress}%
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px]">
                {selectedFile.name}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
          <button
            className="w-6 h-6 sm:w-8 sm:h-8 border-none bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex-shrink-0 shadow-sm group"
            onClick={clearFileSelection}
            disabled={uploading}
          >
            <X size={14} className="sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-t-[28px] border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm sm:text-base animate-shake">
          <AlertCircle size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">{uploadError}</span>
          <button 
            onClick={() => setUploadError(null)}
            className="ml-auto hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full p-1 flex-shrink-0"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {showEmoji && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/5 backdrop-blur-sm" onClick={() => setShowEmoji(false)} />
          <div
            className="fixed z-[10000] shadow-2xl rounded-2xl overflow-hidden animate-scaleUp"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '90px',
              maxWidth: 'calc(100vw - 32px)'
            }}
          >
            <div className="scale-[0.85] sm:scale-100 origin-bottom">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width="350px"
                height="400px"
                searchPlaceholder="Search emoji..."
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </>
      )}

      {showGiphy && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/5 backdrop-blur-sm" onClick={() => setShowGiphy(false)} />
          <div
            className="fixed z-[10000] shadow-2xl rounded-2xl overflow-hidden animate-scaleUp bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '90px',
              width: '350px',
              height: '400px',
              maxWidth: 'calc(100vw - 32px)'
            }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
              <input
                type="text"
                placeholder="Search Giphy..."
                value={giphySearch}
                onChange={(e) => setGiphySearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 outline-none text-sm focus:border-indigo-500 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50">
              {giphyLoading && giphyResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {giphyResults.map((gif) => (
                    <img
                      key={gif.id}
                      src={gif.media[0].tinygif.url}
                      alt={gif.id}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition hover:scale-105"
                      onClick={() => sendGif(gif)}
                    />
                  ))}
                  {giphyResults.length === 0 && !giphyLoading && (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-10">No GIFs found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex items-end gap-1 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4">
        <button
          className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 disabled:opacity-40 flex-shrink-0 group ${showEmoji ? 'bg-gray-100 dark:bg-gray-700 text-indigo-500' : ''}`}
          onClick={() => { setShowEmoji(!showEmoji); setShowGiphy(false); }}
          title="Emoji"
          disabled={uploading}
        >
          <Smile size={22} className="group-hover:text-indigo-500 transition-colors" />
        </button>

        <button
          className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 disabled:opacity-40 flex-shrink-0 group ${showGiphy ? 'bg-gray-100 dark:bg-gray-700 text-indigo-500' : ''}`}
          onClick={() => { setShowGiphy(!showGiphy); setShowEmoji(false); }}
          title="GIFs"
          disabled={uploading}
        >
          GIF
        </button>

        <label
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 disabled:opacity-40 flex-shrink-0 cursor-pointer group"
          title="Attach file"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,audio/*,video/*"
            disabled={uploading}
          />
          <Paperclip size={22} className="group-hover:text-indigo-500 transition-colors" />
        </label>

        <div className="flex-1 relative min-w-0 flex items-center bg-gray-100 dark:bg-gray-700/60 rounded-3xl group ring-1 ring-transparent focus-within:ring-indigo-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 bg-transparent border-none text-[15px] sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 outline-none resize-none min-h-[44px] max-h-[120px] overflow-y-auto leading-relaxed"
            disabled={uploading}
            autoFocus
          />
          {text && (
            <button
              className="pr-4 pl-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors h-full flex items-center"
              onClick={() => setText('')}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          className={`ml-1 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${text.trim() || selectedFile ? 'scale-100' : 'scale-90 opacity-80'}`}
          onClick={sendMessage}
          disabled={(!text.trim() && !selectedFile) || uploading}
          title="Send"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
          )}
        </button>
      </div>
    </div>
    </div>
  );
}


