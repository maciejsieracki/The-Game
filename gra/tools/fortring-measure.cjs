'use strict';
/**
 * fortring-measure.cjs -- R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1 (FORTRING, runda 2): pomiar pierscienia fortow
 * ON vs OFF na zywej grze (POMIAR, nie zmiana zasad gry).
 *
 * Przebieg (jeden wariant = jeden ciagly bieg, osobna strona Chromium):
 *   - bundle vite (budowany POZA repo, --dist), `?civTest=1&civSeed=<seed>` (domyslnie 4242),
 *   - przelacznik pierscienia: `__settingsLive.setFortRingOff(true)` (OFF) albo brak wywolania (ON = reguła gry),
 *     ustawiany PRZED startem gry; odczyt zwrotny `fortRingOff()` jest zapisany w wyniku,
 *   - nowa gra (`__nnsMeasureDebug.startGame`), zalozenie miasta gracza (`foundFirstCity`), wyciszenie zwyciestwa,
 *   - N tur (domyslnie 60): realny `endTurn` gracza; blokady modalne i oferty zamykane/odrzucane jak w
 *     ai-economy-measure-run.cjs (wspolne helpery measure-*.cjs), bez zmian stanu gry poza tymi kliknieciami.
 *
 * Mierzone (wszystko z odczytu gry):
 *   - czas tury AI: ms od wywolania endTurn do momentu, gdy `state().turn` wzrosl i koniec tury jest zakonczony
 *     (zegar strony `performance.now()`, odpytywanie co 100 ms; obejmuje faze AI i przetwarzanie tury),
 *     -> mediana i p95 po turach 1..N (osobno, dla calego biegu),
 *   - liczba fortow/posterunkow (`__settingsLive.fortCount()`) po kazdej turze,
 *   - skrot stanu (`__detHarness.snapshotJson()`, znormalizowany jak w ai-economy-measure-run.cjs) w turze 30 i N,
 *   - round-trip zapisu (`__settingsLive.saveRoundTrip()` = persistSaveToSlot + loadGameFromSlot) po turze N:
 *     skrot stanu PRZED i PO wczytaniu oraz liczba fortow przed/po. Zgodnosc = identyczne skroty.
 *
 * Wynik (w --out): `fortring-<wariant>-seed<S>.jsonl.gz` (jedna linia na ture + linia podsumowania),
 * `fortring-<wariant>-seed<S>.summary.json`. Sumy SHA256 dopisywane przez orkiestracje (SHA256SUMS).
 *
 * Usage (z gra/):  node tools/fortring-measure.cjs --variant on|off [--seed 4242] [--turns 60] [--out <abs>] [--dist <abs>] [--build 1]
 * Env: CHROME_PATH (opcjonalnie). Limit pojedynczego polecenia Bash < 590 s: przebieg mozna dzielic --turns.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL } = require('./measure-close-modals.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA_DIR = path.resolve(__dirname, '..');
const TECH_SEL = { side: TECH_SIDE_CLOSE_SEL, main: TECH_MAIN_CLOSE_SEL };
const CHROME = process.env.CHROME_PATH || resolveChromePath() || '/usr/bin/chromium';
const wait = ms => new Promise(r => setTimeout(r, ms));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const VARIANT = arg('variant', null);
if (!arg('dist', null) || !arg('scratch', null)) { console.error('wymagane: --dist <abs> --scratch <abs> (poza repo)'); process.exit(2); }
if (VARIANT !== 'on' && VARIANT !== 'off') { console.error('--variant on|off jest wymagane'); process.exit(2); }
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '60'), 10);
const HASH_AT = [30, TURNS].filter((t, i, a) => t <= TURNS && a.indexOf(t) === i);
const OUT = path.resolve(arg('out', path.join(GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1', 'dane')));
const DIST = arg('dist', null) ? path.resolve(arg('dist', null)) : null; // wymagane: bundle poza repo (np. katalog w scratchpad)
const BUDGET_SEC = parseInt(arg('budget-sec', '400'), 10); // limit czasu jednej wywolania (wznowienie ze slotu w nastepnym)
const SCRATCH = arg('scratch', null) ? path.resolve(arg('scratch', null)) : null; // wymagane: stan wznowienia i wiersze tur (poza repo)
const SLOT = `fortring-${VARIANT}-seed${SEED}`;
const BYPASS_GOLD = 200;
const BYPASS_FOOD = 200;

function ensureBuild() {
  if (arg('build', '0') !== '1' && fs.existsSync(path.join(DIST, 'index.html'))) return;
  console.log('[fortring] build vite -> ' + DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

/** Zamyka blokady modalne jak gracz (audiencja, panel armii, karta technologii). Zwraca liczbe zamknietych. */
function closeModalsInPage(techSel) {
  const closed = [];
  const aud = document.querySelector('.civ-diplo-aud');
  if (aud && aud.style.display !== 'none') { const b = aud.querySelector('.civ-diplo-aud-back'); if (b) { b.click(); closed.push('aud'); } }
  if (document.getElementById('civ-amp-title')) { const b = document.querySelector('.civ-amp-btn-sep'); if (b) { b.click(); closed.push('amp'); } }
  const tn = document.getElementById('civ-tech-discovery-notice-host');
  if (tn) { const b = tn.querySelector(techSel.side) || tn.querySelector(techSel.main); if (b) { b.click(); closed.push('tech'); } }
  return closed.length;
}
async function closeEndTurnModals(page) {
  let total = 0;
  for (let k = 0; k < 20; k++) {
    const n = await page.evaluate(closeModalsInPage, TECH_SEL);
    if (n === 0) break;
    total += n;
    await wait(300);
  }
  return total;
}

