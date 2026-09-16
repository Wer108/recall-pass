import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { generateExpandedStudentNotes } from "./src/utils/studentNoteGenerator";

dotenv.config();

const app = express();
const PORT = 3000;

// Guarantee JSON header for all /api endpoints
app.use("/api", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use(express.json({ limit: "50mb" }));

// Lazy Gemini SDK client initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// Data directory & sessions persistence file
const DATA_DIR = path.join(process.cwd(), "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

interface AdminCredentialsRecord {
  loginId: string;
  password: string;
  isConfigured: boolean;
  updatedAt: string;
}

function loadAdminCredentials(): AdminCredentialsRecord {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ADMIN_FILE)) {
      const data = fs.readFileSync(ADMIN_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.loginId && parsed.password) {
        return {
          loginId: parsed.loginId,
          password: parsed.password,
          isConfigured: true,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error("Error reading admin credentials:", err);
  }
  return {
    loginId: "",
    password: "",
    isConfigured: false,
    updatedAt: new Date().toISOString(),
  };
}

function saveAdminCredentials(loginId: string, password: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      ADMIN_FILE,
      JSON.stringify(
        {
          loginId: loginId.trim(),
          password: password.trim(),
          isConfigured: true,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (err) {
    console.error("Error saving admin credentials:", err);
  }
}

const activeAdminTokens = new Set<string>();

interface TopicSection {
  id: string;
  title: string;
  bullets: string[];
}

interface QAPair {
  id: string;
  question: string;
  answer: string;
  askerContext?: string;
}

interface StoredSession {
  id: string;
  accessCode: string;
  title: string;
  speaker?: string;
  eventContext?: string;
  createdAt: string;
  expiresAt: string;
  sections: TopicSection[];
  qaList: QAPair[];
  mediaType?: "audio" | "video" | "youtube";
  trackName?: string;
  trackDuration?: string;
  trackSize?: string;
  mediaPreviewUrl?: string;
  mediaUrl?: string;
  youtubeId?: string;
  wordCount: number;
  rawTranscriptSnippet?: string;
  published: boolean;
}

function loadSessions(): StoredSession[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
      return JSON.parse(data) as StoredSession[];
    }
  } catch (err) {
    console.error("Error reading sessions file:", err);
  }
  return seedDefaultSessions();
}

function saveSessions(sessions: StoredSession[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving sessions file:", err);
  }
}

function generateAccessCode(existingCodes: Set<string>): string {
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

function seedDefaultSessions(): StoredSession[] {
  const now = new Date();
  const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const expiredDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const defaultSessions: StoredSession[] = [
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
      rawTranscriptSnippet: "Audio track keynote on resilient distributed architectures, circuit breakers, idempotency, and chaos engineering.",
      published: true,
      sections: [
        {
          id: "sec-1",
          title: "Introduction & Distributed Realities",
          bullets: [
            "Modern microservices face everyday operational conditions of partial failure and network latency.",
            "L. Peter Deutsch's fallacies reminder: the network is neither reliable nor infinite in bandwidth.",
            "Unconstrained synchronous chain calls accounted for over 64% of high-severity financial cloud outages.",
            "Thread pool exhaustion rapidly cascades backwards from downstream dependency hiccups."
          ]
        },
        {
          id: "sec-2",
          title: "Circuit Breakers & Bulkhead Isolation",
          bullets: [
            "Circuit breakers monitor outbound calls over sliding windows and trip fast when errors exceed 15%.",
            "Failing fast prevents thread pool deadlock and immediately serves degraded fallbacks or cached state.",
            "Bulkheading strictly isolates resource pools so non-critical features cannot starve transactional cores.",
            "Separate dedicated worker pools for payment authorization versus recommendation queries."
          ]
        },
        {
          id: "sec-3",
          title: "Strict Idempotency & Event Sourcing",
          bullets: [
            "Every mutating request must include a client-generated UUID idempotency key.",
            "Atomic time-to-live caching on keys prevents duplicate billing and inventory double-booking during retries.",
            "Event sourcing models domain state as an immutable append-only ledger rather than static row snapshots.",
            "Enables deterministic state replay during bug remediation and rigorous mathematical auditability."
          ]
        },
        {
          id: "sec-4",
          title: "Observability & Proactive Chaos Engineering",
          bullets: [
            "Move beyond basic CPU/memory tracking to p99 journey latency and error budget burn rates.",
            "Resilience must be intentionally proven by breaking systems in staging and production.",
            "Regularly inject synthetic 500ms network jitter and kill container pods during peak load drills."
          ]
        }
      ],
      qaList: [
        {
          id: "qa-1",
          question: "How do you handle circuit breakers in high-stakes domains (like live trading) where stale cached data is worse than an error?",
          answer: "In strict transactional paths, do not return stale fallback data. Return an explicit, structured business rejection error (e.g. 'MARKET_DATA_TRANSIENT_UNAVAILABLE') so trading algorithms never execute blindly.",
          askerContext: "Marcus (Audience)"
        },
        {
          id: "qa-2",
          question: "Where do you recommend storing idempotency tokens in high-throughput systems without creating a bottleneck?",
          answer: "Use a multi-zone distributed in-memory key-value cluster (like Redis Cluster) with atomic SETNX and a strict 24-hour expiration window. This keeps memory bounded and latency sub-millisecond.",
          askerContext: "Sarah (Audience)"
        },
        {
          id: "qa-3",
          question: "What is the most effective first step for a legacy team with high resistance to chaos engineering?",
          answer: "Start in CI or staging with proxy blackhole tests against external vendors (e.g., adding 3-second latency to a payment API) to show actual uncaught failure modes safely before touching production.",
          askerContext: "David (Audience)"
        }
      ]
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
      expiresAt: expiredDate.toISOString(), // Expired 2 days ago
      wordCount: 620,
      rawTranscriptSnippet: "Workshop video track on the testing effect, spaced retrieval practice, and desirable difficulties.",
      published: true,
      sections: [
        {
          id: "sec-e1",
          title: "The Fluency Illusion",
          bullets: [
            "Rereading and highlighting create familiarity mistaken for deep comprehension.",
            "True learning requires effortful neural retrieval practice."
          ]
        }
      ],
      qaList: [
        {
          id: "qa-e1",
          question: "How should students deal with emotional frustration during failed retrieval attempts?",
          answer: "Reframe errors as the neuroplasticity window: prediction errors maximize dopamine-mediated consolidation upon seeing the correction.",
          askerContext: "Student (Audience)"
        }
      ]
    }
  ];

  saveSessions(defaultSessions);
  return defaultSessions;
}

// Memory cache initialized from disk
let memorySessions = loadSessions();

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Admin Authentication Endpoints
app.get("/api/admin/status", (_req, res) => {
  const currentAdmin = loadAdminCredentials();
  res.json({
    isConfigured: currentAdmin.isConfigured,
    hasCustomCredentials: currentAdmin.isConfigured,
    loginId: currentAdmin.isConfigured ? currentAdmin.loginId : null,
  });
});

app.post("/api/admin/setup", (req, res) => {
  const { loginId, password } = req.body || {};
  const cleanId = String(loginId || "").trim();
  const cleanPw = String(password || "").trim();

  if (!cleanId || cleanId.length < 3) {
    return res.status(400).json({ error: "Admin Login ID must be at least 3 characters long." });
  }
  if (!cleanPw || cleanPw.length < 6) {
    return res.status(400).json({ error: "Admin password must be at least 6 characters long." });
  }

  saveAdminCredentials(cleanId, cleanPw);

  const token = `rp_adm_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  activeAdminTokens.add(token);

  res.json({
    success: true,
    token,
    adminId: cleanId,
    role: "admin",
    message: "Admin account successfully configured.",
    loginTime: new Date().toISOString(),
  });
});

app.post("/api/admin/login", (req, res) => {
  const { loginId, password } = req.body || {};
  if (!loginId || !password) {
    return res.status(400).json({ error: "Admin Login ID and Password are required." });
  }

  const currentAdmin = loadAdminCredentials();
  if (!currentAdmin.isConfigured) {
    return res.status(400).json({
      error: "No default admin credentials exist. Please set up your custom Admin Login ID and Password.",
      requiresSetup: true,
    });
  }

  const inputId = String(loginId).trim().toLowerCase();
  const expectedId = currentAdmin.loginId.trim().toLowerCase();

  const isIdValid = inputId === expectedId;
  const isPwValid = String(password).trim() === currentAdmin.password.trim();

  if (!isIdValid || !isPwValid) {
    return res.status(401).json({
      error: "Invalid Admin Login credentials. Attendees cannot access this studio. Please verify your custom Admin Login ID and Password.",
    });
  }

  const token = `rp_adm_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  activeAdminTokens.add(token);

  res.json({
    success: true,
    token,
    adminId: currentAdmin.loginId,
    role: "admin",
    loginTime: new Date().toISOString(),
  });
});

app.get("/api/admin/verify", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ error: "Admin session expired or unauthorized. Please sign in." });
  }

  const currentAdmin = loadAdminCredentials();
  res.json({
    authenticated: true,
    adminId: currentAdmin.loginId,
    role: "admin",
  });
});

