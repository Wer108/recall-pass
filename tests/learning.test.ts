import assert from "node:assert/strict";
import { test } from "node:test";
import { generateAccessCode } from "../src/utils/accessCode";
import { buildSessionQuiz, isRecallAnswerCorrect } from "../src/utils/sessionQuiz";
import { SessionData } from "../src/types";

test("new pass IDs contain both letters and digits and are unique", () => {
  const codes = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    const code = generateAccessCode(codes);
    assert.match(code, /^RP-[A-Z2-9]{6}$/);
    assert.match(code.slice(3), /[A-Z]/);
    assert.match(code.slice(3), /[2-9]/);
    assert.equal(code.slice(3).replace(/[A-Z]/g, "").length, 1);
    assert.equal(codes.has(code), false);
    codes.add(code);
  }
});

const session: SessionData = {
  id: "test", accessCode: "RP-TEST23", title: "Session", createdAt: "2026-01-01",
  expiresAt: "2099-01-01", published: true, qaList: [],
  sections: [
    { id: "a", title: "Resilience", bullets: ["Circuit breakers prevent cascading failures.", "Always enforce timeouts."] },
    { id: "b", title: "Numbers", bullets: ["Monitor latency at 99 percent."] },
  ],
};
test("quiz answers and solutions come from the session and cover topics", () => {
  const questions = buildSessionQuiz(session);
  assert.equal(questions.length, 3);
  const concept = buildSessionQuiz({ ...session, sections: [{ id: "c", title: "Network", bullets: ["The network is inherently unreliable."] }] });
  assert.equal(concept[0].answer, "unreliable");
  assert.deepEqual(questions.map(q => q.sectionIndex), [0, 1, 0]);
  for (const question of questions) {
    assert.ok(question.source.includes(question.answer));
    assert.ok(question.prompt.includes("________"));
    assert.equal(question.prompt.includes(question.answer), false);
    assert.equal(isRecallAnswerCorrect(" " + question.answer.toUpperCase() + ". ", question.answer), true);
    assert.equal(isRecallAnswerCorrect("incorrect", question.answer), false);
  }
});
test("empty and expired sessions do not expose practice content", () => {
  assert.deepEqual(buildSessionQuiz({ ...session, sections: [] }), []);
  assert.deepEqual(buildSessionQuiz({ ...session, isExpired: true }), []);
  assert.deepEqual(buildSessionQuiz({ ...session, expiresAt: "2000-01-01" }), []);
});
