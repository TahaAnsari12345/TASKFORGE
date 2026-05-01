import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const getStoredUser = () => {
  const value = localStorage.getItem("tf_user");
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    localStorage.removeItem("tf_user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("tf_token"));
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("tf_user", JSON.stringify(userData));
    localStorage.setItem("tf_token", authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("tf_user");
    localStorage.removeItem("tf_token");
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
