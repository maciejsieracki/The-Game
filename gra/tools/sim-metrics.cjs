'use strict';
/**
 * sim-metrics.cjs -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1.
 *
 * Przykładowa symulacja wielu tur na PRAWDZIWEJ grze (headless Chromium, hak ?testhook=1).
 *
 * Użycie (z katalogu gra/):
 *   node tools/sim-metrics.cjs --seeds 101,102 --turns 60 --ai 5 [--cs 2]
 *       [--difficulty normal] [--era kamien] [--policy pass|accept-all-offers|reject-all-offers]
 *       [--flag warRulesMultiwar=true] [--flag warAllInCapital=false] [--no-auto-battles]
 *       [--json]
 *
 * Drukuje tabelę per seed:
 *   wojny przed T40      -- liczba par w stanie „wojna” na końcu tury 39 (lub ostatniej przed nią)
 *   wojny/typ cyw.       -- wojny na koniec przebiegu / typy cywilizacji (AI + gracz = --ai + 1)
*   oferty AI->gracz     -- liczba UNIKALNYCH ofert (po id) w przebiegu
 *   max wojen (przebieg) -- maksimum liczby wojen w przebiegu (podział na epoki: NIE_ZMIERZONO
 *                           w tym skrypcie -- wymaga odczytu epoki per tura, poza zakresem hooka)
 *   oferty AI->gracz     -- suma ofert zgłoszonych w przebiegu; „bilans<0” = liczba ofert z goldOnce<0
 *                           (pełny bilans z diplomacy-ai-offer-balance NIE_ZMIERZONO)
 *   czas tury mediana    -- mediana ms na turę (z hakiem)
 *   hash końcowy         -- FNV-1a stanu gry po ostatniej turze (stabilny, bez ID)
 *
 * Kod wyjścia: 0 gdy przebieg dokończył się bez pageerror i bez TIMEOUT tury; 1 w przeciwnym razie.
 */

const { withSimBundle, launchBrowser, openSimPage, waitForHook, runSim } = require('./lib/game-sim-harness.cjs');

function parseArgs(argv) {
  const a = {
    seeds: [101, 102], turns: 60, ai: 5, cs: 2, difficulty: 'normal', era: 'kamien',
    policy: 'pass', flags: {}, autoBattles: true, json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--seeds') a.seeds = String(v()).split(',').map(Number);
    else if (k === '--turns') a.turns = Number(v());
    else if (k === '--ai') a.ai = Number(v());
    else if (k === '--cs') a.cs = Number(v());
    else if (k === '--difficulty') a.difficulty = v();
    else if (k === '--era') a.era = v();
    else if (k === '--policy') a.policy = v();
    else if (k === '--flag') {
      const [name, raw] = String(v()).split('=');
      a.flags[name] = raw === 'null' ? null : raw === 'true' ? true : raw === 'false' ? false : raw;
    }
    else if (k === '--no-auto-battles') a.autoBattles = false;
    else if (k === '--json') a.json = true;
    else throw new Error('sim-metrics: nieznana opcja ' + k);
  }
  if (a.seeds.some(s => !Number.isInteger(s) || s <= 0)) throw new Error('sim-metrics: seedy muszą być dodatnimi liczbami całkowitymi');
  return a;
}

function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Agregat zapasów AI co 10 tur (R-WEB-AI-ARMY-UPKEEP-Q1): wojsko, skarbiec, żywność, głód, deficyt złota. */
function aiEconByTurn(metrics) {
  const out = [];
  for (const t of metrics) {
    if (t.turn % 10 !== 0 || !Array.isArray(t.ownerEcon)) continue;
    const ai = t.ownerEcon.filter(o => !o.human);
    if (!ai.length) continue;
    const n = ai.length;
    out.push({
      turn: t.turn,
      aiCount: n,
      militaryPerAi: +(ai.reduce((a, o) => a + o.militaryUnits, 0) / n).toFixed(1),
      militaryTotal: ai.reduce((a, o) => a + o.militaryUnits, 0),
      treasuryMedian: median(ai.map(o => o.treasury)),
      treasuryMin: Math.min(...ai.map(o => o.treasury)),
      aiTreasuryNegative: ai.filter(o => o.treasury < 0).length,
      foodReserveMedian: median(ai.map(o => o.foodReserve)),
      foodNetMedian: median(ai.map(o => o.foodNet)),
      aiHungry: ai.filter(o => o.hungry).length,
      aiStarving: ai.filter(o => o.starving).length,
      aiGoldDeficit: ai.filter(o => o.goldDeficit).length,
      militaryInGoldDeficit: ai.filter(o => o.goldDeficit).reduce((a, o) => a + o.militaryUnits, 0),
      militaryInHunger: ai.filter(o => o.hungry).reduce((a, o) => a + o.militaryUnits, 0),
    });
  }
  return out;
}

