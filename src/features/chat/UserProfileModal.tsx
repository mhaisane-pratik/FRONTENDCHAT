import React from "react";
import { X, Phone, UserCircle2 } from "lucide-react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    mobile: string;
    display_name?: string;
    bio?: string;
    profile_picture?: string;
    is_online?: boolean;
    last_seen?: string;
  };
}

const formatLastSeen = (isoDate?: string) => {
  if (!isoDate) return "Offline";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "Offline";
  return `Last seen ${parsed.toLocaleString()}`;
};

export default function UserProfileModal({ isOpen, onClose, profile }: UserProfileModalProps) {
  if (!isOpen) return null;

  const displayName = profile.display_name || profile.mobile;
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D9488&color=fff&size=160&bold=true`;
  const avatar =
    resolveMediaUrl(profile.profile_picture) ||
    avatarFallback;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[1100]" onClick={onClose} />

      <div className="fixed inset-0 z-[1101] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close profile"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-6">
            <div className="flex flex-col items-center text-center">
              <img
                src={avatar}
                alt={displayName}
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500/30"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = avatarFallback;
                }}
              />
              <h4 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{displayName}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {profile.is_online ? "Online" : formatLastSeen(profile.last_seen)}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mobile</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{profile.mobile}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start gap-3">
                  <UserCircle2 size={18} className="text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">About</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                      {profile.bio?.trim() ? profile.bio : "Hey there! I am using ZatChat."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
