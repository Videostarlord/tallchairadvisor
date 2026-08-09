/**
 * asin-liveness.test.ts — A10 / P4.
 *
 * The centrepiece is `the B0CQ4K1KXT false positive`, which is not hypothetical:
 * the first live run of this detector reported the Hbada E3 Pro dead on
 * /best-office-chairs-under-500/ because the page contained "Currently
 * unavailable". The phrase belonged to the "Newer Version Available" cross-sell
 * block advertising the E3 Ultra; the E3 Pro itself showed Add to Cart, Buy Now
 * and In Stock and was perfectly buyable.
 *
 * Acting on that finding would have deleted a working affiliate link from a money
 * page — the detector costing exactly the revenue it exists to protect. The
 * fixture below is taken from that real page.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyListing, extractAsins } from '../asin-liveness.js';

// ─── The real false positive ───────────────────────────────────────────────────

/** Shortened from the live B0CQ4K1KXT scrape, 2026-08-09. */
const HBADA_E3_PRO = `
# Hbada E3 Pro Ergonomic Office Chair, Big and Tall

Add to Cart
Buy Now
In Stock

## Product Description
Hbada E3 Pro Ergonomic Office Chair, Big and Tall Office Chair - with 3-Zone Dynamic Lumbar Support

## Newer Version Available
[Hbada E3 Ultra Ergonomic Chair, Premium Mesh Chair, Grey](https://www.amazon.com/dp/B0FB37JS43)
, 3.7 out of 5 stars, 7 ratings

Currently unavailable.

## Options Available
### Color
- Black
- Grey
`;

test('THE B0CQ4K1KXT FALSE POSITIVE: a cross-sell "Currently unavailable" never kills a buyable product', () => {
  const v = classifyListing(HBADA_E3_PRO);
  assert.equal(v.kind, 'alive', 'a page with Add to Cart is alive regardless of an unavailability notice elsewhere');
});

test('the same page WITHOUT any way to buy is genuinely dead', () => {
  const noBuyBox = HBADA_E3_PRO.replace(/Add to Cart\nBuy Now\nIn Stock/, '');
  const v = classifyListing(noBuyBox);
  assert.equal(v.kind, 'dead');
  assert.match(v.kind === 'dead' ? v.reason : '', /no way to buy/);
});

// ─── Hard dead ─────────────────────────────────────────────────────────────────

test('a 404 / dog page is dead without needing the buy-box test', () => {
  for (const text of [
    'Page Not Found. Sorry!',
    "We couldn't find that page. Try searching.",
    'Looking for something? We are sorry. The Web address you entered is not a functioning page.',
  ]) {
    assert.equal(classifyListing(text).kind, 'dead', text);
  }
});

// ─── Never dead ────────────────────────────────────────────────────────────────

test('a failed fetch is NEVER dead — it is the mistake that costs revenue', () => {
  for (const status of [403, 404, 500, 503]) {
    const v = classifyListing('', { httpOk: false, status });
    assert.equal(v.kind, 'unknown', `HTTP ${status} must be unknown, not dead`);
  }
});

test('a bot wall is unknown, even when it also says "page not found"', () => {
  const v = classifyListing('Enter the characters you see below. Sorry, page not found.');
  assert.equal(v.kind, 'unknown', 'blocked is checked before dead, deliberately');
});

test('every bot-wall phrasing is unknown', () => {
  for (const text of [
    'Enter the characters you see below',
    "Type the characters you see - we just need to make sure you're not a robot",
    'To discuss automated access to Amazon data please contact',
    'Service Unavailable',
  ]) {
    assert.equal(classifyListing(text).kind, 'unknown', text);
  }
});

test('an empty document is unknown, never alive and never dead', () => {
  assert.equal(classifyListing('').kind, 'unknown');
  assert.equal(classifyListing('   \n ').kind, 'unknown');
});

test('an unrecognisable page is unknown — the detector refuses to guess', () => {
  assert.equal(classifyListing('Some unrelated text with no product signals at all.').kind, 'unknown');
});

// ─── Alive ─────────────────────────────────────────────────────────────────────

test('a normal listing is alive; the title is not guessed from the page', () => {
  const v = classifyListing('# Steelcase Gesture Office Chair\n\nAdd to Cart\n\nCustomer Reviews');
  assert.equal(v.kind, 'alive');
  assert.equal(v.kind === 'alive' ? v.title : 'x', null, 'the title is deliberately not scraped — the registry has a verified one');
});

test('a product page with no buy button but clear product chrome is alive, not unknown', () => {
  const v = classifyListing('# A Chair\n\nProduct Description\n\nCustomer reviews\n\nShips from Amazon');
  assert.equal(v.kind, 'alive');
});

// ─── ASIN extraction ───────────────────────────────────────────────────────────

test('extractAsins finds each distinct ASIN once', () => {
  const src = `
    <a href="https://www.amazon.com/dp/B016OIF2JU?tag=tallchairadvi-20">Gesture</a>
    <a href="https://www.amazon.com/dp/B016OIF2JU?tag=tallchairadvi-20">Gesture again</a>
    <a href="https://www.amazon.com/dp/B00TYE4QXU?tag=tallchairadvi-20">Leap Plus</a>
  `;
  assert.deepEqual(extractAsins(src).sort(), ['B00TYE4QXU', 'B016OIF2JU']);
});

test('extractAsins ignores lowercase and too-short ids', () => {
  assert.deepEqual(extractAsins('/dp/short /dp/b016oif2ju'), []);
});

test('extractAsins takes the first 10 chars of an over-long id, matching lint-content.mjs', () => {
  // Not a bug to fix here: this regex is deliberately identical to the one in
  // lint-content.mjs, and the two must agree about what counts as an ASIN link.
  // Diverging would let a link pass the build gate and be invisible to this check.
  assert.deepEqual(extractAsins('/dp/TOOLONGASIN12'), ['TOOLONGASI']);
});
