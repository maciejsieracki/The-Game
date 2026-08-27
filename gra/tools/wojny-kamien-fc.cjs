'use strict';
/**
 * wojny-kamien-fc.cjs — HARNESS FINAL CONTROL (trzecia niezalezna reprodukcja)
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1
 *
 * Dwa scenariusze na to samo ziarno:
 *   pasywny — gracz zaklada miasto i tylko konczy tury (sterownik obu poprzednich rol);
 *   aktywny — gracz dodatkowo wlacza "Zwiedzaj" na zwiadowcach (akcja z UI),
 *             wiec gra sama eksploruje i realnie nawiazuje kontakty dyplomatyczne.
 *
 * Uruchomienie (z gra/):
 *   node tools/wojny-kamien-fc.cjs --seeds 111,505,606 --turns 60 --mode aktywny --out <kat>
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
const TURNS = parseInt(argOf('--turns', '60'), 10);
const MODE = argOf('--mode', 'aktywny');            // aktywny | pasywny
const DIFF = argOf('--difficulty', '');             // '' = domyslna z buildParams
const OUT_DIR = path.resolve(argOf('--out', '/tmp/fc-wojny-out'));
const DIST = path.resolve(argOf('--dist', '/tmp/civ-fc-wojny'));
const SKIP_BUILD = process.argv.includes('--skip-build');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function build() {
  console.log('[fc] vite build -> ' + DIST);
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build',
    '--config', 'tools/wojny-kamien-fc.vite.config.ts',
    '--outDir', DIST, '--emptyOutDir'], { cwd: GRA, stdio: 'inherit' });
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto('file://' + path.join(DIST, 'index.html'));
  await page.waitForFunction(() => (window).__fc && (window).__fc.ready, { timeout: 120000 });

  const extra = DIFF ? { difficulty: DIFF } : {};
  await page.evaluate(([s, e]) => (window).__fc.start(s, e), [seed, extra]);
  await page.waitForFunction(() => !(window).__fc.blockers().awaitingFirstCity
    || (window).__fc.tick().turn >= 1, { timeout: 60000 }).catch(() => {});
  const founded = await page.evaluate(() => (window).__fc.foundFirstCity());

  let exploreEnabled = 0;
  const prodLog = [];
  if (MODE === 'aktywny') {
    prodLog.push({ t: 0, q: await page.evaluate(() => (window).__fc.queueScout()) });
    exploreEnabled += await page.evaluate(() => (window).__fc.enableExplore());
  }

  const snaps = [];
  let unblockCount = 0;
  snaps.push(await page.evaluate(() => (window).__fc.snap()));

  for (let i = 0; i < TURNS; i++) {
    // Gracz aktywny wlacza "Zwiedzaj" takze na zwiadowcach zbudowanych pozniej.
    if (MODE === 'aktywny') {
      const q = await page.evaluate(() => (window).__fc.queueScout());
      const n = await page.evaluate(() => (window).__fc.enableExplore());
      exploreEnabled += n;
      if (n > 0 || (q !== 'already' && q !== prodLog[prodLog.length - 1].q)) {
        prodLog.push({ t: snaps[snaps.length - 1].t, q, enabled: n });
      }
    }
    const b = await page.evaluate(() => (window).__fc.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle || b.endTurnInProgress) {
      await page.evaluate(() => (window).__fc.unblock());
      unblockCount++;
    }
    if (b.gameOver) break;
    await page.evaluate(() => (window).__fc.endTurn());
    const before = snaps[snaps.length - 1].t;
    let ok = false;
    for (let w = 0; w < 300; w++) {
      const t = await page.evaluate(() => (window).__fc.tick());
      if (!t.endTurnInProgress && t.turn > before) { ok = true; break; }
      if (t.gameOver) { ok = true; break; }
      await wait(100);
    }
    if (!ok) {
      await page.evaluate(() => (window).__fc.unblock());
      unblockCount++;
    }
    snaps.push(await page.evaluate(() => (window).__fc.snap()));
  }

  await page.close();
  return {
    seed, mode: MODE, difficulty: DIFF || 'domyslna', turns: TURNS,
    founded, exploreEnabled, unblockCount, prodLog, errors: errors.slice(0, 10),
    ms: Date.now() - t0, snaps,
  };
}

/** Wypowiedzenia wojny = pary, ktore pojawily sie w warPairs miedzy turami. */
function declarations(snaps) {
  const out = [];
  for (let i = 1; i < snaps.length; i++) {
    const prev = new Set(snaps[i - 1].warPairs);
    for (const p of snaps[i].warPairs) if (!prev.has(p)) out.push({ turn: snaps[i].t, pair: p });
  }
  return out;
}

