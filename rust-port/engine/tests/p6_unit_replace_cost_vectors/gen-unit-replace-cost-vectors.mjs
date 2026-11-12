// P6-UNIT-REPLACE-L3-KOSZT: generator wektorow dla kosztu Pieniadza i max_hp po zamianie jednostki.
//
// Wykonuje TEKST funkcji z pinu (gra/src, bez przeróbki logiki; tylko usuniecie typow i `export`):
//   - production.ts:      civMatrixCostDiscount, civRecruitmentDiscount, unitMoneyCost
//   - unit-cost-tempo.ts: KOSZT_JEDNOSTEK_PACE, applyUnitCostPace
//   - difficulty-cost.ts: isPlayerOwner, getCostMultiplierForOwner, applyDifficultyCostMultiplier
//   - building-stock-cost.ts: epochCostMultiplier, scaleCostByEpoch (baza kosztu po skali epoki)
//   - unit-card-stats.ts: roundCardStat, effectiveMaxHp
//   - civ-bonuses.ts:     applyMultiplier
//   - unit-building-bonuses.ts: unitParametryBonusProc, unitParametryBonusFrac
//   - veteran.ts:         VETERAN_MAX_BATTLES_TRACKED, VETERAN_BONUS_FRAC, veteranBattlesWon,
//                         veteranStarCount, veteranBonusFracForWins, veteranCombatBonusFrac
//   - main.ts:            unitHealth (33093) i normFieldVal (wlasna definicja z pinu)
//
// Wejscia danych: pin gra/data/units.json (nazwy, Epoka, Pieniądz (koszt), health/Health).
// Markery macierzy: zestawy jawne w tym pliku (konstrukcja wierszy macierzy jest testowana osobno
// w p6_repin_b2_production.rs na pinie 91dc998a; funkcje kosztu nie zmienily sie do 07d2fbd72).
//
// Uruchomienie (sciezki bezwzgledne; katalog pina POZA repo, np. git archive):
//   node gen-unit-replace-cost-vectors.mjs <pin gra/src> <pin gra/data/units.json> <wyjscie.json> <pin-sha>

import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';

const [, , srcDir, unitsPath, outPath, pinSha] = process.argv;
if (!srcDir || !unitsPath || !outPath || !pinSha) {
  console.error('usage: node gen-unit-replace-cost-vectors.mjs <pin gra/src> <pin units.json> <out.json> <pin-sha>');
  process.exit(2);
}

const readSrc = (rel) => fs.readFileSync(`${srcDir}/${rel}`, 'utf8');

