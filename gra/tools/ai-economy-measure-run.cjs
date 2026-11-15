'use strict';
/**
 * ai-economy-measure-run.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1: runner wznawialny pomiaru ekonomii AI.
 *
 * POMIAR, nie zmiana gry: zywy bundle vite, headless Chromium, `?playtest=mapa&civTest=1&civSeed=<ziarno>`,
 * realny `endTurn` gracza. Hak metryk: `window.__aiEconomyMeasure.metrics()` (tylko odczyt, gra/src/main.ts,
 * za ?civTest=1). Obejscie bramki NNS GRACZA (nie AI) przez DODATNIE dosypki `grantPlayerGold/grantPlayerFood`
 * z haka `__aiTradeWiringTestDebug` -- kazde takie dosypienie jest liczone i zapisane w wyniku.
 *
 * Wynik (w --out):
 *   seed<S>.jsonl       -- jedna linia na ture: tura po zakonczeniu, metryki per owner, bramka NNS przed endTurn,
 *                          dosypki, opcjonalny skrot stanu (--hash 1).
 *   seed<S>.state.json  -- stan wznowienia: ostatnia tura, slot zapisu, liczniki, powod zatrzymania.
 *   seed<S>.summary.json-- podsumowanie przebiegu (tabela: ziarno | tura koncowa | tury z aktywna bramka | czas).
 * Zapis stanu: quickSave (realna sciezka gry: persistSaveToSlot) co --every tur do trwalego profilu (--profile).
 * Wznowienie: ponowne wywolanie z tym samym --out i --profile laduje slot (loadSlot) i kontynuuje od zapisanej tury.
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-katalog> --seed 4242 --turns 100
 *   opcje: --every 10 --gold 200 --food 200 --bypass 1 --hash 0 --stop-at <tura> (przerwanie do testu wznowienia)
 *   --build 1 buduje bundle do --dist (vite, poza repo).
 *   --resume-test 1: przebieg ciagly 1..K (zapis w turze --save-at), potem NOWA sesja przeglada slot i liczy tury
 *   save-at+1..K; porownuje skroty stanu (hash) i raportuje zgodnosc. --mutant 1 dodaje po wznowieniu dosypke
 *   1 zlota (zmiana stanu) -- oczekiwane: czerwone porownanie.
 *
 * Limity: pojedyncze polecenie Bash < 590 s, dlatego przebieg uruchamiac w tle (setsid nohup ... &) i odpytywac log.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '100'), 10);
const EVERY = Math.max(1, parseInt(arg('every', '10'), 10));
const STOP_AT = parseInt(arg('stop-at', String(TURNS)), 10);
const GOLD = parseInt(arg('gold', '200'), 10);
const FOOD = parseInt(arg('food', '200'), 10);
const BYPASS = arg('bypass', '1') !== '0';
const RESUME_TEST = arg('resume-test', '0') === '1';
const HASH = arg('hash', '0') === '1' || RESUME_TEST;
const FAST = arg('fast', '1') !== '0';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'ai-economy-dist')));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), 'ai-economy-profile')));
const OUT = path.resolve(arg('out', path.join(GRA_DIR, 'ai-economy-out')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const SAVE_AT = parseInt(arg('save-at', '40'), 10);
const MUTANT = arg('mutant', '0') === '1';
const SLOT = 'ai-econ-s' + SEED;
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const TURN_TIMEOUT_MS = 300000;
/** Prefiks zrzutow migawek (diagnostyka, tylko przy SNAP_DUMP); w wznowieniu 'res'. */
let SNAP_PREFIX = process.env.SNAP_DUMP || '';

const wait = ms => new Promise(r => setTimeout(r, ms));
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

function ensureBuild() {
  if (arg('build', '0') !== '1' && fs.existsSync(path.join(DIST, 'index.html'))) return;
  console.log('[econ] build vite -> ' + DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 }, executablePath: CHROME };
  return chromium.launchPersistentContext(profileDir, o);
}

/** Start: `newgame` (domyslnie) = prawdziwa nowa gra (__nnsMeasureDebug.startGame -> doStartGame), bez scenariusza playtest;
 *  `playtest` = scenariusz ?playtest=mapa (ustawia podzialPracy miasta, ktorego zapis gry nie zachowuje). */
