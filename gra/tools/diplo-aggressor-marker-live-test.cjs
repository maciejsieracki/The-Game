'use strict';
/**
 * diplo-aggressor-marker-live-test.cjs — R-WEB-AGGRESSOR-MARKER-Q1 (live Chromium, znacznik „Agresor (N)").
 *
 * Realny headless Chromium na bundle Vite zbudowanym do katalogu tymczasowego poza repo.
 *  T0. Brak flagi: brak znacznika w wierszu AI1.
 *  T1. AI1 wypowiada wojnę graczowi bez casus belli: znacznik „Agresor (20)", tooltip
 *      „Wypowiedział wojnę — konsekwencje dyplomatyczne przez 20 tur", wimpel cywilizacji nienaruszony.
 *  T2. Licznik maleje po prawdziwych końcach tury (N = flaga - tura).
 *  T3. Zapis/wczytanie (REALNE buildSaveGameSnapshot -> restoreGameFromSave) z aktywną flagą: znacznik wraca z tym samym N.
 *  T4. Wygaśnięcie: po dojściu tury do końca flagi znacznik znika (turn === doTury -> brak).
 *  T5. Casus belli (AI2): brak flagi, brak znacznika.
 *  C.  Zero pageerror/console.error.
 * Zrzuty: <evidenceDir>/marker-agresor-n20.png, marker-agresor-po-turach.png, marker-po-wczytaniu.png
 * Usage (z gra/): node tools/diplo-aggressor-marker-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-aggressor-marker-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-AGGRESSOR-MARKER-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI_A = 1;
const AI_B = 2;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[marker-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__aggressorTestDebug && !!window.__pracaPoolSaveLoadTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}


// Zrzut: cały viewport (kontekst HUD) + sam wiersz AI1 z blisko (czytelność znacznika).
async function shot(page, name) {
  // Wynik auto-bitwy (wojna AI1 vs gracz) może przykryć HUD. Stanu gry NIE ruszamy (klik w „Kontynuuj"
  // zaburzał kolejny koniec tury) — tylko na czas zrzutu podnosimy z-index panelu dyplomacji (wyłącznie dowód).
  await page.evaluate(() => window.__aggressorTestDebug.openPanel());
  await wait(500);
  await page.evaluate(() => {
    const el = document.querySelector('.civ-diplo');
    if (el) { el.dataset.prevZ = el.style.zIndex; el.style.zIndex = '2147483647'; }
  });
  await page.screenshot({ path: path.join(EVIDENCE, name + '-ekran.png') });
  const box = await page.locator(`.civ-diplo [data-owner="${AI_A}"]`).first().boundingBox();
  if (box) {
    const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 };
    await page.screenshot({ path: path.join(EVIDENCE, name + '-wiersz.png'), clip });
  }
  await page.evaluate(() => {
    const el = document.querySelector('.civ-diplo');
    if (el) el.style.zIndex = el.dataset.prevZ || '';
  });
}
const endTurnWarns = [];
async function endTurnAndSettle(page, timeoutMs = 120000) {
  const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => ({
      inProg: window.__eraTestDebug.isEndTurnInProgress(),
      turn: window.__eraTestDebug.getWorldState().turn,
    }));
    if (st.turn > turnBefore && !st.inProg) { await wait(150); return true; }
    await page.evaluate(() => {
      const btn = document.querySelector('.pb-overlay [data-act="auto"]');
      if (btn) btn.click();
    });
    await wait(200);
  }
  const diag = await page.evaluate(() => ({
    overlays: Array.from(document.querySelectorAll('[class*="overlay"],[class*="modal"],[role="dialog"]'))
      .filter((e) => e.offsetParent !== null).map((e) => e.className + ': ' + (e.textContent || '').slice(0, 120)),
  }));
  console.log('  [diag endTurn nie rozliczony]', JSON.stringify(diag), JSON.stringify(endTurnWarns.slice(-4)));
  return false;
}
async function badgeText(page, owner) {
  const loc = page.locator(`.civ-diplo [data-owner="${owner}"] .cd-agresor`);
  return (await loc.count()) === 0 ? null : (await loc.first().textContent());
}
async function badgeTitle(page, owner) {
  const loc = page.locator(`.civ-diplo [data-owner="${owner}"] .cd-agresor`);
  return (await loc.count()) === 0 ? null : await loc.first().getAttribute('title');
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[marker-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const reopen = async (page) => { await page.evaluate(() => window.__aggressorTestDebug.openPanel()); await wait(300); };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (m) => { const t = m.text(); if (t.includes('[EndTurn]')) endTurnWarns.push(t.slice(0, 200)); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
    await gotoPlaytestMapa(page);

    // SETUP (nie temat testu): `?playtest=mapa` = jeden AI + gracz => dominacja kończy grę w turze 2;
    // ten sam zabezpieczający hak co perf-long-session/forced-war-*-live (wyłącza WYŁĄCZNIE checkVictory).
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());

    console.log('[T0] brak flagi');
    await page.evaluate((a) => window.__aggressorTestDebug.contact(a), AI_A);
    await reopen(page);
    assert('T0: wiersz AI1 istnieje', (await page.locator(`.civ-diplo [data-owner="${AI_A}"]`).count()) === 1);
    assert('T0: brak znacznika przy braku flagi', (await badgeText(page, AI_A)) === null);

    console.log('[T1] wojna AI1 -> gracz bez casus belli');
    await page.evaluate(([a, p]) => window.__aggressorTestDebug.declareWar(a, p), [AI_A, PLAYER]);
    const s1 = await page.evaluate(() => window.__aggressorTestDebug.state());
    const until = s1.flags[String(AI_A)];
    assert('T1: flaga = tura + 20', until === s1.turn + 20, s1);
    await reopen(page);
    assert('T1: tekst „Agresor (20)"', (await badgeText(page, AI_A)) === 'Agresor (20)', await badgeText(page, AI_A));
    assert('T1: tooltip konsekwencji (20 tur)',
      (await badgeTitle(page, AI_A)) === 'Wypowiedział wojnę — konsekwencje dyplomatyczne przez 20 tur', await badgeTitle(page, AI_A));
    assert('T1: nazwa cywilizacji i wimpel nadal w wierszu',
      (await page.locator(`.civ-diplo [data-owner="${AI_A}"] .cd-civ`).count()) === 1
      && (await page.locator(`.civ-diplo [data-owner="${AI_A}"] .cd-civ-wrap`).count()) === 1);
    const geo = await page.evaluate((o) => {
      const row = document.querySelector(`.civ-diplo [data-owner="${o}"]`);
      const b = row.querySelector('.cd-agresor').getBoundingClientRect();
      const n = row.querySelector('.cd-civ').getBoundingClientRect();
      const first = row.firstElementChild.getBoundingClientRect();
      return { badgeLeft: b.left, nameRight: n.right, pennantRight: first.right, badgeTop: b.top, nameBottom: n.bottom };
    }, AI_A);
    assert('T1: znacznik nie nakłada się na nazwę ani wimpel (obok lub pod nazwą)',
      (geo.badgeLeft >= geo.nameRight - 1 || geo.badgeTop >= geo.nameBottom - 1) && geo.badgeLeft >= geo.pennantRight - 1, geo);
    await shot(page, 'marker-agresor-n20');

    console.log('[T2] licznik po turach');
    for (let i = 1; i <= 3; i++) {
      const ok = await endTurnAndSettle(page);
      assert(`T2: koniec tury #${i} rozliczony`, ok);
      await reopen(page);
      const st = await page.evaluate(() => window.__aggressorTestDebug.state());
      const want = until - st.turn;
      assert(`T2: po turze ${st.turn} licznik = ${want}`, (await badgeText(page, AI_A)) === `Agresor (${want})`, { got: await badgeText(page, AI_A), want });
      assert(`T2: tooltip ${want} tur`, (await badgeTitle(page, AI_A)) === `Wypowiedział wojnę — konsekwencje dyplomatyczne przez ${want} tur`);
    }
    await shot(page, 'marker-agresor-po-turach');

    console.log('[T3] zapis/wczytanie z aktywną flagą');
    const before = await page.evaluate(() => window.__aggressorTestDebug.state());
    await page.evaluate(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
    await wait(500);
    const after = await page.evaluate(() => window.__aggressorTestDebug.state());
    assert('T3: flaga i tura po wczytaniu bez zmian', after.flags[String(AI_A)] === until && after.turn === before.turn, { before, after });
    await reopen(page);
    const wantLoad = until - after.turn;
    assert(`T3: po wczytaniu znacznik „Agresor (${wantLoad})"`, (await badgeText(page, AI_A)) === `Agresor (${wantLoad})`, await badgeText(page, AI_A));
    await shot(page, 'marker-po-wczytaniu');

    console.log('[T5] casus belli AI2: brak flagi i znacznika');
    await page.evaluate(([b, p]) => {
      window.__aggressorTestDebug.contact(b);
      window.__aggressorTestDebug.refusalCasusBelli(b, p);
      window.__aggressorTestDebug.declareWar(b, p);
    }, [AI_B, PLAYER]);
    await reopen(page);
    assert('T5: AI2 brak znacznika', (await badgeText(page, AI_B)) === null);
    assert('T5: AI1 nadal ma znacznik', (await badgeText(page, AI_A)) !== null);

    console.log('[T4] wygaśnięcie flagi (koniec tury do doTury)');
    let guard = 0;
    while (guard++ < 30) {
      const st = await page.evaluate(() => window.__aggressorTestDebug.state());
      if (st.turn >= until) break;
      const ok = await endTurnAndSettle(page);
      if (!ok) { assert('T4: koniec tury rozliczony', false, st); break; }
      if (st.turn + 1 === until - 1) {
        await reopen(page);
        assert('T4: na 1 turę przed końcem „Agresor (1)"', (await badgeText(page, AI_A)) === 'Agresor (1)', await badgeText(page, AI_A));
      }
    }
    await reopen(page);
    const sEnd = await page.evaluate(() => window.__aggressorTestDebug.state());
    assert('T4: tura = koniec flagi', sEnd.turn === until, { sEnd, until });
    assert('T4: znacznik zniknął po wygaśnięciu', (await badgeText(page, AI_A)) === null, await badgeText(page, AI_A));

    assert('C: zero pageerror/console.error', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }
  console.log(`aggressor-marker-live-test: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[marker-live] FAIL:', e && e.stack ? e.stack : e); process.exit(1); });
