'use strict';
/**
 * era-war-measure-run.cjs -- R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 (runda 2): runner pomiaru wojen epoki
 * (Kamień, Brąz, Żelazo) w żywej grze. POMIAR, nie zmiana gry.
 *
 * Źródło danych: hak tylko-do-odczytu `window.__eraWarMeasure` (main.ts, ?civTest=1):
 *   state()        -- migawka tury: per cywilizacja (epoka, tura wejścia w Brąz/Żelazo, pending Kamienia/Brązu/Żelaza),
 *                     aktywne wojny epoki (era, napastnik, cel, startTurn), licznik zużycia wojen epoki per cywilizacja;
 *   attempts()     -- próby przydziału pary (assignForcedWarPairings) od początku gry: ownerId, era, targetId;
 *   declarations() -- faktyczne wypowiedzenia wojen epoki: turn, era, attacker, target, targetIsPlayer.
 * Bramki (powód odrzucenia wypowiedzenia wewnątrz ai.ts) NIE są rejestrowane przez hak -- w raporcie: NIE ZMIERZONO.
 *
 * Wyjście (w --out, poza repo):
 *   era-seed<S>.jsonl       -- jedna linia na turę: { turn, state, newAttempts[], newDeclarations[], gate, modal, sec }
 *   era-seed<S>.summary.json -- koniec, powód zatrzymania, licznik tur.
 *
 * Uzycie (z gra/; bundle poza repo):
 *   node tools/era-war-measure-run.cjs --dist <abs-dist> --out <abs-katalog> --seed 4242 --turns 120 --build 1
 *   opcje: --player-ai 0|1 (domyslnie 1 = gracz autopilot AI), --gold 200 --food 200 --bypass 1, --profile <abs>
 *   Przegladarka: CHROME_PATH (domyslnie /usr/bin/google-chrome). Jeden Chromium naraz.
 *   Pojedyncze polecenie Bash < 590 s: dlugi bieg uruchamiaj w odcinkach (--turns N --from-jsonl-resume nie istnieje;
 *   kazdy odcinek to osobny start gry z tym samym ziarnem).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const base = require('./ai-economy-measure-run.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '120'), 10);
const PLAYER_AI = arg('player-ai', '1') !== '0';
/** Epoka startu gry (kamien|braz|zelazo). Domyslnie kamien: wyzwalacz puli Brazu to przejscie Kamien->Braz. */
const EPOCH = arg('epoch', 'kamien');
/** Limit czasu sciany (s): po przekroczeniu bieg konczy sie czysto (stop=wall-limit), zeby zachowac dane. */
const WALL_LIMIT_MS = parseInt(arg('wall-limit', '520'), 10) * 1000;
const GOLD = parseInt(arg('gold', '200'), 10);
const FOOD = parseInt(arg('food', '200'), 10);
const BYPASS = arg('bypass', '1') !== '0';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'era-war-dist')));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), 'era-war-profile-' + SEED)));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'era-war-out')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const CHROME = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(p => fs.existsSync(p)) || '/usr/bin/google-chrome';
const TURN_TIMEOUT_MS = 300000;
const TAG = `era-seed${SEED}`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const COUNTERS = base.newCtx(null);

function ensureBuild() {
  if (arg('build', '0') !== '1' && fs.existsSync(path.join(DIST, 'index.html'))) return;
  console.log('[era] build vite -> ' + DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  return chromium.launchPersistentContext(PROFILE, { headless: true, args, viewport: { width: 1280, height: 800 }, executablePath: CHROME });
}

/** Start jak runner ekonomii/dyplomacji: doStartGame, nakladka, zalozenie miasta gracza, autopilot gracza. */
async function openGame(ctx) {
  const page = ctx.pages()[0] || await ctx.newPage();
  const url = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness && !!window.__eraWarMeasure, null, { timeout: 180000 });
  await page.evaluate(([seed, epochId]) => window.__nnsMeasureDebug.startGame({ seed, epochId }), [SEED, EPOCH]);
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!founded) throw new Error('nie udalo sie zalozyc miasta gracza (foundFirstCity=false)');
  await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
  if (PLAYER_AI) {
    await page.evaluate(() => window.__aiEconomyMeasure.setPlayerAiAutopilotForTest(true));
    const on = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
    if (on !== true) throw new Error('autopilot gracza nie ustawiony (odczyt=' + on + ')');
  }
  await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  return page;
}

async function clearBattles(page) {
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
    await wait(act === 'wait' ? 300 : 150);
  }
}

async function playOneTurn(page, seenAttempts, seenDecl) {
  const t0 = Date.now();
  const before = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
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
  await clearBattles(page);
  const seenOffers = new Set();
  await rejectAwaitingAiOffers(page, seenOffers);
  await acceptForcedPeace(page, COUNTERS, wait);
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
    await rejectAwaitingAiOffers(page, seenOffers);
    await clearBattles(page);
  }
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) return { stop: 'cannot-end', tura: before };
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
  const state = await page.evaluate(() => window.__eraWarMeasure.state());
  const attempts = await page.evaluate(() => window.__eraWarMeasure.attempts());
  const decl = await page.evaluate(() => window.__eraWarMeasure.declarations());
  const newAttempts = attempts.slice(seenAttempts.n);
  const newDecl = decl.slice(seenDecl.n);
  seenAttempts.n = attempts.length;
  seenDecl.n = decl.length;
  return { rec: { seed: SEED, playerAi: PLAYER_AI ? 1 : 0, turn: after, gate: blocked, bypass,
    state, newAttempts, newDeclarations: newDecl, sec: Math.round((Date.now() - t0) / 100) / 10 } };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  ensureBuild();
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const jsonl = path.join(OUT, TAG + '.jsonl');
  const summaryPath = path.join(OUT, TAG + '.summary.json');
  fs.writeFileSync(jsonl, '');
  const ctx = await launch(chromium);
  const seenAttempts = { n: 0 };
  const seenDecl = { n: 0 };
  let stop = null;
  let turn = 0;
  const t0 = Date.now();
  try {
    const page = await openGame(ctx);
    turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    while (turn < TURNS) {
      const r = await playOneTurn(page, seenAttempts, seenDecl);
      if (r.stop) { stop = { reason: r.stop, tura: r.tura }; break; }
      turn = r.rec.turn;
      if (Date.now() - t0 > WALL_LIMIT_MS) { stop = { reason: 'wall-limit', tura: turn }; break; }
      fs.appendFileSync(jsonl, JSON.stringify(r.rec) + '\n');
      console.log(`[era] ${TAG} tura=${turn} proby=${r.rec.newAttempts.length} wypowiedzenia=${r.rec.newDeclarations.length} czas=${Math.round((Date.now() - t0) / 1000)}s`);
    }
  } finally {
    await ctx.close();
  }
  const summary = { seed: SEED, epoch: EPOCH, playerAi: PLAYER_AI ? 1 : 0, turnsRequested: TURNS, endTurn: turn, stop,
    counters: Object.assign({}, COUNTERS), wallSec: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('[era] PODSUMOWANIE ' + JSON.stringify(summary));
}

module.exports = {};

if (require.main === module) {
  main().catch(e => { console.error('[era] BLAD: ' + (e && e.stack || e)); process.exit(1); });
}
