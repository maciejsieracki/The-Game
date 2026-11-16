// P6-K5-BLOW-ENV-WEKTORY-Q1: generator wektorow z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75)
// dla mnoznika rzeki atakujacego `terrainRiverAttackMultiplier` (gra/src/game/combat.ts:677-687)
// oraz dla flag, ktore `_singleBlow` liczy z tego samego kafla (battleScene.ts:8861).
//
// Oracle: WYCIETE fragmenty pinu, wykonane bez przerobki (tylko zdjecie typow TS przez
// `node --experimental-strip-types`):
//   A. normTerrain                       - gra/src/game/combat.ts:620-624
//   B. terrainRiverAttackMultiplier      - gra/src/game/combat.ts:677-687
//   C. combatParamsRaw                   - gra/data/combat-params.json (wstrzykniety jako JSON, 1:1)
//   D. wiersze terenu                    - gra/data/terrain-combat.json (kolumna "Teren", 1:1)
// Flagi `isRiver` i `rowExists` to wyrazenia z pinu combat.ts:680 i :683 przepisane 1:1
// (nie da sie ich wyciac jako osobnej funkcji; funkcja B zwraca tylko mnoznik).
//
// Uzycie: node --experimental-strip-types gen.mjs <pinDir> <workDir> <outJson>
//   np. git archive 07d2fbd72... gra/src/game/combat.ts gra/data/combat-params.json gra/data/terrain-combat.json | tar -x -C <pinDir>
// STRAZNIK: SHA-256 zrodel pinu musi sie zgadzac, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , pinDir, workDir, outJson] = process.argv;
if (!pinDir || !workDir || !outJson) {
  console.error('uzycie: node --experimental-strip-types gen.mjs <pinDir> <workDir> <outJson>');
  process.exit(2);
}

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  'gra/src/game/combat.ts': '1de2bc6f1ceb86f116e3ea650b34939acca04eaad8f78e218ffc464facb20bce',
  'gra/data/combat-params.json': '5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e',
  'gra/data/terrain-combat.json': 'b5f0f9c5c25a65273bc674d1ae1121ab09d93141085eb0c1a9b1bc911798f9bf',
};
const texts = {};
for (const [rel, want] of Object.entries(FILES)) {
  const buf = readFileSync(join(pinDir, rel));
  const got = createHash('sha256').update(buf).digest('hex');
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${want}`);
    process.exit(3);
  }
  texts[rel] = buf.toString('utf8');
}

// Wyciecie fragmentow po numerach linii (1-indexed, wlacznie) z pinu combat.ts.
const lines = texts['gra/src/game/combat.ts'].split('\n');
const slice = (a, b) => lines.slice(a - 1, b).join('\n');
const fragNorm = slice(620, 624);
const fragRiver = slice(677, 687);
if (!fragNorm.startsWith('export function normTerrain(') || !fragNorm.trimEnd().endsWith('}')) {
  console.error('STRAZNIK: zakres normTerrain nie pasuje do pinu');
  process.exit(4);
}
if (!fragRiver.startsWith('export function terrainRiverAttackMultiplier(') || !fragRiver.trimEnd().endsWith('}')) {
  console.error('STRAZNIK: zakres terrainRiverAttackMultiplier nie pasuje do pinu');
  process.exit(4);
}

const combatParamsJson = texts['gra/data/combat-params.json'];
const terrainRows = JSON.parse(texts['gra/data/terrain-combat.json']);
const prelude = `const combatParamsRaw = ${JSON.stringify(JSON.parse(combatParamsJson))};\n`;
mkdirSync(workDir, { recursive: true });
const fragPath = join(workDir, 'pin_fragments.mts');
writeFileSync(fragPath, prelude + fragNorm + '\n' + fragRiver + '\n');
const W = await import(pathToFileURL(fragPath).href);

// Zestawy danych terenu (kolumna "Teren" z pinu): pelne, bez wiersza "Rzeka", puste.
const fullRows = terrainRows.map((r) => ({ Teren: r.Teren, 'Bonus Obrona': r['Bonus Obrona'] }));
const noRiverRows = fullRows.filter((r) => !r.Teren.includes('Rzeka'));
const rowSets = {
  pelne: fullRows,
  'bez-wiersza-rzeki': noRiverRows,
  puste: [],
};

// Nazwy kafla atakujacego/obroncy w formie combatTerrainName (battle-terrain.ts:150-159 / 802-806).
const NAMES = ['Plaskie (rownina/laka)', 'Las', 'Wzgorza', 'Rzeka'];

const cases = [];
const addCase = (name, atk, def, setName) => {
  const rows = rowSets[setName];
  const expMult = W.terrainRiverAttackMultiplier(atk, rows);
  const nAtk = W.normTerrain(atk);
  const expAtkIsRiver = nAtk.includes('rzek') || nAtk.includes('river');
  const expRowExists = rows.some((t) => W.normTerrain(t.Teren).includes('rzek'));
  cases.push({
    name,
    atkTerrain: atk,
    defTerrain: def,
    rowSet: setName,
    terrainData: rows,
    expMult,
    expAtkIsRiver,
    expRowExists,
  });
};

// Przypadki nazwane (czytelne dla recenzenta).
addCase('atk-rzeka-wiersz', 'Rzeka', 'Plaskie (rownina/laka)', 'pelne');
addCase('obrona-rzeka-atak-plaski', 'Plaskie (rownina/laka)', 'Rzeka', 'pelne');
addCase('oba-na-rzece', 'Rzeka', 'Rzeka', 'pelne');
addCase('brak-rzeki-las-wzgorza', 'Las', 'Wzgorza', 'pelne');
addCase('flaga-bez-wiersza-rzeki', 'Rzeka', 'Plaskie (rownina/laka)', 'bez-wiersza-rzeki');
addCase('atk-rzeka-dane-puste', 'Rzeka', 'Rzeka', 'puste');
addCase('atk-wzgorza-obrona-rzeka', 'Wzgorza', 'Rzeka', 'pelne');
addCase('atk-las-obrona-rzeka-bez-wiersza', 'Las', 'Rzeka', 'bez-wiersza-rzeki');

// Pelna siatka 4 x 4 x 3 (teren atakujacego x obroncy x zestaw danych): kazda kombinacja.
for (const atk of NAMES) {
  for (const def of NAMES) {
    for (const setName of Object.keys(rowSets)) {
      addCase(`siatka-${atk}|${def}|${setName}`, atk, def, setName);
    }
  }
}

const out = {
  pin: PIN,
  riverAttackMult: JSON.parse(combatParamsJson).river_attack_mult,
  snippetSha256: FILES,
  fragments: {
    normTerrain: 'gra/src/game/combat.ts:620-624',
    terrainRiverAttackMultiplier: 'gra/src/game/combat.ts:677-687',
    combatParamsRaw: 'gra/data/combat-params.json',
    terrainData: 'gra/data/terrain-combat.json',
  },
  cases,
};
writeFileSync(outJson, JSON.stringify(out, null, 2) + '\n');
console.log(`OK: ${cases.length} przypadkow -> ${outJson}`);
