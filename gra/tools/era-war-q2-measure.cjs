'use strict';
/**
 * era-war-q2-measure.cjs -- R-WEB-MEASURE-ERA-WAR-Q2-Q1 (MEASQ2). Wariant war-duration-measure.cjs:
 *  - start nowej gry przez __settingsLive.startNewGame z advanced.diplomacyWarLevel (domyslnie 'trudna' = MAKSIMUM)
 *    i playerEpochWarEnabled=true (wojna epoki z udzialem gracza ON);
 *  - kopia z hakami: ai-city-live-measure --prepare, ai-war-weariness-live-audit-hook, era-war-q2-hook (pole ep);
 *  - dziennik powodu konca wojny window.__diploWarEndLog zapisywany do <out>/war-<typ>-<seed>.warend.json (wznawialny).
 * Bazowy opis: war-duration-measure.cjs.
 * war-duration-measure.cjs -- R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1 (wersja 2: wznawialna).
 * Pomiar PELNEJ GRY: realny bundle, headless Chromium, realna tura (endTurn), zmeczenie wojna z gry.
 *
 * Bundle (poza repo): kopia gra/ -> `ai-city-live-measure.cjs --prepare <kopia>` ->
 *   `ai-war-weariness-live-audit-hook.cjs <kopia>` (commitowany hook; dodaje window.__wwDump.dump()) ->
 *   vite build --outDir <dist poza repo>.
 *
 *   node tools/war-duration-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist> --out <katalog>
 *        --seed 4242 --turns 120 [--stop-at <tura>] [--typ kontynenty] [--size Standardowy]
 *
 * Wznowienie: --stop-at <tura> zapisuje slot gry `wwm-<SEED>` (quickSave) na koncu odcinka i przy kazdej turze,
 * stan w <out>/<TAG>.state.json. Kolejne wywolanie z TYM SAMYM --out i --seed wczytuje slot (loadSlot),
 * obcina jsonl do tury slotu i gra dalej. Limit polecenia Bash 590 s: ok. 10-12 tur na odcinek.
 * Bez --stop-at: przebieg od nowej gry do --turns (bez slotu).
 *
 * Wynik: <out>/<TAG>.jsonl -- jedna linia = jedna tura: {turn, ms, owners, cities, wars[], rel[], logs[]}.
 *   wars[] z __wwDump: {a,b,tw,lostA,lostB,since,share,pa,pb,wear{peak,stage,rej,last,ws},forced}.
 * Analiza: tools/war-duration-summarize.cjs.
 * Uwaga o resume: PRNG jest reseedowany ziarnem przy kazdym wczytaniu slotu, wiec odcinek wznowiony NIE jest
 * bit-identyczny z przebiegiem ciaglym (kolejnosc losowan po zapisie). Pomiar wojen jest statystyczny; zapisywac w raporcie.
 * Uwaga o powodzie konca wojny: gra nie zapisuje go w logu; klasyfikacja jest WNIOSKIEM z kolejnych rekordow
 * (patrz summarize), nie zapisem gry.
 */
const fs = require('fs');
const path = require('path');

// Tryb --patch-ep <kopia-gra> (przed --prepare / hakiem war-weariness; tylko kopia poza repo):
// dodaje pole `ep` (epoka cywilizacji = empireEpochForOwner) do window.__wwDump.dump().owners[].
if (process.argv.includes('--patch-ep')) {
  const f = path.join(process.argv[process.argv.indexOf('--patch-ep') + 1], 'src', 'main.ts');
  let src = fs.readFileSync(f, 'utf8');
  if (src.includes('ep: empireEpochForOwner(o)')) { console.log('juz zapatchowany'); process.exit(0); }
  const from = 'civ: civKeyForOwnerId(o), me: o === 0,';
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error('patch-ep: oczekiwano 1 wystapienia, jest ' + n);
  fs.writeFileSync(f, src.replace(from, () => 'civ: civKeyForOwnerId(o), ep: empireEpochForOwner(o), me: o === 0,'));
  console.log('zapatchowano ep w', f);
  process.exit(0);
}
const base = require('./ai-economy-measure-run.cjs'); // closeEndTurnModals: zamyka okna/modale blokujace "Zakoncz ture" (jak w runnerze dyplomacji)
const CTX = base.newCtx(null);
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs'); // pokoj wymuszony (100%): pasywny gracz akceptuje (jedyna opcja okna)
const FP_CTX = { forcedPeaceAccepted: 0 }; // wiszace oferty AI->gracz blokuja "Zakoncz ture" (pasywny gracz)

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const TYP = arg('typ', 'kontynenty');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '120')); const SIZE = arg('size', 'Standardowy');
const SEGMENT = process.argv.indexOf('--stop-at') >= 0;
const STOP_AT = SEGMENT ? parseInt(arg('stop-at', String(TURNS)), 10) : TURNS;
const TAG = `war-${TYP}-${SEED}`;
const SLOT = 'wwm-' + SEED;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), TAG, ...a);
const BASE = path.join(OUTD, TAG);
const JSONL = BASE + '.jsonl';
const STATE = BASE + '.state.json';
const PROFILE = BASE + '.profile';
const WARLOG = BASE + '.warend.json';
const DIPLO_LEVEL = arg('diplo', 'trudna');
// Sol PRNG przy kazdym wczytaniu slotu (MEASURE_RESALT, domyslnie 0): zmiana po awarii Chromium omija powtarzalny punkt awarii.
const RESALT = Number(process.env.MEASURE_RESALT || '0') | 0;