app.post("/api/admin/change-credentials", (req, res) => {
  const { currentPassword, newLoginId, newPassword } = req.body || {};
  const currentAdmin = loadAdminCredentials();

  if (!currentPassword || String(currentPassword).trim() !== currentAdmin.password.trim()) {
    return res.status(401).json({ error: "Current admin password does not match." });
  }

  if (!newLoginId || String(newLoginId).trim().length < 3) {
    return res.status(400).json({ error: "New Admin Login ID must be at least 3 characters." });
  }

  if (!newPassword || String(newPassword).trim().length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }

  saveAdminCredentials(String(newLoginId).trim(), String(newPassword).trim());
  res.json({
    success: true,
    message: "Admin credentials successfully updated.",
    adminId: String(newLoginId).trim(),
  });
});

app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: "Admin signed out." });
});

// Built-in speech groundings for pre-loaded media tracks
const SAMPLE_SPEECH_GROUNDINGS: Record<string, string> = {
  "distributed-systems-audio": `[00:00 - Dr. Aris Thorne]
Good morning everyone, and welcome to our morning keynote on resilient distributed architectures. Over the last decade, we have watched monolithic web architectures evolve into highly distributed event-driven systems. But with distribution comes the harsh reality of partial failure. When you have hundreds of microservices communicating over unpredictable network topologies, network partitions and cascading latency spikes are not rare anomalies; they are everyday operational conditions.

[04:20 - Core Concept: Fallacies of Distributed Computing]
Let us revisit L. Peter Deutsch's classic fallacies. The network is never reliable, latency is never zero, and bandwidth is never infinite. When developers design as if RPC calls are local function invocations, thread pools exhaust rapidly. In 2024 alone, over 64% of high-severity production outages in financial clouds were traced to unconstrained synchronous chain calls. If Service A waits synchronously on B, and B waits on C, any 200-millisecond blip in C cascades backwards into a complete thread pool deadlock in Service A within seconds.

[12:15 - Core Concept: Circuit Breakers and Bulkheading]
To survive cascading failures, we must implement two fundamental defensive patterns: circuit breakers and bulkheading. A circuit breaker monitors outbound calls over a rolling sliding window. If error rates or latency percentiles exceed 15%, the breaker trips open immediately. Downstream calls fail fast without consuming thread resources or saturating socket pools, returning an instant degraded fallback or cached response. Meanwhile, bulkheading isolates resource allocation so that a degradation in non-critical features—like recommendation engines or notifications—cannot starve core transactional checkouts or authentication pipelines.

[22:40 - Architectural Patterns: Idempotency and Event Sourcing]
Another cornerstone is strict idempotency. Every mutation payload should include a client-generated UUID idempotency key stored with an atomic time-to-live cache. If a network timeout occurs mid-flight, the client can safely retry without risking double billing or duplicate inventory reservation. Event sourcing reinforces this by treating state not as a static snapshot, but as an immutable append-only ledger of discrete business events. You can rebuild state at any point in history, replay failed events during bug remediation, and audit state transitions with mathematical certainty.

[34:10 - Implementation Strategy: Observability and Chaos Engineering]
Monitoring CPU and memory is no longer sufficient. High-resilience teams measure SLOs based on end-to-end user journeys: p99 request latency, error budget burn rates, and synthetic canaries. Furthermore, you cannot declare a system resilient until you break it intentionally in staging and production. Tools like Chaos Mesh or custom packet-drop proxies should regularly inject synthetic 500ms network jitter and kill random container instances during peak load exercises.

[45:00 - Closing Remarks]
In conclusion, true resilience is never accidental. It is the deliberate consequence of assuming every dependent service will eventually fail, bounding your resource boundaries through bulkheading, tripping fast with circuit breakers, and guaranteeing safe retries with idempotency keys. Protect your core paths, fail gracefully, and let your systems bend without shattering. Thank you.

[47:30 - Audience Q&A Session]
Moderator: We have about ten minutes for audience questions. Please step up to the microphones in the aisles. Yes, let's start with the gentleman in aisle two.

Marcus (Audience): Hi Dr. Thorne, thank you for the talk. You emphasized circuit breakers failing fast to a fallback cache. How do you handle cases where stale cached data is worse than an explicit error—for instance, in live stock trading or fraud detection?

Dr. Aris Thorne: That is an excellent distinction, Marcus. In high-stakes transactional domains like stock execution or compliance checks, silent fallback to stale data can violate legal or market requirements. In those critical paths, your circuit breaker fallback should not return stale synthetic data. Instead, it must return an explicit, structured business rejection code—for example, "MARKET_DATA_TRANSIENT_UNAVAILABLE"—so the client or algorithmic trader knows immediately that the quote cannot be verified and does not execute blindly. Save cached fallbacks for read-heavy, low-consequence experiences like user profiles, product catalogs, or suggested media.

Sarah (Audience): Quick follow-up regarding idempotency keys. In high-throughput distributed queues, where do you recommend storing and validating the idempotency tokens without introducing a single point of failure bottleneck?

Dr. Aris Thorne: Great question, Sarah. We typically use a distributed in-memory key-value store such as Redis Cluster or Memcached with multi-zone replication, paired with an atomic SETNX operation with a short 24-hour expiration window. The client sends the Idempotency-Key header. When the worker receives it, it executes SETNX. If the key exists, it either returns the previous cached result or waits for the pending in-flight lock. By keeping the TTL short and scoping keys per tenant, memory stays bounded and performance stays sub-millisecond without burdening your relational database.

David (Audience): In legacy codebases transitioning to microservices, team resistance is often high due to the sheer operational overhead of chaos testing. What is the most effective first step for a team that has never done chaos engineering?

Dr. Aris Thorne: Start in your continuous integration pipeline or local staging with simple blackhole tests. Don't start by taking down production nodes. Instead, take your third-party payment gateway or external notification vendor in staging, configure a proxy to add 3 seconds of latency or drop 20% of TCP packets, and observe if your frontend crashes with an uncaught 500 error. Once your team sees the actual user impact in a safe test environment, the cultural shift toward resilience becomes much easier.

Moderator: That concludes our time for Q&A. Let's give Dr. Thorne another round of applause!`,
  "cognitive-science-video": `[00:00 - Prof. Elena Rostova]
Welcome educators, researchers, and students. Today we explore how humans convert working memory into enduring, durable mental schemata. Most traditional study habits—such as rereading textbooks or highlighting passages with fluorescent markers—create a false illusion of mastery known as the fluency illusion. When you look at text, your brain recognizes the words and mistakes familiarity for deep understanding.

[08:15 - Core Concept: Spaced Retrieval and The Testing Effect]
Cognitive science demonstrates that real learning happens during active retrieval, not passive consumption. Every time you struggle to recall a fact or mental model from memory, your neural pathways undergo reconsolidation, strengthening synaptic connections. This is the testing effect. When coupled with expanding spaced intervals—reviewing after 24 hours, then 4 days, then 2 weeks—decay rates flatten dramatically, shifting conceptual knowledge into long-term semantic memory.

[20:30 - Pedagogical Practice: Desirable Difficulties]
Robert Bjork coined the term 'desirable difficulties.' When a learning task feels too easy, retention is poor. Interleaving different problem types—mixing algebra, geometry, and calculus problems rather than doing 30 identical polynomial exercises in a row—forces the learner to discriminate which strategy applies to which context. It slows down initial training performance, but yields up to 40% higher mastery on subsequent unseen assessments.

[35:00 - Closing Summary]
To foster true educational retention, we must restructure our sessions around prompt recall, segmented knowledge checkpoints, and active student interrogation rather than marathon monologue lectures. Give learners low-stakes recall prompts immediately after a session.

[40:15 - Audience Q&A]
Student (Audience): Professor Rostova, how should students deal with the emotional frustration that comes with spaced retrieval when they get questions wrong?

Prof. Elena Rostova: That frustration is completely natural, but we must reframe it scientifically. Getting a retrieval attempt wrong is actually the golden window for neuroplasticity. When you make an error and then immediately check the correct answer, your prediction error signal is at its maximum, which triggers stronger dopamine-mediated memory consolidation than if you got it right effortlessly. Tell students that mental effort is the physical sensation of learning occurring.

Tutor (Audience): Does interleaving work equally well for novice learners who haven't mastered basic fundamentals yet?

Prof. Elena Rostova: That is a critical boundary condition! For total novices who lack foundational schemas, interleaving too early can cause cognitive overload and confusion. In the first phase, block practice is appropriate to establish basic procedural fluency. Once the student achieves roughly 70-80% accuracy on basic isolated drills, immediately transition to interleaved practice to build discrimination ability.`,
  "vector-search-audio": `[00:00 - Alex Rivera]
Hello everyone. Today's deep dive focuses on Approximate Nearest Neighbors (ANN) indexing at billions-scale vector embeddings. Exact k-NN computes Euclidean distance against every single record, which scales at O(N*d) and becomes completely unusable when user requests expect sub-15ms p99 latency.

[06:20 - Core Concept: HNSW vs IVF Graph Traversal]
Hierarchical Navigable Small World (HNSW) graphs offer logarithmic search complexity by creating layered skip-list graphs. The top layers contain sparse long-range links for fast greedy routing, while lower layers contain dense clusters for fine-grained local convergence. The primary drawback is memory footprint: storing adjacency lists in RAM requires 1.5 to 2 times the memory of the raw embedding vectors themselves. In contrast, Inverted File (IVF) indexes cluster vectors into Voronoi cells using k-means, trading slight recall accuracy for vastly superior compression.

[16:45 - Quantization: Scalar vs Product Quantization (PQ)]
To make billion-scale vector indexes financially viable, quantization is mandatory. Scalar quantization compresses 32-bit floats into 8-bit integers, yielding a 4x reduction with negligible accuracy loss. Product Quantization (PQ) decomposes high-dimensional vectors into low-dimensional sub-spaces and quantizes each sub-vector to centroids, slashing memory by up to 16x.

[24:00 - Audience Q&A]
Attendee (Audience): When should a team switch from HNSW to IVF-PQ in production?

Alex Rivera: The rule of thumb is available memory and latency budget. If you have under 10 million vectors and can afford keeping them in RAM, HNSW provides 98%+ recall with sub-5 millisecond latency. Once your dataset exceeds 50 million vectors or server RAM budgets become prohibitive, transition to IVF-PQ on SSD with memory-mapped inverted files to save 80% on compute infrastructure costs.`,
};

