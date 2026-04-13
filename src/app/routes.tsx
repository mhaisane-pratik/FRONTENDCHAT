import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const user = localStorage.getItem("chatUser");

  if (!user) {
    return <Navigate to="/chat-login" replace />;
  }

  return <>{children}</>;
}
