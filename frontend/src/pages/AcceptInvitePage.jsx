import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as authApi from "../api/auth";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const type = (searchParams.get("type") ?? "").toLowerCase();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel = useMemo(() => {
    if (type === "supervisor") return "Supervisor";
    if (type === "worker") return "Worker";
    return "Account";
  }, [type]);

  const isValidType = type === "supervisor" || type === "worker";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !isValidType) {
      setError("Invalid invite link. Please request a new invitation.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = type === "supervisor"
        ? await authApi.acceptSupervisorInvite(token, password)
        : await authApi.acceptWorkerInvite(token, password);
      setSuccess(response?.message ?? "Password set successfully. You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      const normalized = String(detail ?? "").toLowerCase();

      if (
        normalized.includes("already been used")
        || normalized.includes("invalid or expired invite token")
        || normalized.includes("invite token has expired")
      ) {
        setSuccess("This invite link is no longer active. If you already completed setup, your account is activated and you can log in.");
      } else {
        setError(detail ?? "Unable to activate account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-light">
            Activate <span className="font-medium" style={{ color: "#00523E" }}>{roleLabel}</span> Account
          </h1>
          <p className="text-sm text-gray-600">
            Your temporary password is your assigned ID. Use this page to set your permanent password.
          </p>
        </div>

        {!token || !isValidType ? (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            Invalid invite link. Ask an administrator to resend your invitation.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter a new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Confirm your new password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#00523E" }}
            >
              {loading ? "Setting password..." : "Set Password"}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-gray-500">
          <Link to="/login" className="hover:underline" style={{ color: "#00523E" }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
