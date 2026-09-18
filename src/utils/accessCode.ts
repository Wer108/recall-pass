import { randomInt } from "node:crypto";

export function generateAccessCode(existingCodes: Set<string>): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const used = new Set([...existingCodes].map(code => code.toUpperCase()));
  for (let attempt = 0; attempt < 1000; attempt++) {
    const characters = [
      ...Array.from({ length: 5 }, () => letters[randomInt(letters.length)]),
      numbers[randomInt(numbers.length)],
    ];
    // Put the number in a random position while keeping a compact six-character ID.
    for (let index = characters.length - 1; index > 0; index--) {
      const swapIndex = randomInt(index + 1);
      [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }
    const suffix = characters.join("");
    const code = `RP-${suffix}`;
    if (!used.has(code)) return code;
  }
  throw new Error("Unable to allocate a unique pass ID. Please try publishing again.");
}
