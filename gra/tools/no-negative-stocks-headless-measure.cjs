'use strict';
/**
 * no-negative-stocks-headless-measure.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (C3).
 *
 * POMIAR PEŁNEJ GRY (realny bundle vite, headless Chromium, `?civTest=1`, realne „Zakończ turę”, realny
 * nnsAiPreTickBalance z main.ts). Kryterium (a): od tury 11 skarbiec i spichlerz każdej AI >= 0 po każdej turze;
 * (b) żadna cywilizacja nie jest eliminowana przez samo równoważenie; (d) mutacja pomiarowa — ten sam pomiar
 * z flagą równoważenia WYŁĄCZONĄ (`--modes on,off`) musi pokazać minusy.
 *
 * Co jest „spichlerzem po turze”: stan `zapasyPanstwa` jest po ticku ZAWSZE klamrowany do >= 0, więc ujemny
 * spichlerz widać tylko jako surową wartość przed klamrą (spichlerzStolicy - kosztArmii = `spichRaw`) i flagę
 * `glod` (glodWojska) — runner liczy naruszenie, gdy spichRaw < 0 (równoważnie glod === true).
 * Skarbiec: min(wartość po bankowaniu ticku, wartość po całej turze AI).
 *
 * WZNAWIALNY: komórka (tryb × ziarno) zapisuje punkt kontrolny co 10 tur oraz przy limicie czasu
 * (`--cell-sec`, łączny limit jednego wywołania; domyślnie 480 s < 590 s bash). Przy limicie runner robi
 * quickSave do slotu w trwałym profilu Chromium (`<out>/profile-<tryb>-<ziarno>`) i kończy; kolejne wywołanie
 * z tymi samymi argumentami wczytuje slot i kontynuuje. Ukończona komórka (`done: true`) jest pomijana.
 *
 * Użycie (z gra/; bundle budowany OSOBNO poza repo: node ./node_modules/vite/bin/vite.js build --outDir <dist>):
 *   node tools/no-negative-stocks-headless-measure.cjs --dist <dist> --out <katalog> \
 *        [--seeds 11,22,33] [--turns 150] [--civ-types 15] [--city-states 2] [--map Standardowy] \
 *        [--modes on,off] [--cell-sec 480]
 * Wynik: <out>/cell-<tryb>-<ziarno>.json (surowe wiersze per tura per AI + wyjątki + czasy) oraz
 *        <out>/summary.json (agregat, `node tools/no-negative-stocks-headless-measure.cjs --summarize <out>`).
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SLOT = 'nns-cell';
const NNS_FREE_TURNS = 10;

/** Agregacja komórek -> summary (czysta, bez przeglądarki; używana też przez --summarize). */
function summarize(outDir) {
  const files = fs.readdirSync(outDir).filter(f => /^cell-.*\.json$/.test(f)).sort();
  const cells = files.map(f => JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8')));
  const sum = { cells: [], violationsByMode: {}, totalRowsByMode: {}, eliminations: [], msPerTurn: {} };
  for (const c of cells) {
    const rows = c.rows || [];
    const checked = rows.filter(r => r.turn > NNS_FREE_TURNS);
    const viol = checked.filter(r => r.sk < 0 || r.spichRaw < 0 || r.glod);
    // klasyfikacja: ciągły dług (poprzednia tura tego właściciela też < 0 — w tym dług z tur wolnych 1-10, którego jedna tura
    // równoważenia nie spłaci) vs nowy minus (poprzednia tura >= 0 — realny błąd równoważenia / rozjazd projekcji)
    const byOwnerTurn = new Map();
    for (const r of rows) byOwnerTurn.set(r.oid + ':' + r.turn, r);
    const bad = r => r.sk < 0 || r.spichRaw < 0 || r.glod;
    const newOnsets = [];
    let carried = 0;
    for (const r of viol) {
      const prev = byOwnerTurn.get(r.oid + ':' + (r.turn - 1));
      if (prev && bad(prev)) carried++;
      else {
        const ex = (c.exceptions || []).find(e => e.turn === r.turn && e.oid === r.oid);
        newOnsets.push({ turn: r.turn, oid: r.oid, civ: r.civ, cityState: r.cs, sk: r.sk, spichRaw: r.spichRaw, glod: r.glod, przyczyna: ex ? ex.przyczyna : 'brak wpisu' });
      }
    }
    const chainMax = {};
    for (const r of viol) { const k = r.oid; (chainMax[k] = chainMax[k] || []).push(r.turn); }
    const longestChain = Math.max(0, ...Object.values(chainMax).map(ts => { let best = 1, cur = 1; for (let i = 1; i < ts.length; i++) { cur = ts[i] === ts[i - 1] + 1 ? cur + 1 : 1; if (cur > best) best = cur; } return best; }));
    sum.cells.push({
      mode: c.mode, seed: c.seed, done: !!c.done, turnsRun: c.turnsRun, ownersMajor: c.ownersMajor, ownersCityState: c.ownersCityState,
      rowsChecked: checked.length, violations: viol.length, carriedDebtViolations: carried, newOnsetViolations: newOnsets.length, newOnsets, longestChainTurns: longestChain,
      partial: !!c.partial, stoppedBy: c.stoppedBy || null, playerRefounds: c.playerRefounds || 0,
      violTreasury: checked.filter(r => r.sk < 0).length, violGranary: checked.filter(r => r.spichRaw < 0 || r.glod).length,
      minTreasury: checked.length ? Math.min(...checked.map(r => r.sk)) : null,
      minGranaryRaw: checked.length ? Math.min(...checked.map(r => r.spichRaw)) : null,
      exceptions: (c.exceptions || []).length, eliminated: (c.eliminated || []).length,
      balanceActions: c.balanceActions || {}, avgPreTickMs: c.avgPreTickMs, maxPreTickMs: c.maxPreTickMs, avgTurnMs: c.avgTurnMs,
    });
    sum.violationsByMode[c.mode] = (sum.violationsByMode[c.mode] || 0) + viol.length;
    sum.totalRowsByMode[c.mode] = (sum.totalRowsByMode[c.mode] || 0) + checked.length;
    for (const e of (c.eliminated || [])) sum.eliminations.push({ mode: c.mode, seed: c.seed, ...e });
  }
  return sum;
}

if (process.argv.includes('--summarize')) {
  const out = process.argv[process.argv.indexOf('--summarize') + 1];
  const s = summarize(out);
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(s, null, 2));
  console.log(JSON.stringify(s, null, 2));
  process.exit(0);
}

