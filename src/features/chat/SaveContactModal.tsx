import React, { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { useChat } from "../../contexts/ChatContext";

interface SaveContactModalProps {
  contactUsername: string;
  defaultName?: string;
  onClose: () => void;
}

export default function SaveContactModal({ contactUsername, defaultName, onClose }: SaveContactModalProps) {
  const { currentUser, fetchContacts, getDisplayName } = useChat();
  const [name, setName] = useState(defaultName || getDisplayName(contactUsername, contactUsername) !== contactUsername ? getDisplayName(contactUsername, "") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");
  const normalizeMobileKey = (value?: string) => (value || "").replace(/\D/g, "");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for this contact.");
      return;
    }
    if (!currentUser) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner_mobile: currentUser.mobile,
          contact_mobile: contactUsername,
          contact_name: name.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          const localKey = `local_contacts_${normalizeMobileKey(currentUser.mobile)}`;
          const raw = localStorage.getItem(localKey);
          const contacts = raw ? (JSON.parse(raw) as Array<{ contact_mobile: string; contact_name: string }>) : [];
          const normalizedContact = normalizeMobileKey(contactUsername);
          const withoutExisting = contacts.filter((c) => normalizeMobileKey(c.contact_mobile) !== normalizedContact);
          withoutExisting.push({ contact_mobile: normalizedContact, contact_name: name.trim() });
          localStorage.setItem(localKey, JSON.stringify(withoutExisting));
          await fetchContacts();
          onClose();
          return;
        }
        throw new Error("Failed to save contact");
      }

      await fetchContacts(); // Refresh context contacts
      onClose(); // Close modal
    } catch (err: any) {
      console.error("Save contact error:", err);
      setError("An error occurred while saving the contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <UserPlus size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Save Contact</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enter a custom name for <span className="font-semibold text-gray-700 dark:text-gray-300">{contactUsername}</span>. This will be visible only to you.
          </p>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Dad, Alice, John Doe"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            {error && <p className="text-red-500 text-xs mt-2 font-medium animate-shake">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 rounded-xl font-medium bg-indigo-500 hover:bg-indigo-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center min-w-[100px]"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
