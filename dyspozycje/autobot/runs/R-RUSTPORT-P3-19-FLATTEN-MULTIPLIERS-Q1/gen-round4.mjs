// Runda 4 (P3-19, zarzuty rundy 3): generator tabel rozwiniętych wartości dla wierszy 12-18, 25
// oraz osi (b) Pracy budynków i złota jednostek (stany: pace x tryb trudności/właściciela x zniżka cywilizacji).
// Literalna kopia logiki weba (pin edb8fb56, odczyt przez `git archive edb8fb56 gra/src gra/data`), TS -> JS.
// Każda funkcja ma źródło plik:linia. Wynik: pliki JSON w rust-port/engine/data/derived/ + raport równoważności.
// argv: <webRoot (katalog z gra/src i gra/data)> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [, , webRoot, outDir] = process.argv;
const D = (p) => JSON.parse(fs.readFileSync(path.join(webRoot, 'gra/data', p), 'utf8'));
const units = D('units.json');
const buildings = D('buildings.json');
const civs = Object.values(D('civs.json').cywilizacje);
const civMatrix = D('civ-matrix.json');
const tech = D('tech.json');
const improvements = D('terrain-improvements.json');
const wonders = D('wonders.json').cuda;
const econ = D('econ-params.json');
const miasto = D('miasto-params.json');
const tempoCfg = tech.tempo_gry;
const techRows = tech.technologie;

// ---------------------------------------------------------------- stałe (kopia literalna)
// r-stawki-strojenie.ts:6,9 (R_STAWKI_KOSZT_MULT=2, R_STAWKI_FALA2_MULT=2)
const R_STAWKI_KOSZT_MULT = 2;
const R_STAWKI_FALA2_MULT = 2;
// r-stawki-strojenie.ts:12-13 (FALA1xFALA2)
const R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;
// production.ts:511 (GLOBAL_BUILDING_PROD_MULT = 0.25)
const GLOBAL_BUILDING_PROD_MULT = 0.25;
// tech-tempo.ts:22-26 (TEMPO_GRY)
const TEMPO_GRY = { szybka: 1.0, standardowa: 2.0, dluga: 4.0 };
// building-cost-tempo.ts:19-23 / unit-cost-tempo.ts:19-23
const KOSZT_BUDYNKOW_PACE = { niski: 1.0, normalny: 2.0, wysoki: 4.0 };
const KOSZT_JEDNOSTEK_PACE = { niski: 1.0, normalny: 2.0, wysoki: 4.0 };
// population-growth-v85.ts:27,28,44
const WYZYWIENIE_MIN = 0;
const WYZYWIENIE_MAX = 6;
const WYZYWIENIE_STEP = 0.5;
// terrain-improvements.ts:76-80
const TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS = { 1: 1, 2: 2, 3: 4 };

// ---------------------------------------------------------------- epoki (building-stock-cost.ts:28-81)
export function epochCostMultiplier(epoch) {
  if (typeof epoch === 'number' && Number.isFinite(epoch)) {
    const ordinal = Math.floor(epoch);
    if (ordinal >= 3) return 4;
    if (ordinal >= 2) return 2;
    return 1;
  }
  if (typeof epoch !== 'string') return 1;
  const normalized = epoch.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return epochCostMultiplier(Number(normalized));
  if (normalized === 'kamien' || normalized === 'stone' || normalized === '1') return 1;
  if (normalized === 'braz' || normalized === 'bronze' || normalized === '2') return 2;
  if (['zelazo', 'zelazo+', 'iron', 'iron+', 'iron plus', 'steel', 'stal'].includes(normalized)) return 4;
  return 1;
}
export function scaleCostByEpoch(cost, epoch) {
  if (!Number.isFinite(cost) || cost < 0) return 0;
  if (cost === 0) return 0;
  return Math.max(1, Math.round(cost * epochCostMultiplier(epoch)));
}
export function buildingEraCostMultiplier(epokaWejscia) {
  const era = typeof epokaWejscia === 'number' && Number.isFinite(epokaWejscia) ? Math.floor(epokaWejscia) : 1;
  if (era >= 3) return 4;
  if (era >= 2) return 2;
  return 1;
}

