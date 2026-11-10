// Literalna kopia logiki weba (edb8fb56), TS -> JS (usunięte tylko adnotacje typów).
// Źródła: gra/src/game/building-stock-cost.ts (l.28-67, 74-98, 368-420),
//         gra/src/game/r-stawki-strojenie.ts (l.6-47), gra/src/game/economy-upkeep.ts (l.784-797, 679-698).
import fs from 'node:fs';

const R_STAWKI_FALA2_MULT = 2; // r-stawki-strojenie.ts:9

// building-stock-cost.ts:28-57
export function epochCostMultiplier(epoch) {
  if (typeof epoch === 'number' && Number.isFinite(epoch)) {
    const ordinal = Math.floor(epoch);
    if (ordinal >= 3) return 4;
    if (ordinal >= 2) return 2;
    return 1;
  }
  if (typeof epoch !== 'string') return 1;
  const normalized = epoch
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return epochCostMultiplier(Number(normalized));
  }
  if (normalized === 'kamien' || normalized === 'stone' || normalized === '1') return 1;
  if (normalized === 'braz' || normalized === 'bronze' || normalized === '2') return 2;
  if (
    normalized === 'zelazo' ||
    normalized === 'zelazo+' ||
    normalized === 'iron' ||
    normalized === 'iron+' ||
    normalized === 'iron plus' ||
    normalized === 'steel' ||
    normalized === 'stal'
  ) return 4;
  return 1;
}

// building-stock-cost.ts:60-67
export function scaleCostByEpoch(cost, epoch) {
  if (!Number.isFinite(cost) || cost < 0) return 0;
  if (cost === 0) return 0;
  return Math.max(1, Math.round(cost * epochCostMultiplier(epoch)));
}

// building-stock-cost.ts:74-81
export function buildingEraCostMultiplier(epokaWejscia) {
  const era = typeof epokaWejscia === 'number' && Number.isFinite(epokaWejscia)
    ? Math.floor(epokaWejscia)
    : 1;
  if (era >= 3) return 4;
  if (era >= 2) return 2;
  return 1;
}

// r-stawki-strojenie.ts:36-47
export function scaleStockCostRecord(raw) {
  const out = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = Math.max(1, Math.round(v * R_STAWKI_FALA2_MULT));
    }
  }
  return out;
}

// building-stock-cost.ts:84-98
export function buildingStockCost(building) {
  const fala2Cost = scaleStockCostRecord(building?.koszt_surowce);
  const eraMultiplier = buildingEraCostMultiplier(building?.epokaWejscia);
  if (eraMultiplier === 1) return fala2Cost;
  const out = {};
  for (const [key, amount] of Object.entries(fala2Cost)) {
    out[key] = Math.max(1, Math.round(amount * eraMultiplier));
  }
  return out;
}

