// SPDX-License-Identifier: MIT
// Fridge Roast: One Line, Biggest Laugh — entry program.
// Writes one roast line (1-200 chars, single line, UTF-8) to /output/entry.txt
// and verifies it with a sha256 read-back.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "My smart fridge installed a firmware update overnight and now needs a reboot to remember what cold is. One job, and it outsourced it to Wi-Fi.";

const MAX_CHARS = 200;
const MAX_BYTES = 800;

// Fail fast at import time: the gate is checked before any I/O happens,
// so a bad entry never touches /output.
function validateGate(text: string): void {
  const chars = [...text];
  if (chars.length < 1 || chars.length > MAX_CHARS) {
    throw new Error(`entry rejected: ${chars.length} characters, gate is 1-${MAX_CHARS}`);
  }
  if (text.trim().length === 0) throw new Error("entry rejected: only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry rejected: must be a single line");
  }
  if (text.includes("\uFEFF")) throw new Error("entry rejected: contains a BOM");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    throw new Error("entry rejected: contains control characters");
  }
  const encoded = Buffer.from(text, "utf8");
  if (encoded.length > MAX_BYTES) {
    throw new Error(`entry rejected: ${encoded.length} bytes, cap is ${MAX_BYTES}`);
  }
  if (encoded.toString("utf8") !== text) {
    throw new Error("entry rejected: not valid UTF-8");
  }
}

validateGate(ENTRY);

function fail(message: string): never {
  throw new Error(`entry rejected: ${message}`);
}

function main(): void {
  // Gate: 1-200 characters, single line, not only whitespace.
  if ([...ENTRY].length < 1 || [...ENTRY].length > MAX_CHARS) {
    fail(`entry is ${[...ENTRY].length} characters, gate is 1-${MAX_CHARS}`);
  }
  if (ENTRY.trim().length === 0) fail("entry is only whitespace");
  if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
    fail("entry must be a single line");
  }
  if (ENTRY.includes("\uFEFF")) fail("entry contains a BOM");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(ENTRY)) {
    fail("entry contains control characters");
  }
  const bytes = Buffer.from(ENTRY, "utf8");
  if (bytes.length > MAX_BYTES) fail(`entry is ${bytes.length} bytes, cap is ${MAX_BYTES}`);
  if (bytes.toString("utf8") !== ENTRY) fail("entry is not valid UTF-8");

  // Empty only the contents of /output (never the directory itself).
  mkdirSync("/output", { recursive: true });
  for (const name of readdirSync("/output")) {
    rmSync(`/output/${name}`, { recursive: true, force: true });
  }

  writeFileSync("/output/entry.txt", ENTRY, "utf8");

  // Read-back verification.
  const written = readFileSync("/output/entry.txt", "utf8");
  if (written !== ENTRY) fail("read-back mismatch");
  const sha = createHash("sha256").update(written, "utf8").digest("hex");
  console.log(`wrote /output/entry.txt (${[...ENTRY].length} chars, ${bytes.length} bytes, sha256 ${sha})`);
}

main();
