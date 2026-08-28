'use strict';
/**
 * flaga-mp-ev.cjs — NIEZALEZNY sterownik pomiaru EVALUATORA
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 *
 * Ten sam sterownik i ta sama konfiguracja uruchamiane PRZED (origin/main) i PO (galaz
 * tematu). Jedyna roznica miedzy przebiegami jest w ZRODLE GRY.
 *
 * Metoda inna niz u Operatora — patrz naglowek `flaga-mp-ev.vite.config.ts`:
 *  - ZDARZENIA PRZEJECIA liczone z diffu `cityRows` miedzy turami (id -> owner, cs),
 *    a nie z migawki agregatu w turze 20. Dla kazdego zdarzenia „miasto z flaga MP
 *    zmienilo wlasciciela" sprawdzamy, czy flaga zgasla.
 *  - LEDGER `wypowiedz_wojne` raw-vs-layered — niezalezne sprawdzenie blokera warstwy.
 *
 * Uruchomienie (z gra/):
 *   node tools/flaga-mp-ev.cjs --seeds 202,303,404,606 --turns 46 \
 *     --out /tmp/flaga-ev-po --dist /tmp/civ-dist-flaga-ev-h
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '202').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '46'), 10);
const OUT_DIR = path.resolve(argOf('--out', '/tmp/flaga-ev-out'));
const DIST = path.resolve(argOf('--dist', '/tmp/civ-flaga-ev-h'));
const SKIP_BUILD = process.argv.includes('--skip-build');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function build() {
  console.log('[ev] vite build -> ' + DIST);
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build',
    '--config', 'tools/flaga-mp-ev.vite.config.ts',
    '--outDir', DIST, '--emptyOutDir'], { cwd: GRA, stdio: 'inherit' });
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  await page.goto('file://' + path.join(DIST, 'index.html'));
  await page.waitForFunction(() => window.__ev && window.__ev.ready, { timeout: 120000 });

  await page.evaluate(s => window.__ev.start(s, {}), seed);
  await page.waitForFunction(
    () => !window.__ev.blockers().awaitingFirstCity || window.__ev.tick().turn >= 1,
    { timeout: 60000 },
  ).catch(() => {});
  const founded = await page.evaluate(() => window.__ev.foundFirstCity());

  let exploreEnabled = 0;
  await page.evaluate(() => window.__ev.recruitScout());
  exploreEnabled += await page.evaluate(() => window.__ev.enableExplore());

  const snaps = [await page.evaluate(() => window.__ev.snap())];
  const cmdLog = [];
  let unblockCount = 0;

  for (let i = 0; i < TURNS; i++) {
    await page.evaluate(() => window.__ev.recruitScout());
    exploreEnabled += await page.evaluate(() => window.__ev.enableExplore());
    const b = await page.evaluate(() => window.__ev.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle || b.endTurnInProgress) {
      await page.evaluate(() => window.__ev.unblock());
      unblockCount++;
    }
    if (b.gameOver) break;
    await page.evaluate(() => window.__ev.endTurn());
    const before = snaps[snaps.length - 1].t;
    let ok = false;
    for (let w = 0; w < 300; w++) {
      const t = await page.evaluate(() => window.__ev.tick());
      if (!t.endTurnInProgress && t.turn > before) { ok = true; break; }
      if (t.gameOver) { ok = true; break; }
      await wait(100);
    }
    if (!ok) { await page.evaluate(() => window.__ev.unblock()); unblockCount++; }
    for (const e of await page.evaluate(() => window.__ev.drainCmdLog())) cmdLog.push(e);
    snaps.push(await page.evaluate(() => window.__ev.snap()));
  }

  await page.close();
  return { seed, founded, exploreEnabled, unblockCount, errors: errors.slice(0, 10), ms: Date.now() - t0, snaps, cmdLog };
}

/**
 * ZDARZENIA PRZEJECIA MIASTA, liczone WYLACZNIE z diffu migawek — sterownik nie wie nic
 * o `clearCityStateFlagOnCapture`. Dla kazdej pary kolejnych tur szukamy miast, ktore
 * zmienily `owner`; zapisujemy flage MP przed i po zmianie.
 */