const START = arg('start', 'newgame');
function gameUrl() {
  const base = 'file://' + path.join(DIST, 'index.html');
  return START === 'playtest' ? base + '?playtest=mapa&civTest=1&civSeed=' + SEED : base + '?civTest=1&civSeed=' + SEED;
}

/** Zdarzenia strony (bledy, awarie, nawigacja) -> <out>/seed<S>.events.log; bez tego awaria wyglada jak timeout tury. */
function attachDiagnostics(page) {
  const log = (kind, msg) => { try { fs.appendFileSync(path.join(OUT, `seed${SEED}.events.log`), `${new Date().toISOString()} ${kind} ${String(msg).slice(0, 400)}\n`); } catch (_) {} };
  page.on('pageerror', e => log('pageerror', e && e.message));
  page.on('crash', () => log('crash', 'strona przegladarki padla'));
  page.on('close', () => log('close', 'strona zamknieta'));
  page.on('console', m => { if (m.type() === 'error') log('console-error', m.text()); });
  page.on('framenavigated', f => { if (f === page.mainFrame()) log('navigate', f.url().slice(0, 120)); });
}

/** Wycisza zwyciestwo/porazke dla pomiaru (jak trade-runner): bez tego koniec gry przerywa 100-turowy przebieg. */
async function suppressVictory(page) {
  await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
}

async function openGame(ctx, { fresh }) {
  const page = ctx.pages()[0] || await ctx.newPage();
  attachDiagnostics(page);
  await page.goto(gameUrl(), { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness, null, { timeout: 180000 });
  if (START === 'newgame') {
    await page.evaluate(([seed]) => window.__nnsMeasureDebug.startGame({ seed }), [SEED]);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
  }
  if (fresh) {
    const ok = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!ok) throw new Error('nie udalo sie zalozyc miasta gracza (foundFirstCity=false)');
  }
  await suppressVictory(page);
  if (FAST) await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  return page;
}

async function turnOf(page) {
  return page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
}

/**
 * Okna bitwy blokuja koniec tury (preBattleOpen / odlozona auto-bitwa). Rozstrzygniecie jak gracz (przycisk „Auto”
 * albo flush odlozonej bitwy, zamkniecie podsumowania), powtarzane az canEnd(). Liczone jawnie (battlesAuto).
 */
async function clearBattles(page) {
  let n = 0;
  for (let k = 0; k < 12; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
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

/** Jedna tura: bramka NNS gracza (opcjonalnie dosypka), koniec tury, pomiar. Zwraca rekord albo {stop: powod}. */
async function playOneTurn(page, ctxState) {
  const t0 = Date.now();
  const before = await turnOf(page);
  const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
  const bypass = { gold: 0, food: 0, applied: false };
  if (blocked) {
    ctxState.gateActiveTurns++;
    if (BYPASS) {
      await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [GOLD]);
      await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [FOOD]);
      bypass.gold = GOLD; bypass.food = FOOD; bypass.applied = true;
      ctxState.bypassApplied++;
      const still = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
      if (still) return { stop: 'gate-blocked-after-bypass', tura: before };
    } else {
      return { stop: 'gate-blocked (bypass wylaczony)', tura: before };
    }
  }
  const battlesAuto = await clearBattles(page);
  ctxState.battlesAuto = (ctxState.battlesAuto || 0) + battlesAuto;
  const canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  if (!canEnd) {
    const why = await page.evaluate(() => ({ battle: window.__aiTradeWiringTestDebug.battleState(), pending: window.__aiTradeWiringTestDebug.state().pending.length }));
    return { stop: 'cannot-end', tura: before, why };
  }
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  try {
    await page.waitForFunction(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
      before, { timeout: TURN_TIMEOUT_MS, polling: 250 });
  } catch (_) {
    let why = null;
    try { why = await page.evaluate(() => ({ turn: window.__aiTradeWiringTestDebug.state().turn, inProgress: window.__aiTradeWiringTestDebug.isEndTurnInProgress(), battle: window.__aiTradeWiringTestDebug.battleState(), canEnd: window.__aiTradeWiringTestDebug.canEnd() })); } catch (e) { why = 'strona niedostepna: ' + String(e && e.message).slice(0, 160); }
    return { stop: 'endturn-timeout', tura: before, why };
  }
  const after = await turnOf(page);
  const m = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
  const rec = {
    seed: SEED, turn: after, gateBlockedBeforeEnd: blocked, bypass, battlesAuto,
    owners: m.owners, diag: m.diag, niezmierzone: m.niezmierzone, sec: Math.round((Date.now() - t0) / 100) / 10,
  };
  if (HASH) rec.stateHash = await stateHash(page, SNAP_PREFIX ? path.join(OUT, `${SNAP_PREFIX}-t${after}.json`) : null);
  return { rec };
}

