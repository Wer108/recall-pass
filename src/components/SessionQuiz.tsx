import React, { useMemo, useState } from "react";
import { Brain, ArrowRight, Check, RotateCcw, Download, BookOpen } from "lucide-react";
import { SessionData } from "../types";
import { buildSessionQuiz, isRecallAnswerCorrect, RecallQuestion } from "../utils/sessionQuiz";

type Attempt = { question: RecallQuestion; answer: string; correct: boolean; confident: boolean; hinted: boolean };
const button = "rounded-lg px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C98A2C] disabled:opacity-40";
export const SessionQuiz: React.FC<{ session: SessionData; onReviewTopic: (index: number) => void }> = ({ session, onReviewTopic }) => {
  const questions = useMemo(() => buildSessionQuiz(session), [session]);
  const [round, setRound] = useState<RecallQuestion[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<"sure" | "unsure" | "">("");
  const [hinted, setHinted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [previous, setPrevious] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`recallpass_quiz_v1_${session.accessCode}`) || "null");
      return saved && Number.isInteger(saved.correct) && Number.isInteger(saved.total) && saved.total > 0 && saved.correct >= 0 && saved.correct <= saved.total ? saved : null;
    } catch { return null; }
  });
  const current = round[attempts.length - (revealed ? 1 : 0)];
  const latest = attempts.at(-1);
  const weak = attempts.filter(a => !a.correct || !a.confident || a.hinted);
  const correct = attempts.filter(a => a.correct).length;

  function start(items: RecallQuestion[]) {
    setRound(items); setAttempts([]); setAnswer(""); setConfidence(""); setHinted(false);
    setRevealed(false); setFinished(false); setStarted(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || revealed || !answer.trim() || !confidence) return;
    setAttempts([...attempts, { question: current, answer: answer.trim(), correct: isRecallAnswerCorrect(answer, current.answer), confident: confidence === "sure", hinted }]);
    setRevealed(true);
  }
  function next() {
    if (attempts.length === round.length) {
      setFinished(true);
      const result = { correct, total: round.length, date: new Date().toISOString() };
      setPrevious(result);
      try { localStorage.setItem(`recallpass_quiz_v1_${session.accessCode}`, JSON.stringify(result)); } catch { /* Practice works without storage. */ }
    } else {
      setAnswer(""); setConfidence(""); setHinted(false); setRevealed(false);
    }
  }
  function download() {
    const text = [session.title, `Recall practice: ${correct}/${round.length} correct`, "",
      ...attempts.flatMap(a => [a.question.topic, a.question.prompt, `Your answer: ${a.answer}`,
        `Solution: ${a.question.answer}`, `Source note: ${a.question.source}`, `Watch out: ${a.question.pitfall}`, ""])
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = "recall-practice.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section id="session-quiz" aria-labelledby="quiz-heading" className="rounded-2xl border border-[#0F2540]/20 bg-white overflow-hidden print:hidden">
    <div className="bg-[#0F2540] text-white p-6 sm:p-8 flex items-start gap-4">
      <Brain className="w-7 h-7 text-[#E8BF78] shrink-0" />
      <div>
        <p className="text-xs uppercase tracking-widest text-[#E8BF78] font-semibold">Your recall lab · Optional practice</p>
        <h2 id="quiz-heading" className="text-2xl font-bold mt-2">Turn notes into knowledge.</h2>
        <p className="text-sm text-slate-200 mt-2 max-w-xl">Recall a missing concept, check your confidence, then compare with the exact session note. Find what needs another look.</p>
      </div>
    </div>
    <div className="p-6 sm:p-8 space-y-5">
      {!started ? <>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"><span>{questions.length} short questions</span><span>Source-backed solutions</span><span>Focused retry</span></div>
        <p className="text-sm text-slate-600">This checks recall of the words in your notes. It does not grade a full explanation or certify mastery.</p>
        {previous && <p className="text-sm text-[#0F6E56]">Last practice on this browser: {previous.correct}/{previous.total} correct.</p>}
        <button id="btn-quiz-me" disabled={!questions.length} onClick={() => start(questions)} className={button + " bg-[#0F2540] text-white inline-flex items-center gap-2"}>Quiz me <ArrowRight className="w-4 h-4" /></button>
        {!questions.length && <p className="text-sm text-slate-500">There are no suitable topic notes for a recall quiz yet.</p>}
      </> : finished ? <div className="space-y-5" aria-live="polite">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Practice complete</p><h3 className="text-3xl font-bold text-[#0F2540] mt-1">{correct} / {round.length} correct</h3>
        <p className="text-sm text-slate-600 mt-2">{weak.length ? `${weak.length} concepts to revisit, including hinted or uncertain answers.` : "You recalled every word confidently. Try explaining each concept in your own words tomorrow."}</p></div>
        {attempts.some(a => !a.correct && a.confident) && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Confidence check: you felt sure about an incorrect answer. Review those notes first to catch a possible misunderstanding.</p>}
        <div className="space-y-3">{attempts.map((a, index) => <div key={a.question.id} className="border-t border-slate-200 pt-4">
          <div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold text-[#0F2540]">{index + 1}. {a.question.topic}</h4><span className={a.correct ? "text-emerald-700 text-sm" : "text-amber-800 text-sm"}>{a.correct ? "Correct" : "Review"}{a.hinted ? " · Hint used" : ""}{!a.confident ? " · Unsure" : ""}</span></div>
          <p className="text-sm mt-2">{a.question.source}</p>
          <button onClick={() => onReviewTopic(a.question.sectionIndex)} className="text-sm underline underline-offset-4 text-[#0F6E56] mt-2">Return to source note</button>
        </div>)}</div>
        <div className="flex flex-wrap gap-2">
          {!!weak.length && <button onClick={() => start(weak.map(a => a.question))} className={button + " bg-[#0F2540] text-white"}>Retry review concepts</button>}
          <button onClick={() => start(questions)} className={button + " bg-slate-100 text-[#0F2540] inline-flex gap-2 items-center"}><RotateCcw className="w-4 h-4" />Practice again</button>
          <button onClick={download} className={button + " border border-slate-300 inline-flex gap-2 items-center"}><Download className="w-4 h-4" />Save study report</button>
        </div>
      </div> : current && <>
        <div className="flex justify-between gap-3 text-sm"><span className="font-semibold text-[#0F2540]">Question {attempts.length + (revealed ? 0 : 1)} of {round.length}</span><span className="text-slate-500">{current.topic}</span></div>
        <progress aria-label="Quiz progress" value={attempts.length} max={round.length} className="w-full h-2 accent-[#0F6E56]" />
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="quiz-answer" className="block text-lg font-medium text-[#0F2540] leading-relaxed">{current.prompt}</label>
          <p className="text-sm text-slate-500">Which word completes this note? Spelling matters; capitalization and punctuation do not.</p>
          <input id="quiz-answer" autoComplete="off" value={answer} disabled={revealed} onChange={e => setAnswer(e.target.value)} placeholder="Type the missing word" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-2 focus:outline-[#0F2540]" />
          {!revealed && <>
            <fieldset><legend className="text-sm font-semibold mb-2">How confident are you?</legend><div className="flex flex-wrap gap-4">
              {(["sure", "unsure"] as const).map(value => <label key={value} className="flex gap-2 items-center text-sm"><input type="radio" name="confidence" value={value} checked={confidence === value} onChange={() => setConfidence(value)} />{value === "sure" ? "I’m sure" : "I’m still learning"}</label>)}
            </div></fieldset>
            {hinted && <p className="text-sm text-amber-900" role="status">Hint: starts with “{current.answer[0]}” and has {current.answer.length} characters.</p>}
            <div className="flex flex-wrap gap-2"><button type="submit" disabled={!answer.trim() || !confidence} className={button + " bg-[#0F2540] text-white"}>Check answer</button><button type="button" onClick={() => setHinted(true)} className={button + " text-slate-600 border border-slate-300"}>Give me a hint</button></div>
          </>}
        </form>
        {revealed && latest && <div aria-live="polite" className="space-y-4 border-t border-slate-200 pt-5">
          <h3 className="text-lg font-bold text-[#0F2540] flex items-center gap-2">{latest.correct ? <Check className="w-5 h-5 text-emerald-700" /> : <BookOpen className="w-5 h-5 text-amber-700" />}{latest.correct ? "You recalled it." : "Let’s close the gap."}</h3>
          <p className="text-sm"><strong>Solution:</strong> {current.answer}</p>
          <blockquote className="border-l-4 border-[#C98A2C] pl-4 text-sm leading-relaxed text-slate-700">{current.source}<cite className="block text-xs mt-2 not-italic text-slate-500">Session notes · {current.topic}</cite></blockquote>
          <p className="text-sm text-slate-600"><strong>Common mistake to avoid:</strong> {current.pitfall}</p>
          <p className="text-sm text-slate-600"><strong>Go deeper:</strong> Explain this idea without looking, then give one example of when you would use it.</p>
          <button onClick={next} className={button + " bg-[#0F2540] text-white"}>{attempts.length === round.length ? "See my review" : "Next question"}</button>
        </div>}
      </>}
    </div>
  </section>;
}
