// Runda 3 (P3-19): generator tabel Pracy budynków i złota jednostek/utrzymania.
// Literalna kopia logiki weba (pin edb8fb56), TS -> JS (usunięte tylko adnotacje typów).
// Źródła (odczyt, `git show edb8fb56:<ścieżka>`):
//   gra/src/game/building-stock-cost.ts  l.28-57 (epochCostMultiplier), 60-67 (scaleCostByEpoch), 74-81 (buildingEraCostMultiplier)
//   gra/src/game/production.ts           l.322-334 (itemCost budynek), 514-529 (buildingWorkCost, stała GLOBAL 0.25 l.511)
//   gra/src/game/production.ts           l.255-289 (unitCostFromDef, DEFAULT_COST_BY_ROLE), l.290-303 (itemCost jednostka)
//   gra/src/game/economy-upkeep.ts       l.922-977 (DEFAULT_UNIT_UPKEEP_BY_CATEGORY, unitUpkeep, x4 = FALA1xFALA2), l.1000-1023 (buildUnitUpkeepTable)
//   gra/src/game/r-stawki-strojenie.ts   FALA1xFALA2 = 4 (stała R_STAWKI_FALA1_FALA2_MULT; sprawdzić w pliku)
// argv: <units.json> <buildings.json> <miasto-params.json> <outDir>
import fs from 'node:fs';

// --- building-stock-cost.ts:28-57 (kopia literalna) ---
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

// production.ts:322-334 (itemCost, gałąź 'budynek'), poziom = cityLevelOrEpoch
export function itemCostBuilding(b, level) {
  const lvl = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const przyrostKosztu = Number.isFinite(b.przyrostKosztu) ? b.przyrostKosztu : 0;
  const baseCost = Math.round(b.kosztBudowy + przyrostKosztu * (lvl - 1));
  return Math.round(baseCost * buildingEraCostMultiplier(b.epokaWejscia));
}

// production.ts:514-529 — stan BAZOWY (niski = x1.0, bez ulgi cywilizacji, trudność normal = x1)
// GLOBAL 0.25 (l.511) x R_STAWKI_KOSZT_MULT 2 x R_STAWKI_FALA2_MULT 2 = 1.0
export const GLOBAL_BUILDING_PROD_MULT = 0.25;
export const R_STAWKI_KOSZT_MULT = 2;   // r-stawki-strojenie.ts (sprawdzić w pinie)
export const R_STAWKI_FALA2_MULT = 2;   // r-stawki-strojenie.ts:9
export function buildingWorkCostBaseline(afterPace) {
  return Math.max(
    1,
    Math.round(afterPace * GLOBAL_BUILDING_PROD_MULT * R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT),
  );
}

// production.ts:255-289 (unitCostFromDef) — kopia literalna
export const DEFAULT_UNIT_COST = 10; // miasto-params.json jednostka_koszt_domyslny (wczytane niżej)
export function makeUnitCostFromDef(miasto) {
  const DEFAULT_COST_BY_ROLE = {
    Wsparcie: miasto.jednostka_koszt_rola_wsparcie?.wartosc ?? 12,
    Dystans: miasto.jednostka_koszt_rola_dystans?.wartosc ?? 8,
    'Wręcz': miasto.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
    Wrecz: miasto.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
    Konnica: miasto.jednostka_koszt_rola_konnica?.wartosc ?? 16,
  };
  const defaultCost = miasto.jednostka_koszt_domyslny?.wartosc ?? 10;
  return function unitCostFromDef(def) {
    const raw = def['Pieniądz (koszt)'];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      if (raw > 0) return raw;
      if (raw === 0 && def['Super-jednostka'] === 'TAK') return 0;
    }
    const rola = def['Rola (linia)'];
    if (rola != null) {
      const byRole = DEFAULT_COST_BY_ROLE[rola];
      if (typeof byRole === 'number') return byRole;
    }
    return defaultCost;
  };
}

// economy-upkeep.ts:922-977 — tabela kategorii (wartości literalne) i x4 FALA1xFALA2
export const DEFAULT_UNIT_UPKEEP_BY_CATEGORY = {
  zwiadowca: 0, procarz: 1, oszczepnik: 1, lucznik: 1, wlocznik: 2, miecznik: 2,
  falanga: 2, legionista: 2, maczuga: 2, topor: 2, konnica: 3, rydwan: 3, galera: 3,
  super: 0, domyslny: 1,
};
export const R_STAWKI_FALA1_FALA2_MULT = 4; // economy-upkeep.ts:976 (sprawdzić w pinie)
// economy-upkeep.ts:1000-1023 (buildUnitUpkeepTable): wartość = scaleCostByEpoch(upkeep, Epoka)
// economy-upkeep.ts:962-977 (unitUpkeep) dla wiersza z tabeli: base = table[typeId]; base<=0 -> 0; round(base x4)
export function unitUpkeepFromTable(upkeepRaw, epoka) {
  if (upkeepRaw === undefined) return undefined;
  const base = scaleCostByEpoch(upkeepRaw, epoka);
  if (base <= 0) return 0;
  return Math.round(base * R_STAWKI_FALA1_FALA2_MULT);
}

