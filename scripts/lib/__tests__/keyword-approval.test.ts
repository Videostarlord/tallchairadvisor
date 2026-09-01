/**
 * keyword-approval.test.ts — the gate that replaced a human.
 *
 * The tests that matter here are the REJECTIONS. A false approve publishes a
 * cannibalising page onto a live money site; a false reject costs one month on
 * one keyword. Every case below is drawn from the real queue that sat unapproved
 * for six months, not invented.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, judgeBatch, topicOverlap, TOPIC_COLLISION_THRESHOLD } from '../keyword-approval.js';

const base = { search_volume: 500, keyword_difficulty: 5, score: 0.8, tca_status: 'gap', target_slug: '/x/' };
const EXISTING = ['/office-chairs-for-tall-people/', '/review/gesture/', '/chairs/steelcase-gesture/', '/knee-pain-seat-depth/'];

test('a keyword the site already ranks for is rejected — 16 of the 18 live candidates', () => {
  const v = judge({ ...base, keyword: 'aeron size c', tca_status: 'ranking' }, EXISTING);
  assert.equal(v.approved, false);
  assert.match(v.reason, /already ranks/);
});

test('"steelcase gesture review" is rejected as a duplicate of the existing Gesture page', () => {
  const v = judge({ ...base, keyword: 'steelcase gesture review', target_slug: '/steelcase-gesture-review/' }, EXISTING);
  assert.equal(v.approved, false, 'this was marked `gap` by discovery and would have shipped a duplicate');
  assert.match(v.reason, /near-duplicate/);
});

test('an unknown target slug is rejected rather than guessed at', () => {
  const v = judge({ ...base, keyword: 'aeron c chair', target_slug: '/unknown/' }, EXISTING);
  assert.equal(v.approved, false);
  assert.match(v.reason, /no usable target_slug/);
});

test('a slug that already exists on disk is rejected', () => {
  const v = judge({ ...base, keyword: 'something new entirely', target_slug: '/review/gesture/' }, EXISTING);
  assert.equal(v.approved, false);
  assert.match(v.reason, /already exists/);
});

test('a genuine gap with no topical collision is approved', () => {
  const v = judge({ ...base, keyword: 'monitor arm desk clamp thickness', target_slug: '/monitor-arm-clamp-thickness/' }, EXISTING);
  assert.equal(v.approved, true);
  assert.match(v.reason, /true gap/);
});

test('volume, difficulty and score floors each reject on their own', () => {
  assert.equal(judge({ ...base, keyword: 'a rare thing', search_volume: 10 }, []).approved, false);
  assert.equal(judge({ ...base, keyword: 'a hard thing', keyword_difficulty: 80 }, []).approved, false);
  assert.equal(judge({ ...base, keyword: 'a weak thing', score: 0.1 }, []).approved, false);
});

test('cluster dedup: only ONE of five near-identical variants survives a batch', () => {
  const variants = ['best office chair for tall people','best office chair for tall person','best office chair tall person','best office chairs for tall man','best office chairs for tall people']
    .map((keyword, i) => ({ ...base, keyword, target_slug: `/v${i}/`, score: 0.9 - i * 0.01 }));
  const results = judgeBatch(variants, []);
  const approved = results.filter((r) => r.verdict.approved);
  assert.equal(approved.length, 1, 'five variants of one phrase must not commission five pages');
  assert.equal(approved[0].candidate.keyword, 'best office chair for tall people', 'the highest-scoring variant is the one kept');
});

test('the batch is judged highest-score-first so dedup keeps the best variant', () => {
  const results = judgeBatch(
    [{ ...base, keyword: 'tall desk riser height', target_slug: '/a/', score: 0.5 },
     { ...base, keyword: 'tall desk riser', target_slug: '/b/', score: 0.9 }], []);
  assert.equal(results[0].candidate.score, 0.9);
});

test('topicOverlap ignores stopwords and the word "chair", which is in half the site', () => {
  assert.ok(topicOverlap('best office chair for tall people', '/office-chairs-for-tall-people/') >= TOPIC_COLLISION_THRESHOLD);
  assert.ok(topicOverlap('standing desk height tall people', '/office-chairs-for-tall-people/') < TOPIC_COLLISION_THRESHOLD,
    'a genuinely different subject that happens to share "tall people" must still pass');
});

test('an empty existing-page list never crashes the gate', () => {
  assert.equal(judge({ ...base, keyword: 'brand new subject area' }, []).approved, true);
});
