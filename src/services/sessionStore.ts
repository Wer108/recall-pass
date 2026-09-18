import { validateAttendeeSession } from "../utils/validateAttendeeSession";
import { SessionData, TopicSection, QAPair, AdminAuthSession, EventTrainingProfile } from "../types";
import { SAMPLE_MEDIA_TRACKS } from "../data/sampleMediaTracks";
import { generateExpandedStudentNotes } from "../utils/studentNoteGenerator";

const STORAGE_KEY = "recallpass_sessions_v1";
const ADMIN_SESSION_KEY = "recallpass_admin_session_v1";
const ADMIN_CREDENTIALS_KEY = "recallpass_admin_cred_v1";

interface LocalAdminCreds {
  loginId: string;
  password: string;
}

function getLocalAdminCreds(): LocalAdminCreds | null {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.loginId && parsed.password) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveLocalAdminCreds(creds: LocalAdminCreds) {
  try {
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch {}
}

export function getDefaultSessions(): SessionData[] {
  const now = new Date();
  const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const expiredDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "session-cloudscale-2026",
      accessCode: "RP-CLOUD1",
      title: "Designing Resilient Distributed Systems Under High Concurrency",
      speaker: "Dr. Aris Thorne (Principal Systems Architect)",
      eventContext: "CloudScale Global Summit 2026",
      mediaType: "audio",
      trackName: "dr_thorne_systems_keynote_master.mp3",
      trackDuration: "48:15",
      trackSize: "44.2 MB",
      createdAt: now.toISOString(),
      expiresAt: twoMonthsLater.toISOString(),
      wordCount: 840,
      rawTranscriptSnippet:
        "Audio track keynote on resilient distributed architectures, circuit breakers, idempotency, and chaos engineering.",
      published: true,
      sections: [
        {
          id: "sec-1",
          title: "Introduction & Distributed Realities",
          bullets: [
            "Modern microservices face everyday operational conditions of partial failure and network latency.",
            "L. Peter Deutsch's fallacies reminder: the network is neither reliable nor infinite in bandwidth.",
            "Unconstrained synchronous chain calls accounted for over 64% of high-severity financial cloud outages.",
            "Thread pool exhaustion rapidly cascades backwards from downstream dependency hiccups.",
          ],
        },
        {
          id: "sec-2",
          title: "Circuit Breakers & Bulkhead Isolation",
          bullets: [
            "Circuit breakers monitor outbound calls over sliding windows and trip fast when errors exceed 15%.",
            "Failing fast prevents thread pool deadlock and immediately serves degraded fallbacks or cached state.",
            "Bulkheading strictly isolates resource pools so non-critical features cannot starve transactional cores.",
            "Separate dedicated worker pools for payment authorization versus recommendation queries.",
          ],
        },
        {
          id: "sec-3",
          title: "Strict Idempotency & Event Sourcing",
          bullets: [
            "Every mutating request must include a client-generated UUID idempotency key.",
            "Atomic time-to-live caching on keys prevents duplicate billing and inventory double-booking during retries.",
            "Event sourcing models domain state as an immutable append-only ledger rather than static row snapshots.",
            "Enables deterministic state replay during bug remediation and rigorous mathematical auditability.",
          ],
        },
        {
          id: "sec-4",
          title: "Observability & Proactive Chaos Engineering",
          bullets: [
            "Move beyond basic CPU/memory tracking to p99 journey latency and error budget burn rates.",
            "Resilience must be intentionally proven by breaking systems in staging and production.",
            "Regularly inject synthetic 500ms network jitter and kill container pods during peak load drills.",
          ],
        },
      ],
      qaList: [
        {
          id: "qa-1",
          question:
            "How do you handle circuit breakers in high-stakes domains (like live trading) where stale cached data is worse than an error?",
          answer:
            "In strict transactional paths, do not return stale fallback data. Return an explicit, structured business rejection error (e.g. 'MARKET_DATA_TRANSIENT_UNAVAILABLE') so trading algorithms never execute blindly.",
          askerContext: "Marcus (Audience)",
        },
        {
          id: "qa-2",
          question:
            "Where do you recommend storing idempotency tokens in high-throughput systems without creating a bottleneck?",
          answer:
            "Use a multi-zone distributed in-memory key-value cluster (like Redis Cluster) with atomic SETNX and a strict 24-hour expiration window. This keeps memory bounded and latency sub-millisecond.",
          askerContext: "Sarah (Audience)",
        },
        {
          id: "qa-3",
          question:
            "What is the most effective first step for a legacy team with high resistance to chaos engineering?",
          answer:
            "Start in CI or staging with proxy blackhole tests against external vendors (e.g., adding 3-second latency to a payment API) to show actual uncaught failure modes safely before touching production.",
          askerContext: "David (Audience)",
        },
      ],
      isExpired: false,
    },
    {
      id: "session-expired-demo",
      accessCode: "RP-EXPIRE",
      title: "Advanced Cognitive Architecture & Long-Term Memory Retrieval",
      speaker: "Prof. Elena Rostova",
      eventContext: "Pedagogy Summit 2026",
      mediaType: "video",
      trackName: "elena_rostova_memory_retrieval_session.mp4",
      trackDuration: "42:30",
      trackSize: "210.8 MB",
      createdAt: oneMonthAgo.toISOString(),
      expiresAt: expiredDate.toISOString(),
      wordCount: 620,
      rawTranscriptSnippet:
        "Workshop video track on the testing effect, spaced retrieval practice, and desirable difficulties.",
      published: true,
      sections: [
        {
          id: "sec-e1",
          title: "The Fluency Illusion",
          bullets: [
            "Rereading and highlighting create familiarity mistaken for deep comprehension.",
            "True learning requires effortful neural retrieval practice.",
          ],
        },
      ],
      qaList: [
        {
          id: "qa-e1",
          question:
            "How should students deal with emotional frustration during failed retrieval attempts?",
          answer:
            "Reframe errors as the neuroplasticity window: prediction errors maximize dopamine-mediated consolidation upon seeing the correction.",
          askerContext: "Student (Audience)",
        },
      ],
      isExpired: true,
    },
  ];
}