const DIST = arg('dist');
const OUT = arg('out');
const SEEDS = arg('seeds', '11,22,33').split(',').map(x => parseInt(x, 10));
const TURNS = parseInt(arg('turns', '150'), 10);
const CIV_TYPES = parseInt(arg('civ-types', '15'), 10);
const CITY_STATES = parseInt(arg('city-states', '2'), 10);
const MAP = arg('map', 'Standardowy');
const MODES = arg('modes', 'on,off').split(',');
const CELL_SEC = parseInt(arg('cell-sec', '480'), 10);
const T0 = Date.now();
const timeUp = () => Date.now() - T0 > CELL_SEC * 1000;

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist <bundle> --out <katalog>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { console.error('[nns] playwright nie znaleziony (uruchom z gra/).'); process.exit(1); }
  for (const mode of MODES) {
    for (const seed of SEEDS) {
      if (timeUp()) { console.log('[nns] limit czasu wywołania — wznów tym samym poleceniem'); return; }
      const cellFile = path.join(OUT, `cell-${mode}-${seed}.json`);
      let prior = null;
      if (fs.existsSync(cellFile)) { try { prior = JSON.parse(fs.readFileSync(cellFile, 'utf8')); } catch (_) { prior = null; } }
      if (prior && prior.done) { console.log(`[nns] ${mode}/${seed} gotowa — pomijam`); continue; }
      await runCell(chromium, mode, seed, cellFile, prior);
    }
  }
}

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: FALLBACK_CHROME });
  }
}

