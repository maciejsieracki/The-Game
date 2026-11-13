'use strict';
/**
 * measure-ai-trade-offer-frequency.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 (POMIAR, tylko odczyt).
 *
 * Mierzy, jak czesto AI skladala graczowi oferte handlowa w PELNEJ grze (zywy bundle vite, headless Chromium,
 * `?playtest=mapa&civTest=1`, realny endTurn, AI normalny). Skrypt NIE zmienia reguł gry; korzysta z haka
 * `window.__aiTradeWiringTestDebug` (ta sama bramka ?civTest=1 co reszta hakow). Hak jest dodany w gra/src
 * (r3: ziarno ?civSeed, tryb przyspieszony; r4: setRelationPin — pin Relacji PRZED decyzjami AI, tylko ?civTest=1).
 *
 * Liczone per przebieg (surowe liczby, bez progu):
 *   - offers        : nowe wpisy AI->gracz typu wymiana cykliczna (aiCyclicBarter) pojawiajace sie na stole,
 *   - activePrzyjmij: z tych ofert ile mialo podglad „Przyjmij” gracza AKTYWNY (previewAccept.accepted),
 *   - pairs         : liczba ofert per para (give -> recv) z payloadu,
 *   - cyclicDealsMax: maks. liczba aktywnych umow cyklicznych w jednej turze,
 *   - tableGrowth   : przyrost calkowitej liczby wpisow na stole (wszystkie typy; NIE klasyfikowane — jednorazowe
 *                     i pozostale oferty nie maja hakowego odczytu typu, wiec ich liczba jest NIE_ZMIERZONO),
 *   - per100        : offers * 100 / turnsRun.
 * Gdy wisząca oferta blokuje koniec tury (bramka stolu), skrypt ja odrzuca (reject) i liczy jako „odrzucona przez
 * skrypt” — gracz nie reaguje w tym tescie; to jest jawne zalozenie pomiaru.
 *
 * Ograniczenia (jawnie, nie ukrywane):
 *   - ziarno: MEAS_SEED => ?civSeed (tylko z ?civTest=1); bez MEAS_SEED — PLAYTEST_MAPA_SEED. Powtarzalnosc
 *     tego samego ziarna NIE jest gwarantowana (patrz r4: ten sam scenariusz daje rozne oferty w t25 vs t26);
 *   - relacja: MEAS_REL => setRelationPin (r4, pin wymuszany w tiku przed decyzjami AI) + setRelationTotal przed
 *     pierwsza tura; bez MEAS_REL — relacja naturalna po setupie. Pole relAtDecision to zapis pinu w tiku,
 *     NIE niezalezny dowod widocznosci przez AI (dowodem jest relTotalAi po endTurn i symetryczny klucz relacji);
 *   - ramiona: „natural” = bez haka prepare (kontakt/technologia wg gry); „prepared” = prepare() raz na starcie
 *     (kontakt + technologia Wymiany, wyciszenie innych klas ofert) — tylko do porownania, NIE jest pomiarem naturalnym.
 *
 * Usage (z gra/):
 *   MEAS_TURNS=150 MEAS_ARM=natural MEAS_RESULT=<abs.json> BUNDLE_DIR=<abs> node tools/measure-ai-trade-offer-frequency.cjs
 *   MEAS_ARM: natural | prepared (domyslnie natural). MEAS_MAX_SEC: limit czasu przebiegu (domyslnie 480 s);
 *   po limicie zapisuje raport czesciowy z `turnsRun`. Bundle: BUNDLE_DIR (budowany osobno poza repo; SKIP_BUILD=1 pomija build).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), 'measure-ai-trade-dist');
const TURNS = parseInt(process.env.MEAS_TURNS || '150', 10);
const ARM = process.env.MEAS_ARM === 'prepared' ? 'prepared' : 'natural';
// R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1: ziarno (?civSeed, tylko z civTest=1) i Relacja (total 0–200; haki setRelationTotal).
const SEED = process.env.MEAS_SEED ? parseInt(process.env.MEAS_SEED, 10) : null;
const REL = process.env.MEAS_REL ? parseInt(process.env.MEAS_REL, 10) : null;
// 480 s (nie 540): start + build + pętla muszą mieścić się w limicie 590 s pojedynczego wywołania bash (Evaluator r1, zarzut 10).
const MAX_MS = parseInt(process.env.MEAS_MAX_SEC || '480', 10) * 1000;
const RESULT_FILE = process.env.MEAS_RESULT || '';
// MEAS_GATE=1: bramka ?civTest=1 — bez flagi hak nieobecny i ziarno z ?civSeed= ignorowane (PLAYTEST_MAPA_SEED=271828).
const GATE = process.env.MEAS_GATE === '1';
const GATE_WAIT_MS = parseInt(process.env.MEAS_GATE_WAIT_SEC || '170', 10) * 1000;
// MEAS_PROFILE (abs): katalog trwalego profilu Chromium (IndexedDB) — wznawianie przebiegu miedzy wywolaniami bash:
// przy limicie czasu runner robi quickSave do slotu 'meas-cell' i zapisuje stan czastkowy w MEAS_RESULT (stoppedBy='limit czasu');
// kolejne wywolanie z tym samym MEAS_RESULT i MEAS_PROFILE laduje slot (loadSlot) i kontynuuje od zapisanej tury.
const PROFILE = process.env.MEAS_PROFILE || '';
const SAVE_SLOT = 'meas-cell';
// Zgodne z SENSIBLE_TRADE_ACTION_IDS (src/game/diplomacy-sensible-deals.ts): tylko te actionId to oferty handlowe.
const TRADE_ACTIONS = new Set(['handel', 'umowa_handlowa', 'umowa_szlakow']);
// MEAS_FAST (domyslnie 1): tryb przyspieszony = hak setFastMode (pomija renderer.render; tylko ?civTest=1). MEAS_FAST=0 wylacza.
const FAST = process.env.MEAS_FAST !== '0';
const PHASE = process.env.MEAS_PHASE === '1';
const PLAYTEST_SEED_DEFAULT = 271828;
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa' + (GATE ? '' : '&civTest=1') + (SEED != null ? '&civSeed=' + SEED : '');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log(`[meas] build vite -> ${BUNDLE}`);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  if (PROFILE) {
    const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
    try { return await chromium.launchPersistentContext(PROFILE, o); } catch (_) {
      return await chromium.launchPersistentContext(PROFILE, { ...o, executablePath: FALLBACK_CHROME });
    }
  }
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

/**
 * Okna bitwy blokuja koniec tury (preBattleOpen: okno otwarte LUB bitwa odlozona w kolejce auto-pre-battle).
 * Rozstrzygniecie w tescie (jak gracz): flush odlozonej bitwy -> przycisk „Auto” w `.pb-overlay` -> zamkniecie
 * podsumowania po bitwie; powtarzane az canEnd()===true (max 12 iteracji). Zwraca liczbe rozstrzygnietych bitew.
 */
