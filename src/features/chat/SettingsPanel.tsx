import React, { useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { Camera, Image as ImageIcon, Trash2, X } from "lucide-react";
import { WALLPAPERS } from "./wallpapers";
import { resolveMediaUrl } from "../../utils/mediaUrl";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env.VITE_API_URL as string;
const API_KEY = "ZATCHAT_PRATEEK9373";

interface SettingsPanelProps {
  onClose: () => void;
}

const themes = [
  { id: "light", name: "Light", icon: "☀️" },
  { id: "dark", name: "Dark", icon: "🌙" },
];

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { currentUser, setCurrentUser, theme, setTheme, wallpaper, setWallpaper, soundEnabled, setSoundEnabled } = useChat();
  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "wallpaper" | "notifications">("profile");
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.display_name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      setEditing(true);
      setShowPhotoOptions(false);
    }
  };

  const currentDpUrl = previewUrl === "remove" 
    ? `https://ui-avatars.com/api/?name=${currentUser?.mobile || 'user'}&background=0D9488&color=fff&size=128&bold=true`
    : previewUrl || resolveMediaUrl(currentUser?.profile_picture) || `https://ui-avatars.com/api/?name=${currentUser?.mobile || 'user'}&background=0D9488&color=fff&size=128&bold=true`;

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
      let updatedDpUrl = currentUser.profile_picture;

      // 1. Upload new picture if chosen
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append("photo", fileInputRef.current.files[0]);

        const res = await fetch(`${API_URL}/api/v1/users/${encodeURIComponent(currentUser.mobile)}/profile-picture`, {
          method: "POST",
          headers: { "x-api-key": API_KEY },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          updatedDpUrl = data.profile_picture;
        }
      } 
      // 2. Or delete picture if marked as removed
      else if (previewUrl === "remove") {
        updatedDpUrl = "";
      }

      // 3. Save all profile text data
      const res = await fetch(`${API_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          mobile: currentUser.mobile,
          display_name: displayName,
          bio: bio,
          profile_picture: updatedDpUrl as string, // Cast due to type definition limits
        }),
      });

      if (res.ok) {
        const updatedUser = {
          ...currentUser,
          display_name: displayName,
          bio,
          profile_picture: updatedDpUrl,
        };
        setCurrentUser(updatedUser);
        // We'll trust the Socket or Context to eventually re-fetch if needed, 
        // or just clear the preview state so it continues normally.
        if (fileInputRef.current) fileInputRef.current.value = "";
        setPreviewUrl(null);
        setEditing(false);
      }
    } catch (err) {
      console.error("❌ Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[1000] animate-fadeIn" onClick={onClose} />
      <div className="fixed top-0 right-0 w-full md:w-[450px] h-screen bg-white dark:bg-gray-900 shadow-2xl z-[1001] flex flex-col animate-slideInRight">
        <div className="flex items-center gap-4 p-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            className="w-10 h-10 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
            onClick={onClose}
          >
            ←
          </button>
          <h2 className="m-0 text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["profile", "theme", "wallpaper", "notifications"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-4 px-3 text-sm font-medium whitespace-nowrap transition border-b-3 ${
                activeTab === tab
                  ? "text-green-500 border-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 relative">
                <div 
                  className="relative group cursor-pointer active:scale-95 transition-transform" 
                  onClick={() => setShowPhotoOptions(true)}
                  title="Change profile photo"
                >
                  <img
                    src={currentDpUrl}
                    alt="Profile"
                    className="w-36 h-36 rounded-full border-4 border-green-500 object-cover shadow-lg transition-opacity group-hover:opacity-90"
                  />
                  <div className="absolute bottom-1 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white dark:border-gray-900 transition-transform group-hover:scale-110">
                    <Camera size={20} />
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Username</label>
                  <input
                    type="text"
                    value={currentUser?.mobile || ""}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!editing}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 py-3.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-75 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setPreviewUrl(null);
                        setDisplayName(currentUser?.display_name || "");
                        setBio(currentUser?.bio || "");
                      }}
                      disabled={isSaving}
                      className="flex-1 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-75"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 py-3.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose your theme</p>
              <div className="grid grid-cols-2 gap-4">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer flex flex-col items-center gap-3 transition hover:border-green-500 hover:-translate-y-1 ${
                      theme === t.id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setTheme(t.id)}
                  >
                    <span className="text-5xl">{t.icon}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</span>
                    {theme === t.id && (
                      <span className="absolute top-3 right-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "wallpaper" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose your wallpaper</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WALLPAPERS.map((w) => (
                  <div
                    key={w.id}
                    className={`cursor-pointer rounded-xl overflow-hidden border-3 transition hover:-translate-y-1 hover:shadow-lg ${
                      wallpaper === w.id ? "border-indigo-500 shadow-indigo-200" : "border-transparent"
                    }`}
                    onClick={() => setWallpaper(w.id)}
                  >
                    <div
                      className="h-20 w-full"
                      style={{ background: w.css }}
                    ></div>
                    <div className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {w.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Notification settings</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="flex gap-4 items-start">
                    <span className="text-3xl">🔔</span>
                    <div>
                      <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">Push Notifications</h4>
                      <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Receive alerts for new messages</p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 dark:bg-gray-600 rounded-3xl transition before:absolute before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition peer-checked:bg-green-500 peer-checked:before:translate-x-6"></span>
                  </label>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="flex gap-4 items-start">
                    <span className="text-3xl">🔊</span>
                    <div>
                      <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">Sound</h4>
                      <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Play sound for new messages</p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0 peer" 
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                    />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 dark:bg-gray-600 rounded-3xl transition before:absolute before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition peer-checked:bg-green-500 peer-checked:before:translate-x-6"></span>
                  </label>
                </div>

                <button className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
                  Request Permission
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPhotoOptions && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[1010] animate-fadeIn backdrop-blur-sm" 
            onClick={() => setShowPhotoOptions(false)} 
          />
          <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[360px] bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl z-[1020] shadow-2xl overflow-hidden animate-slideUp md:animate-zoomIn">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="m-0 text-xl font-bold text-gray-900 dark:text-white">Profile photo</h3>
              <button 
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={() => setShowPhotoOptions(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex justify-around items-start">
              <button 
                className="flex flex-col items-center gap-3 text-green-600 dark:text-green-500 hover:scale-110 transition group"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm group-hover:border-green-300 dark:group-hover:border-green-600 transition-colors">
                  <Camera size={26} className="text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors" />
                </div>
                <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Camera</span>
              </button>
              
              <button 
                className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition group"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-colors">
                  <ImageIcon size={26} className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Gallery</span>
              </button>
              
              {(currentDpUrl !== `https://ui-avatars.com/api/?name=${currentUser?.mobile || 'user'}&background=0D9488&color=fff&size=128&bold=true` || currentUser?.profile_picture) && previewUrl !== "remove" && (
                <button 
                  className="flex flex-col items-center gap-3 text-red-500 hover:scale-110 transition group"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPreviewUrl("remove"); 
                    setEditing(true); 
                    setShowPhotoOptions(false); 
                  }}
                >
                  <div className="w-14 h-14 rounded-full border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm group-hover:border-red-300 dark:group-hover:border-red-600 transition-colors">
                    <Trash2 size={26} className="text-gray-600 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Remove</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}