// Pre-curated fallback extractions for sample tracks when upstream Gemini API experiences 503 high demand
const CURATED_SAMPLE_FALLBACKS: Record<string, { sections: { title: string; bullets: string[] }[]; qaList: { question: string; answer: string; askerContext?: string }[] }> = {
  "distributed-systems-audio": {
    sections: [
      {
        title: "Introduction & Distributed Computing Fallacies",
        bullets: [
          "Microservices operate over inherently unreliable networks where latency is non-zero and bandwidth is finite.",
          "Treating synchronous remote procedure calls like local function invocations quickly exhausts thread pools.",
          "Synchronous chain calls account for over 64% of high-severity outages in high-throughput cloud environments.",
          "Partial failure must be treated as a normal everyday operational condition rather than an edge case."
        ]
      },
      {
        title: "Circuit Breakers & Bulkheading Defensive Patterns",
        bullets: [
          "Circuit breakers monitor outbound calls over sliding windows and trip fast when error rates exceed 15%.",
          "Failing fast returns instant degraded fallbacks without locking socket pools or worker threads.",
          "Bulkheading strictly partitions resources so secondary features cannot exhaust core transactional services.",
          "Isolate worker thread pools between critical payment authorization and non-critical recommendation paths."
        ]
      },
      {
        title: "Strict Idempotency & Event-Sourced Ledgers",
        bullets: [
          "Every mutation payload requires a client-generated UUID idempotency key cached with an atomic TTL.",
          "Safe automated client retries prevent duplicate charges and double-booked inventory during mid-flight network timeouts.",
          "Event sourcing models domain state as an immutable append-only ledger rather than mutable database row snapshots.",
          "Enables exact state replay during bug remediation and rigorous historical auditability."
        ]
      },
      {
        title: "Observability & Proactive Chaos Engineering",
        bullets: [
          "Prioritize end-to-end user journey Service Level Objectives (p99 latency, error budget burn) over raw CPU metrics.",
          "Verify resilience by intentionally injecting synthetic faults in staging and production environments.",
          "Regularly introduce 500ms artificial network jitter and kill container pods during peak traffic drills."
        ]
      }
    ],
    qaList: [
      {
        question: "How do you handle circuit breakers in high-stakes domains (like live trading) where stale cached data is worse than an error?",
        answer: "In high-stakes transactional domains like stock execution or compliance, return an explicit structured business rejection code rather than stale data, alerting callers immediately that the quote cannot be verified. Save cached fallbacks for read-heavy, low-consequence experiences.",
        askerContext: "Marcus (Audience)"
      },
      {
        question: "Where do you recommend storing idempotency tokens in high-throughput systems without creating a bottleneck?",
        answer: "Use a distributed in-memory key-value store such as Redis Cluster with multi-zone replication, paired with an atomic SETNX operation and a 24-hour expiration window. This keeps memory bounded and performance sub-millisecond.",
        askerContext: "Sarah (Audience)"
      },
      {
        question: "What is the most effective first step for a legacy team with high resistance to chaos engineering?",
        answer: "Start in continuous integration or staging with basic blackhole tests against external vendors or payment gateways by configuring a proxy to add 3 seconds of latency or drop packets. Showing real user impact in a safe test environment builds organizational buy-in.",
        askerContext: "David (Audience)"
      }
    ]
  },
  "cognitive-science-video": {
    sections: [
      {
        title: "The Fluency Illusion & Passive Review",
        bullets: [
          "Traditional study methods like rereading and highlighting create a false illusion of deep conceptual mastery.",
          "Brain recognition and familiarity are frequently mistaken for durable neural comprehension.",
          "Passive text consumption fails to stimulate synaptic reconsolidation needed for long-term retention."
        ]
      },
      {
        title: "Spaced Retrieval & The Testing Effect",
        bullets: [
          "Durable learning happens during active neural retrieval rather than passive information intake.",
          "Struggling to recall a mental model triggers synaptic reconsolidation and strengthens cognitive pathways.",
          "Expanding spaced retrieval intervals (24 hours, 4 days, 2 weeks) dramatically flattens memory decay curves."
        ]
      },
      {
        title: "Desirable Difficulties & Interleaved Practice",
        bullets: [
          "Interleaving distinct problem types forces learners to discriminate which strategy applies to which context.",
          "While interleaving slows initial training performance, it yields up to 40% higher mastery on novel assessments.",
          "Mental effort during difficult retrieval is the physical biological sensation of neuroplastic consolidation."
        ]
      },
      {
        title: "Educational Checkpoint Design",
        bullets: [
          "Restructure learning sessions around frequent low-stakes recall prompts rather than unbroken monologue lectures.",
          "Prompt students with retrieval checkpoints immediately following major conceptual sections."
        ]
      }
    ],
    qaList: [
      {
        question: "How should students deal with emotional frustration during failed spaced retrieval attempts?",
        answer: "Reframe errors as the golden window for neuroplasticity: prediction errors maximize dopamine-mediated consolidation upon seeing the correct answer. Tell students that mental effort is the physical sensation of learning occurring.",
        askerContext: "Student (Audience)"
      },
      {
        question: "Does interleaving work equally well for novice learners who haven't mastered basic fundamentals yet?",
        answer: "For total novices who lack foundational schemas, interleaving too early can cause cognitive overload. In the first phase, block practice is appropriate to establish basic procedural fluency. Once the student achieves 70-80% accuracy, immediately transition to interleaved practice.",
        askerContext: "Tutor (Audience)"
      }
    ]
  },
  "vector-search-audio": {
    sections: [
      {
        title: "Approximate Nearest Neighbors Fundamentals",
        bullets: [
          "Exact k-NN computes Euclidean distance across every record at O(N*d) complexity, making it infeasible for sub-15ms p99 SLAs.",
          "Billion-scale vector retrieval requires Approximate Nearest Neighbor (ANN) indexing to balance latency and recall accuracy."
        ]
      },
      {
        title: "HNSW vs IVF Graph Topologies",
        bullets: [
          "Hierarchical Navigable Small World (HNSW) graphs offer logarithmic search complexity through skip-list layers.",
          "Top layers provide sparse long-range routing while lower layers contain dense clusters for fine-grained convergence.",
          "HNSW requires 1.5 to 2 times the memory of raw vectors, whereas IVF indexes cluster into Voronoi cells for superior RAM economy."
        ]
      },
      {
        title: "Vector Quantization: Scalar vs Product Quantization",
        bullets: [
          "Scalar quantization compresses 32-bit floats into 8-bit integers, achieving a 4x reduction with negligible recall loss.",
          "Product Quantization (PQ) decomposes high-dimensional spaces into sub-vectors to slash memory footprint up to 16x.",
          "Use HNSW in RAM for under 10 million vectors, and transition to IVF-PQ on SSD with memory-mapped files above 50 million vectors."
        ]
      }
    ],
    qaList: [
      {
        question: "When should a team switch from HNSW to IVF-PQ in production?",
        answer: "The rule of thumb is available memory and latency budget. If you have under 10 million vectors and can afford keeping them in RAM, HNSW provides 98%+ recall with sub-5 millisecond latency. Once your dataset exceeds 50 million vectors, transition to IVF-PQ on SSD with memory-mapped files to save 80% on compute infrastructure costs.",
        askerContext: "Attendee (Audience)"
      }
    ]
  }
};

