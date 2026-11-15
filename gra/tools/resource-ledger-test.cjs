'use strict';
/**
 * resource-ledger-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 1).
 *
 * Sprawdza dziennik źródeł (src/game/resource-ledger.ts) i jego podpięcie do
 * tickEmpireResourcePipeline (magazyn państwa: teren -> konwertery -> drain Spichlerza):
 *  (a) suma przepływów per surowiec = zmiana magazynu państwa, różnica 0, 30 tur;
 *      mutacja (usunięcie jednego źródła) daje rozjazd;
 *  (c) brak wpływu na wynik: stan miast identyczny z księgą i bez księgi (30 tur);
 *  etykiety źródeł po polsku z nazwą miasta;
 *  parametr N z econ-params.json (ksiega_zasobow_tury = 10) i przycinanie historii.
 *
 * Uruchom z gra/: node tools/resource-ledger-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { tickEmpireResourcePipeline } from '../src/game/turn-economy';
export {
  createLedgerTurn,
  recordLedgerFlow,
  ledgerResourceNet,
  appendLedgerTurn,
  readLedgerHistoryTurns,
  LEDGER_DEFAULT_HISTORY_TURNS,
} from '../src/game/resource-ledger';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[resource-ledger-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  tickEmpireResourcePipeline,
  createLedgerTurn,
  recordLedgerFlow,
  ledgerResourceNet,
  appendLedgerTurn,
  readLedgerHistoryTurns,
  LEDGER_DEFAULT_HISTORY_TURNS,
} = M;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('FAIL:', msg); }
}

const LABELS = { garncarnia: 'Garncarnia', cegielnia: 'Cegielnia', huta: 'Huta', spichlerz: 'Spichlerz', spichlerz_ii: 'Spichlerz II' };
const labelOf = id => LABELS[id] ?? id;

function makeFixture() {
  const cities = [
    { id: 'c1', name: 'Lublin', ownerId: 1, surowce: { ceramika: 50, sol: 10, glina: 20, drewno: 30, kamien: 5 } },
    { id: 'c2', name: 'Krakow', ownerId: 1, surowce: { glina: 5, drewno: 10, ruda: 8, ruda_cyny: 2, ceramika: 3, sol: 4 } },
    { id: 'c3', name: 'Gniezno', ownerId: 2, surowce: { glina: 40, drewno: 40, ceramika: 12, sol: 6 } },
  ];
  const builtByCity = new Map([
    ['c1', ['garncarnia', 'cegielnia', 'spichlerz']],
    ['c2', ['huta', 'spichlerz_ii']],
    ['c3', ['garncarnia']],
  ]);
  const territoryResourceByCity = new Map([
    ['c1', { glina: 7, drewno: 4, kamien: 3, sol: 2 }],
    ['c2', { ruda: 3, glina: 2, ruda_cyny: 1 }],
    ['c3', { drewno: 9, glina: 11 }],
  ]);
  return { cities, builtByCity, territoryResourceByCity };
}

function runPipeline(fx, ledgerOut, opts = {}) {
  return tickEmpireResourcePipeline(
    fx.cities,
    fx.builtByCity,
    fx.territoryResourceByCity,
    new Map(),                       // workedMagazynByCity
    opts.stolCount ?? new Map(),     // stolarniaCountByOwner
    new Map(),                       // kamieniarskiCountByOwner
    opts.stolBonus ?? 0,             // stolarniaBonusDrewnaCiv
    0,                               // kamieniarskiBonusKamieniaCiv
    () => ({}),                      // converterThroughputsForOwner (fallback)
    () => opts.cap ?? 500,           // ownerResourceCapFor
    undefined,                       // resolveOwnerActiveLabels
    undefined,                       // resolveOwnerZlotoAccess
    { ceramikaI: 1, ceramikaII: 2, solII: 1 }, // spichlerzDrainParams
    undefined,                       // producedOut
    undefined,                       // inflowOut
    false,                           // stopAfterProduction
    undefined,                       // utilizationOut
    ledgerOut,
    labelOf,
  );
}

function ownerTotals(cities) {
  const out = {};
  for (const c of cities) {
    out[c.ownerId] = out[c.ownerId] ?? {};
    for (const [k, v] of Object.entries(c.surowce ?? {})) {
      out[c.ownerId][k] = (out[c.ownerId][k] ?? 0) + (Number.isFinite(v) ? v : 0);
    }
  }
  return out;
}

const TURNS = 30;
const EPS = 1e-9;

// (a) księga = realna zmiana magazynu, 30 tur
{
  const fx = makeFixture();
  const grains = new Set();
  let maxAbsDiff = 0;
  for (let t = 1; t <= TURNS; t++) {
    const before = ownerTotals(fx.cities);
    const ledgerOut = new Map();
    runPipeline(fx, ledgerOut);
    const after = ownerTotals(fx.cities);
    for (const ownerId of Object.keys({ ...before, ...after })) {
      const keys = new Set([...Object.keys(before[ownerId] ?? {}), ...Object.keys(after[ownerId] ?? {})]);
      const turn = ledgerOut.get(Number(ownerId));
      for (const key of keys) {
        const delta = (after[ownerId]?.[key] ?? 0) - (before[ownerId]?.[key] ?? 0);
        const net = turn ? ledgerResourceNet(turn, key).net : 0;
        const diff = Math.abs(delta - net);
        if (Math.abs(delta) > EPS) grains.add(key);
        if (diff > maxAbsDiff) maxAbsDiff = diff;
        assert(diff <= EPS, `tura ${t} owner ${ownerId} ${key}: zmiana ${delta} vs ksiega ${net}`);
      }
    }
  }
  assert(grains.size >= 3, `(a) co najmniej 3 surowce z realnym przepływem, jest ${grains.size}`);
  console.log(`[a] 30 tur, surowce z przepływem: ${[...grains].sort().join(', ')}; maks. różnica ${maxAbsDiff}`);
}

// (a-var) wariant z ucięciem capem (konwersja i teren ucinane przez magazyn) oraz z bonusem Stolarni:
// różnica księgi i realnej zmiany magazynu musi wynosić 0 w każdej turze.
for (const variant of [
  { name: 'cap-12', opts: { cap: 12 } },
  { name: 'stolarnia', opts: { stolCount: new Map([[1, 2]]), stolBonus: 0.5 } },
]) {
  const fx = makeFixture();
  let maxAbsDiff = 0;
  let sawStolarnia = false;
  let sawClipped = false;
  for (let t = 1; t <= TURNS; t++) {
    const before = ownerTotals(fx.cities);
    const ledgerOut = new Map();
    runPipeline(fx, ledgerOut, variant.opts);
    const after = ownerTotals(fx.cities);
    for (const ownerId of Object.keys({ ...before, ...after })) {
      const keys = new Set([...Object.keys(before[ownerId] ?? {}), ...Object.keys(after[ownerId] ?? {})]);
      const turn = ledgerOut.get(Number(ownerId));
      if (turn) {
        for (const bySource of Object.values(turn.byResource)) {
          for (const flow of Object.values(bySource)) {
            if (flow.kind === 'stolarnia') sawStolarnia = true;
          }
        }
      }
      for (const key of keys) {
        const delta = (after[ownerId]?.[key] ?? 0) - (before[ownerId]?.[key] ?? 0);
        const net = turn ? ledgerResourceNet(turn, key).net : 0;
        const diff = Math.abs(delta - net);
        if (diff > maxAbsDiff) maxAbsDiff = diff;
        if (variant.opts.cap !== undefined && after[ownerId]?.[key] === variant.opts.cap) sawClipped = true;
        assert(diff <= EPS, `${variant.name} tura ${t} owner ${ownerId} ${key}: zmiana ${delta} vs ksiega ${net}`);
      }
    }
  }
  if (variant.name === 'stolarnia') {
    assert(sawStolarnia, '(a-var stolarnia) dziennik musi zawierać źródło „stolarnia”');
  } else {
    assert(sawClipped, '(a-var cap-12) magazyn musi dojść do limitu, żeby ucięcie zostało sprawdzone');
  }
  console.log(`[a-var] ${variant.name}, 30 tur: maks. różnica ${maxAbsDiff}`);
}

// (a-mut) mutacja: pominięcie jednego źródła daje rozjazd
{
  const fx = makeFixture();
  const before = ownerTotals(fx.cities);
  const ledgerOut = new Map();
  runPipeline(fx, ledgerOut);
  const after = ownerTotals(fx.cities);
  const turn = ledgerOut.get(1);
  let mutated = false;
  let mismatch = false;
  for (const [key, bySource] of Object.entries(turn.byResource)) {
    for (const [sk, flow] of Object.entries(bySource)) {
      if (flow.kind !== 'konwersja' || flow.amount === 0) continue;
      const copy = JSON.parse(JSON.stringify(turn));
      delete copy.byResource[key][sk];
      const delta = (after[1][key] ?? 0) - (before[1][key] ?? 0);
      if (Math.abs(delta - ledgerResourceNet(copy, key).net) > EPS) mismatch = true;
      mutated = true;
      break;
    }
    if (mutated) break;
  }
  assert(mutated, '(a-mut) fixture ma przepływ konwersji do usunięcia');
  assert(mismatch, '(a-mut) usunięcie źródła konwersji musi dać rozjazd z magazynem');
}

// (c) brak wpływu na wynik: stan miast identyczny z księgą i bez księgi
{
  const withLedger = makeFixture();
  const without = makeFixture();
  let identical = true;
  for (let t = 1; t <= TURNS && identical; t++) {
    runPipeline(withLedger, new Map());
    runPipeline(without, undefined);
    identical = JSON.stringify(withLedger.cities) === JSON.stringify(without.cities);
  }
  assert(identical, '(c) stan miast z księgą i bez księgi musi być identyczny (30 tur)');
}

// Etykiety po polsku z nazwą miasta
{
  const fx = makeFixture();
  const ledgerOut = new Map();
  runPipeline(fx, ledgerOut);
  const labels = [];
  for (const turn of ledgerOut.values()) {
    for (const bySource of Object.values(turn.byResource)) {
      for (const flow of Object.values(bySource)) labels.push(flow.label);
    }
  }
  // Cegielnia idzie pierwsza w puli miasta Lublin (kolejność receptur), więc to jej etykieta.
  assert(labels.includes('Cegielnia (Lublin)'), 'etykieta „Cegielnia (Lublin)” (produkcja konwertera)');
  assert(labels.every(l => !/[a-z]+_[a-z]+/.test(l)), 'etykiety bez surowych ID (podkreślenia)');
  assert(labels.includes('Spichlerz (zużycie zapasów)'), 'etykieta drainu Spichlerza');
  assert(labels.some(l => l.startsWith('Teren i plony z mapy')), 'etykieta terenu');
}

// Zapis bez księgi nie tworzy mapy; zerowe i nie-finityjne są pomijane
{
  const turn = createLedgerTurn();
  recordLedgerFlow(turn, 'sol', 'x|1', { kind: 'teren', label: 'T' }, 0);
  recordLedgerFlow(turn, 'sol', 'x|2', { kind: 'teren', label: 'T' }, NaN);
  recordLedgerFlow(turn, 'sol', 'x|3', { kind: 'teren', label: 'T' }, 3);
  recordLedgerFlow(turn, 'sol', 'x|3', { kind: 'teren', label: 'T' }, 2);
  recordLedgerFlow(turn, 'sol', 'x|4', { kind: 'wejscie', label: 'W' }, -4);
  const net = ledgerResourceNet(turn, 'sol');
  assert(Object.keys(turn.byResource.sol).length === 2, 'zerowe i NaN pominięte, sumowanie po kluczu źródła');
  assert(net.gain === 5 && net.loss === -4 && net.net === 1, `netto sol: ${JSON.stringify(net)}`);
}

// Parametr N z econ-params.json i przycinanie historii
{
  const econ = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8'));
  assert(readLedgerHistoryTurns(econ, 'normal') === 10, 'N z econ-params (normal) = 10');
  assert(readLedgerHistoryTurns(econ, 'hard') === 10, 'N z econ-params (hard) = 10');
  assert(readLedgerHistoryTurns(undefined, 'normal') === LEDGER_DEFAULT_HISTORY_TURNS, 'brak parametru -> domyślne N');
  let hist = [];
  for (let t = 0; t < 25; t++) hist = appendLedgerTurn(hist, createLedgerTurn(), 10);
  assert(hist.length === 10, `historia przycięta do 10 tur, jest ${hist.length}`);
  assert(appendLedgerTurn([], createLedgerTurn(), 0).length === 0, 'N=0 -> pusty dziennik');
}

console.log(`resource-ledger-test: ${passed} passed, ${failed} failed`);

for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }

if (failed > 0) process.exit(1);