/** Bitwy: automatyczne rozstrzygniecie (jak clearBattles w diplomacy-harder-measure-run.cjs). Bez tego zapis
 *  (quickSave) jest zablokowany w trakcie bitwy, a tura moze stanac na oknie bitwy. Zwraca liczbe rozstrzygniec. */
async function clearBattles(page) {
  let n = 0; let clean = 0;
  for (let k = 0; k < 400; k++) {
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

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

function readWarLog() { try { return JSON.parse(fs.readFileSync(WARLOG, 'utf8')); } catch (_) { return []; } }
async function saveWarLog(page) {
  const arr = await page.evaluate(() => window.__diploWarEndLog || []).catch(() => null);
  if (Array.isArray(arr)) fs.writeFileSync(WARLOG, JSON.stringify(arr));
}
function readState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (_) { return null; } }

async function openGame(chromium, resume) {
  // Trwaly profil przegladarki (IndexedDB = zapisy slotow); wznowienie wymaga tego samego profilu co zapis.
  if (!resume) fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  const browser = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', ...(process.env.MEASURE_CHROME_ARGS || '').split(/\s+/).filter(Boolean)],
    viewport: { width: 1280, height: 800 },
  });
  const page = browser.pages()[0] || await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  page.on('console', (m) => { const t = m.text(); if (/\[(Save|Load|Zapis|Wczyt)|zapis|wczyt|slot/i.test(t)) errors.push('[console] ' + t.slice(0, 240)); });
  {
    // PRNG z ziarna (dla resume: sekwencja zaczyna sie od ziarna, nie od miejsca zapisu -- patrz uwaga w naglowku).
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED ^ RESALT) | 0);
  }
  await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
    && !!window.__aiBuildingsTestDebug && !!window.__wwDump && !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  // Jak diplomacy-harder-measure-run.cjs: najpierw start nowej gry (swiat), potem wczytanie slotu (resume) albo zalozenie miasta (fresh).
    const params = {
      civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
      mapSize: SIZE, rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: TYP, seed: SEED,
      mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
      renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
      worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
      advanced: {
        barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
        kosztJednostekPace: 'niski', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
        cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: DIPLO_LEVEL,
      },
      villageRewardsEnabled: true, dealsEndTurnGate: true, playerEpochWarEnabled: true,
    };
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), params);
  await pollUntil(page, () => {
    const dbg = window.__cityStateStartUnitsTestDebug;
    const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    const st = dbg.dumpState();
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 1500000, 'awaitingFirstPlayerCity');
  if (resume) {
    await page.evaluate((slot) => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT);
    await wait(3000); // wczytanie slotu; zgodnosc tury sprawdza main (tura po loadSlot != tura slotu -> blad)
    await page.evaluate((arr) => { window.__diploWarEndLog = arr; }, readWarLog());
  } else {
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
  }
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
  // Autopilot gracza (dispatch): ustawiany PO starcie / wczytaniu, PRZED pierwsza tura; odczyt potwierdza.
  await page.evaluate(() => window.__aiEconomyMeasure.setPlayerAiAutopilotForTest(true));
  const on = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
  if (on !== true) throw new Error('autopilot gracza nie ustawiony (odczyt=' + on + ')');
  await wait(500);
  return { browser, page, errors };
}

