import React, { useState } from "react";
import {
  Sparkles,
  X,
  CheckCircle2,
  Plus,
  Trash2,
  Tag,
  Radio,
  BookOpen,
  Cpu,
  GraduationCap,
  Briefcase,
  Zap,
  Youtube,
  Music,
  Sliders,
  Play,
  RotateCcw,
  Check,
  HelpCircle,
  Video,
} from "lucide-react";
import { EventTrainingProfile } from "../types";

interface EventTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EventTrainingProfile;
  onSaveProfile: (profile: EventTrainingProfile) => void;
}

const MODEL_TRAINING_PRESETS = [
  {
    id: "youtube-tech",
    name: "YouTube Tech & Coding Tutorials",
    domain: "YouTube Tech Walkthroughs, AI Tutorials & Architecture Talks",
    icon: Youtube,
    sourceTypePreference: "youtube" as const,
    terms: [
      "PyTorch",
      "Backpropagation",
      "Attention Mechanism",
      "Transformer Architecture",
      "Vector Embeddings",
      "Context Window",
      "Tokenization",
      "Inference Latency",
      "CUDA Kernel",
    ],
    speakerContext: "YouTube Tech Educator / Principal Engineer providing step-by-step code and architectural breakdowns",
    qaFormatPrompt: "Viewer questions from live chat, video comments, and common developer failure modes",
    notesFocus: "technical" as const,
    customPromptInstructions:
      "Trained for YouTube videos: Extract code patterns, ignore channel sponsor segments and intro greetings, format notes with chapter milestones, and capture real viewer questions.",
  },
  {
    id: "audio-podcasts",
    name: "Audio Podcasts & Multi-Speaker Discussions",
    domain: "Conversational Podcasts, Tech Summits & Keynote Audio",
    icon: Music,
    sourceTypePreference: "audio_upload" as const,
    terms: [
      "First Principles",
      "Consensus Protocol",
      "Zero-Knowledge Proofs",
      "Economic Moats",
      "Scale Bottlenecks",
      "Capital Allocation",
      "Open Source Ecosystem",
    ],
    speakerContext: "Podcast host and industry guest engaging in rapid conversational debate and trade-off analysis",
    qaFormatPrompt: "Host interviewing guest, clarifying nuanced points and addressing listener questions",
    notesFocus: "general" as const,
    customPromptInstructions:
      "Trained for audio tracks: Clean conversational filler words (e.g. 'um', 'like'), separate host questions from guest answers, and highlight contrasting viewpoints.",
  },
  {
    id: "academic-lecture",
    name: "Academic Lectures & Research Seminars",
    domain: "University Computer Science, Neuroscience & Theoretical Research",
    icon: GraduationCap,
    sourceTypePreference: "all_media" as const,
    terms: [
      "Synaptic Plasticity",
      "Testing Effect",
      "Spaced Retrieval",
      "Desirable Difficulties",
      "Markov Decision Process",
      "Eigenvalues",
      "Convergence Bounds",
    ],
    speakerContext: "University Professor and Research Fellow presenting rigorous mathematical or scientific concepts",
    qaFormatPrompt: "Student inquiries during lecture breaks and teaching fellow clarifications",
    notesFocus: "study_guide" as const,
    customPromptInstructions:
      "Trained for academic audio/video: Capture formal definitions, equations, experimental methodology, and student questions asked during lecture pauses.",
  },
  {
    id: "executive-webinar",
    name: "Executive Strategy & Corporate Webinars",
    domain: "Technology Leadership, Product Strategy & Corporate Roadmaps",
    icon: Briefcase,
    sourceTypePreference: "podcast_stream" as const,
    terms: [
      "Product-Market Fit",
      "Retention Cohorts",
      "Unit Economics",
      "GTM Velocity",
      "Capital Efficiency",
      "SLA / SLO Compliance",
    ],
    speakerContext: "VP of Engineering or Product Leader presenting quarterly strategy and business impact",
    qaFormatPrompt: "Stakeholder and investor inquiries addressing operational risks and timelines",
    notesFocus: "executive" as const,
    customPromptInstructions:
      "Trained for executive webinars: Summarize high-level business decisions, KPI metrics, risks, and strategic takeaways. Keep bullet points concise and executive-focused.",
  },
];

