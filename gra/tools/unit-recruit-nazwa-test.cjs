'use strict';
/**
 * unit-recruit-nazwa-test.cjs -- standalone Node regression guard for
 * P-REKRUTACJA-NAZWY-ZNIKAJA (Maciej, playtest 2026-08-09): nazwy jednostek
 * znikaly z panelu REKRUTACJA w widoku miasta.
 *
 * Zbadanie zrodlowe (ta sama sesja) NIE znalazlo pustego `nazwa` -- kazdy z 4
 * punktow tworzenia ProductionItem(kind='jednostka') w production.ts ustawia
 * `nazwa: u.Jednostka` bezwarunkowo, a `units.json` ma pole `Jednostka`
 * wypelnione dla wszystkich 75 wpisow. Pelny render przez buildUnitRecruitCard
 * (jsdom) potwierdzil, ze `item.nazwa` trafia do `name.textContent` poprawnie
 * dla Grecji/epoki Kamien z realnymi bonusami cyw. Ten test jest WIEC STRAZNIKIEM
 * REGRESJI na przyszlosc (dowod mutacyjny w komentarzu ponizej), nie naprawa
 * zastanego buga w tej warstwie -- rzeczywisty (hipotetyczny) mechanizm to
 * ciasny flex w CSS (.unit-compact-cost byl `flex:none`, mogl scisnac
 * `.unit-compact-text` do 0px szerokosci przy dlugich chipach kosztu
 * surowcowego/utrzymania) -- naprawione w unitRecruitCard.ts (min-width floor
 * + cost flex-shrink+wrap).
 *
 * DOWOD MUTACYJNY (wykonany recznie przy pisaniu testu, NIE czesc trwalego
 * zestawu -- podmiana `nazwa: u.Jednostka` na `nazwa: ''` w KAZDYM z 4
 * punktow production.ts po kolei powodowala FAIL tego testu na liscie 1
 * (kazda pusta nazwa jest lapana), potwierdzajac ze asercja rzeczywiscie
 * pokrywa wszystkie 4 miejsca -- przywrocone po potwierdzeniu).
 *
 * Run from gra/:  node tools/unit-recruit-nazwa-test.cjs
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[unit-recruit-nazwa-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.unit-recruit-nazwa-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-recruit-nazwa-bundle.cjs');

const ENTRY_TS = `
export {
  availableProduction,
  availableReplacementsFor,
  purchasableUnits,
  unitProductionItem,
} from '../src/game/production';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[unit-recruit-nazwa-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableProduction, availableReplacementsFor, purchasableUnits, unitProductionItem } = M;

const unitsJson = require('../data/units.json');
const buildingsJson = require('../data/buildings.json');
const DATA = { buildings: Object.values(buildingsJson), units: Object.values(unitsJson) };

let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else {
    failed++;
    console.error('  [FAIL] ' + msg + (extra ? (' -- ' + extra) : ''));
  }
}

function nonBlank(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

console.log('\n[unit-recruit-nazwa-test] Running tests...\n');

// --- 0. Zrodlo danych: kazda jednostka w units.json ma niepuste Jednostka ---
console.log('0. units.json -- kazdy wpis ma niepuste pole Jednostka');
{
  const blanks = DATA.units.filter(u => !nonBlank(u.Jednostka));
  assert(blanks.length === 0, `0 jednostek z pustym Jednostka (znaleziono ${blanks.length})`,
    JSON.stringify(blanks.slice(0, 3)));
}

// --- 1. purchasableUnits -- wszystkie cywilizacje/epoki: nazwa niepusta -----
console.log('\n1. purchasableUnits() -- kazdy ProductionItem(jednostka) ma niepuste nazwa (kilka cyw/epok)');
{
  const nacje = ['', 'Grecja', 'Rzym', 'Egipt', 'Sumer', 'Zulu', 'Inkowie'];
  const civBonusyGrecja = [
    { typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['Falanga', 'Wojownik mykeński', 'Rydwan mykeński', 'Thorakites'] },
  ];
  let totalChecked = 0;
  let anyEmpty = null;
  for (const civUnitNacja of nacje) {
    for (let epoch = 1; epoch <= 3; epoch++) {
      const ctx = {
        epoch,
        builtBuildingIds: ['koszary'],
        civUnitNacja,
        civBonusy: civUnitNacja === 'Grecja' ? civBonusyGrecja : [],
        empireResourceStock: { braz: 10, zelazo: 10, drewno: 10 },
      };
      const techs = ['Łucznictwo', 'Obróbka drewna', 'Brązownictwo', 'Brazownictwo', 'Hutnictwo żelaza'];
      const items = purchasableUnits({ id: 1, ownerId: 0 }, DATA, techs, ctx);
      for (const it of items) {
        totalChecked++;
        if (!nonBlank(it.nazwa)) { anyEmpty = { civUnitNacja, epoch, item: it }; }
      }
    }
  }
  assert(totalChecked > 0, `co najmniej jeden ProductionItem sprawdzony (${totalChecked} razem)`);
  assert(anyEmpty === null, 'zaden ProductionItem(jednostka) nie ma pustego nazwa', JSON.stringify(anyEmpty));
}

// --- 2. availableReplacementsFor -- "Zastąp": nazwa niepusta ----------------
console.log('\n2. availableReplacementsFor() -- kazdy zamiennik ma niepuste nazwa');
{
  const ctx = {
    epoch: 3,
    civUnitNacja: 'Rzym',
    civBonusy: [],
    builtBuildingIds: ['odlewnia_zelaza'],
    empireResourceStock: { braz: 10, zelazo: 10, drewno: 10 },
  };
  const techs = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'];
  const items = availableReplacementsFor('Hastati', DATA, techs, ctx);
  assert(items.length > 0, 'lista zamiennikow niepusta (Hastati)');
  assert(items.every(it => nonBlank(it.nazwa)), 'kazdy zamiennik ma niepuste nazwa',
    JSON.stringify(items.filter(it => !nonBlank(it.nazwa))));
}

// --- 3. availableReplacementsFor -- galaz B ("Zastąp specjalnie", inny Typ) --
console.log('\n3. availableReplacementsFor() -- galaz B (pole "Zastąp specjalnie") ma niepuste nazwa');
{
  const ctx = {
    epoch: 3,
    civUnitNacja: 'Rzym',
    civBonusy: [],
    builtBuildingIds: ['odlewnia_zelaza'],
    empireResourceStock: { braz: 10, zelazo: 10, drewno: 10 },
  };
  const techs = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'];
  const items = availableReplacementsFor('Wojownik tyrreński', DATA, techs, ctx);
  const evocati = items.find(it => it.id === 'Evocati');
  assert(!!evocati, 'Evocati obecny w galezi B (pole "Zastąp specjalnie")', JSON.stringify(items.map(i => i.id)));
  assert(items.every(it => nonBlank(it.nazwa)), 'kazdy wpis galezi B ma niepuste nazwa',
    JSON.stringify(items.filter(it => !nonBlank(it.nazwa))));
}

// --- 4. unitProductionItem -- pojedynczy budowniczy ProductionItem ----------
console.log('\n4. unitProductionItem() -- niepuste nazwa dla kilku jednostek');
{
  const ids = ['Wojownik', 'Zwiadowca', 'Łucznik', 'Hastati', 'Evocati'];
  for (const id of ids) {
    const it = unitProductionItem(id, DATA);
    assert(!!it, `unitProductionItem('${id}') zwraca wpis`);
    if (it) assert(nonBlank(it.nazwa), `unitProductionItem('${id}').nazwa niepuste`, JSON.stringify(it));
  }
}

// --- summary -----------------------------------------------------------------
console.log(`\n[unit-recruit-nazwa-test] ${passed} passed, ${failed} failed.\n`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }
process.exit(failed > 0 ? 1 : 0);