/** Skrot stanu gry: zapis realnej migawki (buildSaveGameSnapshot) BEZ pola meta (znaczniki czasu/sesji). */
async function stateHash(page, dumpTo) {
  const json = await page.evaluate(() => { const o = JSON.parse(window.__detHarness.snapshotJson()); delete o.meta; return JSON.stringify(o); });
  if (dumpTo) fs.writeFileSync(dumpTo, json);
  return sha(json);
}

function readState() {
  try { return JSON.parse(fs.readFileSync(path.join(OUT, `seed${SEED}.state.json`), 'utf8')); } catch (_) { return null; }
}
function writeState(s) { fs.writeFileSync(path.join(OUT, `seed${SEED}.state.json`), JSON.stringify(s, null, 2)); }

/** Przebieg od biezacej tury (lub od zapisu) do `stopAt`. Zapis co EVERY tur. Zwraca podsumowanie. */
async function runSeries(ctx, { resumeFromSlot, stopAt, hashFrom }) {
  const page = await openGame(ctx, { fresh: !resumeFromSlot });
  if (resumeFromSlot) { await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT); await suppressVictory(page); }
  const st = readState() || { seed: SEED, gateActiveTurns: 0, bypassApplied: 0, lastTurn: 0 };
  const ctxState = { gateActiveTurns: st.gateActiveTurns || 0, bypassApplied: st.bypassApplied || 0 };
  const startTurn = await turnOf(page);
  // Obcina JSONL do tury startowej (wznowienie nie dubluje wierszy).
  const jsonlPath = path.join(OUT, `seed${SEED}.jsonl`);
  if (!resumeFromSlot) { try { fs.unlinkSync(jsonlPath); } catch (_) {} }
  if (resumeFromSlot && fs.existsSync(jsonlPath)) {
    const keep = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(l => l.trim() && JSON.parse(l).turn <= startTurn);
    fs.writeFileSync(jsonlPath, keep.map(l => l + '\n').join(''));
  }
  const t0 = Date.now();
  let stop = null;
  let turn = startTurn;
  const rows = [];
  while (turn < stopAt) {
    const r = await playOneTurn(page, ctxState);
    if (r.stop) { stop = { reason: r.stop, tura: r.tura, why: r.why || null }; break; }
    turn = r.rec.turn;
    fs.appendFileSync(jsonlPath, JSON.stringify(r.rec) + '\n');
    rows.push({ turn, gate: r.rec.gateBlockedBeforeEnd, sec: r.rec.sec });
    if (turn % EVERY === 0) {
      const ok = await page.evaluate(slot => window.__aiTradeWiringTestDebug.quickSave(slot), SLOT);
      writeState({ seed: SEED, lastTurn: turn, slot: SLOT, saved: ok, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied });
    }
    if (rows.length % 5 === 0) console.log(`[econ] seed=${SEED} tura=${turn} gateAktywna=${ctxState.gateActiveTurns} dosypki=${ctxState.bypassApplied} czas=${Math.round((Date.now() - t0) / 1000)}s`);
  }
  const endTurnNo = turn;
  writeState({ seed: SEED, lastTurn: endTurnNo, slot: SLOT, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied, stop });
  return { startTurn, endTurn: endTurnNo, stop, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied, wallSec: Math.round((Date.now() - t0) / 1000), page };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  ensureBuild();
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const summaryPath = path.join(OUT, `seed${SEED}.summary.json`);

  if (RESUME_TEST) {
    // A: przebieg ciagly 1..TURNS ze skrotami stanu (referencja), profil 'ref'.
    // B: profil 'cut': gra 1..SAVE_AT (zapis slotu w turze SAVE_AT), zamkniecie, NOWA sesja laduje slot i gra
    //    SAVE_AT+1..TURNS ze skrotami. Porownanie skrotow tur SAVE_AT+1..TURNS (A vs B).
    const jsonlRef = path.join(OUT, `seed${SEED}.ref.jsonl`);
    for (const f of [jsonlRef, path.join(OUT, `seed${SEED}.jsonl`)]) { try { fs.unlinkSync(f); } catch (_) {} }
    try { fs.unlinkSync(path.join(OUT, `seed${SEED}.state.json`)); } catch (_) {}
    const ctxRef = await launch(chromium, path.join(PROFILE, 'ref'));
    const ref = await runSeries(ctxRef, { resumeFromSlot: false, stopAt: TURNS, hashFrom: 1 });
    await ctxRef.close();
    fs.renameSync(path.join(OUT, `seed${SEED}.jsonl`), jsonlRef);
    try { fs.unlinkSync(path.join(OUT, `seed${SEED}.state.json`)); } catch (_) {}
    const ctxCut = await launch(chromium, path.join(PROFILE, 'cut'));
    const cut = await runSeries(ctxCut, { resumeFromSlot: false, stopAt: SAVE_AT, hashFrom: 1 });
    await ctxCut.close();
    const ctxRes = await launch(chromium, path.join(PROFILE, 'cut'));
    const resumed = await resumeCheck(ctxRes, SAVE_AT, TURNS);
    await ctxRes.close();
    const cmp = compareHashes(jsonlRef, SAVE_AT, TURNS, resumed);
    const summary = { seed: SEED, mode: 'resume-test', ref: { endTurn: ref.endTurn, stop: ref.stop, gateActiveTurns: ref.gateActiveTurns, bypassApplied: ref.bypassApplied, wallSec: ref.wallSec }, cut: { endTurn: cut.endTurn, stop: cut.stop }, resumeTest: cmp };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('[econ] WZNOWIENIE ' + JSON.stringify({ saveAt: cmp.saveAt, turns: cmp.turns, compared: cmp.compared, allEqual: cmp.allEqual, mutant: MUTANT }));
    return;
  }

  const ctx = await launch(chromium, PROFILE);
  const st = readState();
  const resume = !!(st && st.lastTurn > 0 && st.saved !== false && st.slot);
  const res = await runSeries(ctx, { resumeFromSlot: resume, stopAt: STOP_AT });
  await ctx.close();
  const summary = { seed: SEED, startTurn: res.startTurn, endTurn: res.endTurn, stop: res.stop, gateActiveTurns: res.gateActiveTurns, bypassApplied: res.bypassApplied, wallSec: res.wallSec, resumed: resume };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('[econ] PODSUMOWANIE ' + JSON.stringify(summary));
}

