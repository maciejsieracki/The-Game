'use strict';
/**
 * city-state-prod-audit-test.cjs — R-AI-MIASTA-BUDOWY-Q1 audyt (read-only).
 * Dokumentuje: wybór produkcji MP (defensiveCopy) vs bramka isProductionAllowed (tech/epoka).
 * Run from gra/: node tools/city-state-prod-audit-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.city-state-prod-audit-entry.ts');
const bundle = path.join(__dirname, '.city-state-prod-audit-bundle.cjs');

fs.writeFileSync(entry, `
export { chooseCityProduction, loadDifficultyParams } from '../src/game/ai';
export { cityStateMilitaryProductionCap } from '../src/game/city-state-difficulty';
export { availableProduction } from '../src/game/production';
export { grantTechEpokWczesniejszych } from '../src/game/research';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const data = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const aiParams = JSON.parse(fs.readFileSync(path.join(GRA, 'data/ai-params.json'), 'utf8'));
const gameData = { buildings: data, units, tech: techData.technologie, aiParams };

const { chooseCityProduction, loadDifficultyParams, cityStateMilitaryProductionCap, availableProduction, grantTechEpokWczesniejszych } = M;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = { teren: 'ląd', terenBazowy: 'trawa' };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes };
}

function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id, population: 3 };
}

function makeUnit(id, ownerId, q, r, typeId = 'Wojownik') {
  return { id, ownerId, typeId, category: 'wojsko', q, r, ruch: 2, ruchLeft: 2 };
}

/** Minimalny mock miasta dla availableProduction (bramka PROD-GATE). */
function isProductionAllowedFactory(city, unlockedTechs, builtIds = []) {
  return (_cityId, itemId) => {
    const allowed = availableProduction(
      city,
      gameData,
      unlockedTechs,
      {
        epoch: 1,
        builtBuildingIds: builtIds,
        productionQueue: [],
        ownerId: city.ownerId,
        difficulty: 'normal',
        isCapital: true,
        empireActiveResourceLabels: [],
        empireBuiltIds: builtIds,
        empireResourceStock: { drewno: 20, kamien: 10 },
        cityHasCoastOrRiver: false,
      },
    );
    return allowed.some(a => a.id === itemId || a.nazwa === itemId);
  };
}

console.log('\ncity-state-prod-audit-test (R-AI-MIASTA-BUDOWY-Q1)\n');

const startTechs = [...grantTechEpokWczesniejszych(techData.technologie, 'kamien')];
const diff = loadDifficultyParams(gameData, 2);
const map = makeMap(8, 8);
const city = makeCity('mp1', 7, 3, 3);
const guard = makeUnit('g1', 7, 3, 3);
const mods = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };

console.log('-- A. Start Kamień: infra bootstrap bez bramki → studnia (wysoki score) --');
{
  const pickNoGate = chooseCityProduction(
    'mp1', [city], [guard], 7, gameData, mods,
    { defensiveCopy: true, cityBuildings: { mp1: [] } },
    map, diff,
  );
  eq(pickNoGate, 'studnia', 'A: bez isProductionAllowed wybór = studnia (infraOrder[0])');
}

console.log('-- B. Start Kamień + PROD-GATE: studnia zablokowana (brak Gospodarka wodna) --');
{
  const gate = isProductionAllowedFactory(city, startTechs, []);
  const allowedStudnia = gate('mp1', 'studnia');
  const allowedPalac = gate('mp1', 'palac');
  assert(!allowedStudnia, 'B1: studnia blocked at stone start (no Gospodarka wodna)');
  assert(allowedPalac, 'B2: palac allowed at stone start (techUnlock "-", stolica)');

  const pick = chooseCityProduction(
    'mp1', [city], [guard], 7, gameData, mods,
    { defensiveCopy: true, cityBuildings: { mp1: [] }, isProductionAllowed: gate },
    map, diff,
  );
  eq(pick, 'palac', 'B3: po bramce tech jedyny infra kandydat z listy = palac (nie studnia)');
}

