import { QAPair, TopicSection } from "../types";

export interface LiveCheckpointResult {
  sections: TopicSection[];
  qaList: QAPair[];
  sourceWordCount: number;
}

const speakerLine = /^(?<speaker>[^:\n]{2,60}):\s*(?<text>.+)$/;
const questionSpeaker = /audience|attendee|student|member|guest|participant|question/i;

function cleanSpokenText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitSpokenSentences(text: string): string[] {
  return cleanSpokenText(text)
    .split(/(?<=[.!?])\s+/)
    .map(cleanSpokenText)
    .filter(sentence => sentence.length >= 12);
}

function checkpointTitle(sentences: string[], index: number): string {
  const words = sentences[0]
    ?.replace(/^[^:]{2,60}:\s*/, "")
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 6);
  return words?.length ? words.join(" ") : `Live checkpoint ${index + 1}`;
}

/**
 * Builds live notes without inventing content. Every bullet is an exact,
 * whitespace-normalized sentence from the transcript shown on screen.
 */
export function buildGroundedLiveCheckpoint(transcript: string): LiveCheckpointResult {
  const cleanTranscript = transcript.trim();
  const sourceWordCount = cleanTranscript.split(/\s+/).filter(Boolean).length;
  if (!cleanTranscript || sourceWordCount < 3) {
    return { sections: [], qaList: [], sourceWordCount };
  }

  const paragraphs = cleanTranscript
    .split(/\n\s*\n+/)
    .map(cleanSpokenText)
    .filter(Boolean);
  const allSentences = paragraphs.flatMap(splitSpokenSentences);
  const usableSentences = allSentences.length ? allSentences : [cleanSpokenText(cleanTranscript)];

  const sections: TopicSection[] = [];
  for (let offset = 0; offset < usableSentences.length && sections.length < 6; offset += 4) {
    const bullets = usableSentences.slice(offset, offset + 4);
    sections.push({
      id: `live-grounded-${sections.length}-${bullets.join(" ").slice(0, 24)}`,
      title: checkpointTitle(bullets, sections.length),
      bullets,
    });
  }

  const turns = paragraphs
    .map(paragraph => paragraph.match(speakerLine)?.groups)
    .filter((turn): turn is { speaker: string; text: string } => Boolean(turn?.speaker && turn?.text));
  const qaList: QAPair[] = [];
  for (let index = 0; index < turns.length - 1; index++) {
    const question = turns[index];
    const answer = turns[index + 1];
    if (questionSpeaker.test(question.speaker) && question.text.includes("?") && !questionSpeaker.test(answer.speaker)) {
      qaList.push({
        id: `live-qa-${index}-${question.text.slice(0, 20)}`,
        question: question.text,
        answer: answer.text,
        askerContext: question.speaker,
      });
      index++;
    }
  }

  return { sections, qaList, sourceWordCount };
}
