// endturn-t57-repro.cjs -- R-WEB-ENDTURN-T57-DIAGNOSIS-Q1 (r2, obrona Operatora).
// Kopia ai-economy-measure-run.cjs z DWOMA dodatkami DIAGNOSTYCZNYMI (nie zmiana gry, nie zmiana harnessu):
//  (1) [probe-cb] co 25 iteracji clearBattles, gdy pendingAuto/preBattle/scena/podsumowanie: zrzut widocznych overlayow;
//  (2) [probe] co 30 s w czekaniu na koniec tury (po 60 s): stan bitwy, canEnd, przycisk Zakoncz ture, podpowiedzi;
//  (3) zamkniecie otwartej audiencji dyplomatycznej (.civ-diplo-aud, przycisk "Wroc") TYLKO gdy blokuje kolejke bitew.
// Uzycie: cd gra && node tools/endturn-t57-repro.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 56 --every 10 --bypass 1 --pw <abs-gra>
// Bez punktu (3) przebieg w turze 51 (seed 4242) zawisa: audiencja zostaje otwarta, kolejka odlozonych bitew (pendingAuto) czeka.
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
const CHROME = process.env.CHROME_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
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
    // r3: doStartGame jest asynchroniczny -- klastry AI/miasta-panstwa powstaja DOPIERO po zniknieciu nakladki
    // „Tworzenie swiata”. Zalozenie miasta gracza przed tym (r1/r2) dawalo AI = 0 miast. Czekamy jak ai-army-live-measure.cjs.
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
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
  // r3: przy ~41 wlascicielach w turze bywa wiele odlozonych bitew (kazda = flush + „Auto” + podsumowanie), a 12 iteracji
  // konczylo przebieg w t51 (seed 4242, pendingAuto=true). Petla trwa do 400 iteracji (~2 min); stop dopiero gdy czysto 2x z rzedu.
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (k % 25 === 0 && (bs.pendingAuto || bs.preBattleOpen || bs.sceneOpen || bs.summaryOpen || bs.resolving)) {
      const pr = await page.evaluate(() => {
        const vis = [...document.body.children].filter(e => e.nodeType === 1 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0)
          .map(e => ({ tag: e.tagName, id: e.id || '', cls: String(e.className || '').slice(0, 50), txt: (e.textContent || '').replace(/\s+/g, ' ').slice(0, 70) }));
        return { vis, tech: !!document.getElementById('civ-tech-discovery-notice-host') };
      });
      const st = await page.evaluate(() => ({ turn: window.__aiTradeWiringTestDebug.state().turn, canEnd: window.__aiTradeWiringTestDebug.canEnd(), pending: window.__aiTradeWiringTestDebug.state().pending.length }));
      console.log('[probe-cb] k=' + k + ' ' + JSON.stringify({ bs, st, pr }).slice(0, 1800));
    }
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const aud = document.querySelector('.civ-diplo-aud');
      if (aud && aud.getBoundingClientRect().width > 0) {
        const w = [...aud.querySelectorAll('button')].find(x => /Wróć/.test(x.textContent || ''));
        if (w) { w.click(); return 'aud-close'; }
      }
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
  let canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  // r3: odlozona auto-bitwa potrafi zalegac w kolejce (pendingAuto=true, nic nie otwarte; seed 4242 t51). Gra leczy to
  // dopiero przy PROBIE zakonczenia tury (healStuckDeferredPreBattleQueueOnEndTurnAttempt, prog 8 s) -- tak jak gracz,
  // ktory klika „Zakoncz ture”. Harness robi to samo (do 3 prob, liczone w stuckQueueHeals) i NIE ukrywa faktu w wyniku.
  for (let k = 0; !canEnd && k < 3; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.pendingAuto || bs.preBattleOpen || bs.sceneOpen || bs.summaryOpen) break;
    await wait(9000);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
    await wait(1500);
    ctxState.stuckQueueHeals = (ctxState.stuckQueueHeals || 0) + 1;
    ctxState.battlesAuto += await clearBattles(page);
    canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
    if ((await turnOf(page)) > before) canEnd = false;
  }
  if ((await turnOf(page)) > before) {
    // proba zakonczenia tury (leczenie kolejki) od razu zakonczyla ture -- zapisz rekord jak zwykla tura
    const afterH = await turnOf(page);
    const mH = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
    const recH = { seed: SEED, turn: afterH, gateBlockedBeforeEnd: blocked, bypass, battlesAuto, stuckQueueHealEndedTurn: true,
      owners: mH.owners, diag: mH.diag, niezmierzone: mH.niezmierzone, sec: Math.round((Date.now() - t0) / 100) / 10 };
    if (HASH) recH.stateHash = await stateHash(page, null);
    return { rec: recH };
  }
  if (!canEnd) {
    const why = await page.evaluate(() => ({ battle: window.__aiTradeWiringTestDebug.battleState(), pending: window.__aiTradeWiringTestDebug.state().pending.length }));
    return { stop: 'cannot-end', tura: before, why };
  }
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  try {
    // PROBE: zamiast jednego waitForFunction -- co 15 s zrzut DOM (widoczne overlaye, przycisk Zakoncz ture, podpowiedz)
    {
      const t0w = Date.now();
      let done = false;
      while (!done && Date.now() - t0w < TURN_TIMEOUT_MS) {
        done = await page.evaluate(([t]) => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), [before]);
        if (done) break;
        if (Date.now() - t0w < 60000) { await wait(2000); continue; }
        const pr = await page.evaluate(() => {
          const vis = [...document.body.children].filter(e => e.nodeType === 1 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0)
            .map(e => ({ tag: e.tagName, id: e.id || '', cls: String(e.className || '').slice(0, 60), txt: (e.textContent || '').replace(/\s+/g, ' ').slice(0, 90), z: getComputedStyle(e).zIndex }));
          const btns = [...document.querySelectorAll('button')].filter(b => /Zako[nń]cz tur/i.test(b.textContent || ''))
            .map(b => ({ txt: (b.textContent || '').trim().slice(0, 40), disabled: b.disabled, aria: b.getAttribute('aria-disabled'), cls: String(b.className).slice(0, 80), vis: b.getBoundingClientRect().width > 0 }));
          const hints = [...document.querySelectorAll('[class*="hint"], [id*="hint"]')].filter(h => (h.textContent || '').trim()).map(h => (h.textContent || '').trim().slice(0, 100)).slice(0, 4);
          return { vis, btns, hints };
        });
        const st = await page.evaluate(() => ({ bs: window.__aiTradeWiringTestDebug.battleState(), canEnd: window.__aiTradeWiringTestDebug.canEnd(), turn: window.__aiTradeWiringTestDebug.state().turn, inProg: window.__aiTradeWiringTestDebug.isEndTurnInProgress(), pending: window.__aiTradeWiringTestDebug.state().pending.length }));
        console.log('[probe] t+' + Math.round((Date.now() - t0w) / 1000) + 's ' + JSON.stringify({ before, st, pr }));
        await wait(30000);
      }
      if (!done) throw new Error('probe: endturn-timeout');
    }
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
  const ctxState = { gateActiveTurns: st.gateActiveTurns || 0, bypassApplied: st.bypassApplied || 0, stuckQueueHeals: st.stuckQueueHeals || 0, battlesAuto: st.battlesAuto || 0 };
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
      writeState({ seed: SEED, lastTurn: turn, slot: SLOT, saved: ok, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied, stuckQueueHeals: ctxState.stuckQueueHeals, battlesAuto: ctxState.battlesAuto });
    }
    if (rows.length % 5 === 0) console.log(`[econ] seed=${SEED} tura=${turn} gateAktywna=${ctxState.gateActiveTurns} dosypki=${ctxState.bypassApplied} czas=${Math.round((Date.now() - t0) / 1000)}s`);
  }
  const endTurnNo = turn;
  writeState({ seed: SEED, lastTurn: endTurnNo, slot: SLOT, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied, stuckQueueHeals: ctxState.stuckQueueHeals, battlesAuto: ctxState.battlesAuto, stop });
  return { startTurn, endTurn: endTurnNo, stop, gateActiveTurns: ctxState.gateActiveTurns, bypassApplied: ctxState.bypassApplied, stuckQueueHeals: ctxState.stuckQueueHeals, battlesAuto: ctxState.battlesAuto, wallSec: Math.round((Date.now() - t0) / 1000), page };
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
  const summary = { seed: SEED, startTurn: res.startTurn, endTurn: res.endTurn, stop: res.stop, gateActiveTurns: res.gateActiveTurns, bypassApplied: res.bypassApplied, stuckQueueHeals: res.stuckQueueHeals, battlesAuto: res.battlesAuto, wallSec: res.wallSec, resumed: resume };
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
    const r = await playOneTurn(page, { gateActiveTurns: 0, bypassApplied: 0, stuckQueueHeals: 0, battlesAuto: 0 });
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
