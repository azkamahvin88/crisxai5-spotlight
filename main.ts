// Spotlight @crisxai5 — a sponsored video-on-X bounty entry on make.fun (Node 22, standard library only).
// The entry is the post itself: a spotlight card introducing @crisxai5 as a must-follow AI & crypto
// expert — AI agents, crypto alpha, Web3 automation — posted natively on X from a public account
// with the text the rules ask for. This program copies POST.json from the repository root to
// /output/POST.json, where the gate reads it. That is all the program has to do in its default run:
// the house reads the post's counts from X itself, so nothing this program writes about the post
// is scored.
//
// --validate runs a local pre-flight checklist and writes nothing: it checks the post address in
// POST.json is a valid X post URL, the post text in post_text.txt tags @crisxai5, and the post text
// carries the entrant's make.fun play code. It prints [PASS]/[FAIL] per check and VALID/INVALID
// overall, exiting 0 when every check passes and 1 otherwise. Run it before the copy:
//
//   MAKEFUN_BOT_DIR=. node main.ts --validate
//
// The checklist only reads files and prints results; it never writes anything and never
// changes POST.json, so it is safe to run as often as you like before submitting.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const POST_FILE = 'POST.json';
const POST_TEXT_FILE = 'post_text.txt';
const SPOTLIGHT_HANDLE = '@crisxai5';
const PLAY_CODE = 'makefun-plume-steeple-parasol';
const POST_URL_PATTERN = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+$/;

type CheckResult = { name: string; pass: boolean; detail: string };

function readPost(): { url: string } {
  const raw = readFileSync(join(BOT_DIR, POST_FILE), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { url?: unknown }).url !== 'string') {
    throw new Error(`${POST_FILE} must be a JSON object with a string "url" field`);
  }
  return { url: (parsed as { url: string }).url };
}

function readPostText(): string {
  return readFileSync(join(BOT_DIR, POST_TEXT_FILE), 'utf8');
}

function validatePost(): CheckResult[] {
  const checks: CheckResult[] = [];
  try {
    const { url } = readPost();
    const ok = POST_URL_PATTERN.test(url);
    checks.push({
      name: 'post url is a valid X post address',
      pass: ok,
      detail: ok ? url : `not an X post address: ${url}`,
    });
  } catch (err) {
    checks.push({
      name: 'post url is a valid X post address',
      pass: false,
      detail: `${POST_FILE} unreadable: ${(err as Error).message}`,
    });
  }
  let text: string;
  try {
    text = readPostText();
  } catch (err) {
    const detail = `${POST_TEXT_FILE} unreadable: ${(err as Error).message}`;
    checks.push({ name: `post text tags ${SPOTLIGHT_HANDLE}`, pass: false, detail });
    checks.push({ name: 'post text carries the play code', pass: false, detail });
    return checks;
  }
  const tagsHandle = text.includes(SPOTLIGHT_HANDLE);
  checks.push({
    name: `post text tags ${SPOTLIGHT_HANDLE}`,
    pass: tagsHandle,
    detail: tagsHandle ? `found ${SPOTLIGHT_HANDLE}` : `${SPOTLIGHT_HANDLE} not found in ${POST_TEXT_FILE}`,
  });
  const hasCode = text.includes(PLAY_CODE);
  checks.push({
    name: 'post text carries the play code',
    pass: hasCode,
    detail: hasCode ? `found ${PLAY_CODE}` : `${PLAY_CODE} not found in ${POST_TEXT_FILE}`,
  });
  return checks;
}

if (process.argv.includes('--validate')) {
  const checks = validatePost();
  for (const check of checks) {
    console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.name} — ${check.detail}`);
  }
  const passed = checks.filter((check) => check.pass).length;
  const valid = passed === checks.length;
  console.log(valid ? `VALID: ${passed}/${checks.length} checks passed` : `INVALID: ${passed}/${checks.length} checks passed`);
  process.exit(valid ? 0 : 1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, POST_FILE), join(OUTPUT_DIR, POST_FILE));
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
