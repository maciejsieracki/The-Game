'use strict';
/**
 * diplomacy-harder-measure-run.cjs -- R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1: runner pomiaru „twardszej dyplomacji"
 * (flaga etapu A OFF vs ON) w zywej grze. POMIAR, nie zmiana gry.
 *
 * Cienki wrapper na `ai-economy-measure-run.cjs`: z tego modulu biore (eksporty) blokady modalne konca tury
 * (`closeEndTurnModals`), liczniki (`newCtx`, `countersOf`) i ten sam start nowej gry. Przebieg tur (bramka NNS
 * gracza z dosypka, zamykanie blokad, zamykanie bitew, realny endTurn) jest tu powtorzony 1:1 w zakresie potrzebnym
 * do pomiaru, bo runner nie eksportuje petli tur. Plik ai-economy-measure-run.cjs NIE jest zmieniany.
 *
 * Flaga: `--harder 0|1` ustawiana PO starcie gry przez hak `window.__diploHarderMeasure.setEnabled` (main.ts, za ?civTest=1),
 * PRZED pierwszym endTurn. Odczyt potwierdzenia: `isEnabled()` zapisywany w kazdym wierszu jako `harder`.
 *
 * Wynik (w --out):
 *   seed<S>-harder<0|1>.jsonl -- jedna linia na ture: { seed, harder, turn, diplo: { owners, pairs[] }, wars, gate, modal, sec }.
 *     pairs[] zawiera pary, ktore maja kontakt/status inny niz 'neutralni' albo sa sasiadami (reszta pominieta, zeby
 *     plik nie puchl; pominiecie jest jawne: pole `pominietePary` w wierszu = liczba pominietych par).
 *   seed<S>-harder<0|1>.summary.json -- koniec, liczniki, powod zatrzymania.
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/diplomacy-harder-measure-run.cjs --dist <abs-dist> --out <abs-katalog> --seed 4242 --turns 20 --harder 1
 *   opcje: --profile <abs> (profil Chromium; domyslnie os.tmpdir), --gold 200 --food 200 --bypass 1
 *   --build 1 buduje bundle do --dist (vite, poza repo; bez tego flagi uzywa istniejacego index.html).
 *   --every N zapisuje wiersz tylko dla tur podzielnych przez N (np. 5 albo 25; ostatnia tura zawsze).
 *   Przegladarka: CHROME_PATH (domyslnie pierwsza z: /usr/bin/chromium, google-chrome). Jeden Chromium naraz.
 *
 * Limity: pojedyncze polecenie Bash < 590 s. Dlugie biegi (100 tur x 3 ziarna ON/OFF) uruchamia orkiestrator
 * przez `setsid nohup node tools/diplomacy-harder-measure-run.cjs ... &` (poza tym plikiem; sam runner nie wznawia).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const base = require('./ai-economy-measure-run.cjs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '100'), 10);
const EVERY = Math.max(1, parseInt(arg('every', '1'), 10) || 1);
const HARDER = arg('harder', '0') === '1';
const GOLD = parseInt(arg('gold', '200'), 10);
const FOOD = parseInt(arg('food', '200'), 10);
const BYPASS = arg('bypass', '1') !== '0';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'diplo-harder-dist')));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), 'diplo-harder-profile-' + (HARDER ? 'on' : 'off'))));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'diplo-harder-out')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
/** Przegladarka: CHROME_PATH; bez niego pierwsza istniejaca z listy (brak /usr/bin/chromium nie wywala launchu). */
const CHROME = process.env.CHROME_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find(p => fs.existsSync(p)) || '/usr/bin/chromium';
const TURN_TIMEOUT_MS = 300000;
const TAG = `seed${SEED}-harder${HARDER ? 1 : 0}`;
const wait = ms => new Promise(r => setTimeout(r, ms));

/** Blokady modalne konca tury: jak runner ekonomii (eksport `closeEndTurnModals`). */
const COUNTERS = base.newCtx(null);

function ensureBuild() {
  if (arg('build', '0') !== '1' && fs.existsSync(path.join(DIST, 'index.html'))) return;
  console.log('[diplo] build vite -> ' + DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  return chromium.launchPersistentContext(PROFILE, { headless: true, args, viewport: { width: 1280, height: 800 }, executablePath: CHROME });
}

/** Start jak runner (`newgame`): prawdziwy doStartGame + czekanie na koniec nakladki + zalozenie miasta gracza. */
async function openGame(ctx) {
  const page = ctx.pages()[0] || await ctx.newPage();
  const url = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness && !!window.__diploHarderMeasure, null, { timeout: 180000 });
  await page.evaluate(([seed]) => window.__nnsMeasureDebug.startGame({ seed }), [SEED]);
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!founded) throw new Error('nie udalo sie zalozyc miasta gracza (foundFirstCity=false)');
  await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
  await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  // Flaga PO starcie gry, PRZED pierwszym endTurn (jedyne miejsce zapisu flagi w runnerze).
  const got = await page.evaluate(on => window.__diploHarderMeasure.setEnabled(on), HARDER);
  if (got !== HARDER) throw new Error('setEnabled(' + HARDER + ') nie ustawil flagi (odczyt=' + got + ')');
  return page;
}