function getLocalSessions(): SessionData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s) => ({
          ...s,
          isExpired: new Date(s.expiresAt) <= new Date(),
        }));
      }
    }
  } catch (err) {
    console.warn("Could not read sessions from localStorage:", err);
  }
  const defaults = getDefaultSessions();
  saveLocalSessions(defaults);
  return defaults;
}

function saveLocalSessions(sessions: SessionData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("Could not save sessions to localStorage:", err);
  }
}

// Safely parse JSON from a response, handling non-JSON (text/plain, text/html) or empty responses gracefully
async function tryParseJson(res: Response): Promise<any> {
  let rawText = "";
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    throw new Error(`Failed to read response: ${readErr?.message || "Connection error"}`);
  }

  if (!rawText || rawText.trim() === "") {
    if (res.ok) return {};
    throw new Error(`Server returned status ${res.status} (${res.statusText || "Empty response"})`);
  }

  // Attempt JSON parsing directly regardless of headers (many proxies or misconfigured headers still return valid JSON strings)
  try {
    return JSON.parse(rawText);
  } catch {
    // If not valid JSON:
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 240);
    if (!res.ok) {
      throw new Error(cleanSnippet || `Server error (${res.status} ${res.statusText || "Request failed"})`);
    }
    // If res.ok was true but body was plain text
    return { text: rawText, message: cleanSnippet };
  }
}

// Check if the remote server/API is unavailable (e.g. running on static hosting like Vercel CDN or GitHub Pages)
function isServerUnavailable(res?: Response, err?: any): boolean {
  if (res && [404, 405, 501, 502, 503, 504].includes(res.status)) {
    return true;
  }
  if (err) {
    const msg = (err.message || "").toLowerCase();
    if (
      msg.includes("405") ||
      msg.includes("404") ||
      msg.includes("empty response") ||
      msg.includes("method not allowed") ||
      msg.includes("not found") ||
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("connection") ||
      msg.includes("load failed") ||
      msg.includes("server error (50")
    ) {
      return true;
    }
  }
  return false;
}

