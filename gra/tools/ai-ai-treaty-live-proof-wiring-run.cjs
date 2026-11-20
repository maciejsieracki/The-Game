'use strict';
/**
 * ai-economy-measure-run.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1: runner wznawialny pomiaru ekonomii AI.
 *
 * POMIAR, nie zmiana gry: zywy bundle vite, headless Chromium, `?playtest=mapa&civTest=1&civSeed=<ziarno>`,
 * realny `endTurn` gracza. Hak metryk: `window.__aiEconomyMeasure.metrics()` (tylko odczyt, gra/src/main.ts,
 * za ?civTest=1). Obejscie bramki NNS GRACZA (nie AI) przez DODATNIE dosypki `grantPlayerGold/grantPlayerFood`
 * z haka `__aiTradeWiringTestDebug` -- kazde takie dosypienie jest liczone i zapisane w wyniku.
 *
 * Blokady modalne konca tury (R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1): runner zamyka TRZY blokady, ktore gra
 * wlicza do `isOtherEndTurnModalOpen` (main.ts), przyciskiem jak gracz, PRZED kazdym „Zakoncz ture” i w petli
 * leczenia kolejki bitew oraz w czasie oczekiwania na koniec tury:
 *   - audiencja dyplomatyczna (`.civ-diplo-aud`, przycisk `.civ-diplo-aud-back`)   -> licznik `diploAudienceClosed`
 *   - panel laczenia armii (`#civ-amp-title`, przycisk `.civ-amp-btn-sep`)           -> licznik `armyMergeClosed`
 *   - karta odkrycia technologii (`#civ-tech-discovery-notice-host`, `[data-act=close]`) -> licznik `techNoticeClosed`
 * Liczniki sa jawne (w kazdym rekordzie tury jako `modalClosedThisTurn`, w summary.json i state.json); NIE sa ukryte.
 * Gdy blokada zostaje otwarta mimo zamkniecia, przebieg zatrzymuje sie z powodem i zrzutem DOM (`why.modal`).
 *
 * Wynik (w --out):
 *   seed<S>.jsonl       -- jedna linia na ture: tura po zakonczeniu, metryki per owner, bramka NNS przed endTurn,
 *                          dosypki, zamkniete blokady modalne, opcjonalny skrot stanu (--hash 1).
 *   seed<S>.state.json  -- stan wznowienia: ostatnia tura, slot zapisu, liczniki (aktualizowane po KAZDEJ turze),
 *                          liczniki zapisane w slocie (`slotCounters`), powod zatrzymania.
 *   seed<S>.summary.json-- podsumowanie przebiegu (liczniki, tura koncowa, czas).
 * Zapis stanu: quickSave (realna sciezka gry: persistSaveToSlot) co --every tur do trwalego profilu (--profile).
 * Wznowienie: ponowne wywolanie z tym samym --out i --profile laduje slot (loadSlot) i kontynuuje od tury slotu;
 * liczniki startuja od wartosci z chwili zapisu slotu (`slotCounters`), wiec zlicza sie raz.
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-katalog> --seed 4242 --turns 100
 *   opcje: --every 10 --gold 200 --food 200 --bypass 1 --hash 0 --stop-at <tura> (przerwanie do testu wznowienia)
 *   --build 1 buduje bundle do --dist (vite, poza repo).
 *   --resume-test 1: przebieg ciagly 1..K (zapis w turze --save-at), potem NOWA sesja przeglada slot i liczy tury
 *   save-at+1..K; porownuje skroty stanu (hash) i raportuje zgodnosc. --mutant 1 dodaje po wznowieniu dosypke
 *   1 zlota (zmiana stanu) -- oczekiwane: czerwone porownanie.
 *
 * Limity: pojedyncze polecenie Bash < 590 s; przebieg dzielimy na kilka wywolan --stop-at (zapis slotu co --every tur).
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
const LEDGER_OFF = arg('ledger-off', '0') === '1';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'ai-economy-dist')));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), 'ai-economy-profile')));
const OUT = path.resolve(arg('out', path.join(GRA_DIR, 'ai-economy-out')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const SAVE_AT = parseInt(arg('save-at', '40'), 10);
const MUTANT = arg('mutant', '0') === '1';
const SLOT = 'ai-econ-s' + SEED;
const HASH_IGNORED = ['units[].stackGroupId(null)', 'cities[].budowaLista(gdy [])', 'cities[].magazynZywnosci(gdy 0)', 'cities[].postepBudynkowUsuniete(gdy {})', 'resourceLedgerHistory(#432)'];
const CHROME = process.env.CHROME_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const TURN_TIMEOUT_MS = 300000;
/** Prefiks zrzutow migawek (diagnostyka, tylko przy SNAP_DUMP); w wznowieniu 'res'. */
let SNAP_PREFIX = process.env.SNAP_DUMP || '';
/** Tura startowa biezacego segmentu (po wczytaniu slotu); pierwsza tura po niej = rozgrzewka (odrzucana w analizie). */
let RUN_START_TURN = 0;

