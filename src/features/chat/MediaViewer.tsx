// File: video-call-main/src/features/chat/MediaViewer.tsx

import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import "./MediaViewer.css";

interface MediaViewerProps {
  roomId: string;
  onClose: () => void;
}

interface MediaFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  message_type: string;
  sender_name: string;
  created_at: string;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function MediaViewer({ roomId, onClose }: MediaViewerProps) {
  const { currentUser } = useChat();
  const [activeTab, setActiveTab] = useState<"photos" | "videos" | "files">("photos");
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [roomId]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      console.log("📸 Loading media for room:", roomId);

      const response = await fetch(
        `${API_URL}/api/v1/chats/history/${roomId}?mobile=${currentUser?.mobile}`
      );

      if (!response.ok) {
        throw new Error("Failed to load media");
      }

      const data = await response.json();
      const messagesArray = Array.isArray(data) ? data : data.messages || [];

      // Filter messages with files
      const mediaFiles = messagesArray
        .filter((msg: any) => msg.file_url && !msg.is_deleted)
        .map((msg: any) => ({
          id: msg.id,
          file_url: msg.file_url,
          file_name: msg.file_name || "Unknown",
          file_size: msg.file_size || 0,
          message_type: msg.message_type,
          sender_name: msg.sender_name,
          created_at: msg.created_at,
          message: msg.message,
        }));

      setMedia(mediaFiles);
      console.log("✅ Loaded", mediaFiles.length, "media files");
    } catch (error) {
      console.error("❌ Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  const photos = media.filter((m) => m.message_type === "image");
  const videos = media.filter((m) => m.message_type === "video");
  const files = media.filter((m) => 
    m.message_type === "file" || 
    (!["image", "video"].includes(m.message_type))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleMediaClick = (mediaItem: MediaFile) => {
    setSelectedMedia(mediaItem);
    if (mediaItem.message_type === "image" || mediaItem.message_type === "video") {
      setShowFullscreen(true);
    }
  };

  const handleDownload = (mediaItem: MediaFile) => {
    window.open(mediaItem.file_url, "_blank");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="media-loading">
          <div className="spinner"></div>
          <p>Loading media...</p>
        </div>
      );
    }

    let items: MediaFile[] = [];
    let emptyMessage = "";

    switch (activeTab) {
      case "photos":
        items = photos;
        emptyMessage = "No photos shared yet";
        break;
      case "videos":
        items = videos;
        emptyMessage = "No videos shared yet";
        break;
      case "files":
        items = files;
        emptyMessage = "No files shared yet";
        break;
    }

    if (items.length === 0) {
      return (
        <div className="media-empty">
          <div className="empty-icon">
            {activeTab === "photos" && "📷"}
            {activeTab === "videos" && "🎥"}
            {activeTab === "files" && "📁"}
          </div>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    if (activeTab === "photos") {
      return (
        <div className="media-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="media-item photo-item"
              onClick={() => handleMediaClick(item)}
            >
              <img src={item.file_url} alt={item.file_name} />
              <div className="media-overlay">
                <span className="media-date">{formatDate(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "videos") {
      return (
        <div className="media-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="media-item video-item"
              onClick={() => handleMediaClick(item)}
            >
              <video src={item.file_url} />
              <div className="video-play-icon">▶️</div>
              <div className="media-overlay">
                <span className="media-date">{formatDate(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "files") {
      return (
        <div className="files-list">
          {items.map((item) => (
            <div key={item.id} className="file-item">
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{item.file_name}</div>
                <div className="file-meta">
                  <span>{formatSize(item.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(item.created_at)}</span>
                  <span>•</span>
                  <span>{item.sender_name}</span>
                </div>
              </div>
              <button
                className="download-btn"
                onClick={() => handleDownload(item)}
              >
                ⬇️
              </button>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      <div className="media-viewer-overlay" onClick={onClose} />
      <div className="media-viewer">
        {/* Header */}
        <div className="media-header">
          <h2>Shared Media</h2>
          <button className="close-media-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="media-tabs">
          <button
            className={`media-tab ${activeTab === "photos" ? "active" : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            <span className="tab-icon">📷</span>
            <span className="tab-label">Photos</span>
            <span className="tab-count">{photos.length}</span>
          </button>
          <button
            className={`media-tab ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            <span className="tab-icon">🎥</span>
            <span className="tab-label">Videos</span>
            <span className="tab-count">{videos.length}</span>
          </button>
          <button
            className={`media-tab ${activeTab === "files" ? "active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            <span className="tab-icon">📁</span>
            <span className="tab-label">Files</span>
            <span className="tab-count">{files.length}</span>
          </button>
        </div>

        {/* Content */}
        <div className="media-content">{renderContent()}</div>
      </div>

      {/* Fullscreen Image Viewer */}
      {showFullscreen && selectedMedia && (
        <>
          <div
            className="fullscreen-overlay"
            onClick={() => setShowFullscreen(false)}
          />
          <div className="fullscreen-viewer">
            <button
              className="close-fullscreen"
              onClick={() => setShowFullscreen(false)}
            >
              ✕
            </button>
            {selectedMedia.message_type === "image" ? (
              <img src={selectedMedia.file_url} alt={selectedMedia.file_name} />
            ) : (
              <video src={selectedMedia.file_url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl" />
            )}
            <div className="fullscreen-info">
              <div className="fullscreen-details">
                <span className="fullscreen-name">{selectedMedia.file_name}</span>
                <span className="fullscreen-date">
                  {formatDate(selectedMedia.created_at)} • {selectedMedia.sender_name}
                </span>
              </div>
              <button
                className="fullscreen-download"
                onClick={() => handleDownload(selectedMedia)}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