export const sessionStore = {
  // Fetch all sessions (tries server first, falls back to local storage)
  async getSessions(): Promise<SessionData[]> {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await tryParseJson(res);
        if (Array.isArray(data)) {
          // Sync with local storage for offline use
          saveLocalSessions(data);
          return data;
        }
      }
    } catch (err) {
      // Backend not present (e.g. GitHub Pages static hosting)
      console.info("Using client-side session store (static host):", err);
    }
    return getLocalSessions();
  },

  // Fetch a single session by code
  async getSessionByCode(code: string): Promise<SessionData> {
    const enteredCode = code.trim().toUpperCase();
    if (!enteredCode) throw new Error("Please enter your pass ID.");
    const cleanCode = /^(?:[A-Z0-9]{6}|[A-Z0-9]{10})$/.test(enteredCode) ? `RP-${enteredCode}` : enteredCode;
    let res: Response | undefined;
    let data: any;
    try {
      res = await fetch(`/api/sessions/${encodeURIComponent(cleanCode)}`);
      data = await res.json();
    } catch {
      // Static hosts may return the app HTML instead of a session API.
    }

    if (res?.ok && data?.accessCode === cleanCode) {
      return validateAttendeeSession(data);
    }
    if (res && !res.ok && data?.error) {
      throw new Error(data.error);
    }

    const found = getLocalSessions().find(
      (s) => typeof s?.accessCode === "string" && s.accessCode.toUpperCase() === cleanCode && s.published
    );
    if (found) {
      return validateAttendeeSession(found);
    }
    throw new Error("Unable to verify this pass ID. The session service is unavailable; please try again or contact your organizer.");
  },

  // Create & publish session
  async createSession(payload: {
    title: string;
    speaker?: string;
    eventContext?: string;
    mediaType?: "audio" | "video" | "url" | "youtube";
    trackName?: string;
    trackDuration?: string;
    trackSize?: string;
    mediaPreviewUrl?: string;
    mediaUrl?: string;
    youtubeId?: string;
    isLiveEventSession?: boolean;
    sections: TopicSection[];
    qaList: QAPair[];
  }): Promise<SessionData> {
    let res: Response;
    let data: any;
    try {
      res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
    } catch {
      throw new Error("Unable to publish: the session service is unavailable. Please try again when the server is connected.");
    }
    if (!res.ok) throw new Error(data?.error || "Failed to publish session.");
    if (!data?.accessCode || !Array.isArray(data.sections) || !Array.isArray(data.qaList)) {
      throw new Error("Unable to publish: the server did not return a valid pass ID.");
    }
    const local = getLocalSessions();
    saveLocalSessions([data, ...local.filter((s) => s.accessCode !== data.accessCode)]);
    return data;
  },

  // Toggle expired state
  async toggleExpired(code: string): Promise<SessionData> {
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(code)}/toggle-expired`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await tryParseJson(res);
        const local = getLocalSessions();
        saveLocalSessions(local.map((s) => (s.accessCode === code ? updated : s)));
        return updated;
      }
    } catch {
      // Fallback
    }

    const local = getLocalSessions();
    let found = local.find((s) => s.accessCode === code);
    if (!found) throw new Error("Session not found");

    const isCurrentlyExpired = new Date(found.expiresAt) <= new Date();
    const now = new Date();
    const updated: SessionData = {
      ...found,
      expiresAt: isCurrentlyExpired
        ? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: !isCurrentlyExpired,
    };

    saveLocalSessions(local.map((s) => (s.accessCode === code ? updated : s)));
    return updated;
  },

  // Delete session
  async deleteSession(code: string): Promise<void> {
    try {
      await fetch(`/api/sessions/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
    } catch {
      // Fallback
    }
    const local = getLocalSessions();
    saveLocalSessions(local.filter((s) => s.accessCode !== code));
  },

  // Process media track (tries server first, falls back to client acoustic engine)
  async processMedia(payload: any): Promise<{
    sections: TopicSection[];
    qaList: QAPair[];
    isFallback?: boolean;
    trackInfo?: any;
  }> {
    try {
      const res = await fetch("/api/process-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await tryParseJson(res);
        return data;
      }
    } catch (err) {
      console.info("Server /api/process-media not available; using client acoustic stream engine:", err);
    }

    // Client-side extraction engine for static GitHub Pages hosting
    const sample = SAMPLE_MEDIA_TRACKS.find(
      (t) => t.id === payload.sampleTrackId || t.trackName === payload.trackName
    );

    if (sample) {
      // Parse sample transcript groundings
      const transcript = sample.groundingAudioTranscript;
      return parseClientTranscript(transcript, payload.title || sample.title, payload.speaker || sample.speaker);
    }

    // Dynamic, topic-specific expanded student note engine
    const isYouTube =
      payload.mediaType === "youtube" ||
      Boolean(payload.youtubeId) ||
      Boolean(payload.mediaUrl && /(?:youtu\.be\/|youtube\.com)/.test(payload.mediaUrl));

    const expandedResult = generateExpandedStudentNotes({
      title: payload.title,
      speaker: payload.speaker,
      eventContext: payload.eventContext,
      mediaType: isYouTube ? "youtube" : payload.mediaType || "audio",
      trainingProfile: payload.trainingProfile,
      lectureNotesOrTranscript: payload.lectureNotesOrTranscript || payload.liveTranscript || payload.transcriptFallback,
      youtubeId: payload.youtubeId,
      mediaUrl: payload.mediaUrl,
      trackName: payload.trackName,
    });

    return {
      sections: expandedResult.sections,
      qaList: expandedResult.qaList,
      isFallback: true,
      trackInfo: {
        mediaType: isYouTube ? "youtube" : payload.mediaType || "audio",
        trackName: payload.trackName || "session_track",
        trackDuration: payload.trackDuration || "Recorded Session",
        mediaUrl: payload.mediaUrl || undefined,
        youtubeId: payload.youtubeId || undefined,
      },
    };
  },

  // Get active admin auth session
  getAdminSession(): AdminAuthSession | null {
    try {
      const sess = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
      if (!sess) return null;
      const parsed = JSON.parse(sess);
      if (parsed && parsed.role === "admin" && parsed.adminId) {
        return parsed as AdminAuthSession;
      }
    } catch {}
    return null;
  },

  // Check if admin is configured
  async getAdminStatus(): Promise<{ isConfigured: boolean; loginId: string | null }> {
    try {
      const res = await fetch("/api/admin/status");
      if (res.ok) {
        const data = await tryParseJson(res);
        return {
          isConfigured: Boolean(data.isConfigured),
          loginId: data.loginId || null,
        };
      }
    } catch {}
    const local = getLocalAdminCreds();
    return {
      isConfigured: Boolean(local && local.loginId && local.password),
      loginId: local?.loginId || null,
    };
  },

  // Setup initial admin credentials (no default credentials)
  async setupAdmin(loginId: string, password: string): Promise<AdminAuthSession> {
    const cleanId = loginId.trim();
    const cleanPw = password.trim();

    if (!cleanId || cleanId.length < 3) {
      throw new Error("Admin Login ID must be at least 3 characters long.");
    }
    if (!cleanPw || cleanPw.length < 6) {
      throw new Error("Admin Password must be at least 6 characters long.");
    }

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: cleanId, password: cleanPw }),
      });

      if (res.ok) {
        const data = await tryParseJson(res);
        saveLocalAdminCreds({ loginId: cleanId, password: cleanPw });
        const session: AdminAuthSession = {
          adminId: data.adminId || cleanId,
          token: data.token || `rp_admin_${Date.now()}`,
          loginTime: data.loginTime || new Date().toISOString(),
          role: "admin",
        };
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        } catch {}
        return session;
      }

      // If server returned 404, 405 (static host like Vercel CDN), or gateway error:
      if (isServerUnavailable(res)) {
        return this.fallbackSetupAdmin(cleanId, cleanPw);
      }

      let errObj: any = {};
      try {
        errObj = await tryParseJson(res);
      } catch (parseErr: any) {
        if (isServerUnavailable(undefined, parseErr)) {
          return this.fallbackSetupAdmin(cleanId, cleanPw);
        }
      }
      throw new Error(errObj.error || errObj.message || "Failed to set up admin account.");
    } catch (err: any) {
      if (isServerUnavailable(undefined, err)) {
        return this.fallbackSetupAdmin(cleanId, cleanPw);
      }
      throw err;
    }
  },

  fallbackSetupAdmin(cleanId: string, cleanPw: string): AdminAuthSession {
    saveLocalAdminCreds({ loginId: cleanId, password: cleanPw });
    const session: AdminAuthSession = {
      adminId: cleanId,
      token: `rp_local_${Date.now()}`,
      loginTime: new Date().toISOString(),
      role: "admin",
    };
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } catch {}
    return session;
  },

  // Admin login with ID and password
  async loginAdmin(loginId: string, password: string): Promise<AdminAuthSession> {
    const cleanId = loginId.trim();
    const cleanPw = password.trim();

    if (!cleanId || !cleanPw) {
      throw new Error("Admin Login ID and Password are required.");
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: cleanId, password: cleanPw }),
      });

      if (res.ok) {
        const data = await tryParseJson(res);
        const session: AdminAuthSession = {
          adminId: data.adminId || cleanId,
          token: data.token || `rp_admin_${Date.now()}`,
          loginTime: data.loginTime || new Date().toISOString(),
          role: "admin",
        };
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        } catch {}
        return session;
      }

      if (isServerUnavailable(res)) {
        return this.fallbackLoginAdmin(cleanId, cleanPw);
      }

      let errObj: any = {};
      try {
        errObj = await tryParseJson(res);
      } catch (parseErr: any) {
        if (isServerUnavailable(undefined, parseErr)) {
          return this.fallbackLoginAdmin(cleanId, cleanPw);
        }
      }
      throw new Error(errObj.error || errObj.message || "Invalid Admin Login ID or Password.");
    } catch (err: any) {
      if (isServerUnavailable(undefined, err)) {
        return this.fallbackLoginAdmin(cleanId, cleanPw);
      }
      throw err;
    }
  },

  fallbackLoginAdmin(cleanId: string, cleanPw: string): AdminAuthSession {
    const creds = getLocalAdminCreds();
    if (!creds || !creds.loginId || !creds.password) {
      throw new Error("No admin account configured yet. Please register your Admin Login ID and Password.");
    }

    const idMatches = cleanId.toLowerCase() === creds.loginId.toLowerCase();
    const pwMatches = cleanPw === creds.password;

    if (idMatches && pwMatches) {
      const session: AdminAuthSession = {
        adminId: creds.loginId,
        token: `rp_local_${Date.now()}`,
        loginTime: new Date().toISOString(),
        role: "admin",
      };
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      } catch {}
      return session;
    }
    throw new Error("Invalid Admin credentials. Attendees cannot access this studio. Check Login ID and Password.");
  },

  // Admin logout
  async logoutAdmin(): Promise<void> {
    try {
      const sess = this.getAdminSession();
      if (sess?.token) {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${sess.token}` },
        });
      }
    } catch {}
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
  },

  // Change Admin Credentials
  async changeAdminCredentials(
    currentPassword: string,
    newLoginId: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string; adminId?: string }> {
    try {
      const sess = this.getAdminSession();
      const res = await fetch("/api/admin/change-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sess?.token ? { Authorization: `Bearer ${sess.token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newLoginId, newPassword }),
      });

      if (res.ok) {
        const data = await tryParseJson(res);
        saveLocalAdminCreds({ loginId: newLoginId.trim(), password: newPassword.trim() });
        if (sess) {
          sess.adminId = newLoginId.trim();
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
        }
        return data;
      }

      if (isServerUnavailable(res)) {
        return this.fallbackChangeAdminCredentials(currentPassword, newLoginId, newPassword);
      }

      let errObj: any = {};
      try {
        errObj = await tryParseJson(res);
      } catch (parseErr: any) {
        if (isServerUnavailable(undefined, parseErr)) {
          return this.fallbackChangeAdminCredentials(currentPassword, newLoginId, newPassword);
        }
      }
      throw new Error(errObj.error || errObj.message || "Failed to update admin credentials.");
    } catch (err: any) {
      if (isServerUnavailable(undefined, err)) {
        return this.fallbackChangeAdminCredentials(currentPassword, newLoginId, newPassword);
      }
      throw err;
    }
  },

  fallbackChangeAdminCredentials(currentPassword: string, newLoginId: string, newPassword: string) {
    const creds = getLocalAdminCreds();
    if (currentPassword.trim() !== creds.password) {
      throw new Error("Current admin password does not match.");
    }
    if (newLoginId.trim().length < 3) {
      throw new Error("New Admin ID must be at least 3 characters.");
    }
    if (newPassword.trim().length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    saveLocalAdminCreds({ loginId: newLoginId.trim(), password: newPassword.trim() });
    const sess = this.getAdminSession();
    if (sess) {
      sess.adminId = newLoginId.trim();
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
    }
    return { success: true, message: "Admin credentials successfully updated.", adminId: newLoginId.trim() };
  },

  // Event Training Profile persistence
  getEventTrainingProfile(): EventTrainingProfile {
    try {
      const stored = localStorage.getItem("recallpass_event_training_profile");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      domain: "Cloud Infrastructure & Distributed Systems",
      customTerms: ["Microservices", "Circuit Breaker", "Bulkheading", "Idempotency", "Redis Cluster", "RPC", "Latency p99"],
      speakerContext: "Principal Systems Architect explaining resilient high-concurrency cloud patterns",
      qaFormatPrompt: "Audience Q&A at aisle microphones focusing on production outages and database tradeoffs",
      targetCadence: "realtime",
      notesFocus: "technical",
      isLiveTrained: true,
    };
  },

  saveEventTrainingProfile(profile: EventTrainingProfile): void {
    try {
      localStorage.setItem("recallpass_event_training_profile", JSON.stringify(profile));
    } catch {}
  },
};

