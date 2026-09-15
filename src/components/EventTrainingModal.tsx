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
} from "lucide-react";
import { EventTrainingProfile } from "../types";

interface EventTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EventTrainingProfile;
  onSaveProfile: (profile: EventTrainingProfile) => void;
}

const PRESET_TEMPLATES = [
  {
    name: "Cloud & Distributed Systems",
    domain: "Distributed Computing, Cloud Architecture & SRE",
    icon: Cpu,
    terms: ["Microservices", "Circuit Breaker", "Bulkheading", "Idempotency", "Redis Cluster", "RPC", "Chaos Mesh", "SLA / SLO", "Latency p99"],
    speakerContext: "Principal Systems Architect explaining resilient high-concurrency cloud patterns",
    qaFormatPrompt: "Audience Q&A at aisle microphones focusing on production outages and database tradeoffs",
    notesFocus: "technical" as const,
  },
  {
    name: "Cognitive Science & Pedagogy",
    domain: "Cognitive Psychology, Neuroplasticity & Educational Science",
    icon: GraduationCap,
    terms: ["Testing Effect", "Spaced Retrieval", "Fluency Illusion", "Desirable Difficulties", "Interleaving", "Synaptic Consolidation", "Bjork Paradigm"],
    speakerContext: "University Professor and Cognitive Neuroscientist",
    qaFormatPrompt: "Students and teaching fellows inquiring about practical study strategies and learning friction",
    notesFocus: "general" as const,
  },
  {
    name: "AI & Vector Search Summit",
    domain: "Machine Learning, Vector Databases & Approximate Nearest Neighbors",
    icon: Zap,
    terms: ["HNSW", "Inverted File (IVF)", "Product Quantization (PQ)", "Scalar Quantization", "Cosine Distance", "Embeddings", "GPU Acceleration"],
    speakerContext: "AI Research Engineer detailing billion-scale similarity indexing",
    qaFormatPrompt: "ML Practitioners asking about memory footprint, query latency, and indexing tradeoffs",
    notesFocus: "technical" as const,
  },
  {
    name: "Executive & Product Strategy",
    domain: "Technology Leadership, Product Management & Venture Operations",
    icon: Briefcase,
    terms: ["Product-Market Fit", "Retention Cohorts", "Unit Economics", "GTM Velocity", "Capital Efficiency", "OKRs"],
    speakerContext: "Product Executive detailing multi-quarter roadmap execution",
    qaFormatPrompt: "Stakeholders questioning resource prioritization and market timing",
    notesFocus: "executive" as const,
  },
];