async function clearBlockers(page) {
  // oferta handlowa AI czekająca na decyzję gracza blokuje koniec tury (założenie pomiaru: gracz nie reaguje -> odrzuć)
  try {
    const rej = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug; if (!h) return 0;
      if (window.__nnsMeasureDebug.canEnd()) return 0;
      const st = h.state(); let n = 0;
      for (const p of (st.pending || [])) { h.reject(p.id); n++; }
      return n;
    });
    if (rej > 0) await wait(100);
  } catch (_) { /* hak niedostępny */ }
  // okna bitwy / podsumowania blokujące koniec tury (hak __aiTradeWiringTestDebug jest za ?civTest=1)
  for (let k = 0; k < 12; k++) {
    const bs = await page.evaluate(() => (window.__aiTradeWiringTestDebug ? window.__aiTradeWiringTestDebug.battleState() : null));
    if (!bs || (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving)) break;
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

async function endTurnOnce(page) {
  return page.evaluate(() => new Promise(resolve => {
    const h = window.__nnsMeasureDebug; const t0 = performance.now(); const turn0 = h.snapshot().turn;
    h.endTurn(); let saw = h.isEndTurnInProgress();
    const tick = () => {
      const ip = h.isEndTurnInProgress(); if (ip) saw = true;
      const turn1 = h.snapshot().turn;
      if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ ms: performance.now() - t0, turn0, turn1 }); return; }
      if (performance.now() - t0 > 400000) { resolve({ ms: -1, turn0, turn1 }); return; }
      setTimeout(tick, 5);
    };
    setTimeout(tick, 0);
  }));
}

