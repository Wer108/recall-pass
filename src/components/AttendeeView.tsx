import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Share2,
  Printer,
  Check,
  Clock,
  Sparkles,
  Filter,
  RefreshCw,
  Music,
  Video,
  Youtube,
  Play,
  Volume2,
  Copy,
  BookOpen,
  Headphones,
  GitBranch,
  BarChart3,
} from "lucide-react";
import { SessionQuiz } from "./SessionQuiz";
import { AudioRecap } from "./AudioRecap";
import { SessionMindMap } from "./SessionMindMap";
import { LearningAnalytics } from "./LearningAnalytics";
import { SessionData } from "../types";
import { NotesSection } from "./NotesSection";
import { QASection } from "./QASection";
import { PremiumExpiredCard } from "./PremiumExpiredCard";
import { validateAttendeeSession } from "../utils/validateAttendeeSession";
import { sessionStore } from "../services/sessionStore";

interface AttendeeViewProps {
  initialCode?: string;
  onSelectAdmin?: () => void;
}

type AttendeeSpace = "notes" | "audio" | "mind-map" | "analytics";
const attendeeSpaces: Array<{ id: AttendeeSpace; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "notes", label: "Notes & quiz", description: "Study the source", icon: BookOpen },
  { id: "audio", label: "Audio recap", description: "Listen on the go", icon: Headphones },
  { id: "mind-map", label: "Mind map", description: "Connect ideas", icon: GitBranch },
  { id: "analytics", label: "My progress", description: "See learning signals", icon: BarChart3 },
];
function readSpace(): AttendeeSpace {
  if (typeof window === "undefined") return "notes";
  const value = new URLSearchParams(window.location.search).get("space");
  return attendeeSpaces.some(space => space.id === value) ? value as AttendeeSpace : "notes";
}