// ---------------------------------------------------------------- Praca budynku (production.ts:255-337, 514-529)
// itemCost('budynek', id, data, level)
export function itemCostBuilding(b, level) {
  const lvl = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const przyrostKosztu = Number.isFinite(b.przyrostKosztu) ? b.przyrostKosztu : 0;
  const baseCost = Math.round(b.kosztBudowy + przyrostKosztu * (lvl - 1));
  return Math.round(baseCost * buildingEraCostMultiplier(b.epokaWejscia));
}
// civ-bonuses.ts:345-370: civBuildingCostDiscount (realizuje 'miasto', typ koszt_redukcja, cel budynki, cap 0.75)
export function civBuildingCostDiscountFromBonusy(bonusy) {
  if (!bonusy || !bonusy.length) return 0;
  let disc = 0;
  for (const b of bonusy) {
    if (b.realizuje !== 'miasto') continue;
    if (b.typ !== 'koszt_redukcja') continue;
    if (b.cel !== 'budynki') continue;
    if (typeof b.wartosc === 'number' && b.wartosc > 0) disc += b.wartosc;
  }
  return Math.min(disc, 0.75);
}
// civ-bonuses.ts:363-370 buildingCostAfterCivDiscount
export function buildingCostAfterCivDiscount(baseCost, disc) {
  if (disc <= 0 || baseCost <= 0) return baseCost;
  return Math.max(1, Math.floor(baseCost * (1 - disc)));
}
// production.ts:514-529 buildingWorkCost; trudność: difficulty-cost.ts:64-82 (getCostMultiplierForOwner / applyDifficultyCostMultiplier)
export function buildingWorkCost(baseCost, disc, pace, diffMult) {
  const afterCiv = buildingCostAfterCivDiscount(baseCost, disc);
  const afterPace = Math.max(1, Math.round(afterCiv * KOSZT_BUDYNKOW_PACE[pace]));
  const afterGlobal = Math.max(1, Math.round(afterPace * GLOBAL_BUILDING_PROD_MULT * R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT));
  return Math.max(1, Math.round(afterGlobal * diffMult));
}

// ---------------------------------------------------------------- trudność (difficulty-cost.ts:64-72)
// tryb = {poziom trudności} x {gracz | AI}. Gracz = ownerId 0 (isPlayerOwner, humanOwnerIds=[0]).
export const TRYBY = [
  { tryb: 'normalny', poziom: 'normal', rola: 'gracz_lub_ai' },
  { tryb: 'latwy_gracz', poziom: 'easy', rola: 'gracz' },
  { tryb: 'latwy_ai', poziom: 'easy', rola: 'ai' },
  { tryb: 'trudny_gracz', poziom: 'hard', rola: 'gracz' },
  { tryb: 'trudny_ai', poziom: 'hard', rola: 'ai' },
];
export function getCostMultiplierForOwner(poziom, isPlayer) {
  if (poziom === 'normal') return 1;
  if (poziom === 'easy') return isPlayer ? 1 : 2;
  return isPlayer ? 2 : 1;
}
export function trybMultiplier(t) {
  return getCostMultiplierForOwner(t.poziom, t.rola === 'gracz');
}

