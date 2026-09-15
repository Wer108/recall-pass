import React from "react";
import {
  BookOpen,
  KeyRound,
  ShieldCheck,
  Lock,
  LogOut,
  Settings,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { AdminAuthSession } from "../types";

interface HeaderProps {
  currentView: "attendee" | "admin-login" | "admin-studio";
  onNavigateAttendee: () => void;
  onNavigateAdmin: () => void;
  onLogoutAdmin: () => void;
  onOpenCredentialsModal?: () => void;
  adminSession: AdminAuthSession | null;
  sessionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateAttendee,
  onNavigateAdmin,
  onLogoutAdmin,
  onOpenCredentialsModal,
  adminSession,
  sessionCount = 0,
}) => {
  return (
    <header
      id="app-header"
      className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={onNavigateAttendee}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0F2540] flex items-center justify-center text-[#C98A2C] shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xl tracking-tight text-[#0F2540]">
                  RecallPass
                </span>
                {currentView === "attendee" ? (
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Attendee Page
                  </span>
                ) : currentView === "admin-login" ? (
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Admin Sign-In
                  </span>
                ) : (
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Admin Studio
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentView === "admin-studio"
                  ? "Ingest tracks, edit summaries, train AI, and generate attendee passes"
                  : "Instant note & verified Q&A recall for live learning sessions"}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Dedicated Page Navigation (Separate Pages for Attendee & Admin) */}
        <nav className="hidden sm:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 shadow-2xs">
          <button
            id="nav-tab-attendee-page"
            type="button"
            onClick={onNavigateAttendee}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === "attendee"
                ? "bg-white text-[#0F2540] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C98A2C]" />
            <span>Attendee Page</span>
          </button>

          <button
            id="nav-tab-admin-page"
            type="button"
            onClick={onNavigateAdmin}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === "admin-studio" || currentView === "admin-login"
                ? "bg-white text-[#0F2540] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Admin Studio</span>
            {!adminSession && (
              <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                Protected
              </span>
            )}
          </button>
        </nav>

        {/* Right: View-specific Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Attendee View: Mobile switcher or button */}
          {currentView === "attendee" && (
            <button
              id="header-btn-organizer-portal"
              onClick={onNavigateAdmin}
              className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-[#0F2540] hover:text-white border border-slate-200 transition-all"
              title="Restricted login for event organizers and speakers"
            >
              <Lock className="w-3.5 h-3.5 text-[#C98A2C]" />
              <span>Admin</span>
            </button>
          )}

          {/* Admin Login View: Back to Attendee Portal */}
          {currentView === "admin-login" && (
            <button
              id="header-btn-back-to-attendee"
              onClick={onNavigateAttendee}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#0F2540] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Go to Attendee Page</span>
            </button>
          )}

          {/* Authenticated Admin Studio View: Admin Bar with Security & Sign Out */}
          {currentView === "admin-studio" && adminSession && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin identity pill */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500 font-medium">Admin:</span>
                <span className="font-mono font-bold text-[#0F2540]">
                  {adminSession.adminId}
                </span>
              </div>

              {/* Password / Credentials Settings */}
              {onOpenCredentialsModal && (
                <button
                  id="header-btn-admin-security"
                  onClick={onOpenCredentialsModal}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0F2540] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors inline-flex items-center gap-1.5"
                  title="Update Admin Login ID & Password"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Credentials</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                id="header-btn-admin-logout"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
                title="Sign out of Admin Studio"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
