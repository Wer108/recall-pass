import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AttendeeView } from "./components/AttendeeView";
import { AdminStudio } from "./components/AdminStudio";
import { SessionData } from "./types";
import { BookOpen, Sparkles, Shield, Clock } from "lucide-react";
import { sessionStore } from "./services/sessionStore";

export default function App() {
  const [activeTab, setActiveTab] = useState<"attendee" | "admin">("attendee");
  const [attendeeCode, setAttendeeCode] = useState<string>("");
  const [sessions, setSessions] = useState<SessionData[]>([]);

  // Fetch all sessions for Admin view and demo counter
  const fetchSessions = async () => {
    try {
      const data = await sessionStore.getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Check if URL has a ?code=RP-XXXXXX query parameter or hash
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    const hashParam = window.location.hash.replace("#", "").trim();

    if (codeParam) {
      setAttendeeCode(codeParam.toUpperCase());
      setActiveTab("attendee");
    } else if (hashParam && hashParam.startsWith("RP-")) {
      setAttendeeCode(hashParam.toUpperCase());
      setActiveTab("attendee");
    }
  }, []);

  const handleViewAttendeeSession = (code: string) => {
    setAttendeeCode(code);
    setActiveTab("attendee");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("code", code);
    window.history.replaceState({}, "", newUrl.toString());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#C98A2C]/20 selection:text-[#0F2540]">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        sessionCount={sessions.length}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === "attendee" ? (
          <AttendeeView
            initialCode={attendeeCode}
            onSelectAdmin={() => setActiveTab("admin")}
          />
        ) : (
          <AdminStudio
            onViewAttendeeSession={handleViewAttendeeSession}
            sessions={sessions}
            onRefreshSessions={fetchSessions}
          />
        )}
      </main>

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
            <span className="text-[#0F2540] font-medium">Deep Navy & Warm Amber</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-3 pt-3 border-t border-slate-100 text-center sm:text-left text-[11px] text-slate-400">
          AI-generated — verify against the original recording for critical details. Designed for lectures, workshops, guest talks, and summit keynotes.
        </div>
      </footer>
    </div>
  );
}
