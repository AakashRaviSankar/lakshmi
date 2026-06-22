"use client";

import { useState } from "react";
import { updateAdminCredentials, updateSystemConfig } from "./actions";

interface SystemConfigProps {
  supportMobile: string;
  supportEmail: string;
  appVersion: string;
  appDownloadUrl: string;
}

export default function SettingsForm({
  initialEmail,
  initialConfig,
}: {
  initialEmail: string;
  initialConfig: SystemConfigProps;
}) {
  // Admin Credentials states
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // System Configuration states
  const [supportMobile, setSupportMobile] = useState(initialConfig.supportMobile);
  const [supportEmail, setSupportEmail] = useState(initialConfig.supportEmail);
  const [appVersion, setAppVersion] = useState(initialConfig.appVersion);
  const [appDownloadUrl, setAppDownloadUrl] = useState(initialConfig.appDownloadUrl);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysMessage, setSysMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to update the admin credentials?")) {
      return;
    }
    setMessage(null);

    if (!email) {
      setMessage({ type: "error", text: "Email address is required." });
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await updateAdminCredentials(email, password || undefined);
      if (res.success) {
        setMessage({ type: "success", text: "Admin credentials updated successfully! Log in again if your email changed." });
        setPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update credentials." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysMessage(null);
    setSysLoading(true);
    try {
      const res = await updateSystemConfig(supportMobile, supportEmail, appVersion, appDownloadUrl);
      if (res.success) {
        setSysMessage({ type: "success", text: "System configuration updated successfully!" });
      } else {
        setSysMessage({ type: "error", text: res.error || "Failed to update system config." });
      }
    } catch (err: any) {
      setSysMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSysLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Admin Settings & Config
        </h1>
        <p className="text-sm text-slate-400">
          Manage admin credentials and global mobile application configurations.
        </p>
      </div>

      {/* Card 1: Admin Account Settings */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          🔑 Admin Account Settings
        </h2>

        <form onSubmit={handleAdminSubmit} className="space-y-6 relative z-10">
          {message && (
            <div
              className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              <span>{message.type === "success" ? "✅" : "❌"}</span>
              <p>{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@lottery.com"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="border-t border-slate-800/60 my-6" />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              New Password (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters (Leave blank to keep current)"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 uppercase tracking-wider text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Saving Credentials..." : "Save Account Settings"}
          </button>
        </form>
      </div>

      {/* Card 2: System Configuration Settings */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          ⚙️ Mobile App System Configuration
        </h2>

        <form onSubmit={handleSystemSubmit} className="space-y-6 relative z-10">
          {sysMessage && (
            <div
              className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 ${
                sysMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              <span>{sysMessage.type === "success" ? "✅" : "❌"}</span>
              <p>{sysMessage.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Support Mobile Number
            </label>
            <input
              type="text"
              value={supportMobile}
              onChange={(e) => setSupportMobile(e.target.value)}
              placeholder="e.g. 9962188600"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Support Email Address
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="e.g. tgboyzz007@gmail.com"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Active App Version
            </label>
            <input
              type="text"
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              App Download URL (Link)
            </label>
            <input
              type="url"
              value={appDownloadUrl}
              onChange={(e) => setAppDownloadUrl(e.target.value)}
              placeholder="e.g. https://178-238-236-200.sslip.io/download"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-white focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sysLoading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 uppercase tracking-wider text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {sysLoading ? "Updating Config..." : "Save System Config"}
          </button>
        </form>
      </div>
    </div>
  );
}
