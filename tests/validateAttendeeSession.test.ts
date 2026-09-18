import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAttendeeSession } from "../src/utils/validateAttendeeSession";

const session = {
  accessCode: "RP-ABC234", title: "Session", expiresAt: "2099-01-01",
  sections: [{ title: "Topic", bullets: ["A note"] }],
  qaList: [{ question: "Why?", answer: "Because." }],
};

test("valid notes remain available", () => {
  assert.deepEqual(validateAttendeeSession(session), { ...session, isExpired: false });
});
test("malformed notes fail before React renders them", () => {
  for (const sections of [null, [null], [{ title: "Topic" }], [{ title: "Topic", bullets: [{}] }]]) {
    assert.throws(() => validateAttendeeSession({ ...session, sections }), /incomplete notes/);
  }
  assert.throws(() => validateAttendeeSession({ ...session, qaList: [{ question: {} }] }), /incomplete notes/);
  assert.throws(() => validateAttendeeSession({ ...session, title: {} }), /could not be loaded/);
});
test("expired passes redact content even when stored notes are malformed", () => {
  const expired = validateAttendeeSession({ ...session, expiresAt: "2000-01-01", sections: null });
  assert.equal(expired.isExpired, true);
  assert.deepEqual(expired.sections, []);
  assert.deepEqual(expired.qaList, []);
});
