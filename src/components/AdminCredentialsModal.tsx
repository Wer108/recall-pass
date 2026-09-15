import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { sessionStore } from "../services/sessionStore";

interface AdminCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLoginId: string;
  onCredentialsUpdated: (newLoginId: string) => void;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentLoginId,
  onCredentialsUpdated,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newLoginId, setNewLoginId] = useState(currentLoginId);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password to authorize changes.");
      return;
    }

    if (newLoginId.trim().length < 3) {
      setError("New Admin ID must be at least 3 characters long.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await sessionStore.changeAdminCredentials(
        currentPassword,
        newLoginId.trim(),
        newPassword || currentPassword
      );
      setSuccess(res.message || "Admin credentials updated successfully.");
      onCredentialsUpdated(newLoginId.trim());
      setTimeout(() => {
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(null);
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to update admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="credentials-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="credentials-modal-dialog"
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#0F2540] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#C98A2C]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Admin Security Settings</h2>
              <p className="text-xs text-slate-300">Update login ID and password</p>
            </div>
          </div>

          <button
            id="btn-close-credentials-modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password (Required) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Login ID */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Admin Login ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value)}
                placeholder="e.g. admin or organizer@summit.io"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              New Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540]"
                  required
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2540] hover:bg-[#17375E] text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-[#C98A2C]" />
                  <span>Update Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