/** Wznowienie: nowa sesja przegladarki, zaladowanie slotu z tury SAVE_AT, granie do TURNS, skroty stanu. */
async function resumeCheck(ctx, saveAt, turns) {
  const page = await openGame(ctx, { fresh: false });
  await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT);
  await suppressVictory(page);
  let turn = await turnOf(page);
  const out = [];
  if (MUTANT) await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [1]);
  if (SNAP_PREFIX) SNAP_PREFIX = 'res';
  while (turn < turns) {
    const r = await playOneTurn(page, { gateActiveTurns: 0, bypassApplied: 0 });
    if (r.stop) { out.push({ stop: r.stop, tura: r.tura }); break; }
    turn = r.rec.turn;
    out.push({ turn, hash: await stateHash(page) });
  }
  return { loadedTurn: saveAt, rows: out };
}

/** Porownanie: skroty z przebiegu ciaglego (turn saveAt+1..turns) vs wznowionego. */
function compareHashes(jsonlPath, saveAt, turns, resumed) {
  const cont = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
    .filter(r => r.turn > saveAt && r.turn <= turns);
  const pairs = [];
  let ok = true;
  for (const c of cont) {
    const r = resumed.rows.find(x => x.turn === c.turn);
    const same = !!r && r.hash === c.stateHash;
    pairs.push({ turn: c.turn, cont: c.stateHash, resumed: r ? r.hash : null, same });
    if (!same) ok = false;
  }
  return { saveAt, turns, compared: pairs.length, allEqual: ok && pairs.length === turns - saveAt, mutant: MUTANT, pairs };
}

main().catch(e => { console.error('[econ] BLAD: ' + (e && e.stack || e)); process.exit(1); });
