import { Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext";

import Landing from "./features/landing/Landing";
import ChatLogin from "./pages/Login";
import ChatLayout from "./features/chat/ChatLayout";
import ProtectedRoute from "./app/ProtectedRoute";

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        {/* Landing Page First */}
        <Route path="/" element={<Landing />} />
        {/* Login Page */}
        <Route path="/chat-login" element={<ChatLogin />} />
        {/* Protected Chat Page */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ChatProvider>
  );
}  
