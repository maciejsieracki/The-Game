'use strict';
/**
 * resource-ledger-perf-micro.cjs -- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 (GOAL 3):
 * MIKROPOMIAR narzutu ksiegi "Skad zapasy" na stanie z 12 / 25 / 50 miastami (bez przegladarki, tani benchmark funkcji).
 *  - A: tickEmpireResourcePipeline BEZ ksiegi (ledgerOut = undefined) vs Z ksiega (ledgerOut = Map) -- ms na wywolanie;
 *  - B: ownerResourceStockAll(cities, owner) -- ms na wywolanie (snapshot puli panstwa);
 *  - C: samo budowanie ksiegi (createLedgerTurn + recordLedgerFlow, 8 zrodel x 6 surowcow na wlasciciela).
 * Metodyka: kolejnosc OFF/ON naprzemienna (ABAB), N powtorzen sekwencyjnych (domyslnie 9), mediana + min/max;
 * rozgrzewka odrzucona. Wynik: JSON na stdout (jedna linia na rozmiar) + tabela.
 * Uruchom z gra/: node tools/resource-ledger-perf-micro.cjs [--reps 9] [--iters 200]
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-perf-micro] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-perf-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-perf-bundle.cjs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const REPS = Number(arg('reps', '9'));
const ITERS = Number(arg('iters', '40'));
const TURN_MS = Number(arg('turn-ms', '7735')); // mediana czasu tury z pomiaru 100 tur (evidence/perf100)

fs.writeFileSync(ENTRY_FILE, `
export { tickEmpireResourcePipeline } from '../src/game/turn-economy';
export { ownerResourceStockAll } from '../src/game/building-stock-cost';
export { createLedgerTurn, recordLedgerFlow } from '../src/game/resource-ledger';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) { console.error('[resource-ledger-perf-micro] bundle failed:', e.message || e); process.exit(1); }

const { tickEmpireResourcePipeline, ownerResourceStockAll, createLedgerTurn, recordLedgerFlow } = require(BUNDLE_FILE);
for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }

const LABELS = { garncarnia: 'Garncarnia', cegielnia: 'Cegielnia', huta: 'Huta', spichlerz: 'Spichlerz', spichlerz_ii: 'Spichlerz II' };
const labelOf = (id) => LABELS[id] ?? id;

function makeFixture(nCities) {
  const cities = []; const builtByCity = new Map(); const territoryResourceByCity = new Map();
  for (let i = 0; i < nCities; i++) {
    const id = 'c' + i; const ownerId = 1 + (i % 3 === 0 ? 1 : 0); // ~1/3 miast ownera 2, reszta ownera 1
    cities.push({ id, name: 'Miasto' + i, ownerId, surowce: { ceramika: 50, sol: 10, glina: 200, drewno: 300, kamien: 50, ruda: 20, miedz: 5, zloto: 1 } });
    builtByCity.set(id, i % 2 ? ['garncarnia', 'cegielnia', 'spichlerz'] : ['huta', 'spichlerz_ii', 'garncarnia']);
    territoryResourceByCity.set(id, { glina: 7, drewno: 4, kamien: 3, sol: 2, ruda: 1 });
  }
  return { cities, builtByCity, territoryResourceByCity };
}

function runPipeline(fx, ledgerOut) {
  return tickEmpireResourcePipeline(
    fx.cities, fx.builtByCity, fx.territoryResourceByCity, new Map(), new Map(), new Map(), 0, 0,
    () => ({}), () => 1e9, undefined, undefined, { ceramikaI: 1, ceramikaII: 2, solII: 1 },
    undefined, undefined, false, undefined, ledgerOut, labelOf,
  );
}

function median(a) { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function timeIt(fn, iters) { const t0 = process.hrtime.bigint(); for (let i = 0; i < iters; i++) fn(); return Number(process.hrtime.bigint() - t0) / 1e6 / iters; }

const rows = [];
for (const n of [12, 25, 50]) {
  // rozgrzewka
  timeIt(() => runPipeline(makeFixture(n), undefined), 3); timeIt(() => runPipeline(makeFixture(n), new Map()), 3);
  const off = []; const on = []; const stock = []; const build = [];
  // Kazdy pomiar na SWIEZYM stanie (fixture budowany POZA zegarem), zeby dryf zapasow miedzy iteracjami nie zaklocal wyniku.
  const timeFresh = (withLedger) => {
    const fxs = []; for (let i = 0; i < ITERS; i++) fxs.push(makeFixture(n));
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < ITERS; i++) runPipeline(fxs[i], withLedger ? new Map() : undefined);
    return Number(process.hrtime.bigint() - t0) / 1e6 / ITERS;
  };
  for (let r = 0; r < REPS; r++) {
    // naprzemiennie: kolejnosc OFF/ON odwracana co powtorzenie (eliminuje dryf zegara/GC)
    if (r % 2 === 0) { off.push(timeFresh(false)); on.push(timeFresh(true)); } else { on.push(timeFresh(true)); off.push(timeFresh(false)); }
    const fxS = makeFixture(n);
    stock.push(timeIt(() => ownerResourceStockAll(fxS.cities, 1), ITERS * 25));
    build.push(timeIt(() => {
      const lt = createLedgerTurn();
      for (const owner of [1, 2]) {
        for (let s = 0; s < 8; s++) for (const rk of ['glina', 'drewno', 'kamien', 'sol', 'ceramika', 'ruda']) recordLedgerFlow(lt, rk, `src|${owner}|${s}`, { kind: 'teren', label: 'Teren (M)' }, 3);
      }
    }, ITERS * 25));
  }
  const mOff = median(off); const mOn = median(on);
  const row = {
    cities: n, reps: REPS, iters: ITERS,
    pipelineOffMs: +mOff.toFixed(4), pipelineOnMs: +mOn.toFixed(4), deltaMs: +(mOn - mOff).toFixed(4),
    deltaPct: +(((mOn - mOff) / mOff) * 100).toFixed(2), deltaPctOfTurn: +(((mOn - mOff) / TURN_MS) * 100).toFixed(4), turnMsAssumed: TURN_MS,
    offMinMax: [+Math.min(...off).toFixed(4), +Math.max(...off).toFixed(4)], onMinMax: [+Math.min(...on).toFixed(4), +Math.max(...on).toFixed(4)],
    ownerResourceStockAllMs: +median(stock).toFixed(5), ledgerBuild96FlowsMs: +median(build).toFixed(5),
  };
  rows.push(row); console.log(JSON.stringify(row));
}
console.log('\nmiasta | pipeline OFF ms | pipeline ON ms | roznica ms | roznica % (pipeline) | roznica % tury | ownerResourceStockAll ms | budowa ksiegi (96 przeplywow) ms');
for (const r of rows) console.log(`${r.cities} | ${r.pipelineOffMs} | ${r.pipelineOnMs} | ${r.deltaMs} | ${r.deltaPct} | ${r.deltaPctOfTurn} | ${r.ownerResourceStockAllMs} | ${r.ledgerBuild96FlowsMs}`);