// ---------------------------------------------------------------- zniżki cywilizacji (dane z civs.json / civ-matrix.json)
// Zbiór wartości zniżki Pracy budynków: po wszystkich cywilizacjach z civs.json (civ-bonuses.ts:345-370).
export function civBuildingDiscountStates() {
  const set = new Set([0]);
  for (const c of civs) set.add(civBuildingCostDiscountFromBonusy(c.bonusy));
  return [...set].sort((a, b) => a - b);
}
// Zniżka rekrutacji jednostek (production.ts:565-577 civRecruitmentDiscount): bonusy matrix (civ-bonuses.ts:307)
// realizuje 'ekonomia' + (opis zawiera 'rekrutacji' lub matrixParamId walka_koszt_rekrutacji_proc).
export function civRecruitmentDiscountFromMatrix(civKey) {
  const cv = civMatrix.cywilizacje[civKey];
  const v = cv?.params?.walka_koszt_rekrutacji_proc;
  return typeof v === 'number' && v > 0 ? v : 0;
}
export function civRecruitmentDiscountStates() {
  const set = new Set([0]);
  for (const k of Object.keys(civMatrix.cywilizacje)) set.add(civRecruitmentDiscountFromMatrix(k));
  return [...set].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- złoto jednostki (production.ts:535-551, 565-577)
// unitMoneyCost(baseCost, ...): baseCost = itemCost('jednostka') = scaleCostByEpoch(unitCostFromDef(u), Epoka)
export function unitMoneyCost(baseCost, recDisc, pace, diffMult) {
  if (!Number.isFinite(baseCost) || baseCost <= 0) return 0;
  let koszt = baseCost;
  if (recDisc > 0) koszt = Math.max(1, Math.floor(koszt * (1 - recDisc)));
  const afterPace = Math.max(1, Math.round(koszt * KOSZT_JEDNOSTEK_PACE[pace]));
  return Math.max(1, Math.round(afterPace * diffMult));
}
// production.ts:255-289 unitCostFromDef (kopia literalna; domyślne koszty z miasto-params.json)
export function makeUnitCostFromDef(miastoP) {
  const DEFAULT_COST_BY_ROLE = {
    Wsparcie: miastoP.jednostka_koszt_rola_wsparcie?.wartosc ?? 12,
    Dystans: miastoP.jednostka_koszt_rola_dystans?.wartosc ?? 8,
    'Wręcz': miastoP.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
    Wrecz: miastoP.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
    Konnica: miastoP.jednostka_koszt_rola_konnica?.wartosc ?? 16,
  };
  const DEFAULT_UNIT_COST = miastoP.jednostka_koszt_domyslny?.wartosc ?? 10;
  return (def) => {
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
    return DEFAULT_UNIT_COST;
  };
}

// ---------------------------------------------------------------- utrzymanie złota budynku (economy-upkeep.ts:637-657)
// buildingEffectAtLevel (production.ts:247-251): baza + przyrost * (max(1,floor(level)) - 1)
export function buildingUpkeepGold(b, level) {
  const lvl = level >= 1 ? level : 1;
  const base = b.utrzymanie;
  const wzrost = Number.isFinite(b.przyrostUtrzymania) ? b.przyrostUtrzymania : 0;
  const n = Math.max(1, Math.floor(lvl));
  const raw = Math.floor(base + wzrost * (n - 1));
  const fala2Upkeep = Math.floor(raw * R_STAWKI_FALA2_MULT);
  return Math.floor(fala2Upkeep * buildingEraCostMultiplier(b.epokaWejscia));
}

// ---------------------------------------------------------------- żywność wojska (economy-upkeep.ts:1038-1066, 608-611, 1026-1048)
// readNum(em, key, difficulty, fallback) -> row[difficulty] (economy-upkeep.ts:77-86)
function econRow(group, key, diff, fallback) {
  const row = econ[group]?.[key];
  const v = row ? row[diff] : undefined;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
export function upkeepParamsFor(diff) {
  return {
    zywnoscJednostkaRuch: econRow('ekonomia_miasta', 'zywnosc_jednostka_ruch', diff, 1),
    zywnoscJednostkaOboz: econRow('ekonomia_miasta', 'zywnosc_jednostka_oboz', diff, 0.5),
    zywnoscMnoznikTerytorium: econRow('ekonomia_miasta', 'zywnosc_mnoznik_terytorium_wlasne', diff, 1),
    zywnoscMnoznikPozaTerytorium: econRow('ekonomia_miasta', 'zywnosc_mnoznik_poza_terytorium', diff, 2),
  };
}
// buildUnitFoodTable (economy-upkeep.ts:1051-1066): scaleCostByEpoch(direct, Epoka)
export function unitFoodBase(u) {
  const direct = u['żywność/turę'];
  if (typeof direct === 'number' && Number.isFinite(direct)) return scaleCostByEpoch(direct, u.Epoka);
  return undefined;
}
// unitFoodPerTurn (economy-upkeep.ts:1038-1066) — kopia literalna, foodTable = wpis z units.json
export function unitFoodPerTurn(foodBase, camping, ownTerritory, p, rucNieTabela = p.zywnoscJednostkaRuch) {
  let base = rucNieTabela;
  if (typeof foodBase === 'number') base = foodBase;
  if (base <= 0) return 0;
  if (camping) {
    const ratio = p.zywnoscJednostkaOboz / (p.zywnoscJednostkaRuch || 1);
    base = base * ratio;
  }
  const mnoznikTerytorium = ownTerritory ? (p.zywnoscMnoznikTerytorium ?? 1) : (p.zywnoscMnoznikPozaTerytorium ?? 2);
  const food = base * mnoznikTerytorium;
  if (food <= 0) return 0;
  return food * R_STAWKI_FALA1_FALA2_MULT;
}

// ---------------------------------------------------------------- racje (population-growth-v85.ts:165-191)
export function clampPoziomRacji(n) {
  const clamped = Math.min(WYZYWIENIE_MAX, Math.max(WYZYWIENIE_MIN, n));
  return Math.round(clamped / WYZYWIENIE_STEP) * WYZYWIENIE_STEP;
}
export function rationFoodCostPerPop(level) {
  return clampPoziomRacji(level) * R_STAWKI_KOSZT_MULT;
}

// ---------------------------------------------------------------- badania (difficulty-cost.ts:86-101, tech-tempo.ts:37-40)
export function scaledResearchCost(baseCost, tempoKey, diffMult, epoka) {
  const afterTempo = Math.max(1, Math.round(baseCost * TEMPO_GRY[tempoKey]));
  let afterGlobal = Math.max(1, Math.round(afterTempo * R_STAWKI_KOSZT_MULT));
  const era = normalizeResearchEra(epoka);
  if (era === 'braz' || era === 'zelazo') afterGlobal = Math.max(1, Math.round(afterGlobal * R_STAWKI_FALA2_MULT));
  return Math.max(1, Math.round(afterGlobal * diffMult));
}
// r-stawki-strojenie.ts:20-27 (normalizeResearchEra) — kopia literalna
export function normalizeResearchEra(epoka) {
  if (!epoka) return 'kamien';
  const n = epoka.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  if (n === 'braz' || n === 'brąz') return 'braz';
  if (n === 'zelazo' || n === 'żelazo') return 'zelazo';
  if (n === 'kamien' || n === 'kamień') return 'kamien';
  return n;
}

// ---------------------------------------------------------------- ulepszenia terenu (terrain-improvements.ts:76-110)
// r-stawki-strojenie.ts:50-53 scaleImprovementWorkCost
export function scaleImprovementWorkCost(base) {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(1, Math.round(base * R_STAWKI_FALA2_MULT));
}
export function terrainImprovementEraMultiplier(era) {
  const normalized = typeof era === 'number' && Number.isFinite(era) ? Math.floor(era) : 1;
  if (normalized <= 1) return TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS[1];
  const mapped = TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS[normalized];
  if (mapped !== undefined) return mapped;
  return TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS[3] * Math.pow(2, normalized - 3);
}
export function scaleTerrainImprovementWorkCost(base, era) {
  const stoneBase = scaleImprovementWorkCost(base);
  if (stoneBase <= 0) return 0;
  return stoneBase * terrainImprovementEraMultiplier(era);
}

// ---------------------------------------------------------------- cuda (r-stawki-strojenie.ts:56-63)
export function scaledWonderWorkCost(kosztBudowy) {
  if (!Number.isFinite(kosztBudowy) || kosztBudowy <= 0) return 0;
  return Math.max(1, Math.round(kosztBudowy * R_STAWKI_FALA2_MULT));
}

// ---------------------------------------------------------------- magazyn (economy-upkeep.ts:392-394, 448-458)
export function magazynEraMultiplier(era) {
  const e = Number.isFinite(era) && era > 1 ? era : 1;
  return Math.pow(2, e - 1);
}
export function ownerResourceCapacityPerType(magazynCount, p, era) {
  const cnt = Number.isFinite(magazynCount) && magazynCount > 0 ? Math.floor(magazynCount) : 0;
  return (p.bazaSurowcePanstwo + p.bonusSurowceNaBudynek * cnt) * magazynEraMultiplier(era);
}
// readNum(g, key, difficulty) (economy-upkeep.ts:120-127)
function globalRow(key, diff) {
  return econRow('globalne', key, diff, NaN);
}

// ================================================================ GENEROWANIE
const pinInfo = process.env.PIN_WEB || 'edb8fb56';
const report = {};

// --- 1. Praca budynków (stany: poziom x pace x tryb x zniżka cywilizacji) — wiersze 8-9, oś (b)
const znizkiBudynkow = civBuildingDiscountStates();
const PACE_KEYS = Object.keys(KOSZT_BUDYNKOW_PACE);
const workRows = [];
let workSprawdzone = 0;
let workRozb = 0;
for (const b of buildings) {
  const maks = Number.isFinite(b.maksPoziom) ? Math.floor(b.maksPoziom) : 1;
  for (let lvl = 1; lvl <= maks; lvl++) {
    const base = itemCostBuilding(b, lvl);
    const wartosci = [];
    for (const pace of PACE_KEYS) {
      for (const t of TRYBY) {
        for (const disc of znizkiBudynkow) {
          const v = buildingWorkCost(base, disc, pace, trybMultiplier(t));
          // production.ts:635-638 buildingGoldPurchaseCost(pracaKoszt) = max(1, round(praca x 2)); BUILDING_GOLD_PURCHASE_MULT=2 (production.ts:635); wywołanie cityPanel.ts:6305
          const zakup = Math.max(1, Math.round(v * 2));
          wartosci.push({ pace, tryb: t.tryb, znizka_cywilizacji: disc, praca: v, zakup_zloto: zakup });
          workSprawdzone++;
        }
      }
    }
    workRows.push({ budynek: b.id, poziom: lvl, epokaWejscia: b.epokaWejscia, koszt_przed_tempem: base, wartosci });
  }
}
report.praca = { budynki: buildings.length, wiersze: workRows.length, wartosci: workSprawdzone, znizki: znizkiBudynkow };

// --- 2. Złoto jednostek (stany: pace x tryb x zniżka rekrutacji) — wiersz 10, oś (b)
const makeCost = makeUnitCostFromDef(miasto);
const recStates = civRecruitmentDiscountStates();
const goldRows = [];
let goldSprawdzone = 0;
for (const u of units) {
  const base = scaleCostByEpoch(makeCost(u), u.Epoka);
  const wartosci = [];
  for (const pace of PACE_KEYS) {
    for (const t of TRYBY) {
      for (const rec of recStates) {
        wartosci.push({ pace, tryb: t.tryb, znizka_rekrutacji: rec, pieniadz: unitMoneyCost(base, rec, pace, trybMultiplier(t)) });
        goldSprawdzone++;
      }
    }
  }
  goldRows.push({ jednostka: u['Jednostka'], epoka: u.Epoka, koszt_przed_tempem: base, wartosci });
}
report.zloto = { jednostki: units.length, wartosci: goldSprawdzone, znizki_rekrutacji: recStates };

// --- 3. Utrzymanie złota budynku — wiersz 12 (statyczne, per poziom)
const upkeepRows = [];
let upkeepSprawdzone = 0;
for (const b of buildings) {
  const maks = Number.isFinite(b.maksPoziom) ? Math.floor(b.maksPoziom) : 1;
  for (let lvl = 1; lvl <= maks; lvl++) {
    upkeepRows.push({ budynek: b.id, poziom: lvl, epokaWejscia: b.epokaWejscia, utrzymanie_zlota: buildingUpkeepGold(b, lvl) });
    upkeepSprawdzone++;
  }
}
report.utrzymanie_zlota_budynku = { wiersze: upkeepRows.length };

// --- 4. Żywność wojska — wiersz 13 (ruch/obóz x własne/poza x poziom trudności), w setnych (x100)
const POZIOMY = ['easy', 'normal', 'hard'];
const foodRows = [];
let foodSprawdzone = 0;
for (const u of units) {
  const fb = unitFoodBase(u);
  const wartosci = [];
  for (const diff of POZIOMY) {
    const p = upkeepParamsFor(diff);
    for (const camping of [false, true]) {
      for (const own of [true, false]) {
        const food = unitFoodPerTurn(fb, camping, own, p);
        wartosci.push({
          stan: camping ? 'oboz' : 'ruch',
          terytorium: own ? 'wlasne' : 'poza',
          poziom_trudnosci: diff,
          zywnosc_setne: Math.round(food * 100),
          zywnosc_dokladnie: food,
        });
        foodSprawdzone++;
      }
    }
  }
  foodRows.push({ jednostka: u['Jednostka'], epoka: u.Epoka, zywnosc_baza_tabela: fb ?? null, wartosci });
}
report.zywnosc_wojska = { jednostki: units.length, wartosci: foodSprawdzone };

// --- 5. Racje — wiersz 14 (żywność na mieszkańca = poziom x R_STAWKI_KOSZT_MULT)
const racjeRows = [];
for (let poz = WYZYWIENIE_MIN; poz <= WYZYWIENIE_MAX + 1e-9; poz += WYZYWIENIE_STEP) {
  racjeRows.push({ poziom_racji: poz, zywnosc_na_mieszkanca: rationFoodCostPerPop(poz) });
}
report.racje = { wiersze: racjeRows.length };

// --- 6. Badania — wiersz 15 (technologia x tempo x tryb)
const researchRows = [];
let researchSprawdzone = 0;
for (const t of techRows) {
  const base = t['Koszt nauki'];
  const wartosci = [];
  for (const tempo of Object.keys(TEMPO_GRY)) {
    for (const tr of TRYBY) {
      wartosci.push({ tempo, tryb: tr.tryb, koszt: scaledResearchCost(base, tempo, trybMultiplier(tr), t.Epoka) });
      researchSprawdzone++;
    }
  }
  researchRows.push({ technologia: t['Technologia'], epoka: t.Epoka, koszt_bazowy: base, wartosci });
}
report.badania = { technologie: techRows.length, wartosci: researchSprawdzone };

// --- 7. Ulepszenia terenu — wiersze 16 i 25 (statyczne)
const impRows = [];
for (const key of Object.keys(improvements)) {
  if (key.startsWith('_')) continue;
  const row = improvements[key];
  impRows.push({
    ulepszenie: key,
    nazwa: row.nazwa,
    epoka: row.epoka,
    koszt_praca_baza: row.koszt_praca ?? 0,
    praca: scaleTerrainImprovementWorkCost(row.koszt_praca ?? 0, row.epoka),
  });
}
report.ulepszenia = { wiersze: impRows.length };

// --- 8. Cuda — wiersz 17 (statyczne)
const wonderRows = wonders.map((w) => ({
  cud: w.id,
  nazwa: w.nazwa,
  kosztBudowy: w.kosztBudowy,
  praca: scaledWonderWorkCost(w.kosztBudowy),
  zywnosc: scaledWonderWorkCost(w.kosztBudowy),
}));
report.cuda = { wiersze: wonderRows.length };

// --- 9. Magazyn — wiersz 18 (era x tryb poziomu trudności; liczba Magazynów = wejście jawne)
const storageRows = [];
for (const era of [1, 2, 3]) {
  const wartosci = [];
  for (const diff of POZIOMY) {
    const baza = globalRow('magazyn_baza_surowce', diff);
    const bonus = globalRow('magazyn_bonus_surowce_na_budynek', diff);
    const mult = magazynEraMultiplier(era);
    const bazaZyw = globalRow('magazyn_baza_zywnosc', diff);
    const mnSpich = globalRow('magazyn_mnoznik_spichlerz', diff);
    wartosci.push({
      poziom_trudnosci: diff,
      surowce_baza_epoki: baza * mult,
      surowce_bonus_na_magazyn_epoki: bonus * mult,
      zywnosc_baza: bazaZyw,
      zywnosc_mnoznik_spichlerz: mnSpich,
    });
  }
  storageRows.push({ epoka_ordynal: era, mnoznik_ery: magazynEraMultiplier(era), wartosci });
}
report.magazyn = { wiersze: storageRows.length };

// --- Równoważność bootstrapu (jednorazowo): tabela Praca/złoto/żywność/magazyn vs literalna chain (ta sama funkcja)
// Sprawdzenie wewnętrzne: wartości z tabel równe wyliczeniu chain dla tego samego wejścia (różnica = 0).
let rozbieznosci = 0;
for (const r of workRows) {
  const b = buildings.find((x) => x.id === r.budynek);
  for (const w of r.wartosci) {
    const t = TRYBY.find((x) => x.tryb === w.tryb);
    const direct = buildingWorkCost(itemCostBuilding(b, r.poziom), w.znizka_cywilizacji, w.pace, trybMultiplier(t));
    if (direct !== w.praca) rozbieznosci++;
  }
}
report.rownowaznosc = { praca_rozbieznosci: rozbieznosci };

// --- Zapis
const meta = (zrodlo, regula, uwaga) => ({
  status: 'BOOTSTRAP: wartości startowe rozwinięte z reguł weba. Źródłem prawdy do ręcznego balansu jest TA tabela (edytuj liczby, nie mnożniki). Tabela NIE jest porównywana ze wzorem przy buildzie.',
  zrodlo,
  regula_weba: regula,
  pin_web: pinInfo,
  wygenerowano: 'R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1 runda 4, generator: gen-round4.mjs',
  uwaga,
});
fs.mkdirSync(outDir, { recursive: true });
const write = (name, obj) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(obj, null, 2) + '\n');
write('building-work-states.json', {
  meta: meta('gra/data/buildings.json, civs.json', 'production.ts:322-334 itemCost; civ-bonuses.ts:345-370; building-cost-tempo.ts:19-40; production.ts:514-529; difficulty-cost.ts:64-82', 'Oś (b): pace (niski/normalny/wysoki) x tryb (poziom trudności x gracz/AI) x zniżka cywilizacji (koszt_redukcja budynki).'),
  osie: { pace: PACE_KEYS, tryb: TRYBY.map((t) => t.tryb), znizka_cywilizacji: znizkiBudynkow },
  wiersze: workRows,
});
write('unit-gold-states.json', {
  meta: meta('gra/data/units.json, miasto-params.json, civ-matrix.json', 'production.ts:255-289 unitCostFromDef; production.ts:535-551 unitMoneyCost; production.ts:565-577 civRecruitmentDiscount; unit-cost-tempo.ts:19-39; difficulty-cost.ts:64-82', 'Oś (b): pace x tryb x zniżka rekrutacji (walka_koszt_rekrutacji_proc).'),
  osie: { pace: PACE_KEYS, tryb: TRYBY.map((t) => t.tryb), znizka_rekrutacji: recStates },
  wiersze: goldRows,
});
write('building-gold-upkeep.json', {
  meta: meta('gra/data/buildings.json', 'economy-upkeep.ts:637-657 buildingUpkeep (floor(floor(raw*2)*m_ery)); production.ts:247-251 buildingEffectAtLevel', 'Statyczne per poziom; brak zależności od trudności (readNum używany tylko dla fallbacku bez wpisu, którego nie ma w danych).'),
  wiersze: upkeepRows,
});
write('unit-food.json', {
  meta: meta('gra/data/units.json, econ-params.json', 'economy-upkeep.ts:1038-1066 unitFoodPerTurn, :1051-1066 buildUnitFoodTable, :608-611 readNum, r-stawki-strojenie.ts:12 (x4)', 'Wartości w setnych żywności (zywnosc_setne = żywność x 100), liczby całkowite. Zależność od trudności tylko w stanie obozu (zywnosc_jednostka_oboz / zywnosc_jednostka_ruch).'),
  osie: { stan: ['ruch', 'oboz'], terytorium: ['wlasne', 'poza'], poziom_trudnosci: POZIOMY },
  wiersze: foodRows,
});
write('racje.json', {
  meta: meta('gra/src/game/population-growth-v85.ts', 'population-growth-v85.ts:27-44 (WYZYWIENIE 0..6 krok 0,5), :165-191 clampPoziomRacji / rationFoodCostPerPop', 'Żywność na mieszkańca = poziom x 2 (R_STAWKI_KOSZT_MULT).'),
  wiersze: racjeRows,
});
write('research-costs.json', {
  meta: meta('gra/data/tech.json', 'difficulty-cost.ts:86-101 scaledResearchCost; tech-tempo.ts:22-40; r-stawki-strojenie.ts:20-33 (Brąz/Żelazo x2)', 'Oś (b): tempo (szybka/standardowa/dluga) x tryb trudności x gracz/AI.'),
  osie: { tempo: Object.keys(TEMPO_GRY), tryb: TRYBY.map((t) => t.tryb) },
  wiersze: researchRows,
});
write('improvement-work.json', {
  meta: meta('gra/data/terrain-improvements.json', 'terrain-improvements.ts:76-110 scaleTerrainImprovementWorkCost; r-stawki-strojenie.ts:50-53', 'Statyczne per ulepszenie; epoka z terrain-improvements.json.'),
  wiersze: impRows,
});
write('wonder-work.json', {
  meta: meta('gra/data/wonders.json', 'r-stawki-strojenie.ts:56-63 scaledWonderWorkCost / scaledWonderFoodCost', 'Statyczne per cud.'),
  wiersze: wonderRows,
});
write('storage-caps.json', {
  meta: meta('gra/data/econ-params.json (globalne)', 'economy-upkeep.ts:392-394 magazynEraMultiplier, :448-458 ownerResourceCapacityPerType, :120-127 readNum', 'cap(typ) = surowce_baza_epoki + surowce_bonus_na_magazyn_epoki x liczba_Magazynow (liczba = wejście jawne, nie w tabeli).'),
  osie: { poziom_trudnosci: POZIOMY },
  wiersze: storageRows,
});

console.log(JSON.stringify(report, null, 2));
console.log(`EXIT_GEN=0`);
