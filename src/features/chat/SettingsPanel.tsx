import React, { useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import { Camera, Image as ImageIcon, Trash2, X } from "lucide-react";
import { WALLPAPERS } from "./wallpapers";
import { resolveMediaUrl } from "../../utils/mediaUrl";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");
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
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.display_name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.mobile || 'user')}&background=0D9488&color=fff&size=128&bold=true`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      setEditing(true);
      setShowPhotoOptions(false);
    }
  };

  const currentDpUrl = previewUrl === "remove" 
    ? avatarFallback
    : previewUrl || resolveMediaUrl(currentUser?.profile_picture) || avatarFallback;

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
      let updatedDpUrl = currentUser.profile_picture;

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
      else if (previewUrl === "remove") {
        updatedDpUrl = "";
      }

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
          profile_picture: updatedDpUrl as string,
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
      <div className="fixed inset-0 z-[1001] bg-white dark:bg-gray-900 flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              className="w-10 h-10 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition flex-shrink-0"
              onClick={onClose}
            >
              ←
            </button>
            <h2 className="m-0 text-xl font-bold text-gray-900 dark:text-white truncate">Settings</h2>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            Profile, appearance, and notifications
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-0 sm:px-0">
          
          {/* Profile Section */}
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800/50">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 px-1">Profile</h3>
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
                    className="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-xl transition-opacity group-hover:opacity-90"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = avatarFallback;
                    }}
                  />
                  <div className="absolute bottom-1 right-1 w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white dark:border-gray-900 transition-transform group-hover:scale-110">
                    <Camera size={18} />
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

              <div className="space-y-4 px-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase ml-1">Username</label>
                  <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-gray-500 dark:text-gray-400 text-[15px] font-medium border border-gray-200 dark:border-gray-700/50">
                    {currentUser?.mobile || ""}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase ml-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setEditing(true); }}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-gray-900 dark:text-white text-[15px] transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase ml-1">About / Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => { setBio(e.target.value); setEditing(true); }}
                    rows={2}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none text-gray-900 dark:text-white text-[15px] resize-none transition-all"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {editing && (
                <div className="flex gap-3 px-1 animate-scaleUp">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setPreviewUrl(null);
                      setDisplayName(currentUser?.display_name || "");
                      setBio(currentUser?.bio || "");
                    }}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800/50">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 px-1">Appearance</h3>
            
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase ml-1">Preferred Theme</label>
              <div className="grid grid-cols-2 gap-3 px-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      theme === t.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-4 ring-indigo-500/10"
                        : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"
                    }`}
                    onClick={() => setTheme(t.id)}
                  >
                    <span className="text-3xl">{t.icon}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase ml-1">Chat Wallpaper</label>
              <div className="grid grid-cols-3 gap-2 px-1">
                {WALLPAPERS.slice(0, 9).map((w) => (
                  <button
                    key={w.id}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                      wallpaper === w.id ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent"
                    }`}
                    onClick={() => setWallpaper(w.id)}
                  >
                    <div className="w-full h-full" style={{ background: w.css }}></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="p-4 sm:p-6 mb-10">
            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 px-1">Notifications</h3>
            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">🔔</div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900 dark:text-white">Push Alerts</div>
                    <div className="text-[11px] text-gray-500">New message notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">🔊</div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900 dark:text-white">Sounds</div>
                    <div className="text-[11px] text-gray-500">Play tone for incoming chats</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div> 
      </div>

      {showPhotoOptions && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[1010] animate-fadeIn backdrop-blur-sm" 
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