console.log('-- C. Po Garncarstwo: spichlerz dostępny (brak DEPOSIT gate przy budowie) --');
{
  const techs = [...startTechs, 'Garncarstwo'];
  const gate = isProductionAllowedFactory(city, techs, []);
  assert(gate('mp1', 'spichlerz'), 'C1: spichlerz allowed with Garncarstwo (no Ceramika gate at enqueue)');
  assert(!gate('mp1', 'garncarnia'), 'C2: garncarnia still blocked without Glina deposit/stock');
}

console.log('-- D. Cap wojska Hard=3 bez garnizonu → Wojownik (0 < cap 3, C-025/C-026 fix) --');
{
  // R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04=B (2026-08-10): pole opts przepięte
  // z opts.menuDifficulty (stara oś gry) na opts.cityStateDifficultyVsPlayer (nowa oś
  // gracz-facing) i cap('hard') podniesiony z 0 na 3 -- inaczej PM na Trudnym nigdy nie
  // mogło zrekrutować NAWET pierwszego garnizonu (patrz cs-military-cap-wiring-test.cjs).
  const capHard = cityStateMilitaryProductionCap('hard');
  eq(capHard, 3, 'D1: hard cap = 3 (= CS_WAVE_ATTACK_MIN_STACK w ai.ts)');
  const pick = chooseCityProduction(
    'mp1', [city], [], 7, gameData, mods,
    {
      defensiveCopy: true,
      cityStateDifficultyVsPlayer: 'hard',
      cityBuildings: { mp1: [] },
      isProductionAllowed: isProductionAllowedFactory(city, startTechs, []),
    },
    map, diff,
  );
  eq(pick, 'Wojownik', 'D2: hard bez garnizonu — 0 military < cap 3, pierwszy garnizon przechodzi');
}

console.log('-- E. Normal cap=1: po garnizonie wojsko wypada, budynek z bramki --');
{
  const pick = chooseCityProduction(
    'mp1', [city], [guard], 7, gameData, mods,
    {
      defensiveCopy: true,
      cityStateDifficultyVsPlayer: 'normal',
      cityBuildings: { mp1: [] },
      isProductionAllowed: isProductionAllowedFactory(city, startTechs, []),
    },
    map, diff,
  );
  eq(pick, 'palac', 'E: normal po garnizonie → palac gdy studnia zablokowana tech');
}

console.log('-- F. R-AI-MIASTA-BUDOWY-FIX-Q1: bramka Kamień — nie studnia/garncarnia, palac wygrywa nad Wojownikiem --');
{
  const gate = isProductionAllowedFactory(city, startTechs, []);
  assert(!gate('mp1', 'studnia'), 'F1: studnia zablokowana tech');
  assert(!gate('mp1', 'garncarnia'), 'F2: garncarnia zablokowana tech');
  assert(gate('mp1', 'palac'), 'F3: palac dozwolony');

  const pick = chooseCityProduction(
    'mp1', [city], [guard], 7, gameData, mods,
    {
      defensiveCopy: true,
      cityStateDifficultyVsPlayer: 'normal',
      cityBuildings: { mp1: [] },
      isProductionAllowed: gate,
    },
    map, diff,
  );
  assert(pick !== 'studnia', 'F4: wynik ≠ studnia (infraOrder nie preferuje zablokowanej)');
  assert(pick !== 'garncarnia', 'F5: wynik ≠ garncarnia');
  assert(pick !== 'Wojownik', 'F6: wynik ≠ Wojownik (palac z infraOrder wygrywa score path)');
  eq(pick, 'palac', 'F7: wybór = palac — pierwszy dozwolony z infraOrder');
}

console.log('-- G. Bez callbacka isProductionAllowed — regresja A (studnia) --');
{
  const pick = chooseCityProduction(
    'mp1', [city], [guard], 7, gameData, mods,
    { defensiveCopy: true, cityBuildings: { mp1: [] } },
    map, diff,
  );
  eq(pick, 'studnia', 'G: bez bramki nadal studnia (zero regresji)');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
