#!/usr/bin/env node
/**
 * mutate-k05a-units.mjs — mutacje behawioralne portu K05A (`src/ui/cityPanel/k05a-fundament.ts`) (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 1). Każda mutacja zmienia jeden fragment kodu portu w pliku tymczasowym;
 * harness `run-k05a-units.mjs --v2 <mutant>` musi wykryć różnicę (EXIT 1). Mutacja przeżyta = brak wykrycia = raport.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k05a-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje zabite; 1 <=> przeżyta >=1 mutacja; 2 <=> błąd.
 */
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k05a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_FILE = resolve(HERE, '../../src/ui/cityPanel/k05a-fundament.ts');
const HARNESS = resolve(HERE, 'run-k05a-units.mjs');
const src = readFileSync(V2_FILE, 'utf8');

/** [id, zamiennik(from), na(to)] — `from` musi występować dokładnie raz w porcie. */
const MUTANTS = [
  ['hexDist-dzielnik', '/ 2;', '/ 3;'],
  ['hexDist-trzeci-czlon', 'Math.abs(dq + dr)', 'Math.abs(dq - dr)'],
  ['hexDist-dr', 'Math.abs(dr)) / 2', 'Math.abs(dr) + 1) / 2'],
  ['rangeName-prog-maly', 'if (R <= 5)', 'if (R < 5)'],
  ['rangeName-prog-sredni', 'if (R <= 10)', 'if (R <= 9)'],
  ['rangeName-etykieta', "'średnie miasto'", "'mniejsze miasto'"],
  ['ringsTiles-mnoznik', 'n += 6 * (R + k);', 'n += 5 * (R + k);'],
  ['ringsTiles-offset', 'n += 6 * (R + k);', 'n += 6 * (R + k - 1);'],
  ['ringsTiles-granica', 'for (let k = 1; k <= rings; k++)', 'for (let k = 1; k < rings; k++)'],
  ['okStat-klasa', '<span class="ks">', '<span class="k">'],
  ['okStat-wartosc', '<b>${val}</b>', '<b>${sub}</b>'],
  ['okStat-sub', '<span class="muted">${sub}</span>', '<span class="muted">${val}</span>'],
  ['ENTITY-id', "'civ-city-panel-entity-card-css-v1'", "'civ-city-panel-entity-card-css-v2'"],
  // r2: TEREN_COL/TEREN_LETTER, kopia enum TerenBazowy (K05A-Z1).
  ['TEREN-COL-kolor', "'#0d2236'", "'#0d2237'"],
  ['TEREN-LETTER-znak', "[TerenBazowy.Laka]: 'Ł'", "[TerenBazowy.Laka]: 'L'"],
  ['enum-wartosc-gory', "Gory     = 'gory',", "Gory     = 'gora',"],
  // r2: okolicaPreviewRadius: pola DTO (city.q / city.r, K05A-Z2), parametry UI, galezie tryb/reczne/worked.
  ['okolica-dto-q', 'hexDist(city.q, city.r, q, r)', 'hexDist(city.q, city.q, q, r)'],
  ['okolica-dto-r', 'hexDist(city.q, city.r, q, r)', 'hexDist(city.r, city.r, q, r)'],
  ['okolica-fallback-ui', 'okolica_promien, 3)', 'okolica_promien, 4)'],
  ['okolica-cap', 'const cap = Rwork ?? fallback;', 'const cap = Rwork ?? fallback + 1;'],
  ['okolica-tryb-galaz', "if (tryb === 'reczny') {", "if (tryb === 'auto') {"],
  ['okolica-reczne-prog', 'if (!count || count <= 0) continue;', 'if (!count) continue;'],
  ['okolica-reczne-finite', 'if (Number.isFinite(q) && Number.isFinite(r)) bump(q, r);', 'if (Number.isFinite(q)) bump(q, r);'],
  ['okolica-worked-swap', 'for (const t of worked ?? []) bump(t.q, t.r);', 'for (const t of worked ?? []) bump(t.r, t.q);'],
  // r3 (batch 1): pola DTO / wejścia reguł (K05A-Z4) i gałęzie jednostek z pinu.
  ['loc-stolica', "if (lokalizacja === 'stolica') return isCapital === true;", "if (lokalizacja === 'stolica') return isCapital !== false;"],
  ['loc-region', "if (lokalizacja === 'region') return isCapital === false;", "if (lokalizacja === 'region') return isCapital !== true;"],
  ['recruit-ep-default', 'const ep = cfg.getEpoch?.(city.ownerId) ?? 1;', 'const ep = cfg.getEpoch?.(city.ownerId) ?? 2;'],
  ['recruit-bonusy-dto', 'civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));', 'civManpowerMaxMult(undefined);'],
  ['recruit-cost-maxmult', 'return unitManpowerCostForType(typeId, ep, maxMult);', 'return unitManpowerCostForType(typeId, ep, 1);'],
  ['rekruci-total-snapshot', 'return cfg.getManpowerSnapshot?.(city.id)?.manpowerBiezacy;', 'return cfg.getManpowerSnapshot?.(city.id)?.manpowerBiezacy ?? 0;'],
  ['rekruci-total-dto', 'const empireTotal = cfg.getEmpireRekruciTotal?.(city.ownerId);', 'const empireTotal = cfg.getEmpireRekruciTotal?.(city.id);'],
  ['affordable-default', 'available = empireRekruciTotal(city),', 'available = undefined,'],
  ['affordable-cmp', 'return available == null || available >= mpCost;', 'return available == null || available > mpCost;'],
  ['affordable-zero', 'if (mpCost <= 0) return true;', 'if (mpCost < 0) return true;'],
  ['maxq-treasury', 'applyLimit(skarb, item.koszt);', 'applyLimit(skarb, 1);'],
  ['maxq-floor', 'return constrained ? Math.max(1, max) : undefined;', 'return constrained ? Math.max(0, max) : undefined;'],
  ['maxq-pool-default', 'applyLimit(pool[key] ?? 0, cost);', 'applyLimit(pool[key] ?? 3, cost);'],
  ['unitstock-missing-neg', 'const missing = isUnitRecruitStockChipMissing(pool, u, k);', 'const missing = !isUnitRecruitStockChipMissing(pool, u, k);'],
  ['unitstock-cls', "const cls = missing ? 'bld-infocard-chip stock-missing' : 'bld-infocard-chip';", "const cls = missing ? 'bld-infocard-chip stock-missing' : 'bld-infocard-chip stock-missing';"],
  ['upkeep-suffix', '${stockResourceLabel(k)}/t</span>`)', '${stockResourceLabel(k)}</span>`)'],
  ['missing-filter', 'return chain.filter(t => !unlocked.has(t));', 'return chain.filter(t => unlocked.has(t));'],
  ['missing-chain-slice', 'const chain = techPrereqChain(data, techName);', 'const chain = techPrereqChain(data, techName).slice(1);'],
  ['deleg-stock-upkeep', 'return regul().unitStockCost(u);', 'return regul().unitResourceUpkeep(u);'],
  ['deleg-pool-zloto', 'return regul().ownerSurowcePoolFor(city);', 'return { ...regul().ownerSurowcePoolFor(city), zloto: 0 };'],
  // r3 (batch 2): kopie z pinu i adapter buildingRequirementChips (wejście z DTO).
  ['chips-adapter-unl', 'return regulExt().buildingRequirementChips(def, city, data, ctx, unlockedTechs);', 'return regulExt().buildingRequirementChips(def, city, data, ctx, []);'],
  ['ccbn-some', 'return chips.length === 0 || chips.every(c => c.met);', 'return chips.some(c => c.met);'],
  ['sort-no-check', 'if (def && buildingCanBuildNow(def, city, data, ctx, techs)) buildable.push(item);', 'if (def) buildable.push(item);'],
  ['sort-order', 'return [...buildable, ...blocked];', 'return [...blocked, ...buildable];'],
  ['conv-era-default', 'const era = cfg.getEpoch?.(city.ownerId) ?? 1;', 'const era = cfg.getEpoch?.(city.ownerId) ?? 2;'],
  ['conv-difficulty', "const difficulty = cfg.difficulty ?? 'normal';", "const difficulty = cfg.difficulty ?? 'hard';"],
  ['conv-raw', 'const rawParams = data.econParams as unknown as RawConverterParamsJson;', 'const rawParams = {} as RawConverterParamsJson;'],
  ['lock-built-text', "if (entry.status === 'built') return 'Już wybudowany w tym mieście';", "if (entry.status === 'built') return 'Już wybudowany';"],
  ['preview-brak-text', "parts.push('Brak wymogu badań');", "parts.push('Brak wymogu');"],
  ['ctx-capital', 'isCapital: (cfg.getCapitalCityId?.(city.ownerId) ?? null) === city.id,', 'isCapital: (cfg.getCapitalCityId?.(city.ownerId) ?? null) !== city.id,'],
  ['ctx-epoch', 'epoch: cfg.getEpoch?.(city.ownerId) ?? 1,', 'epoch: cfg.getEpoch?.(city.ownerId) ?? 0,'],
  ['ctx-queue', 'productionQueue: getProd(city.id).kolejka,', 'productionQueue: [],'],
  ['ctx-stock', 'empireResourceStock: cfg.getEmpireStock?.(city.ownerId),', 'empireResourceStock: undefined,'],
  ['era-full', 'if (fullEraPreview) return true;', 'if (fullEraPreview) return false;'],
  ['era-locblocked', 'if (e.locationBlocked) return false;', 'if (e.locationBlocked && !fullEraPreview) return false;'],
  ['getprod-fallback', 'return cfg.getProd?.(cityId) ?? { kolejka: [] };', "return cfg.getProd?.(cityId) ?? { kolejka: [{ id: 'z', koszt: 0, kind: 'unit' }] };"],
];