export const AttendeeView: React.FC<AttendeeViewProps> = ({
  initialCode = "",
  onSelectAdmin,
}) => {
  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "notes" | "qa">("all");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showSourceMedia, setShowSourceMedia] = useState(false);
  const [attendeeSpace, setAttendeeSpace] = useState<AttendeeSpace>(readSpace);

  const requestId = useRef(0);

  const fetchSession = async (codeToFetch: string, navigate = false) => {
    const cleanCode = codeToFetch.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter the pass ID provided by your organizer.");
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const data = await sessionStore.getSessionByCode(cleanCode);
      if (id !== requestId.current) return;
      setSession(validateAttendeeSession(data));
      setInputCode(data.accessCode);
      setSearchQuery("");
      setActiveFilter("all");

      setShowSourceMedia(false);
      // Dedicated details route; preserve legacy shared pass links.
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("code", data.accessCode);
      newUrl.searchParams.set("page", "session");
      if (navigate) newUrl.searchParams.delete("space");
      newUrl.hash = "";
      if (navigate) {
        setAttendeeSpace("notes");
        window.history.pushState({}, "", newUrl.toString());
      }
      else window.history.replaceState({}, "", newUrl.toString());
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      if (id !== requestId.current) return;
      console.error("Attendee fetch error:", err);
      setError(err.message || "Unable to retrieve session. Please check the code.");
      setSession(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchSession(initialCode);
    }
  }, [initialCode]);

  const resetSession = () => {
    requestId.current++;
    setSession(null); setInputCode(""); setError(null); setLoading(false);
  };

  useEffect(() => {
    const onBack = () => {
      if (!new URLSearchParams(window.location.search).get("code") && !window.location.hash.toLowerCase().startsWith("#rp-")) resetSession();
      else setAttendeeSpace(readSpace());
    };
    window.addEventListener("popstate", onBack);
    window.addEventListener("hashchange", onBack);
    return () => { requestId.current++; window.removeEventListener("popstate", onBack); window.removeEventListener("hashchange", onBack); };
  }, []);

  const backToPass = () => {
    resetSession();
    const url = new URL(window.location.href);
    url.searchParams.delete("code"); url.searchParams.delete("page"); url.searchParams.delete("view"); url.searchParams.delete("space"); url.hash = "attendee";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSession(inputCode, true);
  };

  const handleCopyFullSession = () => {
    if (!session) return;
    let fullText = `${session.title}\n`;
    if (session.speaker) fullText += `Speaker: ${session.speaker}\n`;
    if (session.eventContext) fullText += `Event: ${session.eventContext}\n`;
    fullText += `Access Code: ${session.accessCode}\n`;
    fullText += `AI Disclaimer: AI-generated — verify against the original recording for critical details.\n\n`;

    fullText += `=== TOPIC-SEGMENTED NOTES ===\n\n`;
    session.sections.forEach((sec, idx) => {
      fullText += `${idx + 1}. ${sec.title}\n`;
      sec.bullets.forEach((b) => {
        fullText += `  • ${b}\n`;
      });
      fullText += "\n";
    });

    if (session.qaList.length > 0) {
      fullText += `=== AUDIENCE & SPEAKER Q&A ===\n\n`;
      session.qaList.forEach((qa, idx) => {
        fullText += `Q${idx + 1} [${qa.askerContext || "Audience"}]: ${qa.question}\n`;
        fullText += `A: ${qa.answer}\n\n`;
      });
    }

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyPass = async () => {
    if (!session) return;
    await navigator.clipboard.writeText(session.accessCode);
    setCopiedPass(true);
    window.setTimeout(() => setCopiedPass(false), 2000);
  };

  const openSpace = (space: AttendeeSpace, targetId?: string) => {
    setAttendeeSpace(space);
    const url = new URL(window.location.href);
    if (space === "notes") url.searchParams.delete("space");
    else url.searchParams.set("space", space);
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (targetId) window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleToggleExpiryForTesting = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const updated = await sessionStore.toggleExpired(session.accessCode);
      setSession(validateAttendeeSession(updated));
    } catch (err) {
      console.error("Failed to toggle expiry:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = session?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(session.expiresAt).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div id="attendee-view-wrapper" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Code Lookup Bar */}
      {!session && <section
        id="code-lookup-section"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7"
      >
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0F2540] text-xs font-semibold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5 text-[#C98A2C]" />
            <span>Attendee Instant Access</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2540] tracking-tight">
            Retrieve Live Session Notes
          </h1>
          <p className="text-slate-600 text-sm">
            Enter the pass ID provided by your session speaker or event organizer. No account required.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="attendee-code-input"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Enter your pass ID"
                aria-label="Pass ID"
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3 text-base font-mono font-semibold uppercase tracking-wider text-[#0F2540] bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F2540] focus:border-transparent transition-all"
              />
            </div>

            <button
              id="btn-submit-code"
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-[#0F2540] hover:bg-[#17375E] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Access Notes</span>
                  <ArrowRight className="w-4 h-4 text-[#C98A2C]" />
                </>
              )}
            </button>
          </div>

        </form>

        {error && (
          <div
            id="attendee-error-banner"
            className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 max-w-xl mx-auto"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Unable to find session:</span> {error}
            </div>
          </div>
        )}
      </section>}

      {/* Session Content or Expired Upgrade State */}
      {session && (
        <div id="session-display-area" className="space-y-6">
          <button onClick={backToPass} className="text-sm font-semibold text-[#0F2540] hover:underline">← Enter another pass ID</button>
          {session.isExpired ? (
            /* Expired Pass: Show Upgrade to Premium instead of content */
            <PremiumExpiredCard
              session={session}
              onResetCode={backToPass}
              onReactivateForTesting={handleToggleExpiryForTesting}
            />
          ) : (
            /* Active Pass: Show Full Recall Notes & Q&A */
            <div className="space-y-6">
              <nav aria-label="Attendee learning spaces" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs lg:grid-cols-4">
                {attendeeSpaces.map(space => {
                  const Icon = space.icon;
                  const active = attendeeSpace === space.id;
                  return <button key={space.id} type="button" onClick={() => openSpace(space.id)} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-3 text-left transition-colors ${active ? "bg-[#0F2540] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-[#0F2540]"}`}>
                    <span className="flex items-center gap-2 text-sm font-bold"><Icon className={`h-4 w-4 ${active ? "text-[#E8BF78]" : "text-[#0F6E56]"}`} />{space.label}</span>
                    <span className={`mt-1 block pl-6 text-[11px] ${active ? "text-slate-300" : "text-slate-400"}`}>{space.description}</span>
                  </button>;
                })}
              </nav>
              {/* Session Meta Header Card */}
              <div
                id="session-meta-card"
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0F2540] text-white">
                        {session.accessCode}
                      </span>
                      <button
                        id="btn-copy-attendee-pass"
                        type="button"
                        onClick={handleCopyPass}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 hover:border-[#0F2540] hover:text-[#0F2540]"
                        aria-label={`Copy pass ID ${session.accessCode}`}
                      >
                        {copiedPass ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedPass ? "Copied" : "Copy"}</span>
                      </button>
                      {session.mediaType && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            session.mediaType === "youtube" || session.youtubeId
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : session.mediaType === "video"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-amber-50 text-[#C98A2C] border border-amber-200"
                          }`}
                        >
                          {session.mediaType === "youtube" || session.youtubeId ? (
                            <Youtube className="w-3 h-3 text-rose-600" />
                          ) : session.mediaType === "video" ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <Music className="w-3 h-3" />
                          )}
                          <span>
                            {session.mediaType === "youtube" || session.youtubeId
                              ? "YouTube Video Source"
                              : `${session.mediaType} Track`}
                          </span>
                          {session.trackDuration && (
                            <span className="text-[10px] font-mono">({session.trackDuration})</span>
                          )}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Valid for {daysRemaining} more days</span>
                      </span>
                      {session.eventContext && (
                        <span className="text-xs text-slate-500 font-medium">
                          • {session.eventContext}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2540] tracking-tight leading-snug">
                      {session.title}
                    </h1>

                    {session.speaker && (
                      <p className="text-sm font-medium text-slate-600">
                        Presented by{" "}
                        <span className="text-[#0F2540] font-semibold">
                          {session.speaker}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-copy-full-session"
                      onClick={handleCopyFullSession}
                      className="text-xs font-semibold text-slate-700 hover:text-[#0F2540] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copiedAll ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied Brief</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy All Notes</span>
                        </>
                      )}
                    </button>

                    <button
                      id="btn-print-session"
                      onClick={() => window.print()}
                      className="text-xs font-semibold text-slate-700 hover:text-[#0F2540] bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Developer / Demo convenience to toggle expiry */}
                    <button
                      id="btn-toggle-expiry-demo"
                      onClick={handleToggleExpiryForTesting}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Simulate expiration to view the required Upgrade to Premium screen"
                    >
                      Test Expiry
                    </button>
                  </div>
                </div>

                {/* Mandatory AI Transparency Disclaimer & Media Player Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-l-4 border-[#C98A2C] rounded-r-lg p-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#C98A2C] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        AI-generated — verify against the original recording for critical details.
                      </span>{" "}
                      Extracted from the ingested {session.mediaType === "youtube" ? "YouTube video" : "audio/video track"}.
                    </div>
                  </div>

                  {(session.youtubeId || session.mediaUrl) && (
                    <button
                      type="button"
                      id="btn-toggle-attendee-source-media"
                      onClick={() => setShowSourceMedia(!showSourceMedia)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      {session.youtubeId ? (
                        <Youtube className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>
                        {showSourceMedia ? "Hide Source Media" : `Play Source ${session.youtubeId ? "Video" : "Audio"}`}
                      </span>
                    </button>
                  )}
                </div>

                {/* Collapsible Source Media Player */}
                {showSourceMedia && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {session.youtubeId ? (
                          <Youtube className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Music className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-xs font-bold">
                          Original {session.youtubeId ? "YouTube Lecture Feed" : "Audio Recording"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {session.trackDuration || "Full Track"}
                      </span>
                    </div>

                    {session.youtubeId ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${session.youtubeId}?rel=0&modestbranding=1`}
                          title={session.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    ) : session.mediaUrl ? (
                      <audio src={session.mediaUrl} controls className="w-full" />
                    ) : null}
                  </div>
                )}

                {/* Filter and In-Session Search Controls */}
                {attendeeSpace === "notes" && <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Segmented Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                    <button
                      id="filter-tab-all"
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                        activeFilter === "all"
                          ? "bg-white text-[#0F2540] shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Full Brief ({session.sections.length + session.qaList.length})
                    </button>
                    <button
                      id="filter-tab-notes"
                      onClick={() => setActiveFilter("notes")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                        activeFilter === "notes"
                          ? "bg-white text-[#0F2540] shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Topic Notes ({session.sections.length})
                    </button>
                    <button
                      id="filter-tab-qa"
                      onClick={() => setActiveFilter("qa")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                        activeFilter === "qa"
                          ? "bg-[#0F6E56] text-white shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Live Q&A ({session.qaList.length})
                    </button>
                  </div>

                  {/* Search within session */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      id="session-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search points & Q&A..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0F2540]"
                    />
                  </div>
                </div>}
              </div>

              {/* Render Topic Notes */}
              {attendeeSpace === "notes" && (activeFilter === "all" || activeFilter === "notes") && (
                <NotesSection
                  sections={session.sections}
                  searchQuery={searchQuery}
                  isEditable={false}
                />
              )}

              {/* Render Real Audience Q&A */}
              {attendeeSpace === "notes" && (activeFilter === "all" || activeFilter === "qa") && (
                <QASection
                  qaList={session.qaList}
                  searchQuery={searchQuery}
                  isEditable={false}
                />
              )}
              {attendeeSpace === "notes" && <SessionQuiz key={session.accessCode} session={session} onReviewTopic={(index) => {
                setActiveFilter("all"); setSearchQuery("");
                requestAnimationFrame(() => document.getElementById(`note-card-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }} />}
              {attendeeSpace === "audio" && <AudioRecap session={session} />}
              {attendeeSpace === "mind-map" && <SessionMindMap session={session} />}
              {attendeeSpace === "analytics" && <LearningAnalytics session={session} onStartPractice={() => openSpace("notes", "session-quiz")} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
