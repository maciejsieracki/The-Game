'use strict';
/**
 * city-clears-forest-test.cjs — R-WEB-CITY-CLEARS-FOREST-Q1
 * Reguła właściciela (2026-10-31): „jeżeli stawiam miasto, to automatycznie jest wycinany las,
 * więc lasu nigdy nie ma tam, gdzie jest miasto".
 *
 *  A. Logika (esbuild-bundle prawdziwych modułów, REALNA mapa z generateMap):
 *     A1 założenie miasta na heksie z lasem -> brak Las; A2 heks bez lasu / złoże zostają;
 *     A3 wspólna funkcja clearForestUnderCity; A4 tartak/obóz pod miastem znikają (macierz B).
 *  B. Okablowanie main.ts (tekst ŹRÓDŁA, brak możliwości załadowania modułu 3D w node):
 *     B1 KAŻDE foundCityAt( w main.ts (gra + hooki) ma w oknie finalizeCityFounding(;
 *     B2 finalizeCityFounding woła applyCityFoundingToHex;
 *     B3 siatka enforceNoForestUnderCities zdefiniowana i wołana z reapplyCityHexDecorHides
 *        oraz z granicy tury; B4 loadGameFromSlot: restoreGameFromSave -> reapplyCityHexDecorHides.
 *  Uruchom z gra/: node tools/city-clears-forest-test.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.CCF_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'city-clears-forest-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export * as CityHex from ${JSON.stringify(SRC + '/game/city-hex-clear')};
export { stripImprovementsWhenForestRemoved } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { Nakladka, TerenBazowy } from ${JSON.stringify(SRC + '/types/hex')};
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, outfile: BUNDLE, platform: 'node', format: 'cjs', logLevel: 'error' });
const M = require(BUNDLE);
const { Nakladka, CityHex } = M;

let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (x ? ' :: ' + x : '')); } };

console.log('\n=== A. LOGIKA na realnej mapie ===');
const map = M.generateMap(36, 28, 4242, 'kontynenty');
const keys = Object.keys(map.hexes);
const forestKeys = keys.filter(k => map.hexes[k].nakladka === Nakladka.Las && map.hexes[k].terenBazowy !== M.TerenBazowy.Gory);
ok(forestKeys.length >= 5, 'A0 mapa ma lasy do testu (n=' + forestKeys.length + ')');
const city = { id: 'cT', ownerId: 0 };

{ // A1: wszystkie (do 40) heksy lasu: zalozenie miasta -> brak Las
  let bad = 0;
  for (const k of forestKeys.slice(0, 40)) {
    const [q, r] = k.split(',').map(Number);
    CityHex.applyCityFoundingToHex(city, map, q, r);
    if (map.hexes[k].nakladka === Nakladka.Las) bad++;
  }
  ok(bad === 0, 'A1 zalozenie miasta na KAZDYM z ' + Math.min(40, forestKeys.length) + ' heksow lasu usuwa Las (zle=' + bad + ')');
}
{ // A2: heks bez lasu nietkniety (nakladka Brak), zloze zwierzece zostaje
  const noForest = keys.find(k => map.hexes[k].nakladka === Nakladka.Brak && map.hexes[k].terenBazowy !== M.TerenBazowy.Gory
    && map.hexes[k].terenBazowy !== M.TerenBazowy.Morze);
  const [q, r] = noForest.split(',').map(Number);
  CityHex.applyCityFoundingToHex(city, map, q, r);
  ok(map.hexes[noForest].nakladka === Nakladka.Brak, 'A2a heks bez lasu: nakladka bez zmian');
  const h = { nakladka: Nakladka.ZlozeBydla, terenBazowy: M.TerenBazowy.Laka };
  CityHex.clearHexForCityCenter(h, false);
  ok(h.nakladka === Nakladka.ZlozeBydla, 'A2b zloze zwierzece (macierz B ZOSTAJE) nietkniete');
}
{ // A3: wspolna funkcja
  ok(typeof CityHex.clearForestUnderCity === 'function', 'A3a clearForestUnderCity wyeksportowana');
  if (typeof CityHex.clearForestUnderCity === 'function') {
    const k = forestKeys[forestKeys.length - 1];
    const [q, r] = k.split(',').map(Number);
    map.hexes[k].nakladka = Nakladka.Las;
    ok(CityHex.clearForestUnderCity(map, q, r) === true && map.hexes[k].nakladka === Nakladka.Brak,
      'A3b usuwa Las i zwraca true');
    ok(CityHex.clearForestUnderCity(map, q, r) === false, 'A3c idempotentna: drugi raz false, bez zmian');
    ok(CityHex.clearForestUnderCity(map, 99999, 99999) === false, 'A3d heks poza mapa: false bez wyjatku');
  }
}
{ // A4: tartak/oboz pod miastem znikaja (filtr macierzy B uzywany przez finalizeCityFounding)
  const prev = ['tartak', 'oboz_lowiecki', 'droga', 'farma'];
  const kept = prev.filter(k => CityHex.cityKeepsImprovement(k));
  ok(!kept.includes('tartak') && !kept.includes('oboz_lowiecki'), 'A4a tartak i oboz nie przezywaja zalozenia miasta');
  ok(kept.includes('droga') && kept.includes('farma'), 'A4b droga i farma zostaja (macierz B)');
  const s = M.stripImprovementsWhenForestRemoved(['tartak', 'oboz_lowiecki', 'droga']);
  ok(JSON.stringify(s) === JSON.stringify(['droga']), 'A4c strip lasu (siatka) usuwa tylko tartak/oboz');
}

console.log('\n=== B. OKABLOWANIE main.ts (tekst zrodla) ===');
const MAIN = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
const lines = MAIN.split('\n');
const lineOf = (i) => MAIN.slice(0, i).split('\n').length;
// kod bez komentarzy (linia zakomentowana nie liczy sie jako wolanie — odporne na mutacje przez komentarz)
function stripComments(t) {
  return t.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
}
function bodyAfter(anchor) {
  const i = MAIN.indexOf(anchor);
  if (i < 0) return null;
  const j = MAIN.indexOf('{', i);
  let d = 0;
  for (let k = j; k < MAIN.length; k++) {
    if (MAIN[k] === '{') d++;
    else if (MAIN[k] === '}') { d--; if (d === 0) return stripComments(MAIN.slice(i, k + 1)); }
  }
  return null;
}
{ // B1: kazde foundCityAt( (poza importem) ma finalizeCityFounding( w kolejnych 30 liniach
  const sites = [];
  lines.forEach((ln, idx) => {
    if (/foundCityAt\(/.test(ln) && !/^\s*(\/\/|\*)/.test(ln) && !/^\s*foundCityAt,/.test(ln)) sites.push(idx);
  });
  ok(sites.length >= 8, 'B1a znaleziono wolania foundCityAt( w main.ts: ' + sites.length);
  const missing = sites.filter(idx => !lines.slice(idx, idx + 30).some(l => /finalizeCityFounding\(/.test(l.replace(/\/\/.*$/, ''))));
  ok(missing.length === 0, 'B1b KAZDE foundCityAt( ma finalizeCityFounding( w oknie 30 linii',
    'brak przy liniach ' + JSON.stringify(missing.map(i => i + 1)));
}
{
  const f = bodyAfter('function finalizeCityFounding(');
  ok(f !== null && /applyCityFoundingToHex\(/.test(f), 'B2 finalizeCityFounding woła applyCityFoundingToHex (czyszczenie lasu)');
}
{
  const e = bodyAfter('function enforceNoForestUnderCities(');
  ok(e !== null && /clearForestUnderCity\(/.test(e) && /stripForestDependentImprovements\(/.test(e) && /hideDecorAtHex\(/.test(e),
    'B3a enforceNoForestUnderCities: usuwa Las, tartak/oboz, chowa dekor');
  const rd = bodyAfter('function reapplyCityHexDecorHides(');
  ok(rd !== null && /enforceNoForestUnderCities\(/.test(rd), 'B3b reapplyCityHexDecorHides woła siatkę (load + presety)');
  ok(/enforceNoForestUnderCities\('granica tury'\)/.test(MAIN), 'B3c siatka wolana na granicy tury');
}
{
  const i = MAIN.indexOf('restoreGameFromSave(saved);');
  const win = i < 0 ? '' : MAIN.slice(i, i + 3500);
  ok(/reapplyCityHexDecorHides\(\)/.test(win), 'B4 wczytanie zapisu (restoreGameFromSave(saved)) -> reapplyCityHexDecorHides()');
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\ncity-clears-forest-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