async function clearBattles(page, stats) {
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
    if (stats) stats[act] = (stats[act] || 0) + 1;
    await wait(act === 'wait' ? 300 : 150);
  }
  return n;
}

async function endTurnWait(page) {
  const t0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), t0, { timeout: 90000 },
  );
  await wait(50);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[meas] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const t00 = Date.now();
  const rep = {
    arm: ARM,
    seedNote: SEED != null ? 'ziarno z ?civSeed=' + SEED + ' (tylko z civTest=1)' : 'PLAYTEST_MAPA_SEED (domyslne, brak ?civSeed)',
    relationNote: REL != null ? 'przypiety haka setRelationPin=' + REL + ' (wymuszany w tiku PO tickDiplomacy, PRZED decyzjami AI; relAtDecision = zapis pinu) + setRelationTotal=' + REL + ' przed startem i przed kazdym endTurn (relBeforeEnd)' : 'naturalny (brak haka ustawiania relacji)',
    seed: SEED, relTotalSet: REL, relTotalAfter: null, offersCyclic: 0, offersOneShot: 0, offersOneShotAll: 0, otherActions: {},
    turnsRequested: TURNS, turnsRun: 0, offers: 0, activePrzyjmij: 0, pairs: {}, cyclicDealsMax: 0,
    tableStart: 0, tableEnd: 0, tableGrowth: 0, scriptRejected: 0, rejectCooldownsMax: 0, per100: 0, aiOwner: null, stoppedBy: null,
    autoBattles: 0, battleActs: {}, consoleMatches: [], fastMode: FAST, consoleErrors: 0, offerLog: [], perTurn: [],
  };
  const consoleErrors = [];
  const endBlocks = [];
  let page = null;
  try {
    page = PROFILE ? await browser.newPage() : await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));
    // R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 (r3): MEAS_PHASE=1 — instrumentacja per krok tury (bisekcja dryfu). `phaseMark` (main.ts)
    // pushuje do `window.__civPhaseLog`; podstawiamy Proxy tablicy, ktory przy KAZDYM znaczniku fazy (WORLD_START, ECONOMY, AI_START,
    // AI_CIV_START per wlasciciel, AI_END, ...) zapisuje skrot calej migawki zapisu i skroty sekcji (hak __turnSlowdownTestDebug.snapshotInfo,
    // sekcje bez zegara). Tylko narzedzie pomiarowe; kod gry nietkniety.
    if (PHASE) await page.addInitScript(() => {
      const rec = []; window.__phaseRec = rec;
      const arr = [];
      window.__civPhaseLog = new Proxy(arr, { get(t, p) {
        if (p === 'push') return (e) => {
          try {
            const h = window.__turnSlowdownTestDebug && window.__turnSlowdownTestDebug.snapshotInfo();
            const fnv = (str) => { let x = 0x811c9dc5; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(16); };
            const cs = window.__turnSlowdownTestDebug.snapshotSectionObj('cities');
            const cityF = {};
            if (Array.isArray(cs)) for (const c of cs) { const f = {}; for (const [k, v] of Object.entries(c)) f[k] = fnv(JSON.stringify(v ?? null)); cityF[c.id ?? (c.q + ',' + c.r)] = f; }
            rec.push({ k: e.k, d: e.d, turn: e.turn, hash: h ? h.hash : null, sec: h ? h.sectionHashes : null, cityF });
          } catch (x) { rec.push({ k: e.k, d: e.d, turn: e.turn, err: String(x) }); }
          return 1;
        };
        return t[p];
      } });
    });
    // MEAS_LOGRE: regex (diagnostyka) — pasujace linie konsoli trafiaja do rep.consoleMatches (ostatnie 60, bufor kolowy, z numerem tury gry).
    const LOGRE = process.env.MEAS_LOGRE ? new RegExp(process.env.MEAS_LOGRE, 'i') : null;
    if (LOGRE) page.on('console', m => { const t = m.text(); if (LOGRE.test(t)) { rep.consoleMatches.push({ turnsRun: rep.turnsRun, text: t.slice(0, 220) }); if (rep.consoleMatches.length > 60) rep.consoleMatches.shift(); } });
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); if (/EndTurn\] blocked/.test(m.text())) endBlocks.push(m.text().slice(0, 160)); });
    if (GATE) {
      // Bramka: bez ?civTest=1 hak musi byc nieobecny, a ziarno z ?civSeed= ignorowane.
      const seedLine = new Promise(res => { page.on('console', m => { const x = /\[PlaytestMapa\] seed=(\d+)/.exec(m.text()); if (x) res(Number(x[1])); }); });
      await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
      // R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 (obrona r4): limit czekania na linie seed (bez flagi mapa laduje sie ~2-3 min w swiftshader; r4 zmierzone: 170 s za krotko).
      const seedSeen = await Promise.race([seedLine, wait(GATE_WAIT_MS).then(() => null)]);
      const hookPresent = await page.evaluate(() => typeof window.__aiTradeWiringTestDebug !== 'undefined');
      const gate = { gate: true, civSeedRequested: SEED, seedSeen, seedExpected: PLAYTEST_SEED_DEFAULT, hookPresent, pass: seedSeen === PLAYTEST_SEED_DEFAULT && hookPresent === false };
      console.log('[meas] GATE ' + JSON.stringify(gate));
      if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(gate, null, 2));
      return;
    }
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__eraTestDebug
        && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined, { timeout: 180000 },
    );
    await page.evaluate(() => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    rep.aiOwner = info.ai;
    let prior = null;
    if (PROFILE && RESULT_FILE && fs.existsSync(RESULT_FILE)) {
      try { prior = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8')); } catch (_) { prior = null; }
      if (prior && !(prior.stoppedBy === 'limit czasu' && prior.savedSlot && prior.turnsRun > 0 && prior.seed === SEED && prior.relTotalSet === REL)) prior = null;
    }
    const seen = new Set();
    let resumed = false;
    if (prior) {
      await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), prior.savedSlot);
      const tNow = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      for (const k of Object.keys(prior)) if (!['stoppedBy', 'secs', 'consoleErrors', 'consoleErrorSample', 'endBlocks', 'diag'].includes(k)) rep[k] = prior[k];
      for (const id of (prior.seen || [])) seen.add(id);
      rep.resumes = (prior.resumes || 0) + 1;
      rep.resumeLog = (prior.resumeLog || []).concat([{ turnAtSave: prior.savedGameTurn, turnAfterLoad: tNow, turnsRunAtSave: prior.turnsRun }]);
      resumed = true;
      console.log('[meas] WZNOWIENIE od tury gry ' + tNow + ' (turnsRun=' + rep.turnsRun + ', zapis tury ' + prior.savedGameTurn + ')');
    } else if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('nie udalo sie zalozyc miasta gracza');
    if (FAST) await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
    if (ARM === 'prepared' && !resumed) await page.evaluate(ai => window.__aiTradeWiringTestDebug.prepare(ai), info.ai);
    // r4/Z1: pin Relacji (hak setRelationPin, tylko ?civTest=1) wymuszany w tiku PRZED decyzjami AI; stan strony ginie przy wznowieniu, wiec pin ustawiany ZAWSZE.
    if (REL != null) {
      await page.evaluate(([ai, t]) => window.__aiTradeWiringTestDebug.setRelationPin(ai, t), [info.ai, REL]);
      if (!resumed) rep.relTotalAfter = await page.evaluate(([ai, t]) => window.__aiTradeWiringTestDebug.setRelationTotal(ai, t), [info.ai, REL]);
    }

    const s0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
    if (!resumed) rep.tableStart = s0.tableLen;
    const tStart = Date.now();
    for (let i = rep.turnsRun; i < TURNS; i++) {
      if (Date.now() - t00 > MAX_MS) {
        rep.stoppedBy = 'limit czasu';
        if (PROFILE) {
          // Zapis stanu gry do wznowienia (tylko gdy jest profil trwały); bledy zapisu = przebieg NIEDOKONCZONY bez wznowienia.
          const ok = await page.evaluate(slot => window.__aiTradeWiringTestDebug.quickSave(slot), SAVE_SLOT);
          rep.savedSlot = ok ? SAVE_SLOT : null;
          rep.savedGameTurn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
          rep.seen = [...seen];
        }
        break;
      }
      // Wisząca oferta blokuje koniec tury: odrzuc (zalozenie pomiaru: gracz nie reaguje).
      let st = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
      if (st.pending.length > 0 && !(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
        for (const p of st.pending) { await page.evaluate(id => window.__aiTradeWiringTestDebug.reject(id), p.id); rep.scriptRejected++; }
      }
      rep.autoBattles += await clearBattles(page, rep.battleActs);
      // Relacja przypinana PRZED kazdym endTurn (smoke r3: bez przypiecia relacja spadala 40→29→9 w 3 turach = dryf naturalny).
      let relBeforeEnd = null;
      if (REL != null) {
        relBeforeEnd = await page.evaluate(([ai, t]) => window.__aiTradeWiringTestDebug.setRelationTotal(ai, t), [info.ai, REL]);
      }
      // Gracz bez miast = koniec sensownego pomiaru (stan gry „awaitingFirstPlayerCity” blokuje koniec tury); wynik terminalny.
      if (st.playerCities === 0) { rep.stoppedBy = 'gracz bez miast'; rep.playerCitiesLostAtTurn = st.turn; break; }
      await endTurnWait(page);
      st = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
      rep.turnsRun = i + 1;
      rep.cyclicDealsMax = Math.max(rep.cyclicDealsMax, st.cyclicDeals.length);
      // Wpisy stolu z typem (entries): jednorazowe liczone osobno (bez payloadu), cykliczne jak dotad (payload z pending).
      const fresh = (st.entries || []).filter(e => e.proposer === info.ai && e.responder === 0 && !seen.has(e.id));
      for (const e of fresh) {
        seen.add(e.id);
        if (!e.cyclic) {
          // Wpis jednorazowy: oferta HANDLOWA tylko dla actionId z SENSIBLE_TRADE_ACTION_IDS; reszta (rozejm, trybut_oferta, ...) to oferty dyplomatyczne.
          rep.offersOneShotAll = (rep.offersOneShotAll || 0) + 1;
          rep.otherActions[e.actionId] = (rep.otherActions[e.actionId] || 0) + 1;
          if (TRADE_ACTIONS.has(e.actionId)) { rep.offersOneShot++; rep.offers++; }
          rep.offerLog.push({ turn: st.turn, type: 'jednorazowa', actionId: e.actionId, trade: TRADE_ACTIONS.has(e.actionId) });
          continue;
        }
        const p = st.pending.find(x => x.id === e.id);
        if (!p) continue;
        rep.offersCyclic++;
        const pa = await page.evaluate(id => window.__aiTradeWiringTestDebug.previewAccept(id), p.id);
        const gi = p.payload.giveItems?.[0]?.id ?? '?';
        const ri = p.payload.receiveItems?.[0]?.id ?? '?';
        const key = `${gi}->${ri}`;
        rep.offers++;
        rep.pairs[key] = (rep.pairs[key] || 0) + 1;
        if (pa && pa.accepted) rep.activePrzyjmij++;
        rep.offerLog.push({ turn: st.turn, give: gi, giveQty: p.payload.giveItems?.[0]?.ilosc, recv: ri, recvQty: p.payload.receiveItems?.[0]?.ilosc, przyjmijAktywne: !!(pa && pa.accepted) });
      }
      // rejectCooldowns z hooka: mierzy, czy odrzucenia wymuszone przez skrypt wplywaja na kooldowny ofert (zarzut 9).
      rep.rejectCooldownsMax = Math.max(rep.rejectCooldownsMax, st.rejectCooldowns.length);
      // R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1: skrot stanu (jednostki, skarbiec, zasoby) co ture — digest z hooka.
      if (PHASE) {
        // Zapis krokow tury per tura (migawka sekcji po kazdym znaczniku fazy) + migawka na koniec tury (po przejsciu).
        const rec = await page.evaluate(() => { const r = window.__phaseRec.splice(0); return r; });
        const endSnap = await page.evaluate(() => { const h = window.__turnSlowdownTestDebug.snapshotInfo(); return { hash: h.hash, sec: h.sectionHashes }; });
        (rep.phaseSteps = rep.phaseSteps || []).push(...rec, { k: 'TURN_END_SNAP', d: '', turn: st.turn, hash: endSnap.hash, sec: endSnap.sec });
      }
      rep.perTurn.push({ t: st.turn, cities: st.playerCities, pending: st.pending.length, deals: st.cyclicDeals.length, table: st.tableLen, rejCd: st.rejectCooldowns.length, scriptRejectedSoFar: rep.scriptRejected, relBeforeEnd, relTotalAi: st.relTotalAi, relAtDecision: st.relAtDecision, digest: st.digest ?? null });
    }
    const sEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
    rep.tableEnd = sEnd.tableLen;
    rep.tableGrowth = rep.tableEnd - rep.tableStart;
    rep.per100 = rep.turnsRun > 0 ? +(rep.offers * 100 / rep.turnsRun).toFixed(2) : 0;
    rep.secs = Math.round((Date.now() - tStart) / 1000);
    // Skrot calej trajektorii: sha256 z perTurn (tury + pola stanu + digest). Dwa przebiegi o tym samym skrocie = ten sam przebieg.
    rep.trajectorySha256_12 = require('crypto').createHash('sha256').update(JSON.stringify(rep.perTurn)).digest('hex').slice(0, 12);
    rep.digestFirst = rep.perTurn.length ? rep.perTurn[0].digest : null;
    rep.digestLast = rep.perTurn.length ? rep.perTurn[rep.perTurn.length - 1].digest : null;
    rep.relTotalFirst = rep.perTurn.length ? rep.perTurn[0].relTotalAi : null;
    rep.relTotalLast = rep.perTurn.length ? rep.perTurn[rep.perTurn.length - 1].relTotalAi : null;
    rep.relDrift = (rep.relTotalSet != null && rep.perTurn.length) ? rep.perTurn.some(x => x.relTotalAi !== rep.relTotalSet) : null;
    // r4/Z1: dowod — relacja widziana przez decyzje AI (relAtDecision) w kazdej turze = pin.
    rep.relAtDecisionAllPinned = REL != null && rep.perTurn.length ? rep.perTurn.every(x => x.relAtDecision === REL) : null;
    rep.relAtDecisionDistinct = [...new Set(rep.perTurn.map(x => x.relAtDecision))];
    rep.relPinnedBeforeEnd = REL != null ? rep.perTurn.every(x => x.relBeforeEnd === REL) : null;
    if (!rep.stoppedBy) { rep.stoppedBy = rep.turnsRun >= TURNS ? 'koniec przebiegu' : 'przerwany'; if (rep.stoppedBy === 'koniec przebiegu') { delete rep.seen; delete rep.savedSlot; } }
  } catch (e) {
    rep.stoppedBy = 'blad: ' + e.message;
    if (page) {
      rep.endBlocks = endBlocks.slice(-5);
      rep.diag = await page.evaluate(() => { try { const h = window.__aiTradeWiringTestDebug; const s = h.state(); return { turn: s.turn, pending: s.pending.map(p => ({ id: p.id, proposer: p.proposer, responder: p.responder })), canEnd: h.canEnd(), inProg: h.isEndTurnInProgress(), table: s.tableLen }; } catch (x) { return 'diag-err ' + x.message; } }).catch(x => 'eval-err ' + x.message);
    }
  } finally {
    await browser.close();
  }
  rep.consoleErrors = consoleErrors.length;
  rep.consoleErrorSample = consoleErrors.slice(0, 5);
  const line = JSON.stringify({ arm: rep.arm, turnsRun: rep.turnsRun, offers: rep.offers, per100: rep.per100, activePrzyjmij: rep.activePrzyjmij, pairs: rep.pairs, cyclicDealsMax: rep.cyclicDealsMax, tableGrowth: rep.tableGrowth, scriptRejected: rep.scriptRejected, rejectCooldownsMax: rep.rejectCooldownsMax, stoppedBy: rep.stoppedBy, consoleErrors: rep.consoleErrors });
  console.log('[meas] RESULT ' + line);
  // Blad po wznowieniu NIE nadpisuje punktu kontrolnego (stan czastkowy + zapis gry musza zostac spojne): idzie do pliku .err.
  const keepCheckpoint = typeof rep.stoppedBy === 'string' && rep.stoppedBy.startsWith('blad') && rep.resumes > 0;
  if (RESULT_FILE) fs.writeFileSync(keepCheckpoint ? RESULT_FILE + '.err' : RESULT_FILE, JSON.stringify(rep, null, 2));
}

main().catch(e => { console.error('[meas] FATAL', e); process.exit(1); });