// building-stock-cost.ts:358-360
function stripDiacriticsLower(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// building-stock-cost.ts:368-371
export const MOUNT_UNIT_HORSE_STOCK_COST = 25;
export const MOUNT_UNIT_HORSE_STOCK_KEY = 'kon';
export const MOUNT_HORSE_EXEMPT_UNIT = 'Rydwan (woły)';

// building-stock-cost.ts:383-390
export function unitRequiresMountHorseStock(unit) {
  if (!unit) return false;
  if ((unit.Typ ?? '').toString().trim() !== 'Mount') return false;
  const name = (unit.Jednostka ?? '').toString().trim();
  return name !== MOUNT_HORSE_EXEMPT_UNIT;
}

// building-stock-cost.ts:402-420
export function unitStockCost(unit) {
  const out = {};
  if (!unit) return out;
  const rawName = (unit.Surowiec ?? '').toString().trim();
  if (rawName && rawName !== '-') {
    const ilosc = unit['Surowiec (ilość)'];
    if (typeof ilosc === 'number' && Number.isFinite(ilosc) && ilosc > 0) {
      const key = stripDiacriticsLower(rawName);
      if (key) out[key] = scaleCostByEpoch(ilosc, unit.Epoka);
    }
  }
  if (unitRequiresMountHorseStock(unit)) {
    out[MOUNT_UNIT_HORSE_STOCK_KEY] =
      (out[MOUNT_UNIT_HORSE_STOCK_KEY] ?? 0) + scaleCostByEpoch(MOUNT_UNIT_HORSE_STOCK_COST, unit.Epoka);
  }
  return out;
}

// economy-upkeep.ts:784-797
export function unitResourceUpkeep(unitDef) {
  const out = {};
  if (!unitDef) return out;
  const rawName = (unitDef['Utrzymanie surowiec'] ?? '').toString().trim();
  if (!rawName || rawName === '-') return out;
  const ilosc = unitDef['Utrzymanie surowiec (ilość)'];
  if (typeof ilosc === 'number' && Number.isFinite(ilosc) && ilosc > 0) {
    const key = stripDiacriticsLower(rawName);
    if (key) out[key] = scaleCostByEpoch(ilosc, unitDef.Epoka);
  }
  return out;
}

// economy-upkeep.ts:679-698
export const BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5;
export function buildingResourceUpkeep(building) {
  const raw = building?.koszt_surowce;
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Generator: wejście = kopie JSON z pinu edb8fb56 (identyczne z engine/data, cmp OK)
// argv: <units.json> <buildings.json> <outDir>
// ---------------------------------------------------------------------------
const [, , unitsPath, buildingsPath, outDir] = process.argv;
const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const buildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf8'));

const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const unitRows = units.map((u) => {
  const stock = unitStockCost(u);
  const upkeep = unitResourceUpkeep(u);
  const konBase = unitRequiresMountHorseStock(u) ? MOUNT_UNIT_HORSE_STOCK_COST : 0;
  return {
    jednostka: u.Jednostka,
    epoka: u.Epoka,
    surowiec: sortKeys(stock),
    utrzymanie_surowiec: sortKeys(upkeep),
    baza: {
      surowiec: u.Surowiec ?? null,
      surowiec_ilosc: u['Surowiec (ilość)'],
      utrzymanie_surowiec: u['Utrzymanie surowiec'] ?? null,
      utrzymanie_surowiec_ilosc: u['Utrzymanie surowiec (ilość)'],
      dodatek_kon_baza: konBase,
    },
  };
});

const buildingRows = buildings.map((b) => {
  const stock = buildingStockCost(b);
  const upkeep = buildingResourceUpkeep(b);
  return {
    budynek: b.id,
    epokaWejscia: b.epokaWejscia,
    koszt_surowce: sortKeys(stock),
    utrzymanie_surowcowe_na_ture: sortKeys(upkeep),
    baza_koszt_surowce: b.koszt_surowce ? sortKeys(b.koszt_surowce) : {},
  };
});

const meta = (zrodlo, regula) => ({
  status: 'BOOTSTRAP: wartosci startowe rozwiniete z regul weba. Zrodlem prawdy do recznego balansu jest TA tabela (edytuj liczby, nie mnozniki). Tabela NIE jest porownywana ze wzorem przy buildzie.',
  zrodlo,
  regula_weba: regula,
  wygenerowano: 'R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1 (2026-10-21), generator: P3-19 sekcja 5',
  uwaga_epoka: 'Mnoznik epoki wynika z pola Epoka (jednostka) / epokaWejscia (budynek) danego wiersza, NIE z aktualnej epoki gry (web nie ma kosztow zaleznych od czasu).',
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/unit-stock-costs.json`, JSON.stringify({
  meta: meta('gra/data/units.json @ edb8fb56 (identyczny z rust-port/engine/data/units.json)',
    'building-stock-cost.ts unitStockCost (l.402-420; scaleCostByEpoch l.60-67; epochCostMultiplier l.28-57; MOUNT kon 25 l.368-369, 415-417); economy-upkeep.ts unitResourceUpkeep (l.784-797)'),
  wiersze: unitRows,
}, null, 2) + '\n');
fs.writeFileSync(`${outDir}/building-stock-costs.json`, JSON.stringify({
  meta: meta('gra/data/buildings.json @ edb8fb56 (identyczny z rust-port/engine/data/buildings.json)',
    'building-stock-cost.ts buildingStockCost (l.84-98) = r-stawki-strojenie.ts scaleStockCostRecord x2 (l.36-47), potem buildingEraCostMultiplier (l.74-81); economy-upkeep.ts buildingResourceUpkeep (l.686-698, N=5)'),
  wiersze: buildingRows,
}, null, 2) + '\n');
console.log(`units=${unitRows.length} buildings=${buildingRows.length}`);
