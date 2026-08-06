/**
 * Unit tests for URL classification, run against the repo's REAL files.
 *
 * The load-bearing case is /best-office-chairs/: a 301 source that the 2026-08-05
 * audit treated as a page and reported a CRITICAL duplicate-content crisis over. If
 * this test ever goes green while the probe browses that URL, the C-1 false positive
 * is back.
 *
 * Run: npx tsx --test scripts/probes/__tests__/*.test.ts
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { isRedirectSource, loadRedirectMap } from '../../redirect-map.js';
import {
  filesystemUrls,
  normalizePath,
  parseSitemapExcludedPaths,
  parseSitemapLocs,
  routeFromPageFile,
} from '../inventory.js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

test('/best-office-chairs/ is a redirect source and must never be probed as a page', () => {
  const map = loadRedirectMap(REPO);
  assert.ok(isRedirectSource(map, '/best-office-chairs/'));
  assert.ok(isRedirectSource(map, '/best-office-chairs'), 'must match without the trailing slash too');
  assert.equal(map.get('/best-office-chairs/'), '/office-chairs-for-tall-people/');
  assert.ok(!isRedirectSource(map, '/office-chairs-for-tall-people/'), 'the target is a real page');
  for (const dead of ['/chairs/steelcase-gesture/seat-height/', '/chairs/steelcase-gesture/tall-people/']) {
    assert.ok(isRedirectSource(map, dead), `${dead} was consolidated on 2026-07-04`);
  }
});

test('sitemapExcludedPaths is read from the real astro.config.mjs', () => {
  const excluded = parseSitemapExcludedPaths(readFileSync(resolve(REPO, 'astro.config.mjs'), 'utf-8'));
  assert.ok(excluded.size >= 4, 'config parse produced nothing — noindex filtering would silently stop working');
  for (const path of ['/contact/', '/privacy-policy/', '/affiliate-disclosure/', '/author/jackson-christopher/']) {
    assert.ok(excluded.has(path), `${path} should be sitemap-excluded`);
  }
  assert.ok(!excluded.has('/review/gesture/'));
});

test('src/pages routing matches Astro: index collapses, 404 and dynamic routes drop out', () => {
  assert.equal(routeFromPageFile('review/gesture.astro'), '/review/gesture/');
  assert.equal(routeFromPageFile('index.astro'), '/');
  assert.equal(routeFromPageFile('chairs/steelcase-gesture/index.astro'), '/chairs/steelcase-gesture/');
  assert.equal(routeFromPageFile('404.astro'), null);
  assert.equal(routeFromPageFile('blog/[slug].astro'), null);
});

test('the filesystem fallback finds the real pages and drops the excluded ones', () => {
  const { urls } = filesystemUrls(REPO);
  assert.ok(urls.length > 40, `expected the real page inventory, got ${urls.length}`);
  assert.ok(urls.includes('/review/gesture/'));
  assert.ok(urls.includes('/office-chairs-for-tall-people/'));
  assert.ok(!urls.includes('/404/'));
  assert.ok(!urls.includes('/contact/'), 'sitemap-excluded pages must not enter the inventory');
});

test('normalizePath strips origin, query and hash and adds the trailing slash', () => {
  assert.equal(normalizePath('https://tallchairadvisor.com/review/gesture/?x=1#a'), '/review/gesture/');
  assert.equal(normalizePath('review/gesture'), '/review/gesture/');
  assert.equal(normalizePath('https://tallchairadvisor.com/'), '/');
  assert.equal(normalizePath('/sitemap-0.xml'), '/sitemap-0.xml', 'file extensions keep their exact form');
});

test('sitemap <loc> extraction tolerates whitespace and namespaces', () => {
  const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://tallchairadvisor.com/</loc></url>
    <url><loc>
      https://tallchairadvisor.com/review/gesture/
    </loc></url></urlset>`;
  assert.deepEqual(parseSitemapLocs(xml), ['https://tallchairadvisor.com/', 'https://tallchairadvisor.com/review/gesture/']);
});