async function clearBattles(page) {
  let n = 0;
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    await closeEndTurnModals(page);
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    if (act === 'auto') n++;
    await wait(act === 'wait' ? 300 : 150);
  }
  return n;
}

/** Skrot stanu znormalizowany jak w ai-economy-measure-run.cjs (stateHash): te same pola pomijane. */
async function stateJson(page) {
  return page.evaluate(() => {
    const o = JSON.parse(window.__detHarness.snapshotJson());
    delete o.meta;
    if (Array.isArray(o.units)) for (const u of o.units) { if (u && 'stackGroupId' in u) u.stackGroupId = null; }
    if (Array.isArray(o.cities)) for (const c of o.cities) {
      if (!c) continue;
      if (Array.isArray(c.budowaLista) && c.budowaLista.length === 0) delete c.budowaLista;
      if (c.magazynZywnosci === 0) delete c.magazynZywnosci;
      if (c.postepBudynkowUsuniete && typeof c.postepBudynkowUsuniete === 'object' && Object.keys(c.postepBudynkowUsuniete).length === 0) delete c.postepBudynkowUsuniete;
    }
    delete o.resourceLedgerHistory;
    return JSON.stringify(o);
  });
}
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
/** Diagnostyka round-trip: klucze najwyzszego poziomu, ktore rozni sie miedzy dwoma zrzutami (pierwsza roznica + kontekst). */
function diffSnapshots(a, b) {
  const A = JSON.parse(a); const B = JSON.parse(b);
  const out = [];
  for (const k of [...new Set([...Object.keys(A), ...Object.keys(B)])]) {
    const ja = JSON.stringify(A[k]); const jb = JSON.stringify(B[k]);
    if (ja === jb) continue;
    let i = 0; while (i < ja.length && i < jb.length && ja[i] === jb[i]) i++;
    out.push({ key: k, firstDiffAt: i, beforeCtx: ja.slice(Math.max(0, i - 60), i + 80), afterCtx: jb.slice(Math.max(0, i - 60), i + 80) });
  }
  return out;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}
