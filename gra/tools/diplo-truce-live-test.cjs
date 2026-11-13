'use strict';
/**
 * diplo-truce-live-test.cjs — R-WEB-TRUCE-Q1 (runda 5, N5): żywy cykl rozejmu w Chromium.
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo (`SKIP_BUILD=1` pomija budowanie, gdy bundle już jest).
 *
 *  U1. UI: audiencja AI -> przycisk „Zaproponuj pokój" (data-aid="10") -> modal; przełącznik
 *      „Rozejm" i chip „5 tur" zmieniają ukryte pola (`.cdb-treaty-peacekind`, `.cdb-treaty-truceturns`).
 *      Zrzut modala do katalogu runu. Wysłanie: wpis stołu ma akcję 'rozejm' i turns=5.
 *  L1. Akceptacja rozejmu (REALNA ścieżka applyProposalOutcome): status pary 'pokoj',
 *      truceUntilTurn = tura + 5, peaceUntilTurn = null (rozejm nie zakłada blokady DOW).
 *  L2. Okno rozejmu: w turach przed wygaśnięciem status nadal 'pokoj'; w turze wygaśnięcia
 *      status wraca do 'wojna', truceUntilTurn czyszczony, BEZ flagi agresora i BEZ kary
 *      (brak 'zlamanie_paktu_nap' w zdarzeniach Wiarygodności gracza).
 *  L3. Złamanie: rozejm 5 tur, wypowiedzenie wojny w oknie (REALNE ownerDeclareWarOn) →
 *      kara 'zlamanie_paktu_nap' w Wiarygodności gracza + flaga agresora dla pary,
 *      truceUntilTurn czyszczony.
 *  C.  Zero pageerror / console.error w całym scenariuszu.
 *
 * Usage (z gra/): node tools/diplo-truce-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 *   Najpierw bundle: node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *   potem: SKIP_BUILD=1 node tools/diplo-truce-live-test.cjs <scratch>
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-TRUCE-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PLAYER = 0;
const AI = 1;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) {
    console.log('[truce-live] SKIP_BUILD=1 — używam istniejącego bundle:', SCRATCH);
    return;
  }
  console.log('[truce-live] vite build do katalogu tymczasowego:', SCRATCH);
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
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

/** Kończy tury (nie miejsca): endTurn przesuwa miejsce, pełna tura wymaga kilku wywołań. */
async function endUntilTurn(page, target) {
  for (let i = 0; i < 400; i++) {
    const cur = await page.evaluate(() => window.__truceTestDebug.turn());
    if (cur >= target) return cur;
    if (process.env.TRUCE_DEBUG === '1') {
      const dbg = await page.evaluate(() => ({ ws: window.__eraTestDebug.getWorldState(), modal: !!document.querySelector('.civ-diplo-basket-overlay, .civ-diplo-audience, [role=dialog]') }));
      console.log('      dbg', i, JSON.stringify(dbg).slice(0, 300));
    }
    await endOneTurn(page);
  }
  throw new Error('endUntilTurn: nie osiągnięto tury ' + target);
}

async function pairState(page) {
  return page.evaluate(([a, b]) => window.__truceTestDebug.pairState(a, b), [PLAYER, AI]);
}