function summarizeRun(res, turns) {
  const m = res.metrics;
  const before40 = m.filter(t => t.turn < 40);
  const warsBefore40 = before40.length ? before40[before40.length - 1].wars : 0;
  // Typy cywilizacji na mapie = AI + gracz (ZAŁOŻENIE R2, patrz main.ts civTypesCount = aiCount+1).
  const civTypes = (res.aiCount || 0) + 1;
  const warsEnd = res.snapEnd.warCount;
  // Oferty liczone UNIKALNIE po id (kolejka pending jest sumowana co turę -- nie sumujemy).
  const offerIds = new Set(m.flatMap(t => t.offerIds || []));
  const offers = offerIds.size;
  const offersNeg = res.snapEnd.offers.filter(o => o.goldOnce !== null && o.goldOnce < 0).length;
  return {
    turnsRun: m.length,
    turnsRequested: turns,
    warsBefore40,
    warsEnd,
    civTypes,
    warsPerCiv: civTypes ? +(warsEnd / civTypes).toFixed(2) : null,
    maxWars: Math.max(0, ...m.map(t => t.wars)),
    offersTotal: offers,
    offersNegative: offersNeg,
    turnMsMedian: median(m.map(t => t.ms)),
    hashEnd: m.length ? m[m.length - 1].hash : res.snapEnd.hash,
    startMs: res.startMs,
    aiEcon: aiEconByTurn(m),
  };
}

function printTable(rows) {
  const cols = [
    ['seed', 'seed'], ['wojnyT40', 'wojny przed T40'], ['warsEnd', 'wojny koniec'],
    ['warsPerCiv', 'wojny/typ cyw.'], ['maxWars', 'max wojen'], ['offersTotal', 'oferty'],
    ['offersNegative', 'oferty bilans<0'], ['turnMsMedian', 'czas tury med. ms'],
    ['turnsRun', 'tury'], ['hashEnd', 'hash'],
  ];
  const cells = rows.map(r => ({
    seed: String(r.seed), wojnyT40: String(r.summary.warsBefore40), warsEnd: String(r.summary.warsEnd),
    warsPerCiv: String(r.summary.warsPerCiv), maxWars: String(r.summary.maxWars),
    offersTotal: String(r.summary.offersTotal), offersNegative: String(r.summary.offersNegative),
    turnMsMedian: String(r.summary.turnMsMedian), turnsRun: `${r.summary.turnsRun}/${r.summary.turnsRequested}`,
    hashEnd: r.summary.hashEnd,
  }));
  const widths = cols.map(([k, h]) => Math.max(h.length, ...cells.map(c => c[k].length)));
  const line = (vals) => vals.map((v, i) => v.padEnd(widths[i])).join(' | ');
  console.log(line(cols.map(c => c[1])));
  console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
  for (const c of cells) console.log(line(cols.map(([k]) => c[k])));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = [];
  let failed = false;
  await withSimBundle(async ({ bundleDir }) => {
    const browser = await launchBrowser();
    try {
      for (const seed of args.seeds) {
        const { page, context, pageErrors } = await openSimPage(browser, { bundleDir, testhook: true });
        try {
          await waitForHook(page);
          const res = await runSim(page, {
            seed, turns: args.turns, aiCount: args.ai, cityStates: args.cs,
            difficulty: args.difficulty, era: args.era, policy: args.policy,
            flags: args.flags, autoResolveBattles: args.autoBattles,
          });
          const summary = summarizeRun({ ...res, aiCount: args.ai }, args.turns);
          const timedOut = res.metrics.some(t => String(t.hash).startsWith('TIMEOUT'));
          if (pageErrors.length || timedOut || summary.turnsRun < args.turns) failed = true;
          results.push({ seed, summary, pageErrors, timedOut, startSnapshot: res.snap0 });
        } catch (e) {
          failed = true;
          results.push({ seed, summary: { turnsRun: 0, turnsRequested: args.turns, warsBefore40: 0, warsEnd: 0, civTypes: 0, warsPerCiv: null, maxWars: 0, offersTotal: 0, offersNegative: 0, turnMsMedian: null, hashEnd: 'ERROR', startMs: 0 }, pageErrors: [String(e && e.message || e).slice(0, 300)], timedOut: false });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });
  if (args.json) console.log(JSON.stringify(results, null, 2));
  else {
    printTable(results);
    for (const r of results) {
      if (r.pageErrors.length) console.log(`seed ${r.seed} pageerror(y): ${r.pageErrors.length} -> ${r.pageErrors[0]}`);
      for (const e of r.summary.aiEcon || []) {
        console.log(`seed ${r.seed} T${e.turn}: wojsko AI sr=${e.militaryPerAi} razem=${e.militaryTotal} | skarbiec med=${e.treasuryMedian} min=${e.treasuryMin} ujemny=${e.aiTreasuryNegative}/${e.aiCount} | zywnosc med=${e.foodReserveMedian} przyrost=${e.foodNetMedian} | glod=${e.aiHungry} (jedn.${e.militaryInHunger}) atrycja=${e.aiStarving} | deficyt zlota=${e.aiGoldDeficit} (jedn.${e.militaryInGoldDeficit})`);
      }
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (require.main === module) {
  main().catch(e => { console.error('[sim-metrics] BŁĄD:', e && e.message || e); process.exitCode = 1; });
}

module.exports = { parseArgs, summarizeRun, median, aiEconByTurn };
