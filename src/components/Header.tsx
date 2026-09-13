import React from "react";
import { BookOpen, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

interface HeaderProps {
  activeTab: "attendee" | "admin";
  onTabChange: (tab: "attendee" | "admin") => void;
  sessionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  sessionCount = 0,
}) => {
  return (
    <header
      id="app-header"
      className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            id="brand-logo-btn"
            onClick={() => onTabChange("attendee")}
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
                <span className="text-[11px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Smart Recall
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Smart-education note recall for live learning sessions
              </p>
            </div>
          </button>

          {/* Mobile view tab trigger */}
          <div className="sm:hidden flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="mobile-tab-attendee"
              onClick={() => onTabChange("attendee")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === "attendee"
                  ? "bg-[#0F2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Attendee
            </button>
            <button
              id="mobile-tab-admin"
              onClick={() => onTabChange("admin")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === "admin"
                  ? "bg-[#0F2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin Studio
            </button>
          </div>
        </div>

        {/* Desktop View Switcher & Counter */}
        <div className="hidden sm:flex items-center gap-3">
          <div
            id="nav-tab-container"
            className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center"
          >
            <button
              id="nav-tab-attendee"
              onClick={() => onTabChange("attendee")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "attendee"
                  ? "bg-[#0F2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <KeyRound className="w-4 h-4 text-[#C98A2C]" />
              <span>Attendee Access</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => onTabChange("admin")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-[#0F2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#0F6E56]" />
              <span>Admin Studio</span>
              {sessionCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {sessionCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
