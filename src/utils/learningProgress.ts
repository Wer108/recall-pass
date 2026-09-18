export interface QuizAttemptSummary {
  topic: string;
  correct: boolean;
  confident: boolean;
  hinted: boolean;
}

export interface QuizRun {
  correct: number;
  total: number;
  date: string;
  attempts: QuizAttemptSummary[];
}

export interface QuizProgress {
  runs: QuizRun[];
}

export const QUIZ_PROGRESS_EVENT = "recallpass:quiz-progress";

const keyFor = (accessCode: string) => `recallpass_quiz_v1_${accessCode}`;

function validRun(value: unknown): value is QuizRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<QuizRun>;
  return Number.isInteger(run.correct) && Number.isInteger(run.total) &&
    (run.total || 0) > 0 && (run.correct || 0) >= 0 &&
    (run.correct || 0) <= (run.total || 0) && typeof run.date === "string";
}

export function loadQuizProgress(accessCode: string): QuizProgress {
  if (typeof localStorage === "undefined") return { runs: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(accessCode)) || "null");
    if (saved && Array.isArray(saved.runs)) {
      return { runs: saved.runs.filter(validRun).map((run: QuizRun) => ({ ...run, attempts: Array.isArray(run.attempts) ? run.attempts : [] })) };
    }
    // Read quiz results saved by earlier RecallPass versions.
    if (validRun(saved)) return { runs: [{ ...saved, attempts: [] }] };
  } catch { /* Learning features still work when storage is unavailable. */ }
  return { runs: [] };
}

export function recordQuizRun(accessCode: string, run: QuizRun): QuizProgress {
  const current = loadQuizProgress(accessCode);
  const progress = { runs: [...current.runs, run].slice(-20) };
  try {
    localStorage.setItem(keyFor(accessCode), JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent(QUIZ_PROGRESS_EVENT, { detail: { accessCode } }));
  } catch { /* Keep the completed quiz usable in private browsing. */ }
  return progress;
}
