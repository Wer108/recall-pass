import React, { useEffect, useMemo, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { SessionData } from "../types";

function recapText(session: SessionData) {
  const introduction = `Audio recap for ${session.title}.${session.speaker ? ` Presented by ${session.speaker}.` : ""}`;
  const topics = session.sections.map((section, index) =>
    `Topic ${index + 1}: ${section.title}. ${section.bullets.join(" ")}`
  );
  const questions = session.qaList.length
    ? [`Questions and answers. ${session.qaList.map(item => `${item.question} ${item.answer}`).join(" ")}`]
    : [];
  return [introduction, ...topics, ...questions, "That is the end of this recap."].join(" ");
}

export const AudioRecap: React.FC<{ session: SessionData }> = ({ session }) => {
  const script = useMemo(() => recapText(session), [session]);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState(1);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported, session.accessCode]);

  function speakFromStart() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = rate;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  }

  function play() {
    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    speakFromStart();
  }

  function pause() {
    window.speechSynthesis.pause();
    setStatus("paused");
  }

  function restart() {
    speakFromStart();
  }

  return <section aria-labelledby="audio-recap-title" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
    <div className="bg-[#0F2540] px-6 py-7 text-white sm:px-8">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-white/10 p-3"><Headphones className="h-6 w-6 text-[#E8BF78]" /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8BF78]">Listen and review</p><h2 id="audio-recap-title" className="mt-2 text-2xl font-bold">Audio recap</h2><p className="mt-2 max-w-2xl text-sm text-slate-200">A spoken summary built only from this session’s saved notes and Q&amp;A.</p></div>
      </div>
    </div>
    <div className="space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
        <button type="button" onClick={status === "playing" ? pause : play} disabled={!supported} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2540] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{status === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Play recap"}</button>
        <button type="button" onClick={restart} disabled={!supported} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#0F2540] disabled:opacity-50"><RotateCcw className="h-4 w-4" />Restart</button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600"><Volume2 className="h-4 w-4" /><span>Speed</span><select value={rate} onChange={event => { setRate(Number(event.target.value)); if (status !== "idle") { window.speechSynthesis.cancel(); setStatus("idle"); } }} className="rounded-lg border border-slate-300 bg-white px-2 py-2"><option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option></select></label>
      </div>
      {!supported && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Audio narration is unavailable in this browser. The full recap is available below.</p>}
      <div><h3 className="font-bold text-[#0F2540]">Recap transcript</h3><div className="mt-4 space-y-5">{session.sections.map((section, index) => <article key={section.id} className="border-l-2 border-[#C98A2C] pl-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Topic {index + 1}</p><h4 className="mt-1 font-semibold text-[#0F2540]">{section.title}</h4><ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">{section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>• {bullet}</li>)}</ul></article>)}</div></div>
    </div>
  </section>;
};