/** Liczniki przebiegu (zapisywane w state.json po KAZDEJ turze i w summary.json). */
const COUNTER_KEYS = ['gateActiveTurns', 'bypassApplied', 'stuckQueueHeals', 'battlesAuto',
  'diploAudienceClosed', 'armyMergeClosed', 'techNoticeClosed'];
/** Klucze blokad modalnych (= liczniki zamkniec). */
const MODAL_KEYS = ['diploAudienceClosed', 'armyMergeClosed', 'techNoticeClosed'];

function newCtx(src) {
  const c = {};
  for (const k of COUNTER_KEYS) c[k] = (src && typeof src[k] === 'number') ? src[k] : 0;
  return c;
}
function countersOf(c) {
  const o = {};
  for (const k of COUNTER_KEYS) o[k] = c[k];
  return o;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/**
 * Zamyka otwarte blokady modalne konca tury (uruchamiane w PRZEGLADARCE). Zwraca liste kluczy zamknietych w tym
 * wywolaniu. Klik na przycisk zamkniecia = to, co zrobilby gracz. Blokada bez przycisku nie jest zamykana (zostaje
 * w zrzucie DOM przy zatrzymaniu).
 */
function closeModalsInPage() {
  const closed = [];
  const aud = document.querySelector('.civ-diplo-aud');
  if (aud && aud.style.display !== 'none') {
    const b = aud.querySelector('.civ-diplo-aud-back');
    if (b) { b.click(); closed.push('diploAudienceClosed'); }
  }
  if (document.getElementById('civ-amp-title')) {
    const b = document.querySelector('.civ-amp-btn-sep');
    if (b) { b.click(); closed.push('armyMergeClosed'); }
  }
  const tn = document.getElementById('civ-tech-discovery-notice-host');
  if (tn) {
    const b = tn.querySelector('[data-act="close"]');
    if (b) { b.click(); closed.push('techNoticeClosed'); }
  }
  return closed;
}

/** Stan blokad (w przegladarce): czy otwarte + fragment DOM otwartej blokady (diagnostyka zatrzymania). */
function blockerDumpInPage() {
  const aud = document.querySelector('.civ-diplo-aud');
  const amp = document.getElementById('civ-amp-title');
  const tn = document.getElementById('civ-tech-discovery-notice-host');
  const out = { diploAudience: !!aud && aud.style.display !== 'none', armyMerge: !!amp, techNotice: !!tn, dom: null };
  const el = out.diploAudience ? aud : (out.armyMerge ? amp : (out.techNotice ? tn : null));
  if (el) out.dom = String(el.outerHTML).slice(0, 400);
  return out;
}

/** Blokady modalne nadal otwarte (ten sam predykat co closeModalsInPage; uruchamiane w PRZEGLADARCE). */
function openModalKeysInPage() {
  const open = [];
  const aud = document.querySelector('.civ-diplo-aud');
  if (aud && aud.style.display !== 'none') open.push('diploAudienceClosed');
  if (document.getElementById('civ-amp-title')) open.push('armyMergeClosed');
  if (document.getElementById('civ-tech-discovery-notice-host')) open.push('techNoticeClosed');
  return open;
}

/**
 * Zamyka blokady modalne az do skutku (max 20 kursow). Zamkniecie jest liczone w ctx DOPIERO po sprawdzeniu, ze blokada
 * zniknela po kliknieciu (300 ms); klik bez skutku NIE podbija licznika. Zwraca liste kluczy, ktorych klik nie zamknal
 * (pusta = wszystko zamkniete). Gdy klik 3x z rzedu nie daje skutku, petla konczy sie i zapisuje zrzut DOM na stderr.
 */
async function closeEndTurnModals(page, ctx) {
  const stuck = new Set();
  let noEffect = 0;
  for (let k = 0; k < 20; k++) {
    const clicked = await page.evaluate(closeModalsInPage);
    if (clicked.length === 0) return [...stuck];
    await wait(300);
    const still = await page.evaluate(openModalKeysInPage);
    let effect = false;
    for (const key of clicked) {
      if (still.includes(key)) stuck.add(key);
      else { ctx[key]++; effect = true; }
    }
    if (effect) noEffect = 0;
    else if (++noEffect >= 3) {
      console.error('[econ] blokada nie znika po kliknieciu (3 proby): ' + JSON.stringify(await page.evaluate(blockerDumpInPage)));
      break;
    }
  }
  return [...stuck];
}

/**
 * R-WEB-AI-UPKEEP-ONOFF-MEASURE-100T-Q1 (r3, przeniesione na main w R-WEB-AI-UPKEEP-ONOFF-TOOLS-PORT-Q1):
 * wojny aktywne per tura -- TYLKO ODCZYT, z haka `window.__truceTestDebug.pairState(a, b).status` (status === 'wojna').
 * Pary: wszyscy wlasciciele z wierszy metryk. Brak haka -> `null` (NIE ZMIERZONO, nie zero).
 * Uruchamiane w PRZEGLADARCE.
 */
function warsInPage(ownerIds) {
  const t = window.__truceTestDebug;
  if (!t || typeof t.pairState !== 'function') return null;
  const pairs = [];
  for (let i = 0; i < ownerIds.length; i++) {
    for (let j = i + 1; j < ownerIds.length; j++) {
      let st = null;
      try { st = t.pairState(ownerIds[i], ownerIds[j]).status; } catch (_) { st = null; }
      if (st === 'wojna') pairs.push([ownerIds[i], ownerIds[j]]);
    }
  }
  return { active: pairs.length, withPlayer: pairs.filter(p => p[0] === 0 || p[1] === 0).length,
    aiAi: pairs.filter(p => p[0] !== 0 && p[1] !== 0).length, pairs };
}

/** Wojny z listy wlascicieli wiersza metryk (uruchamia warsInPage w przegladarce). */
async function collectWars(page, owners) {
  try { return await page.evaluate(warsInPage, owners.map(o => o.owner)); } catch (e) { return null; }
}

/**
 * Licznik bramki utrzymania armii AI: `window.__aiUpkeepGateStats`. Hak NIE istnieje w main (licznik byl tylko
 * w kopii kandydata r3, evidence/r3/upkeep-gate-counter.patch) -> `null` = NIE ZMIERZONO. Nie dodawany do src.
 */
async function readGateStats(page) {
  try { return await page.evaluate(() => (window.__aiUpkeepGateStats ? JSON.parse(JSON.stringify(window.__aiUpkeepGateStats)) : null)); } catch (_) { return null; }
}
/** Delta licznikow bramki (po - przed) w obrebie jednej tury; reset licznika (nowa sesja) -> delta = po. */
function gateDelta(before, after) {
  if (!after) return null;
  const d = {};
  for (const k of ['calls', 'flagOff', 'noTickData', 'allowed', 'blocked']) {
    const a = Number(after[k] || 0), b = before ? Number(before[k] || 0) : 0;
    d[k] = a >= b ? a - b : a;
  }
  d.cum = { calls: after.calls || 0, blocked: after.blocked || 0 };
  return d;
}

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
  page.on('console', m => { if (m.type() === 'error') log('console-error', m.text()); const tx = m.text(); if (tx.includes('AI↔AI')) { try { fs.appendFileSync(path.join(OUT, `seed${SEED}.wiring.log`), `${new Date().toISOString()} ${tx.slice(0, 300)}\n`); } catch (_) {} } });
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
  // R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1: wariant OFF = zapis do ksiegi zrodel wylaczony przez
  // __ledgerTestDebug.setRecording(false) (stan gry nietkniety, tylko zapis do ksiegi). Wariant ON = domyslnie.
  if (LEDGER_OFF) {
    const rec = await page.evaluate(() => { try { return window.__ledgerTestDebug.setRecording(false); } catch (e) { return 'ERR:' + String(e); } });
    try { fs.appendFileSync(path.join(OUT, `seed${SEED}.events.log`), `${new Date().toISOString()} ledger-mode off recording=${rec}\n`); } catch (_) {}
    if (rec !== false) throw new Error('ledger-off: setRecording(false) nie ustawil trybu (wynik=' + rec + ')');
  }
  return page;
}