async function endOneTurn(page) {
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await wait(150);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[truce-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (process.env.TRUCE_DEBUG === '1' && /EndTurn|blocked/.test(m.text())) console.log('      warn', m.text().slice(0, 200));
  });

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 30), [AI]);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());

    // --- U1: UI modal rozejmu ---
    console.log('U1 UI: modal pokoj/rozejm');
    await page.evaluate(([ai]) => window.__truceTestDebug.openAudience(ai), [AI]);
    await page.waitForSelector('button[data-aid="10"]', { timeout: 20000 });
    await page.locator('button[data-aid="10"]').first().click({ timeout: 10000 });
    await page.waitForSelector('.cdb-chip-peacekind', { timeout: 20000 });
    const defaultKind = await page.evaluate(() => (document.querySelector('.cdb-treaty-peacekind'))?.value ?? null);
    assert('U1a domyślnie rodzaj = pokoj', defaultKind === 'pokoj', defaultKind);
    assert('U1b w trybie pokoju brak chipów rozejmu', (await page.locator('.cdb-chip-truceturns').count()) === 0);
    await page.locator('.cdb-chip-peacekind[data-kind="rozejm"]').click({ timeout: 10000 });
    await wait(200);
    const kindAfter = await page.evaluate(() => (document.querySelector('.cdb-treaty-peacekind'))?.value ?? null);
    assert('U1c przełącznik na rozejm zmienia pole', kindAfter === 'rozejm', kindAfter);
    assert('U1d rozejm pokazuje 3 chipy 5/10/15', (await page.locator('.cdb-chip-truceturns').count()) === 3);
    await page.locator('.cdb-chip-truceturns[data-turns="5"]').click({ timeout: 10000 });
    await wait(200);
    const turnsAfter = await page.evaluate(() => (document.querySelector('.cdb-treaty-truceturns'))?.value ?? null);
    assert('U1e chip 5 tur zapisuje długość', turnsAfter === '5', turnsAfter);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}' });
    await page.screenshot({ path: path.join(EVIDENCE, 'truce-01-modal-rozejm-5.png') });
    const submitDisabled = await page.locator('.cdb-submit').first().isDisabled().catch(() => true);
    assert('U1f przycisk wyślij aktywny', !submitDisabled);
    if (!submitDisabled) {
      await page.locator('.cdb-submit').first().click({ timeout: 10000 });
      await wait(300);
      const entries = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
      const truceEntry = entries.find(e => e.actionId === 'rozejm' && e.turns === 5);
      assert('U1g wysłanie z UI trafia na stół jako rozejm 5 tur', !!truceEntry, entries);
    }

    // Zamknij modal i audiencję: otwarty modal blokuje zakończenie tury (bramka endTurn).
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    await wait(300);
    const modalsLeft = await page.evaluate(() => document.querySelectorAll('.civ-diplo-basket-overlay').length);
    assert('U1h modal koszyka zamknięty po wysłaniu', modalsLeft === 0, modalsLeft);

    // --- L1: akceptacja rozejmu ---
    console.log('L1 akceptacja rozejmu');
    const t0 = (await pairState(page)).turn;
    const acc = await page.evaluate(([ai]) => window.__truceTestDebug.acceptTruceForTest(ai, 5), [AI]);
    assert('L1a akceptacja przechodzi (accepted)', acc.accepted === true, acc);
    const s1 = await pairState(page);
    assert('L1b status pary = pokoj po rozejmie', s1.status === 'pokoj', s1);
    assert('L1c truceUntilTurn = tura + 5', s1.truceUntilTurn === t0 + 5, { t0, s1 });
    assert('L1d rozejm nie zakłada peaceUntilTurn', s1.peaceUntilTurn === null, s1);

    // --- L2: okno i wygaśnięcie bez kary ---
    console.log('L2 okno rozejmu i wygaśnięcie');
    const credBefore = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    await endUntilTurn(page, t0 + 4);
    const sWin = await pairState(page);
    assert('L2a w oknie (tura < until) status nadal pokoj', sWin.turn < t0 + 5 && sWin.status === 'pokoj' && sWin.truceUntilTurn === t0 + 5, sWin);
    await endUntilTurn(page, t0 + 5);
    const sExp = await pairState(page);
    assert('L2b w turze wygaśnięcia wojna wraca', sExp.turn === t0 + 5 && sExp.status === 'wojna', sExp);
    assert('L2c truceUntilTurn wyczyszczony', sExp.truceUntilTurn === null, sExp);
    const flags = await page.evaluate(() => window.__truceTestDebug.aggressorFlags());
    assert('L2d brak flagi agresora po wygaśnięciu', Object.keys(flags).length === 0, flags);
    const credAfter = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    const credTyp = await page.evaluate(([p]) => JSON.stringify(window.__truceTestDebug.credibilityEvents(p)), [PLAYER]);
    // Kara za złamanie rozejmu to WYŁĄCZNIE 'zlamanie_paktu_nap'. Inne zdarzenia (np. przemarsz
    // jednostek na terytorium AI, nalicza się też przy pokoju) nie są karą za rozejm.
    assert('L2e brak kary zlamanie_paktu_nap po wygaśnięciu', !credTyp.includes('zlamanie_paktu_nap'), { credBefore, credAfter, credTyp: credTyp.slice(0, 400) });

    // --- L3: złamanie w oknie ---
    console.log('L3 złamanie rozejmu');
    const t1 = (await pairState(page)).turn;
    const acc2 = await page.evaluate(([ai]) => window.__truceTestDebug.acceptTruceForTest(ai, 5), [AI]);
    assert('L3a ponowna akceptacja rozejmu', acc2.accepted === true, acc2);
    const credBreach0 = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    // Casus belli gracza wobec AI: bez złamania wypowiedzenie miałoby przyczynę casus belli (bez flagi).
    // Złamanie rozejmu ma wymusić przyczynę 'bez_powodu' (flaga agresora) MIMO casus belli.
    await page.evaluate(([p, ai]) => window.__aggressorTestDebug.refusalCasusBelli(p, ai), [PLAYER, AI]);
    await page.evaluate(([p, ai]) => window.__truceTestDebug.declareWar(p, ai), [PLAYER, AI]);
    const sBr = await pairState(page);
    assert('L3b wypowiedzenie w oknie zrywa rozejm, wojna', sBr.status === 'wojna' && sBr.truceUntilTurn === null, { t1, sBr });
    const credBreach1 = await page.evaluate(([p]) => JSON.stringify(window.__truceTestDebug.credibilityEvents(p)), [PLAYER]);
    assert('L3c kara zlamanie_paktu_nap za złamanie rozejmu', credBreach1.includes('zlamanie_paktu_nap'), credBreach1.slice(0, 300));
    const flagsBr = await page.evaluate(() => window.__truceTestDebug.aggressorFlags());
    assert('L3d flaga agresora dla złamania rozejmu (mimo casus belli)', Object.keys(flagsBr).length > 0, flagsBr);
    const credCount = await page.evaluate(([p]) => window.__truceTestDebug.credibilityEvents(p).length, [PLAYER]);
    assert('L3e zdarzenia Wiarygodności przybyły po złamaniu', credCount > credBreach0, { credBreach0, credCount });
  } catch (e) {
    fail++;
    console.error(' FAIL wyjątek:', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e);
  }

  assert('C zero pageerror/console.error', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  console.log(`\n${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