/** Okna bitew blokuja koniec tury: rozstrzygamy jak gracz (kopia logiki runnera ekonomii, bez zmian semantyki). */
async function clearBattles(page) {
  let n = 0;
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    await base.closeEndTurnModals(page, COUNTERS);
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

/** Wiersz pomiaru: pary z kontaktem/statusem innym niz 'neutralni' albo sasiedzi (jawnie liczone pominiete). */
function diploRow(m) {
  const keep = [];
  let pominiete = 0;
  for (const p of m.pairs) {
    if (p.sasiad || p.status !== 'neutralni' || p.pokoj) keep.push(p);
    else pominiete++;
  }
  return { gracz: m.gracz, owners: m.owners, pairs: keep, pominietePary: pominiete, flagaOdczyt: m.flag };
}

async function playOneTurn(page) {
  const t0 = Date.now();
  const before = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  const modalBefore = Object.assign({}, COUNTERS);
  const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
  const bypass = { gold: 0, food: 0, applied: false };
  if (blocked) {
    if (!BYPASS) return { stop: 'gate-blocked (bypass wylaczony)', tura: before };
    await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [GOLD]);
    await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [FOOD]);
    bypass.gold = GOLD; bypass.food = FOOD; bypass.applied = true;
    if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) return { stop: 'gate-blocked-after-bypass', tura: before };
  }
  await base.closeEndTurnModals(page, COUNTERS);
  const battlesAuto = await clearBattles(page);
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
    return { stop: 'cannot-end', tura: before };
  }
  await base.closeEndTurnModals(page, COUNTERS);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  const deadline = Date.now() + TURN_TIMEOUT_MS;
  let advanced = false;
  while (!advanced && Date.now() < deadline) {
    advanced = await page.evaluate(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
    if (!advanced) { await base.closeEndTurnModals(page, COUNTERS); await wait(250); }
  }
  if (!advanced) return { stop: 'endturn-timeout', tura: before };
  const after = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  const m = await page.evaluate(() => window.__diploHarderMeasure.metrics());
  const modalDelta = {};
  for (const k of base.MODAL_KEYS) modalDelta[k] = COUNTERS[k] - modalBefore[k];
  const d = diploRow(m);
  const rec = { seed: SEED, harder: HARDER ? 1 : 0, turn: after, gate: blocked, bypass, battlesAuto,
    modal: modalDelta, sec: Math.round((Date.now() - t0) / 100) / 10, diplo: d,
    wojny: d.pairs.filter(p => p.status === 'wojna').length };
  return { rec };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  ensureBuild();
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const jsonl = path.join(OUT, TAG + '.jsonl');
  const summaryPath = path.join(OUT, TAG + '.summary.json');
  // Start pliku: obciecie do zera (bez unlink; poprzedni wynik tego samego ziarna/flagi zostaje nadpisany).
  fs.writeFileSync(jsonl, '');
  const ctx = await launch(chromium);
  let stop = null;
  let turn = 0;
  let rows = 0;
  const t0 = Date.now();
  try {
    const page = await openGame(ctx);
    turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    while (turn < TURNS) {
      const r = await playOneTurn(page);
      if (r.stop) { stop = { reason: r.stop, tura: r.tura }; break; }
      turn = r.rec.turn;
      if (turn % EVERY === 0 || turn >= TURNS) {
        fs.appendFileSync(jsonl, JSON.stringify(r.rec) + '\n');
        rows++;
      }
      console.log(`[diplo] ${TAG} tura=${turn} pary=${r.rec.diplo.pairs.length} wojny=${r.rec.wojny} czas=${Math.round((Date.now() - t0) / 1000)}s`);
    }
  } finally {
    await ctx.close();
  }
  const summary = { seed: SEED, harder: HARDER ? 1 : 0, turnsRequested: TURNS, every: EVERY, endTurn: turn, rows, stop,
    counters: Object.assign({}, COUNTERS), wallSec: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('[diplo] PODSUMOWANIE ' + JSON.stringify(summary));
}

module.exports = { diploRow };

if (require.main === module) {
  main().catch(e => { console.error('[diplo] BLAD: ' + (e && e.stack || e)); process.exit(1); });
}