// Resilient Gemini Execution: Retries with fallback across compatible models and timeout protection
async function executeGeminiWithResilience(
  ai: GoogleGenAI,
  contents: any,
  config: any
): Promise<string | null> {
  // Ordered by current real-time availability and responsiveness
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
  ];

  for (const model of candidateModels) {
    try {
      console.log(`[RecallPass AI] Generating student notes with model '${model}'...`);
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), 40000)
        ),
      ]);

      if (response && response.text) {
        console.log(`[RecallPass AI] Successfully generated response with model '${model}'.`);
        return response.text;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.log(`[RecallPass AI] Model '${model}' notice (${msg.slice(0, 80)}...); checking next option.`);
    }
  }

  console.log("[RecallPass AI] Upstream models busy. Deploying student note expansion engine.");
  return null;
}

// Fallback Topic & Q&A Parser for Acoustic Stream Data
function parseFallbackNotesAndQA(
  groundingText: string,
  title: string,
  speaker?: string,
  sampleTrackId?: string,
  eventContext?: string,
  trainingProfile?: any,
  lectureNotesOrTranscript?: string
): { sections: TopicSection[]; qaList: QAPair[] } {
  // 1. Only check pre-curated high-fidelity content if explicitly picked from sample library
  if (sampleTrackId && CURATED_SAMPLE_FALLBACKS[sampleTrackId]) {
    const curated = CURATED_SAMPLE_FALLBACKS[sampleTrackId];
    return {
      sections: curated.sections.map((s, i) => ({ id: `sec-fb-${Date.now()}-${i}`, ...s })),
      qaList: curated.qaList.map((q, i) => ({ id: `qa-fb-${Date.now()}-${i}`, ...q })),
    };
  }

  // 2. Dynamic, topic-specific expanded student notes
  return generateExpandedStudentNotes({
    title,
    speaker,
    eventContext,
    trainingProfile,
    lectureNotesOrTranscript: lectureNotesOrTranscript || groundingText,
  });
}

