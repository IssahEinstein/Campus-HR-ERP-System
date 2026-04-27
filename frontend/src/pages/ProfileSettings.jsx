import { useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:8000";

function resolveAvatarUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

export default function ProfileSettings() {
  const { user, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setBio(user?.bio ?? "");
  }, [user?.first_name, user?.last_name, user?.bio]);

  const avatarUrl = useMemo(
    () => resolveAvatarUrl(user?.avatar_url),
    [user?.avatar_url],
  );

  const submitProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingProfile(true);
    try {
      await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
      });
      await refreshProfile();
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ?? "Failed to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedCurrentPassword = String(
      formData.get("currentPassword") ?? "",
    );
    const submittedNewPassword = String(formData.get("newPassword") ?? "");
    const submittedConfirmPassword = String(
      formData.get("confirmPassword") ?? "",
    );

    setCurrentPassword(submittedCurrentPassword);
    setNewPassword(submittedNewPassword);
    setConfirmPassword(submittedConfirmPassword);

    setError("");
    setMessage("");

    if (submittedNewPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (submittedNewPassword !== submittedConfirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        current_password: submittedCurrentPassword,
        new_password: submittedNewPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ?? "Failed to update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setSavingAvatar(true);
    try {
      await authApi.uploadAvatar(file);
      await refreshProfile();
      setMessage("Profile photo updated.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ??
          "Failed to upload profile photo.",
      );
    } finally {
      setSavingAvatar(false);
      event.target.value = "";
    }
  };

  const removeAvatar = async () => {
    setError("");
    setMessage("");
    setSavingAvatar(true);
    try {
      await authApi.removeAvatar();
      await refreshProfile();
      setMessage("Profile photo removed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ??
          "Failed to remove profile photo.",
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const initials =
    `${(firstName ?? "").trim().charAt(0)}${(lastName ?? "").trim().charAt(0)}`.toUpperCase() ||
    "NA";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-light mb-2">
          Profile{" "}
          <span className="font-medium" style={{ color: "#00523E" }}>
            Settings
          </span>
        </h1>
        <p className="text-gray-600">
          Update your name, password, profile picture, and description.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          {error || message}
        </div>
      )}

      <div
        className="rounded-2xl p-6 flex items-center gap-4"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,82,62,0.11)",
          boxShadow:
            "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
            style={{ backgroundColor: "#00523E" }}
          >
            {initials}
          </div>
        )}

        <div className="space-y-2">
          <label className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50">
            {savingAvatar ? "Working..." : "Upload Profile Photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
              disabled={savingAvatar}
            />
          </label>
          <button
            type="button"
            onClick={removeAvatar}
            disabled={savingAvatar || !user?.avatar_url}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Remove Photo
          </button>
          <p className="text-xs text-gray-500">
            Accepted: JPG, PNG, WEBP, GIF (max 5MB)
          </p>
          <p className="text-xs text-gray-500">
            Uploaded images are center-cropped and resized for a consistent
            profile picture.
          </p>
        </div>
      </div>

      <form
        onSubmit={submitProfile}
        className="rounded-2xl p-6 space-y-4"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,82,62,0.11)",
          boxShadow:
            "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
        }}
      >
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Profile description (optional)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={savingProfile}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#00523E" }}
        >
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <form
        onSubmit={submitPassword}
        className="rounded-2xl p-6 space-y-4"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(242,250,245,0.88) 100%)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,82,62,0.11)",
          boxShadow:
            "0 8px 40px rgba(0,82,62,0.09), inset 0 1px 0 rgba(255,255,255,0.95)",
        }}
      >
        <h2 className="text-lg font-semibold">Change Password</h2>
        <PasswordInput
            name="currentPassword"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Current password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          required
          autoComplete="current-password"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PasswordInput
              name="newPassword"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <PasswordInput
              name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={savingPassword}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#00523E" }}
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
