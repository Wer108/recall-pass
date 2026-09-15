import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AttendeeView } from "./components/AttendeeView";
import { AdminStudio } from "./components/AdminStudio";
import { AdminLogin } from "./components/AdminLogin";
import { AdminCredentialsModal } from "./components/AdminCredentialsModal";
import { SessionData, AdminAuthSession } from "./types";
import { BookOpen, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { sessionStore } from "./services/sessionStore";

export default function App() {
  const [currentView, setCurrentView] = useState<"attendee" | "admin-login" | "admin-studio">("attendee");
  const [adminSession, setAdminSession] = useState<AdminAuthSession | null>(null);
  const [attendeeCode, setAttendeeCode] = useState<string>("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // Fetch all sessions for Admin view and counter
  const fetchSessions = async () => {
    try {
      const data = await sessionStore.getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  // Synchronize route & auth state on mount and on hash/popstate
  const syncViewFromLocation = () => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    const pageParam = params.get("page") || params.get("view");
    const hash = window.location.hash.replace("#", "").trim().toLowerCase();

    const storedAdmin = sessionStore.getAdminSession();
    setAdminSession(storedAdmin);

    if (codeParam) {
      setAttendeeCode(codeParam.toUpperCase());
      setCurrentView("attendee");
      return;
    }

    if (hash.startsWith("rp-")) {
      setAttendeeCode(hash.toUpperCase());
      setCurrentView("attendee");
      return;
    }

    if (hash === "admin" || pageParam === "admin" || window.location.pathname.endsWith("/admin")) {
      if (storedAdmin) {
        setCurrentView("admin-studio");
      } else {
        setCurrentView("admin-login");
      }
      return;
    }

    // Default to Attendee Portal
    setCurrentView("attendee");
  };

  useEffect(() => {
    fetchSessions();
    syncViewFromLocation();

    window.addEventListener("hashchange", syncViewFromLocation);
    window.addEventListener("popstate", syncViewFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncViewFromLocation);
      window.removeEventListener("popstate", syncViewFromLocation);
    };
  }, []);

  // Handler: Navigate to Admin
  const handleNavigateAdmin = () => {
    const active = sessionStore.getAdminSession();
    if (active) {
      setAdminSession(active);
      setCurrentView("admin-studio");
      window.location.hash = "admin";
    } else {
      setCurrentView("admin-login");
      window.location.hash = "admin";
    }
  };

  // Handler: Navigate to Attendee
  const handleNavigateAttendee = () => {
    setCurrentView("attendee");
    window.location.hash = "attendee";
  };

  // Handler: Admin Login Success
  const handleLoginSuccess = (session: AdminAuthSession) => {
    setAdminSession(session);
    setCurrentView("admin-studio");
    window.location.hash = "admin";
    fetchSessions();
  };

  // Handler: Admin Logout
  const handleLogoutAdmin = async () => {
    await sessionStore.logoutAdmin();
    setAdminSession(null);
    setCurrentView("attendee");
    window.location.hash = "attendee";
  };

  // Handler: View a specific session as Attendee
  const handleViewAttendeeSession = (code: string) => {
    setAttendeeCode(code);
    setCurrentView("attendee");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("code", code);
    newUrl.hash = code;
    window.history.replaceState({}, "", newUrl.toString());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#C98A2C]/20 selection:text-[#0F2540]">
      {/* Top Navigation */}
      <Header
        currentView={currentView}
        onNavigateAttendee={handleNavigateAttendee}
        onNavigateAdmin={handleNavigateAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
        adminSession={adminSession}
        sessionCount={sessions.length}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === "attendee" && (
          <AttendeeView initialCode={attendeeCode} />
        )}

        {(currentView === "admin-login" || (currentView === "admin-studio" && !adminSession)) && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToAttendee={handleNavigateAttendee}
          />
        )}

        {currentView === "admin-studio" && adminSession && (
          <AdminStudio
            onViewAttendeeSession={handleViewAttendeeSession}
            sessions={sessions}
            onRefreshSessions={fetchSessions}
            adminLoginId={adminSession.adminId}
            onOpenCredentialsModal={() => setIsCredentialsModalOpen(true)}
          />
        )}
      </main>

      {/* Admin Credentials Modal */}
      {isCredentialsModalOpen && adminSession && (
        <AdminCredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          currentLoginId={adminSession.adminId}
          onCredentialsUpdated={(newId) => {
            setAdminSession((prev) => (prev ? { ...prev, adminId: newId } : prev));
          }}
        />
      )}

      {/* Professional Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 px-4 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0F2540] flex items-center justify-center text-[#C98A2C] font-bold text-xs">
              RP
            </div>
            <span className="font-semibold text-[#0F2540]">RecallPass</span>
            <span>— Smart-education note recall tool for live learning sessions</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>60-Day Pass Expiry</span>
            <span>•</span>
            <span>Verified Q&A Extraction</span>
            <span>•</span>
            {currentView === "attendee" ? (
              <button
                type="button"
                id="footer-admin-link"
                onClick={handleNavigateAdmin}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0F2540] font-semibold transition-colors group"
              >
                <Lock className="w-3 h-3 text-[#C98A2C]" />
                <span>Organizer Login</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Admin Session
              </span>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-3 pt-3 border-t border-slate-100 text-center sm:text-left text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AI-generated — verify against the original recording for critical details. Designed for lectures, workshops, guest talks, and summit keynotes.
          </div>
          <div className="text-slate-400">
            Role-separated security enabled.
          </div>
        </div>
      </footer>
    </div>
  );
}