// API: Fetch YouTube Video Details (Safe proxy avoiding CORS)
app.get("/api/youtube-info", async (req, res) => {
  try {
    const { id, url } = req.query;
    let videoId = (id as string) || "";
    if (!videoId && url) {
      const match = (url as string).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      if (match) videoId = match[1];
    }

    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({ error: "Invalid YouTube Video ID or URL." });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = (await response.json()) as any;
      return res.json({
        videoId,
        title: data.title || `YouTube Video (${videoId})`,
        authorName: data.author_name || "Speaker / Creator",
        authorUrl: data.author_url,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: "Full Video Session",
      });
    }

    return res.json({
      videoId,
      title: `YouTube Video (${videoId})`,
      authorName: "Featured Speaker",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: "YouTube Stream",
    });
  } catch (err: any) {
    console.log("[YouTube Info] Error fetching oEmbed:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch YouTube details" });
  }
});

// API: Process Video / Audio Track with Gemini LLM
app.post("/api/process-media", async (req, res) => {
  try {
    const {
      title,
      speaker,
      eventContext,
      mediaType = "audio",
      trackName = "session_track",
      trackDuration = "Live Recorded",
      trackSize,
      mediaBase64,
      mediaUrl,
      youtubeId,
      mimeType,
      sampleTrackId,
      transcriptFallback,
      liveTranscript,
      lectureNotesOrTranscript,
      trainingProfile,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Session title is required.",
      });
    }

    const isYouTube =
      mediaType === "youtube" ||
      Boolean(youtubeId) ||
      Boolean(mediaUrl && /(?:youtu\.be\/|youtube\.com)/.test(mediaUrl));

    const effectiveMediaType: "audio" | "video" | "youtube" = isYouTube
      ? "youtube"
      : mediaType === "video"
      ? "video"
      : "audio";

    let derivedYouTubeId = youtubeId || "";
    if (!derivedYouTubeId && mediaUrl) {
      const ytMatch = mediaUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      if (ytMatch) derivedYouTubeId = ytMatch[1];
    }

    let groundingText = "";
    if (lectureNotesOrTranscript && lectureNotesOrTranscript.trim()) {
      groundingText = lectureNotesOrTranscript.trim();
    } else if (liveTranscript && liveTranscript.trim()) {
      groundingText = liveTranscript.trim();
    } else if (transcriptFallback && transcriptFallback.trim()) {
      groundingText = transcriptFallback.trim();
    } else if (sampleTrackId && SAMPLE_SPEECH_GROUNDINGS[sampleTrackId]) {
      groundingText = SAMPLE_SPEECH_GROUNDINGS[sampleTrackId];
    } else if (isYouTube) {
      groundingText = `YouTube Educational Lecture: "${title}" by ${speaker || "Speaker / Creator"}. Video ID: ${derivedYouTubeId || "Embedded Video"}. Domain: ${trainingProfile?.domain || eventContext || "Technical & Academic Tutorial"}. Key Focus Terms: ${(trainingProfile?.customTerms || []).join(", ") || title}.`;
    } else if (mediaUrl) {
      groundingText = `Audio / Media Stream: ${mediaUrl}. Lecture title: "${title}" by ${speaker || "Speaker"}. Domain: ${trainingProfile?.domain || eventContext || "Academic Lecture"}. Focus Terms: ${(trainingProfile?.customTerms || []).join(", ") || title}.`;
    } else {
      groundingText = `Educational session on "${title}" presented by ${speaker || "Instructor"}. Domain context: ${eventContext || trainingProfile?.domain || "Comprehensive Learning Curriculum"}.`;
    }

    // Build model training guidance string
    let trainingDirectives = "";
    if (trainingProfile) {
      trainingDirectives = `
CALIBRATED EVENT & SOURCE MODEL TRAINING DATA:
- Domain Theme: ${trainingProfile.domain || "Specialized Tech / Academic"}
- Specialized Vocabulary & Key Glossary: ${(trainingProfile.customTerms || []).join(", ") || "None specified"}
- Speaker / Presenter Style: ${trainingProfile.speakerContext || "Standard Educational"}
- Audience Q&A Structure: ${trainingProfile.qaFormatPrompt || "Live audience inquiries and speaker answers"}
- Notes Depth Focus: ${trainingProfile.notesFocus || "technical"}
- Source Media Focus: ${trainingProfile.sourceTypePreference || (isYouTube ? "youtube" : "audio_upload")}
${trainingProfile.customPromptInstructions ? `- User Custom Model Directives: ${trainingProfile.customPromptInstructions}` : ""}

CRITICAL MODEL TRAINING DIRECTIVES:
1. Integrate the specialized vocabulary and terminology above with high precision. Do not omit or mislabel key domain acronyms or technical concepts.
2. Structure the notes cleanly for rapid student comprehension according to the chosen depth focus.
3. For ${isYouTube ? "YouTube videos" : "audio tracks"}, synthesize high-impact takeaways focusing on core explanations, architectural diagrams/code described, and practical steps.`;
    }

    const systemInstruction = `You are RecallPass, an educational note recall assistant trained to ingest ${isYouTube ? "YouTube educational videos" : "audio and media tracks"} and produce high-fidelity, comprehensive educational recall materials for students.
Your task is to analyze the provided ${String(effectiveMediaType).toUpperCase()} track/stream and extract two precise outputs:
${trainingDirectives}

OUTPUT 1: Topic-segmented, deeply expanded educational notes
- Break the session into 4 to 6 logically labeled, progressive topic modules tailored specifically to "${title}".
- MANDATORY STUDENT COMPREHENSION DIRECTIVE:
  Points MUST be thoroughly expanded so that students can understand the concepts easily.
  Do NOT write brief, 1-sentence generalities or cryptic bullet points.
  Every bullet point MUST be 2 to 4 rich, explanatory sentences that unpack:
  (1) The foundational definition / concept in accessible student language.
  (2) The underlying mechanism or rationale ("How it works" and "Why it is important").
  (3) A concrete real-world example, student application, code/math intuition, or practical mental model.
- Provide 3 to 5 expanded bullet points per section.

OUTPUT 2: Realistic student Q&A extraction
- Extract actual Q&A exchanges that occurred, or formulate 3 to 5 high-impact questions that students frequently ask when studying this topic.
- For each Q&A:
  - "question": Clear, realistic question addressing core concepts, common dilemmas, or student misconceptions.
  - "answer": A comprehensive, encouraging, and detailed instructor explanation (3 to 5 sentences) that clarifies the reasoning step-by-step.
  - "askerContext": Name of student or descriptor (e.g. "Student (Core Concept Query)", "Student (Implementation)", "Classroom Inquiry").

Return your response strictly in structured JSON format matching the schema.`;

    const schemaConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sections: {
            type: Type.ARRAY,
            description: "List of labeled topic segments with expanded student-friendly bullet points",
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Descriptive label for this section of the talk",
                },
                bullets: {
                  type: Type.ARRAY,
                  description: "3 to 5 deeply expanded, student-friendly explanatory points (2-4 sentences each with definitions, mechanics, and examples)",
                  items: {
                    type: Type.STRING,
                  },
                },
              },
              required: ["title", "bullets"],
            },
          },
          qaList: {
            type: Type.ARRAY,
            description: "Real Q&A exchanges or high-impact student queries with detailed answers",
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: "The question asked by an audience member or student",
                },
                answer: {
                  type: Type.STRING,
                  description: "The instructor's comprehensive answer to the question",
                },
                askerContext: {
                  type: Type.STRING,
                  description: "Name or role of the student or audience member",
                },
              },
              required: ["question", "answer"],
            },
          },
        },
        required: ["sections", "qaList"],
      },
    };

    let geminiJsonText: string | null = null;
    let usedFallback = false;

    try {
      const ai = getGeminiClient();

      let contents: any;
      if (mediaBase64 && mimeType) {
        const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, "");
        contents = [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this ${mediaType} track: "${trackName}" (Session: "${title}", Speaker: "${speaker || "Instructor"}"). Extract topic-segmented bullet notes and real audience Q&A exchanges according to instructions.`,
          },
        ];
      } else {
        const prompt = `Session Title: "${title}"
Speaker: "${speaker || "Featured Speaker"}"
Source Track: ${String(mediaType).toUpperCase()} Track ("${trackName}", Duration: ${trackDuration}${mediaUrl ? `, Media URL: ${mediaUrl}` : ""})
Event / Series: "${eventContext || "Live Learning Session"}"
${trainingProfile ? `Event Training Domain: "${trainingProfile.domain}"\nSpecialized Key Terms: ${(trainingProfile.customTerms || []).join(", ")}` : ""}

Spoken Dialogue & Acoustic Stream:
---
${groundingText}
---

Extract the topic-segmented bullet notes and the real audience Q&A exchanges.`;
        contents = prompt;
      }

      geminiJsonText = await executeGeminiWithResilience(ai, contents, schemaConfig);
      if (!geminiJsonText) {
        usedFallback = true;
      }
    } catch (apiError: any) {
      console.log("[RecallPass AI] Live model pipeline notice, deploying acoustic stream parser:", apiError?.message || apiError);
      usedFallback = true;
    }

    let parsedSections: TopicSection[] = [];
    let parsedQAList: QAPair[] = [];

    if (geminiJsonText && !usedFallback) {
      try {
        const parsed = JSON.parse(geminiJsonText);
        parsedSections = (parsed.sections || []).map((sec: any, idx: number) => ({
          id: `sec-${Date.now()}-${idx}`,
          title: sec.title || `Section ${idx + 1}`,
          bullets: Array.isArray(sec.bullets) ? sec.bullets.filter(Boolean) : [],
        }));

        parsedQAList = (parsed.qaList || []).map((qa: any, idx: number) => ({
          id: `qa-${Date.now()}-${idx}`,
          question: qa.question || "",
          answer: qa.answer || "",
          askerContext: qa.askerContext || undefined,
        }));
      } catch (parseErr) {
        console.log("[RecallPass AI] Structured JSON parse adjustment, activating acoustic stream parser.");
        usedFallback = true;
      }
    }

    if (usedFallback || parsedSections.length === 0) {
      const fallbackResult = parseFallbackNotesAndQA(
        groundingText,
        title,
        speaker,
        sampleTrackId,
        eventContext,
        trainingProfile,
        lectureNotesOrTranscript
      );
      parsedSections = fallbackResult.sections;
      parsedQAList = fallbackResult.qaList;
    }

    res.json({
      sections: parsedSections,
      qaList: parsedQAList,
      isFallback: usedFallback,
      trackInfo: {
        mediaType: effectiveMediaType,
        trackName,
        trackDuration,
        mediaUrl: mediaUrl || undefined,
        youtubeId: derivedYouTubeId || undefined,
      },
    });
  } catch (error: any) {
    console.log("[RecallPass AI] Applying resilient fallback for session processing:", error?.message || error);
    const fallbackResult = parseFallbackNotesAndQA(
      req.body?.lectureNotesOrTranscript || req.body?.liveTranscript || req.body?.transcriptFallback || "",
      req.body?.title || "Session Notes",
      req.body?.speaker || "Speaker",
      req.body?.sampleTrackId,
      req.body?.eventContext,
      req.body?.trainingProfile,
      req.body?.lectureNotesOrTranscript
    );
    res.json({
      sections: fallbackResult.sections,
      qaList: fallbackResult.qaList,
      isFallback: true,
      trackInfo: {
        mediaType: req.body?.mediaType || "audio",
        trackName: req.body?.trackName || "session_track",
        trackDuration: req.body?.trackDuration || "Recorded Session",
        mediaUrl: req.body?.mediaUrl || undefined,
      },
    });
  }
});

// API: Process Transcript alias for backward compatibility
app.post("/api/process-transcript", async (req, res) => {
  try {
    const { title = "Educational Session", speaker = "Speaker", transcript } = req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Transcript or track data required." });
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are RecallPass, an educational note recall assistant. Extract topic-segmented bullet notes (3-7 sections, 3-6 actionable bullets each, no paragraphs) and real Q&A exchanges actually present in text.`;
    const prompt = `Session Title: "${title}"\nSpeaker: "${speaker}"\n\nContent:\n${transcript}`;
    
    let jsonText: string | null = null;
    let usedFallback = false;
    try {
      jsonText = await executeGeminiWithResilience(ai, prompt, {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["title", "bullets"],
              },
            },
            qaList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  askerContext: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
          },
          required: ["sections", "qaList"],
        },
      });
      if (!jsonText) {
        usedFallback = true;
      }
    } catch (err: any) {
      console.log("[RecallPass AI] Transcript model notice, using acoustic stream parser:", err?.message || err);
      usedFallback = true;
    }

    let parsedSections: TopicSection[] = [];
    let parsedQAList: QAPair[] = [];

    if (jsonText && !usedFallback) {
      try {
        const parsed = JSON.parse(jsonText);
        parsedSections = (parsed.sections || []).map((s: any, i: number) => ({ id: `sec-${Date.now()}-${i}`, ...s }));
        parsedQAList = (parsed.qaList || []).map((q: any, i: number) => ({ id: `qa-${Date.now()}-${i}`, ...q }));
      } catch {
        usedFallback = true;
      }
    }

    if (usedFallback || parsedSections.length === 0) {
      const fallbackResult = parseFallbackNotesAndQA(transcript, title, speaker);
      parsedSections = fallbackResult.sections;
      parsedQAList = fallbackResult.qaList;
    }

    res.json({
      sections: parsedSections,
      qaList: parsedQAList,
      isFallback: usedFallback,
    });
  } catch (err: any) {
    const fallback = parseFallbackNotesAndQA(req.body?.transcript || "", req.body?.title || "Session Notes", req.body?.speaker || "Speaker");
    res.json({
      sections: fallback.sections,
      qaList: fallback.qaList,
      isFallback: true,
    });
  }
});

