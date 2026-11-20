'use strict';
/**
 * R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1 r2 — test NA ŻYWO panelu Tempo + minimapy w bitwie.
 *
 * Uruchomienie (z katalogu gra/):
 *   node tools/battle-hud-tempo-minimap-live-test.cjs            # bramka: zachowanie + pomiary
 *   SHOT_LABEL=PRZED-r2 node tools/battle-hud-tempo-minimap-live-test.cjs   # + zrzuty do evidence/
 *   MUTATE=1 node tools/battle-hud-tempo-minimap-live-test.cjs   # kontrola negatywna (oczekiwany FAIL)
 *
 * Co sprawdza (prawdziwa BattleScene w Chromium, klikniecia realna mysza):
 *  (A) ZACHOWANIE przyciskow Tempo: Przyspiesz/Zwolnij zmieniaja speedIdx o +1/-1 i odczyt ×N;
 *      Pauza przelacza scene.paused; AUTO przelacza _manualMode.
 *  (B) ZACHOWANIE minimapy: klik w lewa i prawa czesc canvasu przesuwa camTarget monotonicznie;
 *      ten sam punkt daje ten sam camTarget (deterministycznie).
 *  (C) STANY: hover przycisku zmienia computed color/border; focus-visible (klawiatura) daje
 *      widoczny outline 2px; AUTO aktywne ma inne tlo niz nieaktywne.
 *  (D) UKLAD: panel Tempo w prawym dolnym rogu, szerokosc <= 236 px * 1,10 (wymog ≤+10%).
 *  (E) brak pageerror w konsoli.
 *
 * MUTATE=1: odlacza handler przycisku „Zwolnij” (onclick=null) na kopii w przegladarce.
 * Test MUSI wtedy zglosic FAIL w sekcji (A) — inaczej kontrola negatywna nie dziala.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');

const root = path.resolve(__dirname, '..');
const evidence = path.resolve(root, '..', 'dyspozycje/autobot/runs/R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1/evidence');
const SHOT_LABEL = process.env.SHOT_LABEL || '';
const MUTATE = process.env.MUTATE === '1';
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'),
  ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])]
  .find(p => p && fs.existsSync(p));

const VIEWPORTS = [
  { w: 1024, h: 640, dpr: 1 },
  { w: 1280, h: 720, dpr: 1 },
  { w: 1400, h: 900, dpr: 1 },
  { w: 1280, h: 720, dpr: 2 },
];

const results = { checks: [], metrics: [] };
function check(group, name, cond, detail) {
  results.checks.push({ group, name, ok: !!cond, detail: detail === undefined ? null : detail });
  console.log(`  [${cond ? 'OK' : 'FAIL'}] ${group} ${name}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`);
}

const STATE_JS = () => {
  const s = window.__tempo.scene;
  return {
    speedIdx: s.speedIdx, speedMul: s.speedMul, paused: s.paused, manual: s._manualMode,
    deploy: s.deployPhase, lbl: s._tempoSpeedLbl ? s._tempoSpeedLbl.textContent : null,
  };
};

async function btnCenter(page, label) {
  return page.evaluate(l => {
    const b = document.querySelector(`button[aria-label="${l}"]`);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, label);
}

async function clickBtn(page, label) {
  const c = await btnCenter(page, label);
  if (!c) throw new Error('brak przycisku: ' + label);
  await page.mouse.click(c.x, c.y);
  await page.waitForTimeout(150);
}

async function runViewport(browser, server, vp, behaviour) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-hud-tempo-minimap-entry.html`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__tempo?.ready === true, undefined, { timeout: 60000 });
  await page.waitForFunction(() => !!document.querySelector('button[aria-label="Przyspiesz"]'), undefined, { timeout: 60000 });
  await page.waitForTimeout(800);

  const tag = `${vp.w}x${vp.h}${vp.dpr > 1 ? '@' + vp.dpr : ''}`;
  const metric = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Przyspiesz"]');
    const wrap = b.parentElement.parentElement;
    const r = wrap.getBoundingClientRect();
    const cs = getComputedStyle(b);
    return {
      panel: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        right: Math.round(window.innerWidth - r.right), bottom: Math.round(window.innerHeight - r.bottom) },
      btnBorder: cs.borderTopColor, btnColor: cs.color, btnBg: cs.backgroundImage.slice(0, 120),
    };
  });
  const st0 = await page.evaluate(STATE_JS);
  if (st0.deploy) throw new Error('scena w fazie rozstawiania — brak rzedu Tempo');
  metric.tag = tag;
  metric.deploy = st0.deploy;

  // (D) uklad
  check(`D[${tag}]`, 'panel w prawym dolnym rogu (<=20 px od krawedzi)', metric.panel.right <= 20 && metric.panel.bottom <= 20, metric.panel);
  check(`D[${tag}]`, 'szerokosc panelu <= 236*1.10 px', metric.panel.w <= 236 * 1.10, metric.panel.w);

  // (P) paleta minimapy = tokeny marki (R-WEB r3): porownanie PIKSELI canvasu, nie tekstu zrodla.
  // Oczekiwane kolory liczy przegladarka z var(--tg-*) i color-mix; mutacja palety (np. stary #1a3878) ⇒ FAIL.
  const pal = await page.evaluate(() => {
    const probeCss = expr => { const p = document.createElement('span'); p.style.color = expr; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const px = css => { cx.fillStyle = '#010203'; cx.fillStyle = css; if (cx.fillStyle === '#010203' && css.trim().toLowerCase() !== '#010203') return null; cx.clearRect(0, 0, 1, 1); cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return Array.from(cx.getImageData(0, 0, 1, 1).data); };
    const P = window.__tempo.palette;
    const exp = {
      bg: 'var(--tg-bg-deep)',
      river: 'color-mix(in srgb, var(--tg-science-blue) 45%, var(--tg-panel-bg))',
      ford: 'color-mix(in srgb, var(--tg-science-blue) 60%, var(--tg-panel-bg))',
      viewFrame: 'color-mix(in srgb, var(--tg-gold-primary) 95%, transparent)',
    };
    const out = {};
    for (const k of Object.keys(exp)) out[k] = { have: px(P[k]), want: px(probeCss(exp[k])) };
    out.fnRiver = px(P.riverFn); out.fnFord = px(P.fordFn); out.constRiver = px(P.river); out.constFord = px(P.ford);
    return out;
  });
  const near = (a, b, tol) => !!a && !!b && a.every((v, i) => Math.abs(v - b[i]) <= tol);
  for (const k of ['bg', 'river', 'ford', 'viewFrame']) {
    const tol = k === 'viewFrame' ? 3 : 1;
    check(`P[${tag}]`, `paleta ${k} = token marki (piksel canvasu)`, near(pal[k].have, pal[k].want, tol), { have: pal[k].have, want: pal[k].want });
  }
  check(`P[${tag}]`, 'terrainMinimapColor(3)/(4) (rzeka/bród) = stałe palety', near(pal.fnRiver, pal.constRiver, 0) && near(pal.fnFord, pal.constFord, 0), { fnRiver: pal.fnRiver, fnFord: pal.fnFord });

  if (SHOT_LABEL) {
    fs.mkdirSync(evidence, { recursive: true });
    const file = path.join(evidence, `${SHOT_LABEL}-${tag}.png`);
    await page.screenshot({ path: file });
    const pr = await page.evaluate(() => {
      const b = document.querySelector('button[aria-label="Przyspiesz"]');
      const r = b.parentElement.parentElement.getBoundingClientRect();
      return { x: Math.max(0, r.left - 12), y: Math.max(0, r.top - 12), width: r.width + 24, height: r.height + 24 };
    });
    await page.screenshot({ path: path.join(evidence, `${SHOT_LABEL}-panel-${tag}.png`), clip: pr });
    metric.shot = file;
  }

  if (behaviour) {
    // (C) stany hover / focus / AUTO
    const before = await page.evaluate(() => getComputedStyle(document.querySelector('button[aria-label="Przyspiesz"]')).color);
    const c = await btnCenter(page, 'Przyspiesz');
    await page.mouse.move(c.x, c.y);
    await page.waitForTimeout(150);
    const hovered = await page.evaluate(() => getComputedStyle(document.querySelector('button[aria-label="Przyspiesz"]')).color);
    check('C', 'hover zmienia kolor przycisku Przyspiesz', hovered !== before, { before, hovered });
    metric.hover = { before, hovered };
    await page.mouse.move(0, 0);

    // kolor przycisku tempa (nieaktywny) = token --tg-gold-primary; 4 przyciski maja aria-label
    const goldWant = await page.evaluate(() => { const p = document.createElement('span'); p.style.color = 'var(--tg-gold-primary)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    const colorNow = await page.evaluate(() => getComputedStyle(document.querySelector('button[aria-label="Przyspiesz"]')).color);
    check('C', 'kolor nieaktywnego przycisku tempa = token --tg-gold-primary', colorNow === goldWant, { got: colorNow, want: goldWant });
    const labels = await page.evaluate(() => ['Zwolnij', 'Przyspiesz', 'Pauza / Wznów (P)', 'AUTO-rozegranie bitwy (R)'].map(l => !!document.querySelector(`button[aria-label="${l}"]`)));
    check('C', 'cztery przyciski tempa maja aria-label', labels.every(Boolean), labels);

    // fokus klawiatura: Tab az do przycisku Przyspiesz
    await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
    let focused = false;
    for (let i = 0; i < 80 && !focused; i++) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Przyspiesz' && document.activeElement.matches(':focus-visible'));
    }
    if (focused) {
      const ol = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { w: cs.outlineWidth, st: cs.outlineStyle }; });
      check('C', 'focus-visible (klawiatura) daje obrys 2px na Przyspiesz', ol.w === '2px' && ol.st === 'solid', ol);
      metric.focus = ol;
    } else {
      check('C', 'focus-visible (klawiatura) osiagalny przez Tab', false, 'NIE ZMIERZONO: Tab nie doszedl do Przyspiesz');
    }

    // AUTO aktywne vs nieaktywne (tlo)
    const autoBg = () => page.evaluate(() => getComputedStyle(document.querySelector('button[aria-label="AUTO-rozegranie bitwy (R)"]')).backgroundImage);
    const a0 = await autoBg();
    await clickBtn(page, 'AUTO-rozegranie bitwy (R)');
    const a1 = await autoBg();
    await clickBtn(page, 'AUTO-rozegranie bitwy (R)');
    const a2 = await autoBg();
    check('C', 'AUTO: aktywne tlo rozne od nieaktywnego', a0 !== a1, { a0: a0.slice(0, 80), a1: a1.slice(0, 80) });
    check('C', 'AUTO: powrot do stanu poczatkowego po dwoch klikach', a2 === a0, { a0: a0.slice(0, 80), a2: a2.slice(0, 80) });
    metric.auto = { off: a0.slice(0, 80), on: a1.slice(0, 80) };

    // (A) zachowanie przyciskow tempa
    if (MUTATE) {
      await page.evaluate(() => { document.querySelector('button[aria-label="Zwolnij"]').onclick = null; });
      console.log('  [MUTACJA] handler „Zwolnij” odlaczony (onclick=null) na kopii w przegladarce');
    }
    const s0 = await page.evaluate(STATE_JS);
    await clickBtn(page, 'Przyspiesz');
    const s1 = await page.evaluate(STATE_JS);
    check('A', 'Przyspiesz zwieksza speedIdx o 1', s0.speedIdx >= 9 || s1.speedIdx === s0.speedIdx + 1, { from: s0.speedIdx, to: s1.speedIdx });
    check('A', 'odczyt ×N zgodny z speedMul po Przyspiesz', s1.lbl === '×' + s1.speedMul, { lbl: s1.lbl, mul: s1.speedMul });
    await clickBtn(page, 'Zwolnij');
    const s2 = await page.evaluate(STATE_JS);
    check('A', 'Zwolnij cofa speedIdx (powrot do poczatku)', s2.speedIdx === s0.speedIdx, { start: s0.speedIdx, after: s2.speedIdx });
    await clickBtn(page, 'Pauza / Wznów (P)');
    const p1 = await page.evaluate(STATE_JS);
    check('A', 'Pauza przelacza scene.paused', p1.paused !== s0.paused, { before: s0.paused, after: p1.paused });
    await clickBtn(page, 'Pauza / Wznów (P)');
    const p2 = await page.evaluate(STATE_JS);
    check('A', 'Pauza wraca do stanu poczatkowego', p2.paused === s0.paused, { paused: p2.paused });
    metric.tempo = { start: s0.speedIdx, plus: s1.speedIdx, minusBack: s2.speedIdx };

    // (B) zachowanie minimapy
    const cam = () => page.evaluate(() => { const v = window.__tempo.scene.camTarget; return { x: v.x, z: v.z }; });
    const clickMini = async (fx, fy) => {
      const r = await page.evaluate(() => { const r = window.__tempo.scene._minimapCanvas.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
      await page.mouse.click(r.l + r.w * fx, r.t + r.h * fy);
      await page.waitForTimeout(150);
      return cam();
    };
    const c1 = await clickMini(0.1, 0.5);
    const c2 = await clickMini(0.9, 0.5);
    const c3 = await clickMini(0.1, 0.5);
    check('B', 'klik w lewa czesc minimapy przesuwa kamere (x maleje wzgledem prawej)', c2.x > c1.x + 1e-3, { left: c1, right: c2 });
    check('B', 'ten sam punkt minimapy -> ta sama pozycja kamery (deterministycznie)', Math.abs(c3.x - c1.x) < 1e-6 && Math.abs(c3.z - c1.z) < 1e-6, { first: c1, again: c3 });
    metric.minimap = { left: c1, right: c2 };
  }

  check(`E[${tag}]`, 'brak pageerror w konsoli', errors.length === 0, errors.slice(0, 5));
  await ctx.close();
  return metric;
}

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const vp of VIEWPORTS) {
      const behaviour = true; // zachowanie, stany i pomiary na kazdym z 4 wariantow ekranu
      console.log(`== viewport ${vp.w}x${vp.h} @${vp.dpr} (zachowanie + stany)`);
      results.metrics.push(await runViewport(browser, server, vp, behaviour));
    }
  } finally { await browser.close(); await server.close(); }

  const fails = results.checks.filter(c => !c.ok);
  const outFile = path.join(evidence, MUTATE ? 'live-test-mutacja.json' : 'live-test.json');
  if (fs.existsSync(evidence)) fs.writeFileSync(outFile, JSON.stringify({ exe, mutate: MUTATE, ...results }, null, 2) + '\n');
  console.log(`\nWynik: ${results.checks.length - fails.length} OK, ${fails.length} FAIL`);
  if (MUTATE) {
    const tempoFails = fails.filter(f => f.group === 'A');
    if (tempoFails.length) { console.log('KONTROLA NEGATYWNA: mutacja zlapana (FAIL w A) — OK'); }
    else { console.log('KONTROLA NEGATYWNA: mutacja NIE zlapana — FAIL testu'); process.exitCode = 1; }
    return;
  }
  if (fails.length) process.exitCode = 1;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
