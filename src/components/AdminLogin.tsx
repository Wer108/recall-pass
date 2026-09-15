import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  LogIn,
  UserPlus,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { sessionStore } from "../services/sessionStore";
import { AdminAuthSession } from "../types";

interface AdminLoginProps {
  onLoginSuccess: (session: AdminAuthSession) => void;
  onBackToAttendee: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToAttendee,
}) => {
  const [authMode, setAuthMode] = useState<"login" | "setup">("login");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Form states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check initial admin configuration status
  useEffect(() => {
    let isMounted = true;
    sessionStore.getAdminStatus().then((status) => {
      if (isMounted) {
        setIsConfigured(status.isConfigured);
        if (!status.isConfigured) {
          setAuthMode("setup");
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (authMode === "setup") {
      // Setup Mode
      if (!loginId.trim()) {
        setError("Please enter a custom Admin Login ID.");
        return;
      }
      if (loginId.trim().length < 3) {
        setError("Admin Login ID must be at least 3 characters long.");
        return;
      }
      if (!password.trim()) {
        setError("Please choose an Admin Password.");
        return;
      }
      if (password.trim().length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter.");
        return;
      }

      setLoading(true);
      try {
        const session = await sessionStore.setupAdmin(loginId.trim(), password.trim());
        setSuccessMessage("Admin credentials created successfully! Logging you in...");
        setTimeout(() => {
          onLoginSuccess(session);
        }, 500);
      } catch (err: any) {
        setError(err.message || "Failed to set up Admin account.");
      } finally {
        setLoading(false);
      }
    } else {
      // Login Mode
      if (!loginId.trim() || !password.trim()) {
        setError("Please enter both Admin Login ID and Password.");
        return;
      }

      setLoading(true);
      try {
        const session = await sessionStore.loginAdmin(loginId, password);
        onLoginSuccess(session);
      } catch (err: any) {
        setError(err.message || "Invalid Admin Login ID or Password.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      id="admin-login-page"
      className="min-h-[78vh] flex flex-col items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        {/* Back navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="btn-back-to-attendee"
            type="button"
            onClick={onBackToAttendee}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F2540] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Attendee Portal</span>
          </button>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            Restricted Admin Area
          </span>
        </div>

        {/* Card */}
        <div
          id="admin-login-card"
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#0F2540] text-[#C98A2C] mx-auto flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2540] tracking-tight">
              {authMode === "setup" ? "Create Admin Credentials" : "Admin Studio Login"}
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {authMode === "setup"
                ? "No default credentials exist. Set up your custom Admin Login ID and secure password to protect this studio."
                : "Restricted portal for session speakers and event organizers. Attendees cannot access this page."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              id="tab-mode-login"
              onClick={() => {
                setAuthMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === "login"
                  ? "bg-white text-[#0F2540] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              id="tab-mode-setup"
              onClick={() => {
                setAuthMode("setup");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === "setup"
                  ? "bg-white text-[#0F2540] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isConfigured ? "Update / Set New ID" : "Set Up Admin ID"}</span>
            </button>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div
              id="admin-login-success"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              id="admin-login-error"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-id"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                {authMode === "setup" ? "Create Admin Login ID *" : "Admin Login ID *"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-login-id"
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setError(null);
                  }}
                  placeholder={authMode === "setup" ? "e.g. summit_organizer or alex@event.com" : "Enter your Admin Login ID"}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540] focus:border-transparent transition-all"
                  required
                />
              </div>
              {authMode === "setup" && (
                <p className="text-[11px] text-slate-400">
                  Minimum 3 characters. No default credentials exist.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                {authMode === "setup" ? "Create Password *" : "Admin Password *"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={authMode === "setup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder={authMode === "setup" ? "Choose a secure password (min 6 chars)" : "Enter your password"}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (only in setup mode) */}
            {authMode === "setup" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="admin-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Re-enter chosen password"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{authMode === "setup" ? "Creating Account..." : "Authenticating..."}</span>
                </>
              ) : authMode === "setup" ? (
                <>
                  <UserPlus className="w-4 h-4 text-[#C98A2C]" />
                  <span>Save Admin ID & Enter Studio</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#C98A2C]" />
                  <span>Enter Organizer Studio</span>
                </>
              )}
            </button>
          </form>

          {/* Access Policy Notice */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-1">
            <p className="text-[11px] text-slate-500 font-medium">
              Attendees cannot access the Admin Studio.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Attendee access passes (<span className="font-mono font-medium">RP-XXXXXX</span>) only grant access to published notes in the Attendee Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