const median = arr => {
  const s = arr.slice().sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function turnOf(page) {
  return page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
}

/** Jedna tura: blokady, oferty, bitwy, koniec tury, pomiar czasu. Zwraca {ms, turn} albo {stop, why}. */
async function playOneTurn(page, counters) {
  const before = await turnOf(page);
  if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) {
    await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [BYPASS_GOLD]);
    await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [BYPASS_FOOD]);
    counters.gateBypass++;
    if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) return { stop: 'gate-blocked-after-bypass' };
  }
  await closeEndTurnModals(page);
  counters.battlesAuto += await clearBattles(page);
  const seen = new Set();
  const o1 = await rejectAwaitingAiOffers(page, seen);
  counters.offersRejected += o1.confirmed;
  await acceptForcedPeace(page, counters, wait);
  let canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  if (!canEnd) {
    const o2 = await rejectAwaitingAiOffers(page, seen);
    counters.offersRejected += o2.confirmed;
    canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  }
  if (!canEnd) return { stop: 'cannot-end', why: await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState()) };
  await closeEndTurnModals(page);
  const t0 = await page.evaluate(() => performance.now());
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  const deadline = Date.now() + 900000;
  let advanced = false;
  while (!advanced && Date.now() < deadline) {
    advanced = await page.evaluate(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
    if (!advanced) { await closeEndTurnModals(page); await wait(100); }
  }
  const t1 = await page.evaluate(() => performance.now());
  if (!advanced) return { stop: 'endturn-timeout' };
  return { ms: Math.round((t1 - t0) * 10) / 10, turn: await turnOf(page) };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  ensureBuild();
  const base = `fortring-${VARIANT}-seed${SEED}`;
  const statePath = path.join(SCRATCH, base + '.state.json');
  const rowsPath = path.join(SCRATCH, base + '.rows.jsonl');
  const profileDir = path.join(SCRATCH, 'profile-' + VARIANT);
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
  if (state && state.done) { console.log('[fortring] bieg juz zakonczony (state.done=true); nic do zrobienia'); return; }
  const resumed = !!state;
  const counters = state ? state.counters : { gateBypass: 0, battlesAuto: 0, offersRejected: 0, forcedPeaceAccepted: 0 };
  const t0 = Date.now();
  const errors = [];
  const ctx = await chromium.launchPersistentContext(profileDir, { headless: true, executablePath: CHROME, viewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e && e.message).slice(0, 300)));
  let stopReason = null;
  let roundTrip = null;
  let done = false;
  let partial = false;
  let savedTurn = state ? state.lastTurn : 0;
  let savedCounters = state ? { ...state.counters } : { ...counters };
  try {
    await page.goto('file://' + path.join(DIST, 'index.html') + `?civTest=1&civSeed=${SEED}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness && !!window.__settingsLive, null, { timeout: 180000 });
    const hookPresent = await page.evaluate(() => typeof window.__settingsLive.setFortRingOff === 'function');
    if (!hookPresent) throw new Error('brak haka setFortRingOff (bundle bez przelacznika pierscienia)');
    const ringOffRead = await page.evaluate((off) => { window.__settingsLive.setFortRingOff(off); return window.__settingsLive.fortRingOff(); }, VARIANT === 'off');
    if (ringOffRead !== (VARIANT === 'off')) throw new Error('odczyt przelacznika nie zgadza sie z wariantem: ' + ringOffRead);
    // Jak ai-economy-measure-run.cjs (openGame): gra ZAWSZE startuje od nowa (nowa gra / ten sam seed), a wznowienie
    // laduje slot NA TEJ gry. Wczytanie na niezaladowanej stronie daje zamkniecie strony (SIGSEGV) -- stad ten krok.
    await page.evaluate(([seed]) => window.__nnsMeasureDebug.startGame({ seed }), [SEED]);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    if (!resumed) {
      const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
      if (!founded) throw new Error('foundFirstCity=false');
    } else {
      // Wiersze tur po ostatnio ZAPISANYM slocie (state.lastTurn) sa odrzucane: po zamknieciu strony gra wraca do slotu.
      const kept = fs.readFileSync(rowsPath, 'utf8').trim().split('\n').map(l => JSON.parse(l))
        .filter(r => r.kind !== 'turn' || r.turn <= state.lastTurn);
      fs.writeFileSync(rowsPath, kept.map(r => JSON.stringify(r)).join('\n') + '\n');
      const loaded = await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT);
      if (loaded === false) throw new Error('loadSlot zwrocil false (slot ' + SLOT + ')');
      fs.appendFileSync(rowsPath, JSON.stringify({ kind: 'resume', fromTurn: state.lastTurn, turnAfterLoad: await turnOf(page) }) + '\n');
    }
    await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
    if (!resumed) {
      fs.writeFileSync(rowsPath, JSON.stringify({ kind: 'start', variant: VARIANT, seed: SEED, ringOff: ringOffRead, turn: await turnOf(page), forts: await page.evaluate(() => window.__settingsLive.fortCount()) }) + '\n');
    }
    let turnNow = await turnOf(page);
    while (turnNow < TURNS) {
      if ((Date.now() - t0) / 1000 > BUDGET_SEC) { partial = true; break; }
      const r = await playOneTurn(page, counters);
      if (r.stop) { stopReason = { tura: turnNow, ...r }; break; }
      const forts = await page.evaluate(() => window.__settingsLive.fortCount());
      const row = { kind: 'turn', turn: r.turn, ms: r.ms, forts };
      if (HASH_AT.includes(r.turn)) row.stateSha256 = sha256(await stateJson(page));
      fs.appendFileSync(rowsPath, JSON.stringify(row) + '\n');
      console.log(`[fortring ${VARIANT}] tura ${r.turn} ${r.ms} ms forty=${forts}`);
      turnNow = r.turn;
    }
    if (!stopReason && !partial && turnNow >= TURNS) {
      // Round-trip zapisu po turze N: skrot PRZED i PO saveRoundTrip (persistSaveToSlot + loadGameFromSlot).
      const jsonBefore = await stateJson(page);
      const fortsBefore = await page.evaluate(() => window.__settingsLive.fortCount());
      const rt = await page.evaluate(() => window.__settingsLive.saveRoundTrip());
      const jsonAfter = await stateJson(page);
      const fortsAfter = await page.evaluate(() => window.__settingsLive.fortCount());
      const shaBefore = sha256(jsonBefore); const shaAfter = sha256(jsonAfter);
      // Diagnostyka (nie zmienia wyniku): ktore pola roznia sie po wczytaniu, z pierwsza roznica.
      const diff = shaBefore === shaAfter ? [] : diffSnapshots(jsonBefore, jsonAfter).slice(0, 12);
      roundTrip = { saved: rt.saved, shaBefore, shaAfter, identical: shaBefore === shaAfter, fortsBefore, fortsAfter, fortsEqual: fortsBefore === fortsAfter, diffTopKeys: diff.map(d => d.key), diff };
      done = true;
    }
    if (partial && !stopReason) {
      const ok = await page.evaluate(slot => window.__aiTradeWiringTestDebug.quickSave(slot), SLOT);
      if (ok === false) throw new Error('quickSave zwrocil false');
      savedTurn = turnNow;
      savedCounters = { ...counters };
    }
  } catch (e) {
    stopReason = stopReason || { blad: String(e && e.message).slice(0, 4000) };
  } finally {
    await ctx.close();
  }
  const lastTurn = done ? TURNS : savedTurn;
  fs.writeFileSync(statePath, JSON.stringify({ variant: VARIANT, seed: SEED, lastTurn, counters: done ? counters : savedCounters, done: done && !stopReason, stopReason, roundTrip, errors: errors.slice(0, 10) }, null, 1));
  console.log(`[fortring ${VARIANT}] chunk: lastTurn=${lastTurn} partial=${partial} done=${done} stop=${JSON.stringify(stopReason)} sec=${Math.round((Date.now() - t0) / 1000)}`);
  if (!(done && !stopReason)) { process.exitCode = stopReason ? 1 : 0; return; }
  // Wiersze tur ponad zapisany slot (gdyby zostaly) nie wchodza do wyniku; po done slot = TURNS.
  // Finalizacja: wszystkie wiersze + podsumowanie -> jsonl.gz w --out (dane) + summary.json.
  const rows = fs.readFileSync(rowsPath, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const turnRows = rows.filter(r => r.kind === 'turn' && typeof r.ms === 'number');
  const msList = turnRows.map(r => r.ms);
  const sorted = msList.slice().sort((a, b) => a - b);
  const summary = {
    schema: 'fortring-measure-v1', variant: VARIANT, seed: SEED, turnsRequested: TURNS, turnsDone: turnRows.length,
    ringOff: VARIANT === 'off', msMedian: median(msList), msP95: percentile(sorted, 95), msMax: sorted.length ? sorted[sorted.length - 1] : null,
    msTotal: msList.reduce((a, b) => a + b, 0), fortsFirst: turnRows.length ? turnRows[0].forts : null,
    fortsLast: turnRows.length ? turnRows[turnRows.length - 1].forts : null,
    fortsMax: turnRows.length ? Math.max(...turnRows.map(r => r.forts)) : null,
    hashes: rows.filter(r => r.stateSha256).map(r => ({ turn: r.turn, sha256: r.stateSha256 })),
    roundTrip, counters, resumedChunks: rows.filter(r => r.kind === 'resume').length, pageErrors: errors.slice(0, 10),
  };
  const jsonl = rows.map(r => JSON.stringify(r)).concat([JSON.stringify({ kind: 'summary', ...summary })]).join('\n') + '\n';
  const gz = zlib.gzipSync(Buffer.from(jsonl));
  fs.writeFileSync(path.join(OUT, base + '.jsonl.gz'), gz);
  fs.writeFileSync(path.join(OUT, base + '.summary.json'), JSON.stringify(summary, null, 1) + '\n');
  console.log(JSON.stringify(summary, null, 1));
  console.log(`zapisano: ${base}.jsonl.gz sha256=${crypto.createHash('sha256').update(gz).digest('hex')}`);
}

main().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
