import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect to appropriate dashboard
  if (user) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log("📝 [LoginPage] Submitting:", { email: email.trim() });
    try {
      await login(email.trim(), password);
      console.log("✅ [LoginPage] Login successful");
    } catch (err) {
      console.error("❌ [LoginPage] Login error:", err);
      console.error("❌ [LoginPage] Response data:", err?.response?.data);
      console.error("❌ [LoginPage] Status:", err?.response?.status);
      setError(err.response?.data?.detail ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/loginbg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-4xl font-light mb-2">
            Campus
            <span className="font-medium" style={{ color: "#00523E" }}>
              ERP
            </span>
          </h1>
          <p className="text-gray-600">Campus Job Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-light mb-2">Welcome back</h2>
          <p className="text-gray-600 mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@university.edu"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00523E] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "#00523E" }}
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <a
                href="mailto:hr@university.edu"
                className="hover:underline"
                style={{ color: "#00523E" }}
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 CampusERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
