'use strict';
/**
 * R-WEB-ROAD-PAVED-DIRECT-BUILD-OR-UPGRADE-Q1 — droga brukowana: budowa OD ZERA albo ulepszenie
 * istniejącej Drogi.
 *  (a) kwalifikator: heks bez Drogi (łączący się z siecią) -> `droga_brukowana` dozwolona;
 *      heks z Drogą -> ulepszenie dozwolone; brak techu -> brak żądania; auto (direktBruk:false) -> dawna reguła.
 *  (b) stan po budowie od zera: warstwy = ['droga_brukowana'] (bez zwykłej Drogi) -> ruch ÷5, bonus handlu brukowanej.
 *  (c) koszt na heksie: od zera = koszt droga + koszt droga_brukowana; ulepszenie = koszt samej brukowanej.
 *  (d) MUTANT: wycięcie gałęzi budowy od zera w KOPII źródła -> asercje (a) muszą wykryć zmianę.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const IMPROVE_SRC = path.join(GRA, 'src', 'map', 'improvement-build.ts');
const MUTANT_SRC = path.join(GRA, 'src', 'map', '.road-paved-mutant-improvement-build.ts');
const ENTRY = path.join(__dirname, '.road-paved-direct-entry.ts');
const BUNDLE = path.join(__dirname, '.road-paved-direct-bundle.cjs');

let bundleSeq = 0;
function bundleEntry(importPath) {
  // Unikalna nazwa wyjścia: node cache-uje require() po ścieżce, więc mutant nie może nadpisać oryginału.
  bundleSeq += 1;
  const entry = ENTRY.replace('.ts', `-${bundleSeq}.ts`);
  const bundle = BUNDLE.replace('.cjs', `-${bundleSeq}.cjs`);
  fs.writeFileSync(entry, `
export { buildImprovementQualifier, createImprovementBuildApi, collectRoadKeys } from '${importPath}';
export { applyRoadMovementModifier, ROAD_BRUK_MOVE_SPEED_MULT } from '../src/map/road-movement';
export { applyImprovementBonuses } from '../src/game/terrain-improvements';
export { TerenBazowy, Ulepszenie } from '../src/types/hex';
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: bundle, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  const mod = require(bundle);
  try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* noop */ }
  return mod;
}

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function mkHex(TB, UL, q, r, teren, ulepszenie) {
  return {
    coords: { q, r }, terenBazowy: teren, nakladka: 'brak', ulepszenie: ulepszenie || UL.Brak,
    wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
    rzeka: { obecna: false, krawedzie: [] },
  };
}

// Fixture: miasto (0,0); zwykła Droga (1,0) połączona z miastem; (2,0) łąka przy drodze (bez drogi);
// (5,5) daleko od sieci i poza terytorium.
function buildFixture(M, techs) {
  const TB = M.TerenBazowy;
  const UL = M.Ulepszenie;
  const hexes = {
    '0,0': mkHex(TB, UL, 0, 0, TB.Rownina),
    '1,0': mkHex(TB, UL, 1, 0, TB.Rownina, UL.Droga),
    '2,0': mkHex(TB, UL, 2, 0, TB.Rownina),
    '5,5': mkHex(TB, UL, 5, 5, TB.Rownina),
  };
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  return {
    map,
    cityNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
    territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
    playerOwnerIdNum: 0,
    playerCivArchetype: 'rzymianie',
    playerEra: 3,
    roadKeys: M.collectRoadKeys(map),
    researchedTechs: new Set(techs),
    placedImprovements: new Map(),
  };
}