// ---------------------------------------------------------------------------
const [, , unitsPath, buildingsPath, miastoPath, outDir] = process.argv;
const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const buildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf8'));
const miasto = JSON.parse(fs.readFileSync(miastoPath, 'utf8'));
const unitCostFromDef = makeUnitCostFromDef(miasto);

// Równoważność bootstrapu (Praca): flat = (kosztBudowy*m, przyrost*m) musi dać ten sam wynik
// co itemCost + buildingWorkCost (stan bazowy) dla każdego poziomu 1..LEVEL_MAX.
const LEVEL_MAX = 200;
const workRows = [];
let workRozbieznosci = 0;
let workSprawdzone = 0;
for (const b of buildings) {
  const m = buildingEraCostMultiplier(b.epokaWejscia);
  const baseFlat = b.kosztBudowy * m;
  const incFlat = b.przyrostKosztu * m;
  for (let lvl = 1; lvl <= LEVEL_MAX; lvl++) {
    const web = buildingWorkCostBaseline(itemCostBuilding(b, lvl));
    const flat = baseFlat + incFlat * (lvl - 1);
    workSprawdzone++;
    if (web !== flat) workRozbieznosci++;
  }
  workRows.push({
    budynek: b.id,
    epokaWejscia: b.epokaWejscia,
    praca_bazowa: baseFlat,
    praca_przyrost: incFlat,
    baza: {
      kosztBudowy: b.kosztBudowy,
      przyrostKosztu: b.przyrostKosztu,
      mnoznik_ery: m,
    },
  });
}

// Równoważność bootstrapu (złoto jednostek) i utrzymanie x4.
const goldRows = units.map((u) => {
  const cost = scaleCostByEpoch(unitCostFromDef(u), u.Epoka);
  const upkeepRaw = u['Utrzymanie (Pieniądz/turę)'];
  const upkeep = unitUpkeepFromTable(
    typeof upkeepRaw === 'number' && Number.isFinite(upkeepRaw) ? upkeepRaw : undefined,
    u.Epoka,
  );
  return {
    jednostka: u.Jednostka,
    epoka: u.Epoka,
    pieniadz_koszt: cost,
    utrzymanie_pieniadz_ture: upkeep ?? 0,
    baza: {
      pieniadz_koszt_zrodlo: u['Pieniądz (koszt)'],
      rola_linia: u['Rola (linia)'] ?? null,
      super_jednostka: u['Super-jednostka'] ?? null,
      utrzymanie_zrodlo: upkeepRaw ?? null,
    },
  };
});

const meta = (zrodlo, regula) => ({
  status: 'BOOTSTRAP: wartosci startowe rozwiniete z regul weba. Zrodlem prawdy do recznego balansu jest TA tabela (edytuj liczby, nie mnozniki). Tabela NIE jest porownywana ze wzorem przy buildzie.',
  zrodlo,
  regula_weba: regula,
  wygenerowano: 'R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1 runda 3, generator: gen-work-gold.mjs',
  uwaga_stan: 'Wartosci dotycza stanu bazowego web: pace niski (x1), trudnosc normal (x1), bez ulgi cywilizacji. Stany (b) NIE sa rozwiniete w tej tabeli (P3-19 sek. 9).',
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/building-work-costs.json`, JSON.stringify({
  meta: meta('gra/data/buildings.json @ edb8fb56 (identyczny z rust-port/engine/data/buildings.json)',
    'production.ts itemCost budynek (l.322-334) x buildingEraCostMultiplier (building-stock-cost.ts l.74-81); buildingWorkCost stan bazowy (production.ts l.514-529: 0.25x2x2 = 1.0)'),
  wiersze: workRows,
}, null, 2) + '\n');
fs.writeFileSync(`${outDir}/unit-gold-costs.json`, JSON.stringify({
  meta: meta('gra/data/units.json @ edb8fb56 + gra/data/miasto-params.json (domyslne koszty roli)',
    'production.ts unitCostFromDef (l.255-289) + scaleCostByEpoch(Epoka); economy-upkeep.ts unitUpkeep (l.962-977) x4 po scaleCostByEpoch (buildUnitUpkeepTable l.1000-1023). UWAGA: regula kategorii (zwiadowca/super -> 0, economy-upkeep.ts:967-968) zalezy od pola kategorii instancji (main.ts:7193), NIE od units.json; NIE odtworzono w tabeli (P3-19 sek. 9)'),
  wiersze: goldRows,
}, null, 2) + '\n');

console.log(`praca: sprawdzone=${workSprawdzone} rozbieznosci=${workRozbieznosci} budynki=${workRows.length}`);
console.log(`zloto: jednostki=${goldRows.length}`);
