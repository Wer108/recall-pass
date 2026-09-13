export interface SampleMediaTrack {
  id: string;
  title: string;
  speaker: string;
  eventContext: string;
  mediaType: "audio" | "video";
  trackName: string;
  trackDuration: string;
  duration?: string;
  durationSeconds: number;
  trackSize: string;
  fileSize?: string;
  format: string;
  description: string;
  previewUrl?: string;
  groundingAudioTranscript: string;
}

export type MediaTrackInfo = SampleMediaTrack;

export const SAMPLE_MEDIA_TRACKS: SampleMediaTrack[] = [
  {
    id: "distributed-systems-audio",
    title: "Designing Resilient Distributed Systems Under High Concurrency",
    speaker: "Dr. Aris Thorne (Principal Systems Architect)",
    eventContext: "CloudScale Global Summit 2026",
    mediaType: "audio",
    trackName: "dr_thorne_systems_keynote_master.mp3",
    trackDuration: "48:15",
    durationSeconds: 2895,
    trackSize: "44.2 MB",
    format: "MP3 Audio (320 kbps, 48 kHz, Stereo)",
    description: "Multi-track board master audio from the main auditorium at CloudScale 2026.",
    groundingAudioTranscript: `[00:00 - Dr. Aris Thorne]
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
  },
  {
    id: "cognitive-science-video",
    title: "The Cognitive Architecture of Long-Term Memory & Retrieval Practice",
    speaker: "Prof. Elena Rostova",
    eventContext: "Educational Psychology & Pedagogy Workshop 2026",
    mediaType: "video",
    trackName: "elena_rostova_memory_retrieval_session.mp4",
    trackDuration: "42:30",
    durationSeconds: 2550,
    trackSize: "210.8 MB",
    format: "1080p MP4 Video (H.264 / AAC Audio)",
    description: "High-definition camera feed from the pedagogy hall with synced presentation slides.",
    groundingAudioTranscript: `[00:00 - Prof. Elena Rostova]
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
  },
  {
    id: "vector-search-audio",
    title: "Scaling Approximate Nearest Neighbors in Vector Databases",
    speaker: "Alex Rivera (Lead Infrastructure Engineer)",
    eventContext: "AI Systems Engineering Meetup",
    mediaType: "audio",
    trackName: "alex_rivera_vector_indexing_talk.wav",
    trackDuration: "31:10",
    durationSeconds: 1870,
    trackSize: "68.5 MB",
    format: "WAV Audio (Lossless PCM, 44.1 kHz)",
    description: "Direct mixer board recording from the technical meetup stage.",
    groundingAudioTranscript: `[00:00 - Alex Rivera]
Hello everyone. Today's deep dive focuses on Approximate Nearest Neighbors (ANN) indexing at billions-scale vector embeddings. Exact k-NN computes Euclidean distance against every single record, which scales at O(N*d) and becomes completely unusable when user requests expect sub-15ms p99 latency.

[06:20 - Core Concept: HNSW vs IVF Graph Traversal]
Hierarchical Navigable Small World (HNSW) graphs offer logarithmic search complexity by creating layered skip-list graphs. The top layers contain sparse long-range links for fast greedy routing, while lower layers contain dense clusters for fine-grained local convergence. The primary drawback is memory footprint: storing adjacency lists in RAM requires 1.5 to 2 times the memory of the raw embedding vectors themselves. In contrast, Inverted File (IVF) indexes cluster vectors into Voronoi cells using k-means, trading slight recall accuracy for vastly superior compression.

[16:45 - Quantization: Scalar vs Product Quantization (PQ)]
To make billion-scale vector indexes financially viable, quantization is mandatory. Scalar quantization compresses 32-bit floats into 8-bit integers, yielding a 4x reduction with negligible accuracy loss. Product Quantization (PQ) decomposes high-dimensional vectors into low-dimensional sub-spaces and quantizes each sub-vector to centroids, slashing memory by up to 16x.

[24:00 - Audience Q&A]
Attendee (Audience): When should a team switch from HNSW to IVF-PQ in production?

Alex Rivera: The rule of thumb is available memory and latency budget. If you have under 10 million vectors and can afford keeping them in RAM, HNSW provides 98%+ recall with sub-5 millisecond latency. Once your dataset exceeds 50 million vectors or server RAM budgets become prohibitive, transition to IVF-PQ on SSD with memory-mapped inverted files to save 80% on compute infrastructure costs.`,
  },
];
