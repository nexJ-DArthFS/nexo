
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL = "http://localhost:3001";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
  method: "GET",
  credentials: "include",
  cache: "no-store",
});

      if (!response.ok) {
        setUser(null);
        setPermissions([]);
        return null;
      }

      const data = await response.json();

      const currentPermissions = Array.isArray(data.permissions)
        ? data.permissions
        : [];

      setUser(data.user);
      setPermissions(currentPermissions);

      return {
        user: data.user,
        permissions: currentPermissions,
      };
    } catch (error) {
      console.error("Error al consultar la sesión:", error);
      setUser(null);
      setPermissions([]);
      return null;
    }
  }, []);

  const hasPermission = useCallback(
    (permissionKey) => {
      return permissions.some(
        (permission) => permission.key === permissionKey
      );
    },
    [permissions]
  );

  useEffect(() => {
    refreshUser().finally(() => {
      setLoading(false);
    });
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cerrar la sesión.");
    }

    setUser(null);
    setPermissions([]);

    return true;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}
