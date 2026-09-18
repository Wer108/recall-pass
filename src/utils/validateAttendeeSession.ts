import { SessionData } from "../types";

// API responses and browser storage are untrusted at runtime, even when typed.
export function validateAttendeeSession(value: unknown): SessionData {
  const data = value as SessionData | null;
  const optionalText = (value: unknown) => value == null || typeof value === "string";
  if (
    !data || typeof data !== "object" ||
    typeof data.accessCode !== "string" ||
    typeof data.title !== "string" ||
    typeof data.expiresAt !== "string" || !Number.isFinite(Date.parse(data.expiresAt)) ||
    ![data.speaker, data.eventContext, data.mediaType, data.trackDuration, data.youtubeId, data.mediaUrl].every(optionalText)
  ) {
    throw new Error("This session could not be loaded. Please contact your organizer to republish the notes.");
  }

  const isExpired = data.isExpired === true || Date.parse(data.expiresAt) <= Date.now();
  if (isExpired) return { ...data, isExpired, sections: [], qaList: [] };

  if (
    !Array.isArray(data.sections) ||
    !data.sections.every(section =>
      section && typeof section.title === "string" &&
      Array.isArray(section.bullets) && section.bullets.every(bullet => typeof bullet === "string")
    ) ||
    !Array.isArray(data.qaList) ||
    !data.qaList.every(qa =>
      qa && typeof qa.question === "string" && typeof qa.answer === "string" &&
      optionalText(qa.askerContext)
    )
  ) {
    throw new Error("This session contains incomplete notes. Please contact your organizer to republish them.");
  }
  return { ...data, isExpired };
}