// API: Get all sessions (Admin overview)
app.get("/api/sessions", (_req, res) => {
  const now = new Date();
  const list = memorySessions.map((s) => ({
    ...s,
    isExpired: new Date(s.expiresAt) <= now,
  }));
  res.json(list);
});

// API: Create and publish a new session
app.post("/api/sessions", (req, res) => {
  try {
    const {
      title,
      speaker,
      eventContext,
      sections,
      qaList,
      transcript,
      mediaType = "audio",
      trackName = "session_track",
      trackDuration,
      trackSize,
      mediaPreviewUrl,
      mediaUrl,
      youtubeId,
      customExpiresAt,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Session title is required." });
    }

    const existingCodes = new Set(memorySessions.map((s) => s.accessCode));
    const accessCode = generateAccessCode(existingCodes);

    const now = new Date();
    // Default 2 months (60 days) from current date
    const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const expiresAt = customExpiresAt || twoMonthsLater.toISOString();

    const wordCount = transcript
      ? transcript.trim().split(/\s+/).filter(Boolean).length
      : 800;

    const newSession: StoredSession = {
      id: `session-${Date.now()}`,
      accessCode,
      title: title.trim(),
      speaker: speaker?.trim() || undefined,
      eventContext: eventContext?.trim() || undefined,
      createdAt: now.toISOString(),
      expiresAt,
      mediaType: mediaType === "youtube" ? "youtube" : mediaType === "video" ? "video" : "audio",
      trackName: trackName?.trim() || undefined,
      trackDuration: trackDuration?.trim() || undefined,
      trackSize: trackSize?.trim() || undefined,
      mediaPreviewUrl: mediaPreviewUrl || undefined,
      mediaUrl: mediaUrl?.trim() || undefined,
      youtubeId: youtubeId?.trim() || undefined,
      wordCount,
      rawTranscriptSnippet: `${String(mediaType).toUpperCase()} track: ${trackName || "session_track"} (${trackDuration || "Duration logged"})`,
      published: true,
      sections: Array.isArray(sections) ? sections : [],
      qaList: Array.isArray(qaList) ? qaList : [],
    };

    memorySessions.unshift(newSession);
    saveSessions(memorySessions);

    res.status(201).json({
      ...newSession,
      isExpired: false,
    });
  } catch (err: any) {
    console.error("Error saving session:", err);
    res.status(500).json({ error: "Failed to publish session." });
  }
});