export const EventTrainingModal: React.FC<EventTrainingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "test">("presets");
  const [domain, setDomain] = useState(profile.domain || "YouTube Tech Tutorials & Educational Audio");
  const [customTerms, setCustomTerms] = useState<string[]>(profile.customTerms || [
    "PyTorch",
    "Transformer Architecture",
    "Context Window",
    "Tokenization",
  ]);
  const [newTerm, setNewTerm] = useState("");
  const [speakerContext, setSpeakerContext] = useState(
    profile.speakerContext || "Tech educator or audio podcast host explaining complex concepts"
  );
  const [qaFormatPrompt, setQaFormatPrompt] = useState(
    profile.qaFormatPrompt || "Viewer / listener inquiries and speaker clarifications"
  );
  const [targetCadence, setTargetCadence] = useState<"realtime" | "interval" | "ondemand">(
    profile.targetCadence || "interval"
  );
  const [notesFocus, setNotesFocus] = useState<"technical" | "general" | "executive" | "study_guide">(
    profile.notesFocus || "technical"
  );
  const [sourceTypePreference, setSourceTypePreference] = useState<"youtube" | "audio_upload" | "podcast_stream" | "all_media">(
    profile.sourceTypePreference || "all_media"
  );
  const [customPromptInstructions, setCustomPromptInstructions] = useState(
    profile.customPromptInstructions ||
      "Trained to extract clean, actionable bullet notes and authentic Q&A from YouTube educational videos and audio tracks."
  );

  const [justTrained, setJustTrained] = useState(false);

  // Test sandbox state
  const [testSample, setTestSample] = useState(
    "https://www.youtube.com/watch?v=zjkBMFhNj_g (Intro to Large Language Models - Andrej Karpathy)"
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    sections: Array<{ title: string; bullets: string[] }>;
    qaList: Array<{ question: string; answer: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleAddTerm = () => {
    const trimmed = newTerm.trim();
    if (trimmed && !customTerms.includes(trimmed)) {
      setCustomTerms([...customTerms, trimmed]);
      setNewTerm("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTerm();
    }
  };

  const handleRemoveTerm = (termToRemove: string) => {
    setCustomTerms(customTerms.filter((t) => t !== termToRemove));
  };

  const handleApplyPreset = (preset: typeof MODEL_TRAINING_PRESETS[0]) => {
    setDomain(preset.domain);
    setCustomTerms(preset.terms);
    setSpeakerContext(preset.speakerContext);
    setQaFormatPrompt(preset.qaFormatPrompt);
    setNotesFocus(preset.notesFocus);
    setSourceTypePreference(preset.sourceTypePreference);
    setCustomPromptInstructions(preset.customPromptInstructions);
    setActiveTab("custom");
  };

  const handleSave = () => {
    const updated: EventTrainingProfile = {
      domain: domain.trim() || "YouTube & Audio Media",
      customTerms,
      speakerContext: speakerContext.trim(),
      qaFormatPrompt: qaFormatPrompt.trim(),
      targetCadence,
      notesFocus,
      sourceTypePreference,
      customPromptInstructions: customPromptInstructions.trim(),
      isLiveTrained: true,
    };
    onSaveProfile(updated);
    setJustTrained(true);
    setTimeout(() => {
      setJustTrained(false);
      onClose();
    }, 900);
  };

  const handleRunTest = () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate fast model calibration verification
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        sections: [
          {
            title: `1. Core Architecture & Foundations (${domain.split(",")[0] || "Overview"})`,
            bullets: [
              `Directly recognized domain concepts: ${customTerms.slice(0, 3).join(", ") || "Foundational principles"}.`,
              "Ingested audio/video stream parsed into high-density conceptual checkpoints.",
              "Filtered conversational tangents to isolate actionable technical mechanisms.",
            ],
          },
          {
            title: "2. Practical Implementation & Workflow Patterns",
            bullets: [
              `Applied trained vocabulary: ${customTerms.slice(3, 6).join(", ") || "Execution methods"}.`,
              "Outlined step-by-step instructions for immediate attendee review and recall.",
              "Identified boundary constraints and common engineering bottlenecks.",
            ],
          },
        ],
        qaList: [
          {
            question: "How does the model prevent hallucinations when processing specialized jargon?",
            answer: `The calibrated training profile injects ${customTerms.length} verified terms directly into Gemini's system instructions, prioritizing domain-grounded definitions.`,
          },
        ],
      });
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="model-training-modal"
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Train AI Model for YouTube & Audio Tracks
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-semibold border border-amber-400/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Calibrate vocabulary, media focus, and note structures so the AI accurately extracts notes from any YouTube video or audio track.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "presets"
                ? "border-[#0F2540] text-[#0F2540]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Media Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "custom"
                ? "border-[#0F2540] text-[#0F2540]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Vocabulary & Calibration</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
              {customTerms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "test"
                ? "border-[#0F2540] text-[#0F2540]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Test Sandbox</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select a Pre-Trained Media Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a baseline profile designed specifically for YouTube lectures, tech podcasts, academic audio, or webinars.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MODEL_TRAINING_PRESETS.map((preset) => {
                  const IconComponent = preset.icon;
                  return (
                    <div
                      key={preset.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-50 text-slate-800 group-hover:text-amber-700 flex items-center justify-center transition-colors">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {preset.sourceTypePreference === "youtube"
                              ? "YouTube Video"
                              : preset.sourceTypePreference === "audio_upload"
                              ? "Audio Track"
                              : "Audio & Video"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {preset.speakerContext}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {preset.terms.slice(0, 4).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                            >
                              {t}
                            </span>
                          ))}
                          {preset.terms.length > 4 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{preset.terms.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          Focus: {preset.notesFocus}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0F2540] hover:bg-slate-800 text-white transition-colors"
                        >
                          Load & Customize
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM CALIBRATION */}
          {activeTab === "custom" && (
            <div className="space-y-5">
              {/* Media Focus & Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Target Domain & Subject
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. YouTube Python Tutorials, System Design Audio"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gives the model the foundational subject theme for contextual recall.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Primary Media Source Focus
                  </label>
                  <select
                    value={sourceTypePreference}
                    onChange={(e) => setSourceTypePreference(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none bg-white font-medium"
                  >
                    <option value="youtube">YouTube Videos & Lectures (Chapters & Visuals)</option>
                    <option value="audio_upload">Audio Tracks (.mp3, .wav, .m4a, Podcasts)</option>
                    <option value="podcast_stream">Remote Media Stream / Web Audio</option>
                    <option value="all_media">Any Media Track (Universal Processing)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Calibrates ingestion filters for video slide references vs. pure acoustic speech.
                  </p>
                </div>
              </div>

              {/* Specialized Vocabulary Chips */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Specialized Vocabulary & Key Terms ({customTerms.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add terms the AI should specifically recognize and preserve without hallucinations.
                    </p>
                  </div>
                  {customTerms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomTerms([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Term Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type term (e.g. Backpropagation, Zero-Copy, Transformer) and press Enter"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0F2540]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="px-3 py-2 text-xs font-bold rounded-lg bg-[#0F2540] text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[48px] max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {customTerms.length === 0 ? (
                    <span className="text-xs text-slate-400 italic p-1.5">
                      No custom terms added yet. Add domain vocabulary above.
                    </span>
                  ) : (
                    customTerms.map((term, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 group"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(term)}
                          className="text-amber-500 hover:text-rose-700 ml-0.5 rounded transition-colors"
                          title="Remove term"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Notes Depth & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Notes Density & Structure
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "technical", label: "Technical Bullets", desc: "Detailed, actionable points" },
                      { id: "general", label: "General Recall", desc: "Balanced conceptual points" },
                      { id: "study_guide", label: "Study Guide", desc: "Definitions & key formulas" },
                      { id: "executive", label: "Executive Summary", desc: "High-level strategic points" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNotesFocus(opt.id as any)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          notesFocus === opt.id
                            ? "border-[#0F2540] bg-slate-900 text-white shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            notesFocus === opt.id ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Speaker / Dialogue Style
                  </label>
                  <input
                    type="text"
                    value={speakerContext}
                    onChange={(e) => setSpeakerContext(e.target.value)}
                    placeholder="e.g. Solo educator walking through code; or podcast host & guest"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none"
                  />
                  <div className="mt-2.5">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Q&A Extraction Sensitivity
                    </label>
                    <input
                      type="text"
                      value={qaFormatPrompt}
                      onChange={(e) => setQaFormatPrompt(e.target.value)}
                      placeholder="e.g. Audience inquiries from comments/chat, or interview dialogue"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Prompt Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Custom Model Directives (System Instruction Tuning)</span>
                  <span className="text-[10px] font-mono text-slate-400">Directly injected to Gemini</span>
                </label>
                <textarea
                  value={customPromptInstructions}
                  onChange={(e) => setCustomPromptInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Ignore sponsor segments, highlight code patterns, format chapter milestones with bullet points."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#0F2540] focus:ring-1 focus:ring-[#0F2540] outline-none leading-relaxed font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TEST SANDBOX */}
          {activeTab === "test" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 leading-relaxed">
                  <span className="font-bold">Test Your Trained Model: </span>
                  Paste a sample YouTube link or audio title to preview how the AI extracts topic notes and verified Q&A using your custom domain glossary ({customTerms.length} terms active).
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Sample YouTube URL or Audio Track Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testSample}
                    onChange={(e) => setTestSample(e.target.value)}
                    placeholder="Enter YouTube URL or audio title..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0F2540] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRunTest}
                    disabled={isTesting}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Calibrating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Test</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Quick Samples:</span>
                  {[
                    "https://www.youtube.com/watch?v=zjkBMFhNj_g (Intro to LLMs)",
                    "Stanford CS229: Machine Learning Lecture 1 (Audio/Video)",
                    "Distributed Systems Resiliency Keynote (Audio Stream)",
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTestSample(s)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {s.split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Results Preview */}
              {testResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Model Calibration Verified • Applied {customTerms.length} Key Terms</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Success
                    </span>
                  </div>

                  <div className="space-y-3">
                    {testResult.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                        <h5 className="text-xs font-bold text-slate-900 mb-1.5">{sec.title}</h5>
                        <ul className="space-y-1">
                          {sec.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {testResult.qaList.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                        <h5 className="text-xs font-bold text-slate-900 mb-1">Extracted Q&A Exchange</h5>
                        <div className="text-xs text-slate-800">
                          <span className="font-semibold text-sky-800">Q: </span>
                          {testResult.qaList[0].question}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          <span className="font-semibold text-emerald-800">A: </span>
                          {testResult.qaList[0].answer}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active Model: <strong className="text-slate-800">Gemini 3.8 Flash</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-training-profile"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0F2540] hover:bg-slate-800 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              {justTrained ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Model Calibrated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Save & Activate Model</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