function layerCensus(snaps) {
  const c = { full: 0, simplified: 0, pre_contact: 0 };
  for (const s of snaps) for (const o of s.owners) if (o.layer) c[o.layer] = (c[o.layer] || 0) + 1;
  return c;
}

/** Pierwsza tura, w ktorej dany owner ma isCS=true mimo ze nie jest simpl/typCopy. */
function csFlip(snaps) {
  const flips = {};
  for (const s of snaps) {
    for (const o of s.owners) {
      if (o.o <= 0 || o.simpl || o.typCopy) continue;
      if (o.isCS && flips[o.o] == null) flips[o.o] = { turn: s.t, cities: o.cities, csCities: o.csCities };
    }
  }
  return flips;
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
    const last = r.snaps[r.snaps.length - 1];
    const decl = declarations(r.snaps);
    const row = {
      seed: r.seed, mode: r.mode, difficulty: r.difficulty,
      turnsReached: last.t, snaps: r.snaps.length,
      founded: r.founded, exploreEnabled: r.exploreEnabled, unblockCount: r.unblockCount,
      prodLog: r.prodLog,
      plrUnitsFinal: last.plrUnits, scoutsFinal: last.scouts.length,
      declarations: decl,
      declCount: decl.length,
      declWithPlayer: decl.filter(d => d.pair.startsWith('0x') || d.pair.endsWith('x0')).length,
      mainAiCount: last.owners.filter(o => o.o > 0 && !o.simpl && !o.typCopy && !o.elim).length,
      contactsFinal: last.contacts,
      contactsMainAiFinal: last.contacts.filter(oid => {
        const o = last.owners.find(x => x.o === oid);
        return o && !o.simpl && !o.typCopy;
      }),
      layerCensus: layerCensus(r.snaps),
      csFlip: csFlip(r.snaps),
      stonePendingMax: Math.max(...r.snaps.map(s => s.stonePending.length)),
      warEventsFinal: last.warEvents.length,
      panelPlayerFinal: last.panelPlayer.length,
      panelOthersFinal: last.panelOthers.length,
      errors: r.errors,
      ms: r.ms,
    };
    summary.push(row);
    const tag = r.mode + '-' + (r.difficulty === 'domyslna' ? 'dom' : r.difficulty) + '-seed-' + seed;
    fs.writeFileSync(path.join(OUT_DIR, 'fc-' + tag + '.json'), JSON.stringify(r));
    fs.writeFileSync(path.join(OUT_DIR, 'fc-podsumowanie.json'), JSON.stringify(summary, null, 2));
    console.log('[fc] ' + tag + ': tura=' + row.turnsReached
      + ' wypowiedzenia=' + row.declCount + ' (z graczem ' + row.declWithPlayer + ')'
      + ' kontakty=' + JSON.stringify(row.contactsFinal)
      + ' kontaktyGlowneAI=' + JSON.stringify(row.contactsMainAiFinal)
      + ' warstwy=' + JSON.stringify(row.layerCensus)
      + ' csFlip=' + JSON.stringify(row.csFlip)
      + ' zwiadRozkazy=' + row.exploreEnabled
      + ' unblock=' + row.unblockCount
      + ' ' + Math.round(row.ms / 1000) + 's');
  }
  await browser.close();
  console.log('[fc] gotowe -> ' + OUT_DIR);
})().catch(e => { console.error('[fc] BLAD:', e); process.exit(1); });