// API: Attendee lookup by access code (case-insensitive)
app.get("/api/sessions/:code", (req, res) => {
  const codeParam = req.params.code?.trim().toUpperCase();
  const session = memorySessions.find(
    (s) => s.accessCode.toUpperCase() === codeParam
  );

  if (!session) {
    return res.status(404).json({
      error: `No session found for access code "${req.params.code}". Please verify your code and try again.`,
    });
  }

  const now = new Date();
  const isExpired = new Date(session.expiresAt) <= now;

  if (isExpired) {
    // Attendee view for expired codes shows upgrade message instead of the content
    return res.json({
      id: session.id,
      accessCode: session.accessCode,
      title: session.title,
      speaker: session.speaker,
      eventContext: session.eventContext,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isExpired: true,
      sections: [], // Redacted content on expiry
      qaList: [],   // Redacted content on expiry
      published: session.published,
    });
  }

  // Active session: return full recall notes + Q&A
  res.json({
    ...session,
    isExpired: false,
  });
});

// API: Update session (Admin review/edit or toggle expiration)
app.patch("/api/sessions/:code", (req, res) => {
  const codeParam = req.params.code?.trim().toUpperCase();
  const index = memorySessions.findIndex(
    (s) => s.accessCode.toUpperCase() === codeParam
  );

  if (index === -1) {
    return res.status(404).json({ error: "Session not found." });
  }

  const current = memorySessions[index];
  const { title, speaker, eventContext, sections, qaList, expiresAt } = req.body;

  if (title !== undefined) current.title = title.trim();
  if (speaker !== undefined) current.speaker = speaker.trim();
  if (eventContext !== undefined) current.eventContext = eventContext.trim();
  if (sections !== undefined) current.sections = sections;
  if (qaList !== undefined) current.qaList = qaList;
  if (expiresAt !== undefined) current.expiresAt = expiresAt;

  memorySessions[index] = current;
  saveSessions(memorySessions);

  const isExpired = new Date(current.expiresAt) <= new Date();
  res.json({
    ...current,
    isExpired,
  });
});

