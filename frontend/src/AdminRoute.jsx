
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, permissions, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-page">
        <p>Verificando permisos administrativos...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const canAccessAdmin = permissions.some(
    (permission) => permission.key === "users.read"
  );

  if (!canAccessAdmin) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
