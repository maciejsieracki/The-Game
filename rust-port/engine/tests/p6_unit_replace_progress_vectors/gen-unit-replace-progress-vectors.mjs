// P6-UNIT-REPLACE-PROGRESS (dlug DLUG-UNIT-REPLACE-PROGRESS): generator wektorow newMaxHp po zamianie
// jednostki z postepem (battlesSurvived > 0 lub parametryBonusProc > 0).
//
// Wykonuje TEKST funkcji z pinu (gra/src, bez przeróbki logiki; tylko usuniecie typow i `export`):
//   - unit-card-stats.ts:       roundCardStat, effectiveMaxHp
//   - unit-building-bonuses.ts: unitParametryBonusProc, unitParametryBonusFrac
//   - veteran.ts:               VETERAN_MAX_BATTLES_TRACKED, VETERAN_BONUS_FRAC, veteranBattlesWon,
//                               veteranStarCount, veteranBonusFracForWins, veteranCombatBonusFrac
//   - main.ts:                  normFieldVal, unitHealth (33093)
//
// Wejscie danych: pin gra/data/units.json (klucz `health` / `Health` jak w pinie).
// Wynik: dla kazdego typu jednostki i kazdej pary (parametryBonusProc, battlesSurvived) z siatki,
// wartosc `newMaxHp` = effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(u), veteranCombatBonusFrac(u)).
//
// Uruchomienie (katalog pina POZA repo, np. git archive):
//   node gen-unit-replace-progress-vectors.mjs <pin gra/src> <pin gra/data/units.json> <wyjscie.json> <pin-sha>

import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';

const [, , srcDir, unitsPath, outPath, pinSha] = process.argv;
if (!srcDir || !unitsPath || !outPath || !pinSha) {
  console.error('usage: node gen-unit-replace-progress-vectors.mjs <pin gra/src> <pin units.json> <out.json> <pin-sha>');
  process.exit(2);
}

const readSrc = (rel) => fs.readFileSync(`${srcDir}/${rel}`, 'utf8');

// Wyciaga blok `export function NAME` / `function NAME` (sygnatura + cialo z dopasowaniem nawiasow).
function grabFunction(src, name) {
  const re = new RegExp(`(export\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(src);
  if (!m) throw new Error(`brak funkcji ${name}`);
  let i = m.index + m[0].length - 1;
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
  }
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

const cardStats = readSrc('game/unit-card-stats.ts');
const civBonuses = readSrc('game/civ-bonuses.ts');
const buildingBonuses = readSrc('game/unit-building-bonuses.ts');
const veteran = readSrc('game/veteran.ts');
const main = readSrc('main.ts');

const parts = [
  grabFunction(civBonuses, 'applyMultiplier'),
  grabFunction(cardStats, 'roundCardStat'),
  grabFunction(cardStats, 'effectiveMaxHp'),
  grabFunction(buildingBonuses, 'unitParametryBonusProc'),
  grabFunction(buildingBonuses, 'unitParametryBonusFrac'),
  grabConst(veteran, 'VETERAN_MAX_BATTLES_TRACKED'),
  grabConst(veteran, 'VETERAN_BONUS_FRAC'),
  grabFunction(veteran, 'veteranBattlesWon'),
  grabFunction(veteran, 'veteranStarCount'),
  grabFunction(veteran, 'veteranBonusFracForWins'),
  grabFunction(veteran, 'veteranCombatBonusFrac'),
  grabFunction(main, 'normFieldVal'),
  // main.ts:33093 unitHealth (tekst pinu): def['health'] ?? def['Health'], fallback 30.
  "function unitHealth(def) { return normFieldVal(def['health'] ?? def['Health'], 30); }",
];

const jsCode = parts.map((p) => stripTypeScriptTypes(p, { mode: 'strip' })).join('\n');
// Straznik: SHA-256 tekstu funkcji pinu, z ktorego powstaly wektory.
const textSha256 = createHash('sha256').update(parts.join('\n'), 'utf8').digest('hex');
const lib = new Function(`${jsCode}
return { effectiveMaxHp, unitParametryBonusFrac, veteranCombatBonusFrac, unitHealth };`)();

const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
// Siatka postepu: parametryBonusProc (procenty) x battlesSurvived (liczba bitew, takze ulamkowa i powyzej limitu).
const PARAM_GRID = [0, 5, 10, 20, 35, 50];
const BATTLES_GRID = [0, 1, 2, 3, 5, 7, 10, 12];

const cases = [];
for (const u of units) {
  const def = {};
  if (u.health !== undefined) def.health = u.health;
  if (u.Health !== undefined) def.Health = u.Health;
  const baseHealth = lib.unitHealth(def);
  for (const param of PARAM_GRID) {
    for (const battles of BATTLES_GRID) {
      // Postep przekazany jak w stanie gry: pole niezerowe, zerowe pomijane przez web (liczone jak 0).
      const prog = { parametryBonusProc: param, battlesSurvived: battles };
      const newMaxHp = lib.effectiveMaxHp(
        lib.unitHealth(def),
        lib.unitParametryBonusFrac(prog),
        lib.veteranCombatBonusFrac(prog),
      );
      cases.push({
        unit: u['Jednostka'],
        def,
        baseHealth,
        parametryBonusProc: param,
        battlesSurvived: battles,
        newMaxHp,
      });
    }
  }
}

const doc = {
  meta: {
    pinSha,
    textSha256,
    generator: 'gen-unit-replace-progress-vectors.mjs',
    source: 'gra/src/game/{unit-card-stats,unit-building-bonuses,veteran}.ts + main.ts (normFieldVal, unitHealth)',
    note: 'Wykonanie tekstu pinu w node (type-stripping). Tylko przypadki z postepem > 0 (siatka PARAM_GRID x BATTLES_GRID bez pary 0/0).',
  },
  cases: cases.filter((c) => c.parametryBonusProc > 0 || c.battlesSurvived > 0),
};
fs.writeFileSync(outPath, JSON.stringify(doc));
console.log(`cases=${doc.cases.length}`);
