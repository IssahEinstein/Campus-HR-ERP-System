/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

/** Decode the payload portion of a JWT without verifying the signature. */
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("access_token");
    return t ? decodeJwt(t) : null;
  });
  // true while we are verifying a stored token on first mount
  const [initializing, setInitializing] = useState(
    () => !!localStorage.getItem("access_token"),
  );
  const navigate = useNavigate();

  const mergeUser = useCallback(
    (payload, profile) => ({
      ...(payload ?? {}),
      ...(profile ?? {}),
    }),
    [],
  );

  const refreshProfile = useCallback(async () => {
    const activeToken = localStorage.getItem("access_token");
    if (!activeToken) return null;

    const payload = decodeJwt(activeToken);
    try {
      const profile = await authApi.myProfile();
      const merged = mergeUser(payload, profile);
      setUser(merged);
      return merged;
    } catch {
      // If the token is expired / server unreachable, fall back to JWT payload
      setUser(payload);
      return payload;
    }
  }, [mergeUser]);

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    refreshProfile().finally(() => setInitializing(false));
  }, [token, refreshProfile]);

  const login = useCallback(
    async (email, password) => {
      console.log("🔐 [Login] Attempting login for:", email);
      const data = await authApi.login(email, password);
      console.log(
        "✅ [Login] Token received:",
        data.access_token?.slice(0, 30) + "...",
      );
      const payload = decodeJwt(data.access_token);
      console.log("📦 [Login] JWT payload:", payload);
      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token);
      let merged = payload;
      try {
        const profile = await authApi.myProfile();
        console.log("👤 [Login] Profile fetched:", profile);
        merged = mergeUser(payload, profile);
      } catch (err) {
        console.warn(
          "⚠️ [Login] Profile fetch failed, using JWT payload only:",
          err?.message,
        );
        merged = payload;
      }
      setUser(merged);
      console.log("🧭 [Login] Merged user:", merged);
      // Route to role-specific dashboard
      const role = payload?.role?.toLowerCase();
      console.log("➡️ [Login] Navigating to:", `/${role}/dashboard`);
      navigate(`/${role}/dashboard`, { replace: true });
      return merged;
    },
    [mergeUser, navigate],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{ token, user, initializing, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