function runAssertions(M, label) {
  const state = buildFixture(M, ['Koło', 'Drogi brukowane']);
  const qual = M.buildImprovementQualifier(state);
  const qualAuto = M.buildImprovementQualifier(state, { direktBruk: false });

  // (a) kwalifikator
  ok(qual('droga_brukowana', 2, 0), `${label}(a) heks BEZ Drogi przy sieci -> droga_brukowana dozwolona`);
  ok(qual('droga', 2, 0), `${label}(a) zwykła Droga na tym samym heksie nadal dozwolona`);
  ok(qual('droga_brukowana', 1, 0), `${label}(a) heks Z Drogą -> ulepszenie do brukowanej dozwolone`);
  ok(!qual('droga_brukowana', 5, 5), `${label}(a) heks poza siecią dróg -> brukowana zakazana`);
  ok(!qualAuto('droga_brukowana', 2, 0), `${label}(a) auto (direktBruk:false): brukowana BEZ Drogi zakazana`);
  ok(qualAuto('droga_brukowana', 1, 0), `${label}(a) auto: ulepszenie istniejącej Drogi nadal dozwolone`);

  // (a') brak techu -> brak żądania budowy
  const noTech = M.createImprovementBuildApi(buildFixture(M, ['Koło']));
  ok(noTech.createBuildRequest('droga_brukowana', 2, 0) === null,
    `${label}(a') bez techu 'Drogi brukowane' brak żądania budowy`);
  // (a'-hint) brak techu -> HUD pokazuje powód po polsku (lockHint)
  const noTechInfo = noTech.listTypes().find(t => t.key === 'droga_brukowana');
  ok(!!noTechInfo && typeof noTechInfo.lockHint === 'string' && noTechInfo.lockHint.indexOf('Technolog') >= 0,
    `${label}(a'-hint) bez techu lockHint po polsku: "${noTechInfo && noTechInfo.lockHint}"`);

  // (c) koszt
  const api = M.createImprovementBuildApi(state);
  const costBruk = api.getWorkCost('droga_brukowana');
  const costDroga = api.getWorkCost('droga');
  const reqZero = api.createBuildRequest('droga_brukowana', 2, 0);
  const reqUp = api.createBuildRequest('droga_brukowana', 1, 0);
  ok(!!reqZero && reqZero.kosztPraca === costDroga + costBruk,
    `${label}(c) budowa od zera = Droga+Brukowana (${reqZero && reqZero.kosztPraca} vs ${costDroga}+${costBruk})`);
  ok(!!reqUp && reqUp.kosztPraca === costBruk,
    `${label}(c) ulepszenie Drogi = sama brukowana (${reqUp && reqUp.kosztPraca} vs ${costBruk})`);
  ok(costDroga > 0 && costBruk > 0, `${label}(c) koszty z danych są dodatnie`);
  // (c-HUD) lista budowy (HUD): brukowana ma koszt z Drogą (ulepszenie) i koszt od zera
  const bukInfo = api.listTypes().find(t => t.key === 'droga_brukowana');
  ok(!!bukInfo && bukInfo.kosztPraca === costBruk && bukInfo.kosztOdZera === costDroga + costBruk,
    `${label}(c-HUD) listTypes brukowanej: ${bukInfo && bukInfo.kosztPraca} z Drogą / ${bukInfo && bukInfo.kosztOdZera} od zera (oczekiwano ${costBruk} / ${costDroga + costBruk})`);

  // (b) stan po budowie od zera: warstwy = ['droga_brukowana'] bez zwykłej drogi
  const hexDirect = { ...state.map.hexes['2,0'], ulepszenia: ['droga_brukowana'] };
  ok(M.applyRoadMovementModifier(100, hexDirect) === 100 / M.ROAD_BRUK_MOVE_SPEED_MULT,
    `${label}(b) budowa od zera -> ruch / ROAD_BRUK_MOVE_SPEED_MULT`);
  const yld = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0 };
  M.applyImprovementBonuses(yld, ['droga_brukowana'], 3);
  ok(yld.handel > 0, `${label}(b) bonus handlu z samej warstwy brukowanej > 0 (bez zwykłej Drogi)`);
  return { qual, qualAuto };
}

const ORIGINAL = fs.readFileSync(IMPROVE_SRC, 'utf8');
const M = bundleEntry('../src/map/improvement-build');
runAssertions(M, '');

// (d) MUTANT: budowa od zera wycięta w kopii źródła -> asercje muszą się wywalić.
const needle = 'return opts.direktBruk !== false && roadAdjacencyOk(state, q, r);';
if (!ORIGINAL.includes(needle)) {
  ok(false, '(d) kotwica mutacji nie znaleziona w improvement-build.ts');
} else {
  fs.writeFileSync(MUTANT_SRC, ORIGINAL.replace(needle, 'return false;'), 'utf8');
  let mutFailures = 0;
  const savedPass = pass;
  const savedFail = fail;
  const savedLog = console.error;
  console.error = () => { mutFailures++; };
  try {
    const MUT = bundleEntry('../src/map/.road-paved-mutant-improvement-build');
    runAssertions(MUT, '[mutant] ');
  } finally {
    console.error = savedLog;
    pass = savedPass;
    fail = savedFail;
    try { fs.unlinkSync(MUTANT_SRC); } catch (_) { /* noop */ }
  }
  ok(mutFailures > 0, '(d) MUTANT (bez budowy od zera) wykryty przez asercje (a)/(c)');
}

console.log(`road-paved-direct-build-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