// API: Toggle expiry for demo testing
app.post("/api/sessions/:code/toggle-expired", (req, res) => {
  const codeParam = req.params.code?.trim().toUpperCase();
  const session = memorySessions.find(
    (s) => s.accessCode.toUpperCase() === codeParam
  );

  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  const now = new Date();
  const isCurrentlyExpired = new Date(session.expiresAt) <= now;

  if (isCurrentlyExpired) {
    // Re-activate: set expiry 60 days ahead
    session.expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    // Expire: set expiry 2 days ago
    session.expiresAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  }

  saveSessions(memorySessions);
  res.json({
    ...session,
    isExpired: !isCurrentlyExpired,
  });
});

// API: Delete session
app.delete("/api/sessions/:code", (req, res) => {
  const codeParam = req.params.code?.trim().toUpperCase();
  const initialLen = memorySessions.length;
  memorySessions = memorySessions.filter(
    (s) => s.accessCode.toUpperCase() !== codeParam
  );

  if (memorySessions.length === initialLen) {
    return res.status(404).json({ error: "Session not found." });
  }

  saveSessions(memorySessions);
  res.json({ success: true, message: `Session ${codeParam} deleted.` });
});

// Fallback 404 for unmatched /api routes so they return JSON instead of HTML or plain text
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

// Global JSON error handler for all /api endpoints
app.use("/api", (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.log("[RecallPass API] Handled API error:", err?.message || err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({
    error: err?.message || "Internal server error",
  });
});

// Mount Vite middleware for dev or static serving in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RecallPass server running on port ${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start RecallPass server:", err);
  process.exit(1);
});
