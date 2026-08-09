/**
 * amazon-session.test.ts — P3.
 *
 * The property under test is the one the plan singled out: the scraper must file
 * `amazon-session-expired` rather than report $0. Everything here defends the
 * boundary between "I could not see" and "I saw nothing", because the kill-list
 * gate that decides whether the site continues reads that number.
 *
 * The DOM layer in amazon-pull.ts cannot be exercised without a live credential.
 * These functions are pure precisely so the JUDGEMENT can be tested even though
 * the scraping cannot.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySession, classifyCsv, rollingWindow, describeWindow } from '../amazon-session.js';

// ─── session classification ────────────────────────────────────────────────────

test('a redirect to the sign-in page is expiry, not a report', () => {
  const s = classifySession('https://www.amazon.com/ap/signin?openid.return_to=...', 'Sign in');
  assert.equal(s.kind, 'signin');
});

test('an OTP / challenge page is expiry', () => {
  for (const url of [
    'https://www.amazon.com/ap/cvf/verify',
    'https://www.amazon.com/ap/mfa',
  ]) {
    assert.equal(classifySession(url, 'whatever').kind, 'signin');
  }
});

test('a captcha or verification body is expiry even on a plausible URL', () => {
  const s = classifySession(
    'https://affiliate-program.amazon.com/home/reports',
    'Enter the characters you see below',
  );
  assert.equal(s.kind, 'signin');
});

test('THE CRITICAL CASE: sign-in wins even when report chrome is also present', () => {
  // Amazon's login page can retain navigation text from the destination. Reading
  // that as "logged in" is exactly how a scraper parses an empty table into $0.
  const s = classifySession(
    'https://www.amazon.com/ap/signin?target=associates',
    'Associates Central — Earnings Report — please sign in to continue',
  );
  assert.equal(s.kind, 'signin', 'a sign-in signal must never be overridden by a report marker');
});

test('the real reporting UI is identified positively', () => {
  const s = classifySession(
    'https://affiliate-program.amazon.com/home/reports',
    'Associates Central   Earnings Report   Tracking ID: tallchairadvi-20',
  );
  assert.equal(s.kind, 'report');
});

test('an UNRECOGNISED page is never treated as a report', () => {
  // The heart of it: absence of a login form is not proof of a session.
  const s = classifySession('https://affiliate-program.amazon.com/oops', 'Something went wrong.');
  assert.equal(s.kind, 'unknown');
  assert.notEqual(s.kind, 'report');
});

// ─── CSV classification ────────────────────────────────────────────────────────

test('HTML where a CSV should be is invalid — the classic expired-session symptom', () => {
  const v = classifyCsv('<!DOCTYPE html><html><body>Sign in</body></html>');
  assert.equal(v.kind, 'invalid');
  assert.match(v.kind === 'invalid' ? v.reason : '', /HTML/);
});

test('an empty file is invalid, not empty', () => {
  assert.equal(classifyCsv('').kind, 'invalid');
  assert.equal(classifyCsv('   \n  ').kind, 'invalid');
});

test('a header-only CSV is EMPTY and explicitly not evidence of $0', () => {
  const v = classifyCsv('ASIN,Title,Clicks\n', 'asin');
  assert.equal(v.kind, 'empty');
  assert.match(v.kind === 'empty' ? v.reason : '', /NOT evidence of \$0/);
});

test('a wrong header is invalid — the download served something else', () => {
  const v = classifyCsv('Foo,Bar\n1,2\n', 'asin');
  assert.equal(v.kind, 'invalid');
});

test('a real CSV counts its data rows, excluding the header', () => {
  const v = classifyCsv('ASIN,Title,Clicks\nB016OIF2JU,Gesture,28\nB00TYE4QXU,Leap Plus,49\n', 'asin');
  assert.equal(v.kind, 'data');
  assert.equal(v.kind === 'data' ? v.rows : -1, 2);
});

test('trailing blank lines do not inflate the row count', () => {
  const v = classifyCsv('ASIN,X\nB1,1\n\n\n', 'asin');
  assert.equal(v.kind === 'data' ? v.rows : -1, 1);
});

// ─── the export window ─────────────────────────────────────────────────────────

test('the window is stated, never inferred — 30 days is inclusive of today', () => {
  const w = rollingWindow(30, new Date('2026-08-09T12:00:00Z'));
  assert.equal(w.end, '2026-08-09');
  assert.equal(w.start, '2026-07-11');
  assert.equal(w.kind, 'rolling-30-day');
});

test('a non-30 window is labelled explicit rather than mislabelled rolling-30', () => {
  const w = rollingWindow(7, new Date('2026-08-09T12:00:00Z'));
  assert.equal(w.kind, 'explicit');
  assert.equal(w.start, '2026-08-03');
});

test('describeWindow states both the kind and the dates', () => {
  const text = describeWindow(rollingWindow(30, new Date('2026-08-09T12:00:00Z')));
  assert.match(text, /rolling-30-day/);
  assert.match(text, /2026-07-11 -> 2026-08-09/);
});