// Wyciaga blok `export function NAME` / `function NAME` (sygnatura + cialo z dopasowaniem nawiasow).
function grabFunction(src, name) {
  const re = new RegExp(`(export\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(src);
  if (!m) throw new Error(`brak funkcji ${name}`);
  let i = m.index + m[0].length - 1; // na '('
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
  }
  // cialo: pierwszy '{' po sygnaturze (typ zwracany nie zawiera klamer w tych funkcjach)
  const open = src.indexOf('{', i);
  let d = 0;
  let j = open;
  for (; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (d === 0) { j++; break; } }
  }
  return src.slice(m.index, j).replace(/^export\s+/, '');
}

// Wyciaga `export const NAME ... = <wyrazenie>;` (do srednika na poziomie 0 nawiasow).
function grabConst(src, name) {
  const re = new RegExp(`(export\\s+)?const\\s+${name}\\b`);
  const m = re.exec(src);
  if (!m) throw new Error(`brak stalej ${name}`);
  const eq = src.indexOf('=', m.index);
  let depth = 0;
  let j = eq + 1;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    else if (c === ';' && depth === 0) { j++; break; }
  }
  return src.slice(m.index, j).replace(/^export\s+/, '');
}

const production = readSrc('game/production.ts');
const tempo = readSrc('game/unit-cost-tempo.ts');
const difficulty = readSrc('game/difficulty-cost.ts');
const stock = readSrc('game/building-stock-cost.ts');
const cardStats = readSrc('game/unit-card-stats.ts');
const civBonuses = readSrc('game/civ-bonuses.ts');
const buildingBonuses = readSrc('game/unit-building-bonuses.ts');
const veteran = readSrc('game/veteran.ts');

const normFieldValSrc = (() => {
  const main = readSrc('main.ts');
  return grabFunction(main, 'normFieldVal');
})();

const parts = [
  grabConst(tempo, 'KOSZT_JEDNOSTEK_PACE'),
  grabFunction(tempo, 'applyUnitCostPace'),
  grabFunction(production, 'civMatrixCostDiscount'),
  grabFunction(production, 'civRecruitmentDiscount'),
  grabFunction(production, 'unitMoneyCost'),
  grabFunction(difficulty, 'isPlayerOwner'),
  grabFunction(difficulty, 'getCostMultiplierForOwner'),
  grabFunction(difficulty, 'applyDifficultyCostMultiplier'),
  grabFunction(stock, 'epochCostMultiplier'),
  grabFunction(stock, 'scaleCostByEpoch'),
  grabFunction(cardStats, 'roundCardStat'),
  grabFunction(cardStats, 'effectiveMaxHp'),
  grabFunction(civBonuses, 'applyMultiplier'),
  grabFunction(buildingBonuses, 'unitParametryBonusProc'),
  grabFunction(buildingBonuses, 'unitParametryBonusFrac'),
  grabConst(veteran, 'VETERAN_MAX_BATTLES_TRACKED'),
  grabConst(veteran, 'VETERAN_BONUS_FRAC'),
  grabFunction(veteran, 'veteranBattlesWon'),
  grabFunction(veteran, 'veteranStarCount'),
  grabFunction(veteran, 'veteranBonusFracForWins'),
  grabFunction(veteran, 'veteranCombatBonusFrac'),
  normFieldValSrc,
  // main.ts:33093 unitHealth (tekst pinu): def['health'] ?? def['Health'], fallback 30.
  "function unitHealth(def) { return normFieldVal(def['health'] ?? def['Health'], 30); }",
];

const jsCode = parts.map((p) => stripTypeScriptTypes(p, { mode: 'strip' })).join('\n');
// Straznik: SHA-256 tekstu funkcji pinu, z ktorego powstaly wektory (zmiana pinu = nowy hash).
const textSha256 = createHash('sha256').update(parts.join('\n'), 'utf8').digest('hex');
const lib = new Function(`${jsCode}
return { civMatrixCostDiscount, civRecruitmentDiscount, unitMoneyCost, applyDifficultyCostMultiplier,
  applyUnitCostPace, scaleCostByEpoch, effectiveMaxHp, veteranCombatBonusFrac, unitParametryBonusFrac,
  unitHealth };`)();

// Zestawy markerow (CivBonusLite): realizuje/matrixParamId/cel jak w pinie.
const jednostki = (v) => ({ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: v, opis: 'Matrix:prod_koszt_jednostki_proc', realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc' });
const budynki = (v) => ({ typ: 'koszt_redukcja', cel: 'budynki', wartosc: v, opis: 'Matrix:prod_koszt_budynku_proc', realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' });
const rekrut = (cel, v) => ({ typ: 'koszt_redukcja', cel, wartosc: v, opis: 'Matrix:walka_koszt_rekrutacji_proc', realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' });
const markerSets = {
  brak: [],
  'jednostki-0.10': [budynki(0.2), jednostki(0.1)],
  'jednostki-0.00': [budynki(0), jednostki(0)],
  'jednostki-0.35': [budynki(0.05), jednostki(0.35)],
  'impi-0.15': [rekrut('impi', 0.15), jednostki(0.1)],
  'rekrut-0.10-wszyscy': [rekrut('jednostki', 0.1)],
  'nie-liczba': [jednostki('brak'), jednostki(0.2)],
  'rekrut-bez-ekonomii': [{ ...rekrut('jednostki', 0.5), realizuje: 'walka' }],
};
const DIFFS = { normal: 'normal', easy: 'easy', hard: 'hard' };
const paces = [
  { json: 'niski', js: 'niski' },
  { json: 'normalny', js: 'normalny' },
  { json: 'wysoki', js: 'wysoki' },
  { json: '', js: '' },
  { json: 1.5, js: 1.5 },
  { json: 0, js: 0 },
  { json: null, js: undefined },
];

const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));

const money = [];
for (const u of units) {
  const raw = u['Pieniądz (koszt)'];
  const epoka = u['Epoka'];
  // Baza po skali epoki (web itemCost -> scaleCostByEpoch(unitCostFromDef)); tylko dodatnie surowe koszty.
  if (typeof raw !== 'number' || !(raw > 0)) continue;
  const base = lib.scaleCostByEpoch(raw, epoka);
  for (const [setName, markers] of Object.entries(markerSets)) {
    for (const p of paces) {
      for (const owner of [0, 1]) {
        for (const diff of Object.keys(DIFFS)) {
          const out = lib.unitMoneyCost(base, markers, p.js, owner, diff, u['Jednostka']);
          money.push({
            unit: u['Jednostka'],
            base,
            markers: setName,
            pace: p.json,
            owner,
            diff,
            out,
          });
        }
      }
    }
  }
}

const hpProgress = [
  { parametryBonusProc: undefined, battlesSurvived: undefined },
  { parametryBonusProc: 0, battlesSurvived: 0 },
  { parametryBonusProc: 10, battlesSurvived: 1 },
  { parametryBonusProc: 20, battlesSurvived: 3 },
  { parametryBonusProc: 35, battlesSurvived: 2 },
  { parametryBonusProc: 20, battlesSurvived: 7 },
  { parametryBonusProc: 12.5, battlesSurvived: 0.5 },
];
const hp = [];
for (const u of units) {
  // Definicja jak w pinie: obie wersje klucza zdrowia (health TW v3 i Health).
  const def = {};
  if (u.health !== undefined) def.health = u.health;
  if (u.Health !== undefined) def.Health = u.Health;
  const baseHealth = lib.unitHealth(def);
  for (const pr of hpProgress) {
    const prog = {};
    if (pr.parametryBonusProc !== undefined) prog.parametryBonusProc = pr.parametryBonusProc;
    if (pr.battlesSurvived !== undefined) prog.battlesSurvived = pr.battlesSurvived;
    const out = lib.effectiveMaxHp(
      lib.unitHealth(def),
      lib.unitParametryBonusFrac(prog),
      lib.veteranCombatBonusFrac(prog),
    );
    hp.push({
      unit: u['Jednostka'],
      def,
      baseHealth,
      parametryBonusProc: pr.parametryBonusProc ?? null,
      battlesSurvived: pr.battlesSurvived ?? null,
      out,
    });
  }
}

// Dane do raportu rozbieznosci danych (pin vs Rust): baza kosztu i zdrowie per jednostka.
const pinData = units.map((u) => ({
  unit: u['Jednostka'],
  base: typeof u['Pieniądz (koszt)'] === 'number' && u['Pieniądz (koszt)'] > 0
    ? lib.scaleCostByEpoch(u['Pieniądz (koszt)'], u['Epoka'])
    : null,
  baseHealth: lib.unitHealth({ ...(u.health !== undefined ? { health: u.health } : {}), ...(u.Health !== undefined ? { Health: u.Health } : {}) }),
}));

const doc = {
  meta: {
    pinSha,
    textSha256,
    generator: 'gen-unit-replace-cost-vectors.mjs',
    source: 'gra/src/game/{production,unit-cost-tempo,difficulty-cost,building-stock-cost,unit-card-stats,civ-bonuses,unit-building-bonuses,veteran}.ts + main.ts (normFieldVal, unitHealth)',
    note: 'Wykonanie tekstu pinu w node (type-stripping). Markery: zestawy jawne (markerSets).',
  },
  markerSets,
  money,
  hp,
  pinData,
};
fs.writeFileSync(outPath, JSON.stringify(doc));
console.log(`money=${money.length} hp=${hp.length} pinData=${pinData.length}`);
