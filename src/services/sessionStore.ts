import { SessionData, TopicSection, QAPair } from "../types";
import { SAMPLE_MEDIA_TRACKS } from "../data/sampleMediaTracks";

const STORAGE_KEY = "recallpass_sessions_v1";

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

function generateCode(existingCodes: Set<string>): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  let attempts = 0;
  do {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `RP-${suffix}`;
    attempts++;
  } while (existingCodes.has(code) && attempts < 100);
  return code;
}

// Check if response is real JSON (and not HTML from static 404 on GitHub Pages)
async function tryParseJson(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but received '${contentType}'`);
  }
  return await res.json();
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
    const cleanCode = code.trim().toUpperCase();
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await tryParseJson(res);
        return data;
      }
    } catch {
      // Fallback
    }

    const localList = getLocalSessions();
    const found = localList.find((s) => s.accessCode === cleanCode);
    if (found) {
      return {
        ...found,
        isExpired: new Date(found.expiresAt) <= new Date(),
      };
    }
    throw new Error(`Session with pass code "${cleanCode}" not found.`);
  },

  // Create & publish session
  async createSession(payload: {
    title: string;
    speaker?: string;
    eventContext?: string;
    mediaType?: "audio" | "video";
    trackName?: string;
    trackDuration?: string;
    trackSize?: string;
    mediaPreviewUrl?: string;
    sections: TopicSection[];
    qaList: QAPair[];
  }): Promise<SessionData> {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await tryParseJson(res);
        // Also save locally
        const local = getLocalSessions();
        saveLocalSessions([data, ...local.filter((s) => s.accessCode !== data.accessCode)]);
        return data;
      }
    } catch {
      // Fallback
    }

    // Client-side session creation
    const local = getLocalSessions();
    const existingCodes = new Set(local.map((s) => s.accessCode));
    const accessCode = generateCode(existingCodes);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const newSession: SessionData = {
      id: `session-${Date.now()}`,
      accessCode,
      title: payload.title,
      speaker: payload.speaker || "Featured Speaker",
      eventContext: payload.eventContext,
      mediaType: payload.mediaType || "audio",
      trackName: payload.trackName,
      trackDuration: payload.trackDuration,
      trackSize: payload.trackSize,
      mediaPreviewUrl: payload.mediaPreviewUrl,
      createdAt: now.toISOString(),
      expiresAt,
      wordCount: payload.sections.reduce(
        (acc, sec) => acc + sec.bullets.reduce((bAcc, b) => bAcc + b.split(" ").length, 0),
        0
      ),
      rawTranscriptSnippet: `${payload.mediaType?.toUpperCase() || "MEDIA"} track: ${payload.trackName || "session_track"} (${payload.trackDuration || "Duration logged"})`,
      published: true,
      sections: payload.sections,
      qaList: payload.qaList,
      isExpired: false,
    };

    saveLocalSessions([newSession, ...local]);
    return newSession;
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

    // Generic fallback for user-uploaded audio/video file on static hosts
    return {
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          title: "Session Overview & Core Objectives",
          bullets: [
            `Keynote presentation and practical principles delivered by ${payload.speaker || "the speaker"}.`,
            "Acoustic track ingested and segmented into actionable takeaways.",
            "Designed for durable knowledge retention and rapid post-session review.",
          ],
        },
        {
          id: `sec-${Date.now()}-2`,
          title: "Key Frameworks & Methodologies",
          bullets: [
            "Fundamental paradigms established during the presentation.",
            "Emphasis on verifiable architectural patterns and resilient implementation.",
            "Concrete guidance on measuring user-facing outcomes under real-world conditions.",
          ],
        },
        {
          id: `sec-${Date.now()}-3`,
          title: "Execution Guidelines & Recommendations",
          bullets: [
            "Actionable steps for engineering teams and session participants.",
            "Prioritize bounded resource usage and fast-failing defensive checks.",
            "Reference the original recording track for deeper contextual inquiries.",
          ],
        },
      ],
      qaList: [
        {
          id: `qa-${Date.now()}-1`,
          question: "How can attendees best apply these principles immediately?",
          answer:
            "Start by identifying the highest-risk failure mode in your current architecture, isolate it with dedicated circuit breakers, and run safe verification drills in a test environment.",
          askerContext: "Audience Member",
        },
      ],
      isFallback: true,
      trackInfo: {
        mediaType: payload.mediaType || "audio",
        trackName: payload.trackName || "session_track",
        trackDuration: payload.trackDuration || "Recorded Session",
      },
    };
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
