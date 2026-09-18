import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, CalendarDays, Target } from "lucide-react";
import { SessionData } from "../types";
import { loadQuizProgress, QUIZ_PROGRESS_EVENT } from "../utils/learningProgress";

export const LearningAnalytics: React.FC<{ session: SessionData; onStartPractice: () => void }> = ({ session, onStartPractice }) => {
  const [progress, setProgress] = useState(() => loadQuizProgress(session.accessCode));
  useEffect(() => {
    const refresh = (event?: Event) => {
      if (event instanceof CustomEvent && event.detail?.accessCode !== session.accessCode) return;
      setProgress(loadQuizProgress(session.accessCode));
    };
    window.addEventListener("storage", refresh);
    window.addEventListener(QUIZ_PROGRESS_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(QUIZ_PROGRESS_EVENT, refresh); };
  }, [session.accessCode]);

  const stats = useMemo(() => {
    const attempts = progress.runs.flatMap(run => run.attempts || []);
    const correct = attempts.filter(item => item.correct).length;
    const confident = attempts.filter(item => item.confident);
    const confidentCorrect = confident.filter(item => item.correct).length;
    const topics = session.sections.map(section => {
      const topicAttempts = attempts.filter(item => item.topic === section.title);
      return { title: section.title, total: topicAttempts.length, score: topicAttempts.length ? Math.round(topicAttempts.filter(item => item.correct).length / topicAttempts.length * 100) : 0 };
    });
    return { attempts, correct, confidence: confident.length ? Math.round(confidentCorrect / confident.length * 100) : 0, topics };
  }, [progress, session.sections]);
  const latest = progress.runs.at(-1);

  return <section aria-labelledby="analytics-title" className="space-y-6">
    <div className="rounded-2xl bg-[#0F2540] p-6 text-white sm:p-8"><div className="flex items-start gap-4"><div className="rounded-xl bg-white/10 p-3"><BarChart3 className="h-6 w-6 text-[#E8BF78]" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8BF78]">Your learning signal</p><h2 id="analytics-title" className="mt-1 text-2xl font-bold">Learning analytics</h2><p className="mt-2 text-sm text-slate-200">Private progress from quizzes completed for this pass on this browser.</p></div></div></div>
    {!latest ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><Brain className="mx-auto h-9 w-9 text-[#C98A2C]" /><h3 className="mt-4 text-xl font-bold text-[#0F2540]">Build your first learning signal</h3><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Complete the recall quiz and this page will show your score, confidence accuracy, and topic-level practice.</p><button type="button" onClick={onStartPractice} className="mt-5 rounded-lg bg-[#0F2540] px-5 py-2.5 text-sm font-semibold text-white">Go to quiz</button></div> : <>
      <div className="grid gap-4 sm:grid-cols-3"><Metric icon={Target} label="Latest score" value={`${latest.correct}/${latest.total}`} detail={`${Math.round(latest.correct / latest.total * 100)}% recalled`} /><Metric icon={Brain} label="Confidence accuracy" value={`${stats.confidence}%`} detail="When you felt sure" /><Metric icon={CalendarDays} label="Practice rounds" value={String(progress.runs.length)} detail={`${stats.attempts.length || latest.total} answers reviewed`} /></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-lg font-bold text-[#0F2540]">Topic mastery</h3><p className="mt-1 text-sm text-slate-600">Based on recall answers, not a formal assessment.</p></div><button type="button" onClick={onStartPractice} className="text-sm font-semibold text-[#0F6E56] underline underline-offset-4">Practice again</button></div><div className="mt-6 space-y-5">{stats.topics.map(topic => <div key={topic.title}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{topic.title}</span><span className="text-slate-500">{topic.total ? `${topic.score}%` : "Not practiced"}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0F6E56] transition-all" style={{ width: `${topic.score}%` }} /></div></div>)}</div></div>
    </>}
  </section>;
};

const Metric: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string; detail: string }> = ({ icon: Icon, label, value, detail }) => <div className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-[#C98A2C]" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-[#0F2540]">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