function parseClientTranscript(
  text: string,
  title: string,
  speaker: string
): { sections: TopicSection[]; qaList: QAPair[]; isFallback: boolean } {
  const sections: TopicSection[] = [];
  const qaList: QAPair[] = [];

  const qaSplit = text.search(/\[(?:\d{2}:\d{2}\s*-\s*)?(?:Audience\s+)?Q&A(?:\s+Session)?\]/i);
  let mainText = text;
  let qaText = "";

  if (qaSplit !== -1) {
    mainText = text.slice(0, qaSplit);
    qaText = text.slice(qaSplit);
  }

  // Extract Q&A
  if (qaText) {
    const qaRegex = /([A-Za-z0-9\s]+(?:\([A-Za-z\s]+\))?):\s*([^]+?)(?=\n[A-Za-z0-9\s]+(?:\([A-Za-z\s]+\))?:|$)/g;
    let match;
    const turns: { speaker: string; text: string }[] = [];
    while ((match = qaRegex.exec(qaText)) !== null) {
      turns.push({ speaker: match[1].trim(), text: match[2].trim() });
    }

    for (let i = 0; i < turns.length - 1; i++) {
      const cur = turns[i];
      const nxt = turns[i + 1];
      const isQ = cur.text.includes("?") || /^(how|what|why|where|when|can|does|is|are)/i.test(cur.text);
      const isAud = /audience|student|attendee|tutor|marcus|sarah|david/i.test(cur.speaker);
      if (isQ && isAud) {
        qaList.push({
          id: `qa-cl-${Date.now()}-${qaList.length}`,
          question: cur.text,
          answer: nxt.text,
          askerContext: cur.speaker,
        });
        i++;
      }
    }
  }

  // Chunks
  const chunks = mainText.split(/\n(?=\[(?:\d{2}:\d{2}\s*-\s*)?[^\]]+\])/);
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx].trim();
    if (!chunk) continue;
    let secTitle = `Topic ${idx + 1}`;
    let secBody = chunk;

    const tMatch = chunk.match(/^\[(?:\d{2}:\d{2}\s*-\s*)?([^\]]+)\]\s*\n?([\s\S]*)$/);
    if (tMatch) {
      secTitle = tMatch[1].replace(/^(Core Concept|Architectural Patterns|Implementation Strategy|Pedagogical Practice):\s*/i, "").trim();
      secBody = tMatch[2].trim();
    }

    const sentences = secBody
      .replace(/\[\d{2}:\d{2}[^\]]*\]/g, "")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !/^(good morning|welcome|thank you|hello everyone)/i.test(s));

    if (sentences.length > 0) {
      sections.push({
        id: `sec-cl-${Date.now()}-${idx}`,
        title: secTitle,
        bullets: sentences.slice(0, 5),
      });
    }
  }

  if (sections.length === 0) {
    sections.push({
      id: `sec-cl-${Date.now()}-0`,
      title: `${title} — Core Highlights`,
      bullets: [
        `Summary of session presented by ${speaker}.`,
        "Key takeaways extracted directly from acoustic dialogue stream.",
      ],
    });
  }

  return { sections, qaList, isFallback: true };
}
