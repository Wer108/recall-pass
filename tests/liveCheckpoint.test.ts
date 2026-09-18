import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGroundedLiveCheckpoint } from "../src/utils/liveCheckpoint";

test("live checkpoints contain only sentences visible in the transcript", () => {
  const transcript = [
    "Today we are discussing coastal mangrove restoration. Mangrove roots reduce wave energy during storms.",
    "Local communities monitor seedling survival every month. The team replants areas where survival falls below seventy percent.",
  ].join("\n\n");
  const checkpoint = buildGroundedLiveCheckpoint(transcript);

  assert.equal(checkpoint.sourceWordCount, 31);
  assert.equal(checkpoint.sections.length, 1);
  for (const section of checkpoint.sections) {
    for (const bullet of section.bullets) assert.ok(transcript.includes(bullet));
  }
  assert.equal(checkpoint.qaList.length, 0);
  assert.equal(JSON.stringify(checkpoint).includes("distributed"), false);
  assert.equal(JSON.stringify(checkpoint).includes("microservices"), false);
});

test("Q&A is emitted only from labeled spoken exchanges", () => {
  const transcript = [
    "Audience Member: How often should we measure seedling survival?",
    "Dr. Rao: Measure survival monthly during the first growing season.",
    "The next topic is shoreline mapping.",
  ].join("\n\n");
  const checkpoint = buildGroundedLiveCheckpoint(transcript);

  assert.deepEqual(checkpoint.qaList.map(({ question, answer, askerContext }) => ({ question, answer, askerContext })), [{
    question: "How often should we measure seedling survival?",
    answer: "Measure survival monthly during the first growing season.",
    askerContext: "Audience Member",
  }]);
});

test("short or empty speech waits for more transcript", () => {
  assert.deepEqual(buildGroundedLiveCheckpoint(""), { sections: [], qaList: [], sourceWordCount: 0 });
  assert.deepEqual(buildGroundedLiveCheckpoint("hello everyone"), { sections: [], qaList: [], sourceWordCount: 2 });
});
