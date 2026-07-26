#!/usr/bin/env python3
"""Visual / mobile rendering audit via Playwright.

Captures above-the-fold + full-page screenshots at mobile and desktop viewports,
and collects hard measurements: element offsets, horizontal overflow, tap target
sizes, CLS, and affiliate CTA scroll-depth positions.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "https://tallchairadvisor.com"
PAGES = [
    ("homepage", "/"),
    ("money-hub", "/office-chairs-for-tall-people/"),
    ("gesture-review", "/review/gesture/"),
    ("knee-pain", "/knee-pain-seat-depth/"),
    ("6foot6", "/office-chairs-for-6-foot-6/"),
]
VIEWPORTS = {
    "mobile": {"width": 390, "height": 844, "mobile": True},
    "desktop": {"width": 1440, "height": 900, "mobile": False},
}

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "screenshots", "audit-2026-07")
os.makedirs(OUT, exist_ok=True)

# Runs in page context after load. Returns a measurement dict.
MEASURE_JS = r"""
() => {
  const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const vw = window.innerWidth, vh = window.innerHeight;
  const abs = (el) => { const r = el.getBoundingClientRect(); return r.top + window.scrollY; };
  const pct = (y) => Math.round((y / docH) * 1000) / 10;

  // --- horizontal overflow ---
  const overflowers = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      overflowers.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 90),
        left: Math.round(r.left), right: Math.round(r.right),
        w: Math.round(r.width),
        overflowX: cs.overflowX,
        text: (el.textContent || '').trim().slice(0, 50)
      });
    }
  });

  // --- affiliate CTAs (amazon links) ---
  const ctas = [];
  document.querySelectorAll('a[href*="amazon."], a[href*="amzn.to"], a[href*="tallchairadvi-20"]').forEach(a => {
    const r = a.getBoundingClientRect();
    const y = r.top + window.scrollY;
    ctas.push({
      text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      y: Math.round(y), depthPct: pct(y),
      w: Math.round(r.width), h: Math.round(r.height),
      aboveFold: y < vh,
      rel: a.getAttribute('rel') || ''
    });
  });

  // --- tap targets (interactive elements under 44px) ---
  const small = [];
  document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (getComputedStyle(el).visibility === 'hidden') return;
    if (r.height < 44 || r.width < 24) {
      small.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 45),
        w: Math.round(r.width), h: Math.round(r.height),
        y: Math.round(r.top + window.scrollY),
        inNav: !!el.closest('nav, header, footer')
      });
    }
  });

  // --- tables ---
  const tables = [];
  document.querySelectorAll('table').forEach(t => {
    const r = t.getBoundingClientRect();
    const wrap = t.parentElement;
    const wcs = wrap ? getComputedStyle(wrap) : null;
    tables.push({
      y: Math.round(r.top + window.scrollY),
      depthPct: pct(r.top + window.scrollY),
      w: Math.round(r.width),
      scrollW: t.scrollWidth,
      viewportW: vw,
      overflowsViewport: r.width > vw + 1 || t.scrollWidth > vw + 1,
      wrapperOverflowX: wcs ? wcs.overflowX : null,
      wrapperClass: wrap ? (wrap.className || '').toString().slice(0, 70) : null,
      cols: t.querySelector('tr') ? t.querySelector('tr').children.length : 0,
      rows: t.querySelectorAll('tr').length,
      caption: (t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    });
  });

  // --- above-the-fold inventory: what elements intersect first viewport ---
  const atf = [];
  document.querySelectorAll('h1, h2, h3, p, img, a, button, div[class*="border"], section').forEach(el => {
    const r = el.getBoundingClientRect();
    const y = r.top + window.scrollY;
    if (y < vh && y + r.height > 0) {
      const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (el.tagName === 'IMG' || txt.length > 0) {
        atf.push({
          tag: el.tagName.toLowerCase(),
          y: Math.round(y), h: Math.round(r.height),
          src: el.tagName === 'IMG' ? (el.currentSrc || el.src || '').split('/').pop().slice(0,45) : null,
          text: txt.slice(0, 70)
        });
      }
    }
  });

  // --- disclosure ---
  const bodyText = document.body.innerText;
  let disclosure = null;
  const discRe = /(affiliate|commission|earn from qualifying|paid link)/i;
  const cands = [...document.querySelectorAll('p, div, span, aside, section, small')];
  for (const el of cands) {
    const t = (el.innerText || '').trim();
    if (t.length < 400 && t.length > 15 && discRe.test(t)) {
      const r = el.getBoundingClientRect();
      const y = r.top + window.scrollY;
      const cs = getComputedStyle(el);
      disclosure = {
        text: t.replace(/\s+/g, ' ').slice(0, 180),
        y: Math.round(y), depthPct: pct(y),
        aboveFold: y < vh,
        fontSize: cs.fontSize, color: cs.color,
        tag: el.tagName.toLowerCase()
      };
      break;
    }
  }

  // --- hero image / first content image ---
  let hero = null;
  for (const img of document.querySelectorAll('img')) {
    const r = img.getBoundingClientRect();
    if (r.height > 120 && !img.closest('header, nav')) {
      hero = {
        src: (img.currentSrc || img.src || '').split('/').pop(),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width), h: Math.round(r.height),
        loading: img.getAttribute('loading'),
        hasDims: !!(img.getAttribute('width') && img.getAttribute('height')),
        aspectStyle: getComputedStyle(img).aspectRatio
      };
      break;
    }
  }

  // --- key boxes: find TL;DR / verdict / quick picks ---
  const boxes = [];
  cands.concat([...document.querySelectorAll('div, aside')]).forEach(el => {
    const t = (el.innerText || '').trim();
    if (!t) return;
    const head = t.slice(0, 60).toLowerCase();
    if (/(tl;?dr|the verdict|quick pick|bottom line|short answer|at a glance)/i.test(head)) {
      const r = el.getBoundingClientRect();
      if (r.height < 40) return;
      const y = r.top + window.scrollY;
      boxes.push({
        label: t.slice(0, 45).replace(/\s+/g, ' '),
        y: Math.round(y), h: Math.round(r.height),
        depthPct: pct(y), aboveFold: y < vh
      });
    }
  });
  // dedupe nested by y
  const seen = new Set(); const uboxes = [];
  boxes.sort((a,b) => a.y - b.y || b.h - a.h);
  for (const b of boxes) { const k = b.y; if (!seen.has(k)) { seen.add(k); uboxes.push(b); } }

  // --- font sizes of body text ---
  const fontCounts = {};
  document.querySelectorAll('p, li').forEach(el => {
    if ((el.innerText || '').trim().length < 20) return;
    const fs = getComputedStyle(el).fontSize;
    fontCounts[fs] = (fontCounts[fs] || 0) + 1;
  });

  const h1 = document.querySelector('h1');
  const h1r = h1 ? h1.getBoundingClientRect() : null;

  return {
    url: location.href,
    docHeight: docH, viewport: {w: vw, h: vh},
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > vw + 1,
    h1: h1 ? {text: h1.innerText.trim().slice(0,90), y: Math.round(h1r.top + window.scrollY),
              fontSize: getComputedStyle(h1).fontSize, aboveFold: (h1r.top + window.scrollY) < vh} : null,
    hero, disclosure, boxes: uboxes,
    ctas, ctaCount: ctas.length,
    ctasAboveFold: ctas.filter(c => c.aboveFold).length,
    firstCtaDepth: ctas.length ? ctas[0].depthPct : null,
    ctasWithin70: ctas.filter(c => c.depthPct <= 70).length,
    tables, overflowers: overflowers.slice(0, 25), overflowCount: overflowers.length,
    smallTapTargets: small, smallTapCount: small.length,
    fontCounts,
    atfCount: atf.length,
    atf: atf.slice(0, 60)
  };
}
"""

CLS_JS = r"""
() => new Promise(resolve => {
  let cls = 0; const shifts = [];
  try {
    const po = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) {
          cls += e.value;
          shifts.push({value: Math.round(e.value*10000)/10000, time: Math.round(e.startTime),
            sources: (e.sources||[]).map(s => s.node ? (s.node.tagName||'') + '.' + ((s.node.className||'').toString().slice(0,40)) : '').slice(0,3)});
        }
      }
    });
    po.observe({type: 'layout-shift', buffered: true});
  } catch(e) { return resolve({error: String(e)}); }
  setTimeout(() => resolve({cls: Math.round(cls*10000)/10000, shifts: shifts.slice(0,10)}), 2500);
})
"""


def run():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for vp_name, vp in VIEWPORTS.items():
            ctx = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=2,
                is_mobile=vp["mobile"],
                has_touch=vp["mobile"],
                user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
                            "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
                if vp["mobile"] else None,
            )
            for name, path in PAGES:
                url = BASE + path
                page = ctx.new_page()
                key = f"{name}|{vp_name}"
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=45000)
                    cls = page.evaluate(CLS_JS)
                    try:
                        page.wait_for_load_state("networkidle", timeout=15000)
                    except Exception:
                        pass
                    page.evaluate("window.scrollTo(0,0)")
                    page.wait_for_timeout(400)

                    fold = os.path.join(OUT, f"{name}-{vp_name}-fold.png")
                    full = os.path.join(OUT, f"{name}-{vp_name}-full.png")
                    page.screenshot(path=fold, full_page=False)
                    page.screenshot(path=full, full_page=True)

                    m = page.evaluate(MEASURE_JS)
                    m["cls"] = cls
                    m["status"] = "ok"
                    m["shots"] = {"fold": fold, "full": full}
                    results[key] = m
                    print(f"[ok] {key}  docH={m['docHeight']} hscroll={m['hasHorizontalScroll']} ctas={m['ctaCount']}", flush=True)
                except Exception as e:
                    results[key] = {"status": "error", "error": str(e), "url": url}
                    print(f"[ERR] {key}: {e}", flush=True)
                page.close()
            ctx.close()
        browser.close()

    out_json = os.path.join(OUT, "measurements.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=1)
    print("\nWrote", out_json)


if __name__ == "__main__":
    run()