function captureEvents(snaps) {
  const evs = [];
  for (let i = 1; i < snaps.length; i++) {
    const prev = new Map(snaps[i - 1].cityRows.map(c => [c.id, c]));
    for (const cur of snaps[i].cityRows) {
      const p = prev.get(cur.id);
      if (!p || p.o === cur.o) continue;
      evs.push({ turn: snaps[i].t, id: cur.id, from: p.o, to: cur.o, csBefore: p.cs, csAfter: cur.cs });
    }
  }
  return evs;
}

/** Nowe pary ze statusem `wojna` miedzy kolejnymi turami = wypowiedzenia wojny. */
function declarations(snaps) {
  const out = [];
  for (let i = 1; i < snaps.length; i++) {
    const prev = new Set(snaps[i - 1].warPairs);
    for (const p of snaps[i].warPairs) if (!prev.has(p)) out.push({ turn: snaps[i].t, pair: p });
  }
  return out;
}

/**
 * GLOWNA CYWILIZACJA (AI CYWILIZACJI, nie AI GRACZA) = owner > 0, ktory w PIERWSZEJ
 * migawce nie nalezy ani do `simplifiedDiplomacyOwners`, ani do `typCityCopyOwners`.
 * Oba zbiory sa nadawane przy spawnie i naprawa ich nie dotyka, wiec klasyfikacja jest
 * niezalezna od mierzonej zmiany i identyczna w PRZED i PO.
 */
function classify(snaps) {
  const everMp = new Set();
  const seen = new Set();
  for (const s of snaps) {
    for (const o of s.owners) {
      if (o.o <= 0) continue;
      seen.add(o.o);
      if (o.simpl || o.typCopy) everMp.add(o.o);
    }
  }
  return { major: [...seen].filter(o => !everMp.has(o)).sort((a, b) => a - b), mp: [...everMp].sort((a, b) => a - b) };
}

function atTurn(snaps, t) {
  let best = null;
  for (const s of snaps) if (s.t <= t && (!best || s.t > best.t)) best = s;
  return best || snaps[snaps.length - 1];
}

