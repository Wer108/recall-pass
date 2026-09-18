import { SessionData } from "../types";

export interface RecallQuestion {
  id: string;
  topic: string;
  prompt: string;
  answer: string;
  source: string;
  sectionIndex: number;
  pitfall: string;
}
const stopWords = new Set("about after again against along already also always among another because before being between could every first found from further having into itself their there these they this those through under using very what when where which while with without would should rather often other only than that then them such some more most must does each have has are were was will can may not and the for you your".split(" "));
export function buildSessionQuiz(session: SessionData): RecallQuestion[] {
  if (session.isExpired || Date.parse(session.expiresAt) <= Date.now()) return [];
  const byTopic = session.sections.map((section, sectionIndex) =>
    section.bullets.flatMap((source, bulletIndex) => {
      const candidates = source.match(/\b[A-Za-z][A-Za-z-]{3,}\b/g) || [];
      const answer = candidates.filter(word => !stopWords.has(word.toLowerCase()) && !/ly$/i.test(word))
        .sort((a, b) => b.length - a.length)[0];
      if (!answer) return [];
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const prompt = source.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "________");
      return [{
        id: `s${sectionIndex}-b${bulletIndex}`, topic: section.title, prompt, answer, source, sectionIndex,
        pitfall: /\b(not|never|without|avoid|only)\b/i.test(source)
          ? "Watch the qualifier: overlooking words such as “not”, “only”, or “without” can reverse the meaning of this note."
          : /\d/.test(source)
          ? "Keep the number and its context together. A value on its own does not explain when this idea applies."
          : "Remember the relationship in the whole sentence, not just the missing word. Explain why the concept matters before moving on.",
      }];
    })
  );
  // Interleave topics so a long first section cannot crowd out the others.
  const questions: RecallQuestion[] = [];
  for (let row = 0; questions.length < 12; row++) {
    let added = false;
    for (const topic of byTopic) {
      if (topic[row] && questions.length < 12) { questions.push(topic[row]); added = true; }
    }
    if (!added) break;
  }
  return questions;
}
export function isRecallAnswerCorrect(answer: string, expected: string): boolean {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalize(answer) === normalize(expected);
}
