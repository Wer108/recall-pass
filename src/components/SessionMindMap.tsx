import React, { useState } from "react";
import { GitBranch, Lightbulb } from "lucide-react";
import { SessionData } from "../types";

export const SessionMindMap: React.FC<{ session: SessionData }> = ({ session }) => {
  const [selected, setSelected] = useState(0);
  const topic = session.sections[selected];
  return <section aria-labelledby="mind-map-title" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex items-start gap-4"><div className="rounded-xl bg-[#EEF8F5] p-3"><GitBranch className="h-6 w-6 text-[#0F6E56]" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0F6E56]">See the connections</p><h2 id="mind-map-title" className="mt-1 text-2xl font-bold text-[#0F2540]">Session mind map</h2><p className="mt-2 text-sm text-slate-600">Choose a branch to explore the key points behind each topic.</p></div></div>
    {topic ? <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="rounded-2xl bg-[#0F2540] p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-[#E8BF78]">Central idea</p><h3 className="mt-2 text-xl font-bold">{session.title}</h3><div className="my-5 h-px bg-white/15" /><div className="grid gap-2">{session.sections.map((section, index) => <button key={section.id} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${selected === index ? "border-[#E8BF78] bg-white text-[#0F2540]" : "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"}`}><span className="mr-2 text-xs opacity-60">{String(index + 1).padStart(2, "0")}</span>{section.title}</button>)}</div></div>
      <article className="rounded-2xl border border-[#7FC0AE] bg-[#EEF8F5] p-5 sm:p-6"><div className="flex items-center gap-2 text-[#0F6E56]"><Lightbulb className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">Selected branch</span></div><h3 className="mt-3 text-xl font-bold text-[#0F2540]">{topic.title}</h3><div className="mt-5 space-y-3">{topic.bullets.map((bullet, index) => <div key={index} className="rounded-xl border border-white bg-white p-4 shadow-xs"><p className="text-xs font-bold text-[#0F6E56]">KEY POINT {index + 1}</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{bullet}</p></div>)}</div></article>
    </div> : <p className="mt-6 text-sm text-slate-500">No topic branches are available yet.</p>}
  </section>;
};