async function turnOf(page) {
  return page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
}

/**
 * Okna bitwy blokuja koniec tury (preBattleOpen / odlozona auto-bitwa). Rozstrzygniecie jak gracz (przycisk „Auto”
 * albo flush odlozonej bitwy, zamkniecie podsumowania), powtarzane az canEnd(). Liczone jawnie (battlesAuto).
 * Przed kazda iteracja zamykane sa blokady modalne (closeEndTurnModals).
 */
async function clearBattles(page, ctxState) {
  let n = 0;
  // r3: przy ~41 wlascicielach w turze bywa wiele odlozonych bitew (kazda = flush + „Auto” + podsumowanie), a 12 iteracji
  // konczylo przebieg w t51 (seed 4242, pendingAuto=true). Petla trwa do 400 iteracji (~2 min); stop dopiero gdy czysto 2x z rzedu.
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    await closeEndTurnModals(page, ctxState);
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

/** Diagnostyka zatrzymania: stan bitew/kolejki + blokady modalne z DOM. */
async function stopDump(page, extra) {
  try {
    const modal = await page.evaluate(blockerDumpInPage);
    return Object.assign({ modal }, extra);
  } catch (e) {
    return Object.assign({ modal: 'niedostepne: ' + String(e && e.message).slice(0, 120) }, extra);
  }
}

/** Jedna tura: bramka NNS gracza (opcjonalnie dosypka), koniec tury, pomiar. Zwraca rekord albo {stop: powod}. */
async function playOneTurn(page, ctxState) {
  const t0 = Date.now();
  const before = await turnOf(page);
  const gateBefore = await readGateStats(page);
  const modalBefore = {};
  for (const k of MODAL_KEYS) modalBefore[k] = ctxState[k];
  const modalDelta = () => { const d = {}; for (const k of MODAL_KEYS) d[k] = ctxState[k] - modalBefore[k]; return d; };
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
  // Blokady modalne (audiencja, panel armii, karta technologii) zamykane jak gracz PRZED bitwami i przed endTurn.
  await closeEndTurnModals(page, ctxState);
  const battlesAuto = await clearBattles(page, ctxState);
  ctxState.battlesAuto = (ctxState.battlesAuto || 0) + battlesAuto;
  let canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
  // r3: odlozona auto-bitwa potrafi zalegac w kolejce (pendingAuto=true, nic nie otwarte; seed 4242 t51). Gra leczy to
  // dopiero przy PROBIE zakonczenia tury (healStuckDeferredPreBattleQueueOnEndTurnAttempt, prog 8 s) -- tak jak gracz,
  // ktory klika „Zakoncz ture”. Harness robi to samo (do 3 prob, liczone w stuckQueueHeals) i NIE ukrywa faktu w wyniku.
  for (let k = 0; !canEnd && k < 3; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.pendingAuto || bs.preBattleOpen || bs.sceneOpen || bs.summaryOpen) break;
    await wait(9000);
    await closeEndTurnModals(page, ctxState);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
    await wait(1500);
    await closeEndTurnModals(page, ctxState);
    ctxState.stuckQueueHeals = (ctxState.stuckQueueHeals || 0) + 1;
    ctxState.battlesAuto += await clearBattles(page, ctxState);
    canEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
    if ((await turnOf(page)) > before) canEnd = false;
  }
  if ((await turnOf(page)) > before) {
    // proba zakonczenia tury (leczenie kolejki) od razu zakonczyla ture -- zapisz rekord jak zwykla tura
    const afterH = await turnOf(page);
    const mH = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
    const recH = { seed: SEED, turn: afterH, gateBlockedBeforeEnd: blocked, bypass, battlesAuto, stuckQueueHealEndedTurn: true,
      modalClosedThisTurn: modalDelta(),
      owners: mH.owners, diag: mH.diag, niezmierzone: mH.niezmierzone, sec: Math.round((Date.now() - t0) / 100) / 10 };
    recH.wars = await collectWars(page, mH.owners);
    recH.upkeepGate = gateDelta(gateBefore, await readGateStats(page));
    if (HASH) recH.stateHash = await stateHash(page, null);
    return { rec: recH };
  }
  if (!canEnd) {
    const why = await page.evaluate(() => ({ battle: window.__aiTradeWiringTestDebug.battleState(), pending: window.__aiTradeWiringTestDebug.state().pending.length }));
    return { stop: 'cannot-end', tura: before, why: await stopDump(page, { gra: why }) };
  }
  await closeEndTurnModals(page, ctxState);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  // Czekanie na koniec tury z zamykaniem blokad, ktore gra otworzy w trakcie tury (audiencja, panel armii, karta techn.).
  const deadline = Date.now() + TURN_TIMEOUT_MS;
  let advanced = false;
  let turnErr = null;
  while (!advanced && Date.now() < deadline) {
    try {
      advanced = await page.evaluate(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
      if (!advanced) await closeEndTurnModals(page, ctxState);
    } catch (e) { turnErr = e; break; }
    if (!advanced) await wait(250);
  }
  if (!advanced) {
    let why = null;
    try { why = await page.evaluate(() => ({ turn: window.__aiTradeWiringTestDebug.state().turn, inProgress: window.__aiTradeWiringTestDebug.isEndTurnInProgress(), battle: window.__aiTradeWiringTestDebug.battleState(), canEnd: window.__aiTradeWiringTestDebug.canEnd() })); } catch (e) { why = 'strona niedostepna: ' + String(e && e.message).slice(0, 160); }
    if (turnErr) why = Object.assign({ blad: String(turnErr && turnErr.message).slice(0, 160) }, typeof why === 'object' ? why : { opis: why });
    return { stop: 'endturn-timeout', tura: before, why: await stopDump(page, { gra: why }) };
  }
  const after = await turnOf(page);
  const m = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
  const rec = {
    seed: SEED, turn: after, gateBlockedBeforeEnd: blocked, bypass, battlesAuto, modalClosedThisTurn: modalDelta(),
    owners: m.owners, diag: m.diag, niezmierzone: m.niezmierzone, sec: Math.round((Date.now() - t0) / 100) / 10,
    load1: Math.round(os.loadavg()[0] * 100) / 100,
    ledgerRecording: LEDGER_OFF ? 'off' : 'on',
  };
  rec.wars = await collectWars(page, m.owners);
  rec.upkeepGate = gateDelta(gateBefore, await readGateStats(page));
  // R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1: rozmiar dziennika w pamieci (co 10 tur, tura koncowa i pierwsza tura po starcie segmentu; poza pomiarem tury).
  if (after % 10 === 0 || after === TURNS || after === RUN_START_TURN + 1) {
    try { rec.ledgerStats = await page.evaluate(() => window.__aiEconomyMeasure.ledgerStats()); } catch (e) { rec.ledgerStats = 'ERR:' + String(e); }
  }
  if (HASH) rec.stateHash = await stateHash(page, SNAP_PREFIX ? path.join(OUT, `${SNAP_PREFIX}-t${after}.json`) : null);
  return { rec };
}

/** Skrot stanu gry: zapis realnej migawki (buildSaveGameSnapshot) BEZ pola meta (znaczniki czasu/sesji). */
async function stateHash(page, dumpTo) {
  const json = await page.evaluate(() => {
    const o = JSON.parse(window.__detHarness.snapshotJson());
    delete o.meta;
    // NORMALIZACJA HASZU (R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1 r3) -- ZNANE roznice bez wplywu na przyszle tury:
    //  * units[].stackGroupId: artefakt Date.now() (zgoda orkiestratora r2);
    //  * cities[].budowaLista/magazynZywnosci/postepBudynkowUsuniete: wczytanie dopisuje wartosc domyslna ([]/0/{}),
    //    przebieg ciagly trzyma pole nieobecne -- usuwane z hasza TYLKO gdy rowne domyslnej;
    //  * resourceLedgerHistory: osobny defekt #432 (dziennik 5 -> 0 po wczytaniu), nie wplywa na tick.
    // Lista jest raportowana w summary (hashIgnored) -- nic nie jest ukrywane po cichu.
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
  if (dumpTo) fs.writeFileSync(dumpTo, json);
  return sha(json);
}

function readState() {
  try { return JSON.parse(fs.readFileSync(path.join(OUT, `seed${SEED}.state.json`), 'utf8')); } catch (_) { return null; }
}
function writeState(s) { fs.writeFileSync(path.join(OUT, `seed${SEED}.state.json`), JSON.stringify(s, null, 2)); }

/** Przebieg od biezacej tury (lub od zapisu) do `stopAt`. Zapis slotu co EVERY tur; stan (w tym liczniki) po KAZDEJ turze. */
async function runSeries(ctx, { resumeFromSlot, stopAt }) {
  const page = await openGame(ctx, { fresh: !resumeFromSlot });
  // Liczniki startuja od wartosci ZAPISANYCH w slocie (nie z ostatniej tury), zeby wznowienie nie liczylo podwojnie.
  const st = resumeFromSlot ? (readState() || {}) : {};
  const ctxState = newCtx(st.slotCounters || null);
  if (resumeFromSlot) { await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT); await suppressVictory(page); }
  const startTurn = await turnOf(page);
  // R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1 (2): tor AI↔AI WŁĄCZONY testowo (hak civTest, nie dane). Po każdym (wznowionym) starcie.
  await page.evaluate(() => window.__truceTestDebug.aiAiTreatyTickForTest.setEnabled(true));
  RUN_START_TURN = startTurn;
  let slotOk = !!resumeFromSlot;
  let slotTurn = startTurn;
  let slotCounters = countersOf(ctxState);
  // Obcina JSONL do tury startowej (wznowienie nie dubluje wierszy).
  const jsonlPath = path.join(OUT, `seed${SEED}.jsonl`);
  if (!resumeFromSlot) { try { fs.unlinkSync(jsonlPath); } catch (_) {} }
  if (resumeFromSlot && fs.existsSync(jsonlPath)) {
    const keep = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(l => l.trim() && JSON.parse(l).turn <= startTurn);
    fs.writeFileSync(jsonlPath, keep.map(l => l + '\n').join(''));
  }
  const stateOf = (extra) => Object.assign({ seed: SEED, slot: SLOT, saved: slotOk, slotTurn, slotCounters }, countersOf(ctxState), extra);
  const t0 = Date.now();
  let stop = null;
  let turn = startTurn;
  const rows = [];
  while (turn < stopAt) {
    const r = await playOneTurn(page, ctxState);
    if (r.stop) { stop = { reason: r.stop, tura: r.tura, why: r.why || null }; break; }
    turn = r.rec.turn;
    fs.appendFileSync(jsonlPath, JSON.stringify(r.rec) + '\n');
    rows.push({ turn, gate: r.rec.gateBlockedBeforeEnd, sec: r.rec.sec, modal: r.rec.modalClosedThisTurn });
    if (turn % EVERY === 0) {
      const ok = await page.evaluate(slot => window.__aiTradeWiringTestDebug.quickSave(slot), SLOT);
      if (ok) { slotOk = true; slotTurn = turn; slotCounters = countersOf(ctxState); }
    }
    // Stan po KAZDEJ turze (liczniki i ostatnia tura), nie tylko przy zapisie slotu.
    writeState(stateOf({ lastTurn: turn, stop: null }));
    if (rows.length % 5 === 0) console.log(`[econ] seed=${SEED} tura=${turn} gateAktywna=${ctxState.gateActiveTurns} dosypki=${ctxState.bypassApplied} zamkniete(aud/armia/techn)=${ctxState.diploAudienceClosed}/${ctxState.armyMergeClosed}/${ctxState.techNoticeClosed} czas=${Math.round((Date.now() - t0) / 1000)}s`);
  }
  const endTurnNo = turn;
  writeState(stateOf({ lastTurn: endTurnNo, stop }));
  return { startTurn, endTurn: endTurnNo, stop, counters: countersOf(ctxState), wallSec: Math.round((Date.now() - t0) / 1000), page };
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
    const ref = await runSeries(ctxRef, { resumeFromSlot: false, stopAt: TURNS });
    await ctxRef.close();
    fs.renameSync(path.join(OUT, `seed${SEED}.jsonl`), jsonlRef);
    try { fs.unlinkSync(path.join(OUT, `seed${SEED}.state.json`)); } catch (_) {}
    const ctxCut = await launch(chromium, path.join(PROFILE, 'cut'));
    const cut = await runSeries(ctxCut, { resumeFromSlot: false, stopAt: SAVE_AT });
    await ctxCut.close();
    const ctxRes = await launch(chromium, path.join(PROFILE, 'cut'));
    const resumed = await resumeCheck(ctxRes, SAVE_AT, TURNS);
    await ctxRes.close();
    const cmp = compareHashes(jsonlRef, SAVE_AT, TURNS, resumed);
    const summary = { seed: SEED, mode: 'resume-test', hashIgnored: HASH_IGNORED, ref: { endTurn: ref.endTurn, stop: ref.stop, counters: ref.counters, wallSec: ref.wallSec }, cut: { endTurn: cut.endTurn, stop: cut.stop }, resumeTest: cmp };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('[econ] WZNOWIENIE ' + JSON.stringify({ saveAt: cmp.saveAt, turns: cmp.turns, compared: cmp.compared, allEqual: cmp.allEqual, mutant: MUTANT }));
    return;
  }

  const ctx = await launch(chromium, PROFILE);
  const st = readState();
  // Wznowienie tylko gdy zapis slotu istnieje (saved === true); inaczej przebieg startuje od nowej gry.
  const resume = !!(st && st.lastTurn > 0 && st.saved === true && st.slot);
  const res = await runSeries(ctx, { resumeFromSlot: resume, stopAt: STOP_AT });
  await ctx.close();
  const summary = { seed: SEED, startTurn: res.startTurn, endTurn: res.endTurn, stop: res.stop, counters: res.counters, wallSec: res.wallSec, resumed: resume };
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
  if (process.env.SNAP_LOAD_DUMP) await stateHash(page, path.join(OUT, `${process.env.SNAP_LOAD_DUMP}-load-t${turn}.json`));
  if (MUTANT) await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [1]);
  if (SNAP_PREFIX) SNAP_PREFIX = 'res';
  const ctxState = newCtx(null);
  while (turn < turns) {
    const r = await playOneTurn(page, ctxState);
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

module.exports = { warsInPage, gateDelta, closeModalsInPage, blockerDumpInPage, closeEndTurnModals, newCtx, countersOf, COUNTER_KEYS, MODAL_KEYS };

if (require.main === module) {
  main().catch(e => { console.error('[econ] BLAD: ' + (e && e.stack || e)); process.exit(1); });
}