async function runCell(chromium, mode, seed, cellFile, prior) {
  const balanceOn = mode === 'on';
  const profileDir = path.join(OUT, `profile-${mode}-${seed}`);
  const res = prior && prior.savedSlot ? prior : {
    mode, seed, turns: TURNS, civTypes: CIV_TYPES, cityStates: CITY_STATES, map: MAP, startedAt: new Date().toISOString(),
    rows: [], exceptions: [], eliminated: [], balanceActions: {}, preTickMs: [], turnMs: [], turnsRun: 0,
    cityCountByOwner: {}, ownersMajor: 0, ownersCityState: 0, resumes: 0, errors: [], done: false,
  };
  if (prior && prior.savedSlot) res.resumes = (prior.resumes || 0) + 1;
  const save = () => fs.writeFileSync(cellFile, JSON.stringify(res));
  const ctx = await launch(chromium, profileDir);
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    page.on('pageerror', e => { if (res.errors.length < 8) res.errors.push('[pageerror] ' + String(e).slice(0, 200)); });
    const endBlocks = [];
    page.on('console', m => { const t = m.text(); if (/EndTurn\] blocked/.test(t)) { endBlocks.push(t.slice(0, 160)); if (endBlocks.length > 5) endBlocks.shift(); } });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.addInitScript(s0 => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ seed) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + seed, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    if (prior && prior.savedSlot) {
      await page.evaluate(slot => window.__nnsMeasureDebug.loadSlot(slot), SLOT);
      // wczytanie jest asynchroniczne (duża mapa, swiftshader): czekaj na stan „gra w toku” (miasto gracza, brak blokady pierwszego miasta, właściciele AI)
      await page.waitForFunction(() => {
        const h = window.__nnsMeasureDebug;
        return h.snapshot().owners.length > 0;
      }, undefined, { timeout: 300000, polling: 1000 });
      await wait(1500);
      console.log(`[nns] ${mode}/${seed} WZNOWIENIE od tury ${prior.turnsRun + 1}`);
    } else {
      let mapLogged = false;
      page.on('console', m => { if (/\[NewGame\] Mapa/.test(m.text())) mapLogged = true; });
      await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed, mapSize: MAP, civTypes: CIV_TYPES, cityStates: CITY_STATES });
      // generacja świata: log „[NewGame] Mapa” + zniknięcie nakładki „Tworzenie świata” + gotowy start gracza (jak ai-army-all-civs-live-measure)
      let ready = false;
      for (let i = 0; i < 1500 && !ready; i++) {
        await wait(1000);
        if (!mapLogged) continue;
        const st = await page.evaluate(() => {
          const h = window.__nnsMeasureDebug;
          const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
          return { ov, w: h.worldReady(), aw: h.awaitingFirstCity() };
        });
        ready = !st.ov && st.w && st.aw;
      }
      if (!ready) throw new Error('świat nie wygenerowany w limicie');
      if (!(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()))) throw new Error('foundFirstCity() = false');
      await page.waitForFunction(() => window.__nnsMeasureDebug.playerCities() > 0 && !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 60000 });
      await wait(2000);
    }
    await page.evaluate(() => { try { window.__rebelProtectionTestDebug && window.__rebelProtectionTestDebug.disableVictoryCheckForTest(); } catch (_) { /* brak haka */ } });
    await page.evaluate(([bal]) => { const h = window.__nnsMeasureDebug; h.setFast(true); h.setBalance(bal); }, [balanceOn]);
    const flag = await page.evaluate(() => window.__nnsMeasureDebug.isBalance());
    if (flag !== balanceOn) throw new Error('flaga równoważenia nie ustawiona: ' + flag);
    res.balanceFlag = flag;
    const alive = new Map(); // oid -> ostatnia znana liczba miast
    let snap = await page.evaluate(() => window.__nnsMeasureDebug.snapshot());
    for (const o of snap.owners) alive.set(o.oid, o.cities);
    res.ownersMajor = snap.owners.filter(o => !o.cityState).length;
    res.ownersCityState = snap.owners.filter(o => o.cityState).length;
    res.civs = snap.owners.map(o => ({ oid: o.oid, civ: o.civ, cityState: o.cityState }));
    await page.evaluate(() => window.__nnsMeasureDebug.drain());
    let turn = snap.turn;
    while (res.turnsRun < TURNS) {
      if (timeUp()) {
        const ok = await page.evaluate(slot => window.__nnsMeasureDebug.quickSave(slot), SLOT);
        if (!ok) { res.errors.push('quickSave nieudany — brak wznowienia'); save(); break; }
        res.savedSlot = SLOT; res.stoppedBy = 'limit czasu'; save();
        console.log(`[nns] ${mode}/${seed} limit czasu po ${res.turnsRun} turach — zapis slotu; wznów tym samym poleceniem`);
        return;
      }
      // gracz (bierny, jedno miasto) może zostać podbity: gra czeka wtedy na założenie nowego miasta — zakładamy je ponownie,
      // a gdy się nie da, kończymy komórkę z jawną adnotacją (pomiar AI do tej tury jest nadal ważny)
      if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
        let refound = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
        // start gracza zajęty przez AI -> przenieś punkt startu na pierwszy wolny hex (hak pomiarowy, tylko ?civTest=1)
        if (!refound) { const rf = await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere()); refound = rf.ok; if (!rf.ok) res.refoundDiag = rf; }
        await wait(500);
        const still = await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity());
        res.playerRefounds = (res.playerRefounds || 0) + 1;
        if (!refound || still) { res.stoppedBy = 'gracz bez miast i brak możliwości ponownego założenia (tura ' + turn + ')'; res.partial = true; break; }
      }
      await page.evaluate(() => window.__nnsMeasureDebug.grantPlayerGold(5000)); // bramka gracza nie może zatrzymać pomiaru AI
      let r = null;
      for (let retry = 0; ; retry++) {
        await clearBlockers(page);
        r = await endTurnOnce(page);
        if (r.turn1 > r.turn0) break;
        if (retry >= 12) throw new Error('tura nie przechodzi: ' + JSON.stringify(r) + ' blokady=' + JSON.stringify(endBlocks));
        // bramka gracza (NNS, podtemat B): bierny gracz z prognoza < 0 nie moze zakonczyc tury -> wykonaj ruch naprawczy (rozwiaz partie jednostek gracza)
        if (endBlocks.some(t => /NNS/.test(t))) { res.playerGateDisbands = (res.playerGateDisbands || 0) + 3; await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(3)); endBlocks.length = 0; }
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter(x => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300);
      }
      turn = r.turn1; res.turnsRun++; res.turnMs.push(Math.round(r.ms));
      // klucz tury w dziennikach = zmienna `turn` w ticku (== nowa tura r.turn1); NNS wolne dla tur <= 10 tak samo jak w grze
      const ended = r.turn1;
      snap = await page.evaluate(() => window.__nnsMeasureDebug.snapshot());
      const d = await page.evaluate(() => window.__nnsMeasureDebug.drain());
      const bankBy = new Map(); for (const b of d.bank) if (b.turn === ended) bankBy.set(b.oid, b);
      const logBy = new Map(); for (const l of d.log) if (l.turn === ended) logBy.set(l.oid, l);
      const stat = d.stats.find(x => x.turn === ended);
      if (stat) res.preTickMs.push(stat.ms);
      for (const o of snap.owners) {
        const b = bankBy.get(o.oid); const l = logBy.get(o.oid);
        const sk = b ? Math.min(b.skarb, o.treasury) : o.treasury;
        const row = { turn: ended, oid: o.oid, civ: o.civ, cs: o.cityState, sk: Math.round(sk), skBank: b ? Math.round(b.skarb) : null, skEnd: Math.round(o.treasury),
          spichRaw: b && b.spichRaw !== null ? Math.round(b.spichRaw) : 0, glod: b ? b.glod : false, granary: Math.round(o.granary), cities: o.cities, units: o.units };
        res.rows.push(row);
        if (l && l.akcje.length) for (const a of l.akcje) { const k = a.startsWith('rozwiaz') ? 'rozwiaz' : a; res.balanceActions[k] = (res.balanceActions[k] || 0) + 1; }
        if (ended > NNS_FREE_TURNS && (row.sk < 0 || row.spichRaw < 0 || row.glod)) {
          res.exceptions.push({ turn: ended, oid: o.oid, civ: o.civ, cityState: o.cityState, sk: row.sk, spichRaw: row.spichRaw, glod: row.glod,
            przyczyna: l ? (l.wyjatek || (l.hold ? 'po równoważeniu nadal < 0 (rozjazd projekcji vs realny tick lub wydatki AI po bankowaniu): przed=' + l.sk0 + '/' + l.sp0 + ' po=' + l.sk1 + '/' + l.sp1 : 'projekcja >= 0, realny tick < 0 (rozjazd preview vs tick): proj=' + l.sk0 + '/' + l.sp0)) : 'brak wpisu równoważenia (tura < 11 lub właściciel bez miast w projekcji)' });
        }
        alive.set(o.oid, o.cities);
      }
      // eliminacje: właściciel obecny w poprzednim snapshotcie, a teraz bez miast / zniknął
      const nowIds = new Set(snap.owners.map(o => o.oid));
      for (const [oid, c] of [...alive.entries()]) {
        if (!nowIds.has(oid) && c > 0) {
          const recent = res.rows.filter(x => x.oid === oid && x.turn >= ended - 10).length;
          res.eliminated.push({ oid, civ: (res.civs.find(x => x.oid === oid) || {}).civ, cityState: !!(res.civs.find(x => x.oid === oid) || {}).cityState, turn: ended, lastCities: c, rowsLast10: recent });
          alive.delete(oid);
        }
      }
      if (res.turnsRun % 10 === 0) { save(); console.log(`[nns] ${mode}/${seed} T${turn} turn=${Math.round(r.ms)}ms AI=${snap.owners.length} wyjątków=${res.exceptions.length}`); }
    }
    const pm = res.preTickMs;
    res.avgPreTickMs = pm.length ? +(pm.reduce((a, b) => a + b, 0) / pm.length).toFixed(2) : null;
    res.maxPreTickMs = pm.length ? Math.max(...pm) : null;
    res.avgTurnMs = res.turnMs.length ? Math.round(res.turnMs.reduce((a, b) => a + b, 0) / res.turnMs.length) : null;
    // eliminacje a równoważenie: czy właściciel miał rozwiązania/podatek w ostatnich 10 turach — wpisy z drain są zbiorcze w balanceActions
    res.done = res.turnsRun >= TURNS || res.partial === true; delete res.savedSlot; res.finishedAt = new Date().toISOString(); save();
    console.log(`[nns] ${mode}/${seed} KONIEC: tur=${res.turnsRun} wyjątków=${res.exceptions.length} eliminacji=${res.eliminated.length} avgPreTick=${res.avgPreTickMs}ms`);
  } catch (e) {
    res.error = String((e && e.stack) || e).slice(0, 800); save(); console.error('[nns] BŁĄD', mode, seed, res.error);
  } finally {
    await ctx.close().catch(() => {});
    if (res.done) { try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) { /* profil do usunięcia ręcznie */ } }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('[nns] FATAL', e); process.exit(1); });