async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const prev = SEGMENT ? readState() : null;
  const resume = !!(prev && prev.saved === true && prev.slot === SLOT && prev.slotTurn > 0);
  let slotTurn = resume ? prev.slotTurn : 0;
  if (resume) {
    // Obciecie jsonl do tury slotu (bez duplikatow po wznowieniu).
    if (fs.existsSync(WARLOG)) fs.writeFileSync(WARLOG, JSON.stringify(readWarLog().filter((e) => e.tura <= slotTurn)));
    if (fs.existsSync(JSONL)) {
      const keep = fs.readFileSync(JSONL, 'utf8').split('\n').filter((l) => l.trim() && JSON.parse(l).turn <= slotTurn);
      fs.writeFileSync(JSONL, keep.map((l) => l + '\n').join(''));
    }
  } else {
    fs.writeFileSync(JSONL, '');
    fs.writeFileSync(WARLOG, '[]');
  }
  const status = { tag: TAG, seed: SEED, typ: TYP, size: SIZE, turns: TURNS, stopAt: STOP_AT, segment: SEGMENT, resumed: resume, slot: SLOT, startedAt: new Date().toISOString(), lastTurn: slotTurn, errors: [], gateBypass: 0 };
  let saved = resume; let browser = null;
  const saveState = (extra) => { if (SEGMENT) fs.writeFileSync(STATE, JSON.stringify(Object.assign({ tag: TAG, slot: SLOT, saved, slotTurn, lastTurn: status.lastTurn, gateBypass: status.gateBypass }, extra || {}), null, 2)); };
  try {
    const opened = await openGame(chromium, resume);
    browser = opened.browser; const page = opened.page;
    let turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    if (resume && turn !== slotTurn) throw new Error(`wznowienie: tura po loadSlot=${turn} != tura slotu ${slotTurn} | ${opened.errors.slice(-6).join(' || ')}`);
    log(resume ? `WZNOWIENIE ze slotu ${SLOT} (tura ${turn})` : `start (tura ${turn})`);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true)).catch(() => {});
    while (turn < STOP_AT) {
      // Bramka NNS gracza (dosypka zlota/zywnosci, jak w diplomacy-harder-measure-run.cjs). Zlicza sie w statusie.
      if (await page.evaluate(() => { try { return window.__aiTradeWiringTestDebug.nnsGateBlocked(); } catch (_) { return false; } })) {
        await page.evaluate(() => { window.__aiTradeWiringTestDebug.grantPlayerGold(300); window.__aiTradeWiringTestDebug.grantPlayerFood(300); });
        status.gateBypass++;
      }
      status.battles = (status.battles || 0) + await clearBattles(page);
      const offers = await rejectAwaitingAiOffers(page, new Set());
      status.aiOffersRejected = (status.aiOffersRejected || 0) + offers.confirmed;
      await acceptForcedPeace(page, FP_CTX);
      status.forcedPeaceAccepted = FP_CTX.forcedPeaceAccepted;
      let r = null; let retries = 0;
      for (;;) {
        r = await page.evaluate(() => new Promise((resolve) => {
          const dbg = window.__eraTestDebug; const turn0 = dbg.getWorldState().turn; const t0 = performance.now();
          dbg.endTurn(); let saw = dbg.isEndTurnInProgress();
          const tick = () => {
            const ip = dbg.isEndTurnInProgress(); if (ip) saw = true;
            if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn }); return; }
            if (performance.now() - t0 > 400000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn }); return; }
            setTimeout(tick, 4);
          };
          setTimeout(tick, 0);
        }));
        if (r.turn1 > r.turn0) break;
        if (++retries > 6) {
          const vis = await page.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null).map((x) => x.innerText.trim()).filter(Boolean).slice(0, 25));
          throw new Error('tura nie przechodzi: ' + JSON.stringify(r) + ' widoczne przyciski=' + JSON.stringify(vis));
        }
        await base.closeEndTurnModals(page, CTX);
        await acceptForcedPeace(page, FP_CTX);
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate((n) => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          const btns = [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null);
          for (const b of btns.filter((x) => re.test(x.innerText.trim())).slice(0, 3)) b.click();
          // Od 3. proby: klik w pierwszy widoczny przycisk modalu (np. propozycja pokoju/oferta), by odblokowac ture.
          if (n >= 3) { const m = btns.find((x) => x.innerText.trim() && !/Zakończ turę/i.test(x.innerText)); if (m) m.click(); }
        }, retries);
        await wait(300);
      }
      turn = r.turn1;
      const d = await page.evaluate(() => window.__wwDump.dump());
      fs.appendFileSync(JSONL, JSON.stringify(Object.assign({}, d, { ms: Math.round(r.ms) })) + '\n');
      status.lastTurn = turn;
      if (SEGMENT && (turn % 1 === 0 || turn >= STOP_AT)) { // MEASQ2: zapis slotu co turę (Chromium pada co kilka tur)
        const ok = await page.evaluate((slot) => window.__aiTradeWiringTestDebug.quickSave(slot), SLOT);
        if (ok) { saved = true; slotTurn = turn; }
        saveState({ updatedAt: new Date().toISOString() });
        await saveWarLog(page);
      }
      if (turn % 10 === 0) log(`T${turn} lastTurnMs=${Math.round(r.ms)} wojen=${d.wars.length}`);
    }
    await saveWarLog(page);
    status.finishedAt = new Date().toISOString();
    status.errors = opened.errors.slice(0, 20);
    if (SEGMENT) saveState({ done: turn >= TURNS, stopped: turn < TURNS, lastTurn: turn });
    fs.writeFileSync(BASE + '.status.json', JSON.stringify(status, null, 2));
    if (turn >= TURNS) fs.writeFileSync(BASE + '.DONE', 'ok\n');
    log(turn >= TURNS ? 'DONE' : `ODCINEK KONIEC tura ${turn} (stop-at ${STOP_AT})`);
  } catch (e) {
    status.error = String((e && e.stack) || e).slice(0, 800);
    fs.writeFileSync(BASE + '.status.json', JSON.stringify(status, null, 2));
    fs.writeFileSync(BASE + '.ERROR', status.error.slice(0, 400) + '\n'); log('ERROR', status.error.slice(0, 300));
  } finally { if (browser) await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