/**
 * Mutanty udowodnione jako równoważne (przeżycie oczekiwane). Każdy wpis wymaga dowodu w P5-8-K05A.md §7.
 * okolica-reczne-finite: `Number.isFinite(q)` zamiast `(q) && (r)`. Gdy r = NaN (klucz "7,x"), hexDist daje NaN,
 * a `NaN <= cap` jest false, więc bump jest no-op — identyczne zachowanie. Gdy q = NaN, d też NaN (no-op).
 */
const EQUIVALENT = {
  'okolica-reczne-finite': 'NaN w hexDist -> d=NaN -> (d <= cap) === false -> bump no-op; wejście {"7,x":3} w harnessie',
};
const equivalent = [];
const tmp = mkdtempSync(join(tmpdir(), 'p58k05a-mutate-'));
const survived = [];
const killed = [];
let exitCode = 0;
try {
  for (const [id, from, to] of MUTANTS) {
    const n = src.split(from).length - 1;
    if (n !== 1) {
      console.error(`mutant ${id}: wzorzec wystąpił ${n} razy (wymagane 1)`);
      exitCode = 2;
      break;
    }
    const mutPath = join(tmp, `${id}.ts`);
    writeFileSync(mutPath, src.replace(from, to));
    const r = spawnSync(process.execPath, [HARNESS, '--pin-dir', resolve(PIN_DIR), '--v2', mutPath], { encoding: 'utf8' });
    if (r.status === 1) killed.push(id);
    else if (EQUIVALENT[id]) {
      equivalent.push(id);
      console.log(`ROWNOWAZNA ${id} (dowod: ${EQUIVALENT[id]})`);
    } else {
      survived.push(id);
      console.log(`PRZEZYTA ${id} (exit=${r.status}) ${r.stderr ? r.stderr.trim().slice(0, 200) : ''}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (exitCode === 0) {
  console.log(`mutate-k05a-units: mutacji=${MUTANTS.length} zabitych=${killed.length} rownowaznych=${equivalent.length} przezytych=${survived.length}`);
  exitCode = survived.length === 0 ? 0 : 1;
}
process.exit(exitCode);