export const EventTrainingModal: React.FC<EventTrainingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [domain, setDomain] = useState(profile.domain || "Distributed Systems & Cloud Architecture");
  const [customTerms, setCustomTerms] = useState<string[]>(profile.customTerms || []);
  const [newTerm, setNewTerm] = useState("");
  const [speakerContext, setSpeakerContext] = useState(profile.speakerContext || "");
  const [qaFormatPrompt, setQaFormatPrompt] = useState(profile.qaFormatPrompt || "");
  const [targetCadence, setTargetCadence] = useState<"realtime" | "interval" | "ondemand">(
    profile.targetCadence || "interval"
  );
  const [notesFocus, setNotesFocus] = useState<"technical" | "general" | "executive">(
    profile.notesFocus || "technical"
  );
  const [justTrained, setJustTrained] = useState(false);

  if (!isOpen) return null;

  const handleAddTerm = () => {
    const trimmed = newTerm.trim();
    if (trimmed && !customTerms.includes(trimmed)) {
      setCustomTerms([...customTerms, trimmed]);
      setNewTerm("");
    }
  };

  const handleRemoveTerm = (termToRemove: string) => {
    setCustomTerms(customTerms.filter((t) => t !== termToRemove));
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setDomain(preset.domain);
    setCustomTerms(preset.terms);
    setSpeakerContext(preset.speakerContext);
    setQaFormatPrompt(preset.qaFormatPrompt);
    setNotesFocus(preset.notesFocus);
  };

  const handleSave = () => {
    const updated: EventTrainingProfile = {
      domain: domain.trim(),
      customTerms,
      speakerContext: speakerContext.trim(),
      qaFormatPrompt: qaFormatPrompt.trim(),
      targetCadence,
      notesFocus,
      isLiveTrained: true,
    };
    onSaveProfile(updated);
    setJustTrained(true);
    setTimeout(() => {
      setJustTrained(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F2540] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C98A2C]/20 text-[#C98A2C] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Train Live Event Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Custom AI Calibration
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Prime speech recognition and note segmentation with event glossary, speaker context, and Q&A guidelines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Quick Event Templates (1-Click Training)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                const isCurrent = domain === tpl.domain;
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleApplyPreset(tpl)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                      isCurrent
                        ? "bg-[#0F2540] text-white border-[#0F2540] shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCurrent ? "text-[#C98A2C]" : "text-slate-500"}`} />
                    <span className="text-xs font-semibold leading-tight line-clamp-1">
                      {tpl.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Domain & Topic Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Event Subject Domain & Topic Context</span>
              <span className="text-[11px] text-slate-400">Guiding theme</span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. High-Concurrency Distributed Systems, Kubernetes, Cloud Databases"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
            />
          </div>

          {/* Lexicon / Custom Terms Tag Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C98A2C]" />
                <span>Specialized Terminology & Key Acronyms ({customTerms.length})</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Prevents mishearing complex terms in live audio
              </span>
            </div>

            {/* Input to add tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                placeholder="Type keyword / speaker name / acronym and press Add (e.g. Idempotency, gRPC, Dr. Thorne)"
                className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3.5 py-2 rounded-xl bg-[#0F2540] text-white text-xs font-semibold hover:bg-[#17375E] flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Term</span>
              </button>
            </div>

            {/* Terms Pill Container */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {customTerms.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No specialized terms added yet. Add terms above or select a preset template.
                </span>
              ) : (
                customTerms.map((term) => (
                  <span
                    key={term}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 shadow-2xs group"
                  >
                    <span>{term}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(term)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Q&A Structure Training */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Speaker & Presentation Context
              </label>
              <input
                type="text"
                value={speakerContext}
                onChange={(e) => setSpeakerContext(e.target.value)}
                placeholder="e.g. Keynote presentation with slide checkpoints"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Audience Q&A Dynamic
              </label>
              <input
                type="text"
                value={qaFormatPrompt}
                onChange={(e) => setQaFormatPrompt(e.target.value)}
                placeholder="e.g. In-person questions at microphone; moderator announces names"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Live Cadence & Notes Granularity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Live Processing Cadence
              </label>
              <select
                value={targetCadence}
                onChange={(e) => setTargetCadence(e.target.value as any)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
              >
                <option value="interval">Live Checkpoint every 60s (Recommended)</option>
                <option value="realtime">Continuous Real-Time Stream (30s Chunks)</option>
                <option value="ondemand">Manual On-Demand Checkpoint Trigger</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Note Depth & Synthesis Style
              </label>
              <select
                value={notesFocus}
                onChange={(e) => setNotesFocus(e.target.value as any)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#0F2540] focus:outline-hidden"
              >
                <option value="technical">Technical & Architectural Precision (Bullets)</option>
                <option value="general">Comprehensive Pedagogical Concepts</option>
                <option value="executive">Executive Takeaways & Action Items</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Trained context will be injected into live acoustic & speech processing.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-event-training"
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all flex items-center gap-1.5 ${
                justTrained
                  ? "bg-emerald-600"
                  : "bg-[#0F2540] hover:bg-[#17375E]"
              }`}
            >
              {justTrained ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Calibrated & Active!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C98A2C]" />
                  <span>Calibrate & Save Training</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
