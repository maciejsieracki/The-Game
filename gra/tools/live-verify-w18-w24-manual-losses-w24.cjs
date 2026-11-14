'use strict';
/**
 * R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1 — punkt 2 (W24): lewy baner HUD (.civ-hud-banner-left) w żywej grze
 * przy viewportach 1000x700, 800x600, 640x480. Mierzy: scrollWidth/clientWidth strony, right każdego elementu banera
 * względem szerokości okna, zrzuty PNG (deviceScaleFactor 1).
 * Usage: ROBOCZA_HTML=<index.html z vite build> EVID_DIR=<katalog> node tools/live-verify-w18-w24-manual-losses-w24.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const fs = require('fs');
const path = require('path');
const { wait } = C;

const SIZES = [[1000, 700], [800, 600], [640, 480]];

const measure = (page) => page.evaluate(() => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const root = document.querySelector('.civ-hud-banner-left');
  const doc = document.documentElement;
  const info = {
    innerW: W, innerH: H,
    docScrollW: doc.scrollWidth, docClientW: doc.clientWidth,
    bodyScrollW: document.body.scrollWidth,
    hasHorizontalScroll: doc.scrollWidth > W,
    leftBannerFound: !!root,
    leftBannerRect: null, maxRight: null, overflowing: [], fallbackClass: null,
    overflowingTop: [], overflowingBottom: [], clippedText: [],
  };
  if (root) {
    const r = root.getBoundingClientRect();
    info.leftBannerRect = { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    info.fallbackClass = root.className.includes('hud-left-fallback') ? 'fallback' : (root.className.includes('hud-left-compact') ? 'compact' : 'normal');
    let maxR = -Infinity;
    const els = [root, ...root.querySelectorAll('*')];
    for (const el of els) {
      if (!el.offsetParent && el !== root) continue;
      const br = el.getBoundingClientRect();
      if (br.width === 0 && br.height === 0) continue;
      if (br.right > maxR) maxR = br.right;
      const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 70);
      if (br.right > W + 0.5 || br.left < -0.5) {
        info.overflowing.push({ tag: el.tagName, cls, left: Math.round(br.left), right: Math.round(br.right) });
      }
      if (br.top < -0.5) info.overflowingTop.push({ tag: el.tagName, cls, top: Math.round(br.top) });
      if (br.bottom > H + 0.5) info.overflowingBottom.push({ tag: el.tagName, cls, bottom: Math.round(br.bottom), H });
      // Przyciecie wewnatrz elementu (tekst/etykieta szersza niz kontener).
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && (el.textContent || '').trim()) {
        info.clippedText.push({ tag: el.tagName, cls, scrollW: el.scrollWidth, clientW: el.clientWidth, text: (el.textContent || '').trim().slice(0, 30) });
      }
    }
    info.maxRight = Math.round(maxR);
    info.overflowing = info.overflowing.slice(0, 15);
    info.overflowingTop = info.overflowingTop.slice(0, 15);
    info.overflowingBottom = info.overflowingBottom.slice(0, 15);
    info.clippedText = info.clippedText.slice(0, 15);
  }
  return info;
});

(async () => {
  const browser = await C.launch();
  const out = { sizes: {} };
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(2000);
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij|OK)$/.test((x.textContent || '').trim())); if (b) b.click(); });
      await page.keyboard.press('Escape');
      await wait(400);
    }
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      await wait(1200);
      const m = await measure(page);
      const key = w + 'x' + h;
      out.sizes[key] = m;
      await page.screenshot({ path: path.join(C.EVID, 'w24-lewy-baner-' + key + '.png') });
      console.log(key, JSON.stringify(m));
    }
  } catch (e) { out.error = e.stack; }
  await browser.close();
  // Asercje (kryteria dispatchu + zarzut Evaluatora): brak poziomego scrolla, right<=W, top>=0, bottom<=H, brak przyciecia tekstu.
  const failures = [];
  for (const [key, m] of Object.entries(out.sizes)) {
    if (m.hasHorizontalScroll) failures.push(key + ': hasHorizontalScroll');
    if (m.maxRight !== null && m.maxRight > m.innerW) failures.push(key + ': maxRight ' + m.maxRight + ' > W');
    if (m.overflowingTop.length) failures.push(key + ': top<0 x' + m.overflowingTop.length);
    if (m.overflowingBottom.length) failures.push(key + ': bottom>H x' + m.overflowingBottom.length);
    if (m.clippedText.length) failures.push(key + ': clippedText x' + m.clippedText.length);
  }
  if (out.error) failures.push('error: ' + out.error.split('\n')[0]);
  out.failures = failures;
  out.verdict = failures.length ? 'FAIL' : 'PASS';
  fs.mkdirSync(C.EVID, { recursive: true });
  fs.writeFileSync(path.join(C.EVID, 'w24-lewy-baner.json'), JSON.stringify(out, null, 2));
  console.log('VERDICT', out.verdict, JSON.stringify(failures));
  process.exitCode = failures.length ? 1 : 0;
})();