(async () => {
  if (!SKIP_BUILD) build();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  } catch (e) {
    browser = await chromium.launch({
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--allow-file-access-from-files'],
    });
  }
  const summary = [];
  for (const seed of SEEDS) {
    const r = await runSeed(browser, seed);
    const cls = classify(r.snaps);
    const s20 = atTurn(r.snaps, 20);
    const last = r.snaps[r.snaps.length - 1];
    const decl = declarations(r.snaps);
    const caps = captureEvents(r.snaps);
    const majorAt = (snap) => snap.owners.filter(o => cls.major.includes(o.o));
    const mpAt = (snap) => snap.owners.filter(o => cls.mp.includes(o.o));
    // Przejecia miasta, ktore PRZED zmiana wlasciciela nioslo flage MP.
    const capsMp = caps.filter(e => e.csBefore);
    const capsMpToMajor = capsMp.filter(e => cls.major.includes(e.to));
    // Ledger komend: ile `wypowiedz_wojne` powstalo i ile przezylo filtr warstwy.
    const cmdRaw = r.cmdLog.reduce((a, e) => a + e.raw.length, 0);
    const cmdLay = r.cmdLog.reduce((a, e) => a + e.lay.length, 0);
    const cmdByLayer = {};
    for (const e of r.cmdLog) {
      const k = e.layer;
      cmdByLayer[k] = cmdByLayer[k] || { raw: 0, lay: 0 };
      cmdByLayer[k].raw += e.raw.length;
      cmdByLayer[k].lay += e.lay.length;
    }
    const row = {
      seed: r.seed,
      turnsReached: last.t,
      founded: r.founded,
      exploreEnabled: r.exploreEnabled,
      unblockCount: r.unblockCount,
      majorOwners: cls.major,
      mpOwners: cls.mp,
      t20: {
        turn: s20.t,
        majorFlaggedAsCityState: majorAt(s20).filter(o => o.isCS).map(o => o.o),
        majorCount: majorAt(s20).length,
        mpStillFlagged: mpAt(s20).filter(o => o.isCS && !o.elim).map(o => o.o),
        mpAlive: mpAt(s20).filter(o => !o.elim).map(o => o.o),
        majorInPowerRanking: majorAt(s20).filter(o => o.pow).map(o => o.o),
        majorPortraitForcedCulture: majorAt(s20).filter(o => o.por).map(o => o.o),
      },
      tEnd: {
        turn: last.t,
        majorFlaggedAsCityState: majorAt(last).filter(o => o.isCS).map(o => o.o),
        mpStillFlagged: mpAt(last).filter(o => o.isCS && !o.elim).map(o => o.o),
        mpAlive: mpAt(last).filter(o => !o.elim).map(o => o.o),
        majorInPowerRanking: majorAt(last).filter(o => o.pow).map(o => o.o),
        majorPortraitForcedCulture: majorAt(last).filter(o => o.por).map(o => o.o),
      },
      // === SEDNO: zdarzenia przejecia miasta niosacego flage MP ===
      captureEventsTotal: caps.length,
      captureOfMpCityTotal: capsMp.length,
      captureOfMpCityFlagStayedOn: capsMp.filter(e => e.csAfter).length,
      captureOfMpCityFlagWentOff: capsMp.filter(e => !e.csAfter).length,
      captureOfMpCityByMajor: capsMpToMajor.length,
      captureOfMpCityByMajorFlagStayedOn: capsMpToMajor.filter(e => e.csAfter).length,
      captureEventsMp: capsMp,
      declarations: decl,
      declCount: decl.length,
      declAiVsAi: decl.filter(d => !d.pair.startsWith('0x') && !d.pair.endsWith('x0')).length,
      cmdWarRaw: cmdRaw,
      cmdWarLayered: cmdLay,
      cmdByLayer,
      stonePendingEver: [...new Set(r.snaps.flatMap(s => s.stonePending))].sort((a, b) => a - b),
      stonePendingFirstTurn: (r.snaps.find(s => s.stonePending.length > 0) || {}).t ?? null,
      stoneActiveFinal: last.stoneActive,
      errors: r.errors,
      ms: r.ms,
    };
    summary.push(row);
    fs.writeFileSync(path.join(OUT_DIR, 'ev-seed-' + seed + '.json'), JSON.stringify(r));
    fs.writeFileSync(path.join(OUT_DIR, 'ev-podsumowanie.json'), JSON.stringify(summary, null, 2));
    console.log('[ev] seed=' + seed + ' tura=' + row.turnsReached
      + ' glowneAI=' + JSON.stringify(row.majorOwners) + ' MP=' + JSON.stringify(row.mpOwners)
      + '\n     T20 glowneOznaczoneJakoMP=' + JSON.stringify(row.t20.majorFlaggedAsCityState)
      + ' realneMPnadalMP=' + JSON.stringify(row.t20.mpStillFlagged) + ' z ' + JSON.stringify(row.t20.mpAlive)
      + ' ranking=' + JSON.stringify(row.t20.majorInPowerRanking)
      + ' portretKultury=' + JSON.stringify(row.t20.majorPortraitForcedCulture)
      + '\n     przejeciaMiastMP=' + row.captureOfMpCityTotal
      + ' (flagaZOSTALA=' + row.captureOfMpCityFlagStayedOn + ', ZGASLA=' + row.captureOfMpCityFlagWentOff + ')'
      + ' przezGlowneAI=' + row.captureOfMpCityByMajor + ' (zostala=' + row.captureOfMpCityByMajorFlagStayedOn + ')'
      + '\n     wypowiedzenia=' + row.declCount + ' (AIvsAI ' + row.declAiVsAi + ')'
      + ' komendyWojny raw=' + row.cmdWarRaw + ' poFiltrze=' + row.cmdWarLayered
      + ' ' + JSON.stringify(row.cmdByLayer)
      + '\n     stonePendingEver=' + JSON.stringify(row.stonePendingEver)
      + ' odTury=' + row.stonePendingFirstTurn
      + ' stoneActive=' + JSON.stringify(row.stoneActiveFinal)
      + ' bledyStrony=' + row.errors.length + ' ' + Math.round(row.ms / 1000) + 's');
  }
  await browser.close();
  console.log('[ev] gotowe -> ' + OUT_DIR);
})().catch(e => { console.error('[ev] BLAD:', e); process.exit(1); });
