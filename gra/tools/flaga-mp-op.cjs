'use strict';
/**
 * flaga-mp-op.cjs — sterownik pomiaru OPERATORA
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 *
 * Ten sam sterownik uruchamiany PRZED i PO naprawie — jedyna roznica miedzy przebiegami
 * jest w zrodle gry, nie w sterowniku. Scenariusz „aktywny": gracz zaklada miasto, kupuje
 * zwiadowce i wlacza im „Zwiedzaj" (akcje dostepne w UI), wiec gra sama eksploruje mape
 * i realnie nawiazuje kontakty dyplomatyczne.
 *
 * Uruchomienie (z gra/):
 *   node tools/flaga-mp-op.cjs --seeds 111,505,606 --turns 45 \
 *     --out /tmp/flaga-op-przed --dist /tmp/civ-dist-flaga-op-h
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '111').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '45'), 10);
const OUT_DIR = path.resolve(argOf('--out', '/tmp/flaga-op-out'));
const DIST = path.resolve(argOf('--dist', '/tmp/civ-flaga-op-h'));
const SKIP_BUILD = process.argv.includes('--skip-build');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function build() {
  console.log('[flg] vite build -> ' + DIST);
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build',
    '--config', 'tools/flaga-mp-op.vite.config.ts',
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
  await page.waitForFunction(() => window.__flg && window.__flg.ready, { timeout: 120000 });

  await page.evaluate(s => window.__flg.start(s, {}), seed);
  await page.waitForFunction(
    () => !window.__flg.blockers().awaitingFirstCity || window.__flg.tick().turn >= 1,
    { timeout: 60000 },
  ).catch(() => {});
  const founded = await page.evaluate(() => window.__flg.foundFirstCity());

  let exploreEnabled = 0;
  await page.evaluate(() => window.__flg.recruitScout());
  exploreEnabled += await page.evaluate(() => window.__flg.enableExplore());

  const snaps = [await page.evaluate(() => window.__flg.snap())];
  let unblockCount = 0;

  for (let i = 0; i < TURNS; i++) {
    await page.evaluate(() => window.__flg.recruitScout());
    exploreEnabled += await page.evaluate(() => window.__flg.enableExplore());
    const b = await page.evaluate(() => window.__flg.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle || b.endTurnInProgress) {
      await page.evaluate(() => window.__flg.unblock());
      unblockCount++;
    }
    if (b.gameOver) break;
    await page.evaluate(() => window.__flg.endTurn());
    const before = snaps[snaps.length - 1].t;
    let ok = false;
    for (let w = 0; w < 300; w++) {
      const t = await page.evaluate(() => window.__flg.tick());
      if (!t.endTurnInProgress && t.turn > before) { ok = true; break; }
      if (t.gameOver) { ok = true; break; }
      await wait(100);
    }
    if (!ok) { await page.evaluate(() => window.__flg.unblock()); unblockCount++; }
    snaps.push(await page.evaluate(() => window.__flg.snap()));
  }

  await page.close();
  return { seed, turns: TURNS, founded, exploreEnabled, unblockCount, errors: errors.slice(0, 10), ms: Date.now() - t0, snaps };
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
 * GLOWNA CYWILIZACJA = owner, ktory NIGDY (w calym przebiegu) nie byl w
 * simplifiedDiplomacyOwners ani typCityCopyOwners. Te dwa zbiory sa nadawane przy spawnie
 * i nie zmieniaja sie w trakcie gry, wiec to stabilna, niezalezna od naprawy definicja.
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
    const majorAt = (snap) => snap.owners.filter(o => cls.major.includes(o.o));
    const mpAt = (snap) => snap.owners.filter(o => cls.mp.includes(o.o));
    const row = {
      seed: r.seed,
      turnsReached: last.t,
      founded: r.founded,
      exploreEnabled: r.exploreEnabled,
      unblockCount: r.unblockCount,
      majorOwners: cls.major,
      mpOwners: cls.mp,
      // KRYTERIUM 1/2 — pomiar w turze 20.
      t20: {
        turn: s20.t,
        majorFlaggedAsCityState: majorAt(s20).filter(o => o.isCS).map(o => o.o),
        majorCount: majorAt(s20).length,
        mpFlaggedAsCityState: mpAt(s20).filter(o => o.isCS && !o.elim).map(o => o.o),
        mpAliveCount: mpAt(s20).filter(o => !o.elim).length,
        majorInPowerRanking: majorAt(s20).filter(o => o.power).map(o => o.o),
        majorPortraitForcedCulture: majorAt(s20).filter(o => o.portrait).map(o => o.o),
        majorCsCities: majorAt(s20).filter(o => o.csCities > 0).map(o => o.o + ':' + o.csCities),
      },
      // KRYTERIUM 1/2 — ten sam pomiar na koniec przebiegu.
      tEnd: {
        turn: last.t,
        majorFlaggedAsCityState: majorAt(last).filter(o => o.isCS).map(o => o.o),
        mpFlaggedAsCityState: mpAt(last).filter(o => o.isCS && !o.elim).map(o => o.o),
        mpAliveCount: mpAt(last).filter(o => !o.elim).length,
        majorInPowerRanking: majorAt(last).filter(o => o.power).map(o => o.o),
        majorPortraitForcedCulture: majorAt(last).filter(o => o.portrait).map(o => o.o),
      },
      // Pierwsza tura, w ktorej GLOWNA cywilizacja zostaje uznana za miasto-panstwo.
      firstMajorFlagTurn: (() => {
        const out = {};
        for (const s of r.snaps) {
          for (const o of s.owners) {
            if (!cls.major.includes(o.o)) continue;
            if (o.isCS && out[o.o] == null) out[o.o] = { turn: s.t, csCities: o.csCities };
          }
        }
        return out;
      })(),
      // KRYTERIUM 3 — realne wypowiedzenia wojny.
      declarations: decl,
      declCount: decl.length,
      declAiVsAi: decl.filter(d => !d.pair.startsWith('0x') && !d.pair.endsWith('x0')).length,
      csCityIdsFinal: last.csCityIds,
      errors: r.errors,
      ms: r.ms,
    };
    summary.push(row);
    fs.writeFileSync(path.join(OUT_DIR, 'flg-seed-' + seed + '.json'), JSON.stringify(r));
    fs.writeFileSync(path.join(OUT_DIR, 'flg-podsumowanie.json'), JSON.stringify(summary, null, 2));
    console.log('[flg] seed=' + seed + ' tura=' + row.turnsReached
      + ' glowneAI=' + JSON.stringify(row.majorOwners)
      + ' MP=' + JSON.stringify(row.mpOwners)
      + ' | T20 glowneOznaczoneJakoMP=' + JSON.stringify(row.t20.majorFlaggedAsCityState)
      + ' T20 realneMPnadalMP=' + JSON.stringify(row.t20.mpFlaggedAsCityState) + '/' + row.t20.mpAliveCount
      + ' T20 glowneWrankingu=' + JSON.stringify(row.t20.majorInPowerRanking)
      + ' T20 glownePortretKultury=' + JSON.stringify(row.t20.majorPortraitForcedCulture)
      + ' | wypowiedzenia=' + row.declCount + ' (AIvsAI ' + row.declAiVsAi + ')'
      + ' ' + Math.round(row.ms / 1000) + 's');
  }
  await browser.close();
  console.log('[flg] gotowe -> ' + OUT_DIR);
})().catch(e => { console.error('[flg] BLAD:', e); process.exit(1); });
