import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import { socket } from "../../api/socket";
import ChatList from "./ChatList";
import NewChatModal from "./NewChatModal";
import CreateGroupModal from "./CreateGroupModal";
import SettingsPanel from "./SettingsPanel";
import {
  Menu,
  Search,
  X,
  Plus,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  CheckCheck,
  UserPlus,
} from "lucide-react";

interface SidebarProps {
  onSettingsClick: () => void;
  isMobile: boolean;
}

type FilterType = "all" | "unread" | "groups";

export default function Sidebar({ onSettingsClick, isMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { chatRooms, selectedRoom, allowGroupCreation, currentUser, appName, appLogo, getDisplayName, setCurrentUser, setSelectedRoom } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    setSearchTerm("");
    setActiveFilter("all");
  }, [selectedRoom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest(".dropdown-menu") && !target.closest(".menu-button")) {
          setShowMenu(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const filteredRooms = chatRooms.filter((room) => {
    const otherUser = room.other_user || (room.participant_1 === currentUser?.mobile ? room.participant_2 : room.participant_1) || "";
    const displayName = room.is_group ? room.group_name : getDisplayName(otherUser, otherUser);
    const matchesSearch = displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "unread") {
      return room.unread_count > 0;
    } else if (activeFilter === "groups") {
      return room.is_group === true;
    }
    return true;
  });

  // Remove exact duplicates (same other user or same group ID)
  const uniqueRooms = [];
  const seenIds = new Set();
  
  for (const room of filteredRooms) {
    const otherUser = room.is_group 
      ? `group_${room.id}` 
      : (room.other_user || (room.participant_1 === currentUser?.mobile ? room.participant_2 : room.participant_1));
    
    if (otherUser && !seenIds.has(otherUser)) {
      seenIds.add(otherUser);
      uniqueRooms.push(room);
    }
  }

  const roomsToDisplay = uniqueRooms;

  const unreadCount = chatRooms.filter((r) => r.unread_count > 0).length;
  const groupsCount = chatRooms.filter((r) => r.is_group).length;

  const handleLogout = () => {
    localStorage.removeItem("chatUser");
    localStorage.removeItem("selectedRoom");
    if (socket.connected) {
      socket.disconnect();
    }
    setCurrentUser(null);
    setSelectedRoom(null);
    navigate("/chat-login", { replace: true });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#fdfdfd] dark:bg-[#111b21] overflow-hidden">
      
      {/* Dynamic App Branding & Header */}
      <div className="flex flex-col bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        
        {/* Top Branding Row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
           <div className="flex items-center gap-3">
             {appLogo ? (
                <img src={appLogo} alt="App Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm bg-gray-50 dark:bg-gray-800" />
             ) : (
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {appName ? appName.charAt(0).toUpperCase() : "Z"}
                </div>
             )}
             <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 block">
               {appName || "ZatChat"}
             </span>
           </div>
           
           <div className="flex items-center gap-1">
             <button
               className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
               onClick={() => setShowNewChat(true)}
               title="New chat"
             >
               <Plus size={20} />
             </button>
             <button
               className="menu-button w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
               onClick={(e) => {
                 e.stopPropagation();
                 setShowMenu(!showMenu);
               }}
               title="Menu"
             >
               <Menu size={20} />
             </button>
           </div>
        </div>

        {/* Bottom Search Row */}
        <div className="px-4 pb-3 pt-1">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border-none bg-gray-100 dark:bg-[#202c33] text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 gap-1 bg-[#fdfdfd] dark:bg-[#111b21]">
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
            activeFilter === "all"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeFilter === "unread"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("unread")}
        >
          <CheckCheck size={16} className="stroke-[2]" />
          Unread
        </button>
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeFilter === "groups"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveFilter("groups")}
        >
          <Users size={16} className="stroke-[2]" />
          Groups
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList rooms={roomsToDisplay} searchTerm={searchTerm} activeFilter={activeFilter} />
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowMenu(false)} />
          <div className="absolute top-16 left-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-[1000] min-w-[220px] overflow-hidden border border-gray-200 dark:border-gray-700 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              onClick={() => {
                setShowNewChat(true);
                setShowMenu(false);
              }}
            >
              <MessageSquare size={18} className="text-gray-500 dark:text-gray-400" />
              <span>New chat</span>
            </button>
            {allowGroupCreation && (
              <button
                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                onClick={() => {
                  setShowCreateGroup(true);
                  setShowMenu(false);
                }}
              >
                <UserPlus size={18} className="text-gray-500 dark:text-gray-400" />
                <span>New group</span>
              </button>
            )}
            <button
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
            >
              <Settings size={18} className="text-gray-500 dark:text-gray-400" />
              <span>Settings</span>
            </button>
            {(currentUser?.mobile === 'admin' || currentUser?.is_admin === true) && (
              <button
                className="w-full px-4 py-3 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors"
                onClick={() => {
                  window.location.href = '/admin'; // Redirects to admin dashboard
                }}
              >
                <Settings size={18} />
                <span>Admin Dashboard</span>
              </button>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              onClick={() => {
                handleLogout();
                setShowMenu(false);
              }}
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}