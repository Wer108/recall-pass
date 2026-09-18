import { randomInt } from "node:crypto";

export function generateAccessCode(existingCodes: Set<string>): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const used = new Set([...existingCodes].map(code => code.toUpperCase()));
  for (let attempt = 0; attempt < 1000; attempt++) {
    const suffix = Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join("");
    const code = `RP-${suffix}`;
    if (/[A-Z]/.test(suffix) && /[0-9]/.test(suffix) && !used.has(code)) return code;
  }
  throw new Error("Unable to allocate a unique pass ID. Please try publishing again.");
}
