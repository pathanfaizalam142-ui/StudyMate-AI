import crypto from "node:crypto";

/**
 * Phase 1.1 Section 7 — Deterministic Question Hash Normalization Contract
 *
 * Pipeline:
 * 1. Unicode Normalization (NFKC)
 * 2. Lowercasing
 * 3. Strip backticks (`) and markdown emphasis wrappers (*, _)
 * 4. Replace all non-letter, non-digit, non-whitespace characters (/[^\p{L}\p{N}\s]/gu) with a single space ' '
 * 5. Collapse consecutive whitespace to a single space and trim
 * 6. Compute SHA-256 hex digest (64 chars)
 *
 * Guarantees:
 *   "What is RAM?" === "what is ram?" === "What is  RAM ?"
 */
export function normalizeQuestionText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }
  return rawText
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeQuestionHash(rawText: string): string {
  const normalized = normalizeQuestionText(rawText);
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function computeSha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function hashPasswordScrypt(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(keyHex, "hex");
  if (derivedBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, storedBuffer);
}
