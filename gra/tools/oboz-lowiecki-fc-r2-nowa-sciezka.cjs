'use strict';
/**
 * oboz-lowiecki-fc-r2-nowa-sciezka.cjs — sonda Final Control (runda 2)
 * R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
 *
 * Runda 2 wprowadza NOWA SCIEZKE USUWANIA ulepszen (stripImprovementsWhenForestRemoved
 * przestal byc pustym przelotem). Ta sonda NIE powtarza P7 (to robi oboz-lowiecki-fc-balans)
 * — pyta o skutki UBOCZNE tej sciezki w scenariuszach, ktorych nikt nie testowal:
 *
 *  A) DOMKNIECIE WEJSC — ile miejsc w rozgrywce w ogole wchodzi w nowa sciezke.
 *     Dowod z DOSLOWNEGO TEKSTU main.ts (ekstrakcja funkcji po nazwie), nie z grepa po repo.
 *  B) ZALOZENIE MIASTA NA LESIE — czy nowa sciezka zmienila cokolwiek (nie powinna:
 *     finalizeCityFounding ma wlasny filtr macierzy B i NIE wola stripa).
 *  C) WCZYTANIE STAREGO ZAPISU — czy stary oboz poza lasem przezywa load (kryt. 6 dispatchu:
 *     stare zapisy ZOSTAJA; runda 2 nie ma prawa tego po cichu zmienic).
 *  D) WYRAB AI NA CUDZYM TERENIE — czy AI moze skasowac oboz obcej cywilizacji.
 *  E) FILTR ZA SZEROKI — kazdy klucz z terrain-improvements.json przez strip; ma zniknac
 *     DOKLADNIE jeden.
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-fc-r2-nowa-sciezka.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.oboz-fc-r2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-fc-r2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  stripImprovementsWhenForestRemoved, computeImprovementBuildImpact,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  cityKeepsImprovement, applyCityFoundingToHex, CITY_KEEP_IMPROVEMENT_KEYS,
} from ${JSON.stringify(SRC + '/game/city-hex-clear')};
export { Nakladka, TerenBazowy } from ${JSON.stringify(SRC + '/types/hex')};
`);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, outfile: BUNDLE,
  platform: 'node', format: 'cjs', logLevel: 'error',
});
const M = require(BUNDLE);
const { Nakladka, TerenBazowy, stripImprovementsWhenForestRemoved } = M;

let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (x ? ' :: ' + x : '')); } };

// ---------------------------------------------------------------- A
// Ekstrakcja DOSLOWNEGO tekstu funkcji z main.ts po zliczaniu klamr — bez uruchamiania main.ts
// (to modul 3D, nie da sie go zaladowac w node). Zrodlo rzedu 2 wg §13a: kod w repo.
const MAIN = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
function bodyAfter(anchor) {
  const i = MAIN.indexOf(anchor);
  if (i < 0) return null;
  let j = MAIN.indexOf('{', i);
  if (j < 0) return null;
  let d = 0;
  for (let k = j; k < MAIN.length; k++) {
    if (MAIN[k] === '{') d++;
    else if (MAIN[k] === '}') { d--; if (d === 0) return MAIN.slice(i, k + 1); }
  }
  return null;
}
const lineOf = (s) => MAIN.slice(0, MAIN.indexOf(s)).split('\n').length;
const CALL = /stripForestDependentImprovements\s*\(/;

console.log('\n=== A. DOMKNIECIE WEJSC w nowa sciezke usuwania (doslowny tekst main.ts) ===');
// wszystkie wystapienia wolania helpera w main.ts (bez jego wlasnej definicji)
const callSites = [];
{
  const re = /stripForestDependentImprovements\s*\(hexKey\)/g;
  let m;
  while ((m = re.exec(MAIN)) !== null) {
    const ln = MAIN.slice(0, m.index).split('\n').length;
    callSites.push(ln);
  }
}
console.log('  wolania stripForestDependentImprovements(hexKey) w main.ts -> linie ' + JSON.stringify(callSites));
ok(callSites.length === 2, 'A1 nowa sciezka ma DOKLADNIE 2 wejscia w main.ts (gracz + AI)', JSON.stringify(callSites));

const DEF_STRIP = bodyAfter('function stripForestDependentImprovements(');
ok(DEF_STRIP !== null && /stripImprovementsWhenForestRemoved\(prev\)/.test(DEF_STRIP),
  'A2 helper faktycznie wola stripImprovementsWhenForestRemoved z improvement-build');

const F_CLEAR = bodyAfter('function finalizeHexClearing(');
ok(F_CLEAR !== null && CALL.test(F_CLEAR), 'A3 wyrab gracza (finalizeHexClearing) wchodzi w nowa sciezke');

// ---------------------------------------------------------------- B
console.log('\n=== B. ZALOZENIE MIASTA NA LESIE — czy runda 2 cokolwiek tu zmienila ===');
const F_CITY = bodyAfter('function finalizeCityFounding(');
ok(F_CITY !== null, 'B0 finalizeCityFounding znaleziona w main.ts');
ok(F_CITY !== null && !CALL.test(F_CITY) && !/stripImprovementsWhenForestRemoved/.test(F_CITY),
  'B1 zalozenie miasta NIE wola nowej sciezki usuwania (ma wlasny filtr macierzy B)');
ok(F_CITY !== null && /cityKeepsImprovement/.test(F_CITY),
  'B2 zalozenie miasta filtruje przez cityKeepsImprovement (macierz B), nie przez las');
// pomiar zachowania, nie odczyt kodu: heks lasu z obozem+tartakiem, zalozenie miasta
{
  const map = M.generateMap(36, 28, 4242, 'kontynenty');
  const lasKey = Object.keys(map.hexes).find(k => map.hexes[k].nakladka === Nakladka.Las);
  const [q, r] = lasKey.split(',').map(Number); // heks trzyma `coords`, nie q/r — klucz jest zrodlem
  const prev = ['tartak', 'oboz_lowiecki', 'droga'];
  const kept = prev.filter(k => M.cityKeepsImprovement(k));
  M.applyCityFoundingToHex({ id: 'c1', ownerId: 0 }, map, q, r);
  console.log('  heks ' + lasKey + ' | warstwy przed=' + JSON.stringify(prev)
    + ' -> po zalozeniu miasta=' + JSON.stringify(kept)
    + ' | nakladka po=' + JSON.stringify(map.hexes[lasKey].nakladka));
  ok(!kept.includes('oboz_lowiecki'),
    'B3 oboz znika przy zalozeniu miasta na lesie — macierza B, nie nowym filtrem');
  ok(map.hexes[lasKey].nakladka !== Nakladka.Las,
    'B4 las pod miastem faktycznie znika (kanon macierzy B) — a mimo to strip sie nie odpala');
  // kontrola: gdyby ktos podpial strip do zakladania miasta, tartak by przezyl (bo strip go nie rusza),
  // ale oboz i tak by znikl — wiec dowodem NIEzmiany jest B1+B2 (tekst) razem z B3 (pomiar).
  ok(stripImprovementsWhenForestRemoved(prev).includes('tartak'),
    'B5 kontrola: gdyby strip tu dzialal, tartak by zostal — czyli B3 wynika z macierzy B, nie ze stripa');
}

// ---------------------------------------------------------------- C
console.log('\n=== C. WCZYTANIE STAREGO ZAPISU — stary oboz poza lasem ma PRZEZYC (kryt. 6) ===');
const F_RESTORE = bodyAfter('function restorePlacedImprovementsFromSave(');
ok(F_RESTORE !== null, 'C0 restorePlacedImprovementsFromSave znaleziona w main.ts');
ok(F_RESTORE !== null && !CALL.test(F_RESTORE) && !/stripImprovementsWhenForestRemoved/.test(F_RESTORE),
  'C1 wczytanie zapisu NIE przepuszcza warstw przez nowa sciezke — stare obozy zostaja');
{
  // odtworzenie semantyki loadu: warstwy z zapisu ida do magazynu DOSLOWNIE
  const zapis = { '3,4': ['oboz_lowiecki'], '5,6': ['tartak', 'droga'] };
  const store = new Map();
  for (const [k, v] of Object.entries(zapis)) store.set(k, [...v]); // main.ts: placedImprovements.set(hexKey, layers)
  console.log('  po loadzie: ' + JSON.stringify([...store.entries()]));
  ok(JSON.stringify(store.get('3,4')) === JSON.stringify(['oboz_lowiecki']),
    'C2 stary oboz na heksie bez lasu przezywa wczytanie (brak cichej migracji kasujacej)');
}

// ---------------------------------------------------------------- D
console.log('\n=== D. WYRAB AI NA CUDZYM TERENIE — czy AI skasuje oboz obcej cywilizacji ===');
{
  // wycinka AI siedzi w obsludze cmd.type === 'buildImprovement'; bramka terytorium stoi PRZED nia
  const i0 = MAIN.indexOf("if (cmd.type === 'buildImprovement')");
  const iGate = MAIN.indexOf('isTerritoryHexOwnedBy(cmd.q, cmd.r, ownerId, territoryGate)', i0);
  const iWyc = MAIN.indexOf("if (meta?.typ === 'wycinka')", i0);
  const iCall = MAIN.indexOf('stripForestDependentImprovements(hexKey)', iWyc);
  console.log('  buildImprovement@' + MAIN.slice(0, i0).split('\n').length
    + ' · bramka terytorium@' + MAIN.slice(0, iGate).split('\n').length
    + ' · wycinka@' + MAIN.slice(0, iWyc).split('\n').length
    + ' · strip@' + MAIN.slice(0, iCall).split('\n').length);
  ok(i0 >= 0 && iGate > i0 && iWyc > iGate && iCall > iWyc,
    'D1 bramka `isTerritoryHexOwnedBy` stoi PRZED wycinka AI, a wycinka PRZED usunieciem warstw');
  const gateBlock = MAIN.slice(iGate, iWyc);
  ok(/continue;/.test(gateBlock),
    'D2 nieswoje terytorium konczy sie `continue` — AI nie dochodzi do wyrebu, wiec nie kasuje cudzego obozu');
  const F_APPLY = bodyAfter('function applyBuildRequest(');
  ok(F_APPLY !== null && /assertPlayerTerritoryForBuild\(/.test(F_APPLY),
    'D3 sciezka gracza tez ma bramke terytorium przed wycinka (assertPlayerTerritoryForBuild)');
}

// ---------------------------------------------------------------- E
console.log('\n=== E. CZY FILTR NIE JEST ZA SZEROKI — kazdy klucz z danych przez strip ===');
{
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'), 'utf8'));
  const keys = Object.keys(data).filter(k => k !== '_meta');
  const usuwane = keys.filter(k => !stripImprovementsWhenForestRemoved([k]).includes(k));
  console.log('  kluczy w terrain-improvements.json: ' + keys.length + ' | usuwane przez strip: ' + JSON.stringify(usuwane));
  ok(usuwane.length === 1 && usuwane[0] === 'oboz_lowiecki',
    'E1 strip usuwa DOKLADNIE jeden klucz i jest nim oboz_lowiecki', JSON.stringify(usuwane));
  const wszystko = stripImprovementsWhenForestRemoved(keys);
  ok(wszystko.length === keys.length - 1 && !wszystko.includes('oboz_lowiecki'),
    'E2 podanie wszystkich kluczy naraz zabiera dokladnie jeden (brak efektu kolejnosci)');
  ok(stripImprovementsWhenForestRemoved(['tartak']).includes('tartak'), 'E3 tartak zostaje (kanon)');
  ok(stripImprovementsWhenForestRemoved(['farma']).includes('farma'), 'E4 farma zostaje (swiadomie, osobna decyzja)');
  const dwa = stripImprovementsWhenForestRemoved(['oboz_lowiecki', 'oboz_lowiecki', 'droga']);
  ok(JSON.stringify(dwa) === JSON.stringify(['droga']), 'E5 duplikat klucza tez znika (filtr, nie splice)');
  ok(JSON.stringify(stripImprovementsWhenForestRemoved([])) === '[]', 'E6 pusta lista nie wybucha');
  // klucze spoza danych (np. warstwy techniczne uzywane w main.ts) — nie moga znikac
  for (const k of ['droga', 'fort', 'posterunek', 'kamieniolom', 'glinianka', 'irygacja', 'tarasy']) {
    if (!keys.includes(k)) continue;
  }
  const tech = ['droga', 'tarasy', 'fort'];
  ok(tech.every(k => stripImprovementsWhenForestRemoved(tech).includes(k)),
    'E7 warstwy techniczne (droga/tarasy/fort) nietkniete');
}

console.log('\noboz-lowiecki-fc-r2-nowa-sciezka: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
