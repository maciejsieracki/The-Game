'use strict';
/**
 * unit-replace-test.cjs -- standalone Node sanity test for availableReplacementsFor()
 * (mechanizm "Zastąp", ZASTAP-JEDNOSTKI-PLAN.md). Run from gra/:
 *   node tools/unit-replace-test.cjs
 *
 * Bundles production.ts (+ deps) via esbuild, loads the REAL data/units.json,
 * and checks two scenarios from the dyspozycja:
 *   1. Rzym w epoce Żelazo: lista zamienników dla Hastati (Typ=Swordsman) zawiera
 *      inne miecznik-y tego samego Typ (Wojownik, Evocati), NIE zawiera Hastati
 *      samej siebie ani jednostek innej nacji (Hieros Lochos = Grecja).
 *   2. "Wojownik tyrreński" (Typ=Offensive) -> lista zawiera "Evocati" (Typ=Swordsman)
 *      mimo innego Typ, wyłącznie dzięki polu "Zastąp specjalnie" -- i tylko gdy
 *      Evocati jest faktycznie odblokowany (epoka/tech); gdy nie -- znika.
 *
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[unit-replace-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.unit-replace-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-replace-bundle.cjs');

const ENTRY_TS = `
export {
  availableReplacementsFor,
  availableProduction,
  epochNumber,
} from '../src/game/production';
export {
  buildReplaceAvailabilityCtx,
} from '../src/game/unit-replace-context';
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
  console.error('[unit-replace-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableReplacementsFor, buildReplaceAvailabilityCtx } = M;

const unitsJson = require('../data/units.json');
const DATA = { buildings: [], units: Object.values(unitsJson) };

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(cond, msg, extra) {
  if (cond) {
    passed++;
    console.log('  [OK] ' + msg);
  } else {
    failed++;
    const detail = extra ? (' -- ' + extra) : '';
    console.error('  [FAIL] ' + msg + detail);
  }
}

// Ctx: Rzym gracz w epoce Zelazo (3), Hutnictwo zelaza + Brazownictwo zbadane,
// bez bonusow cyw (civBonusy=[]) -- specTokens puste, wiec jednostki "Specjalna"
// innych nacji i tak odpadaja na bramce Nacja. builtBuildingIds zawiera Odlewnie
// zelaza + hasKopalniaNaZlozuZelaza=true (dec. wlasciciela 2026-07-19: jednostki
// Zelaza wymagaja Surowiec='zelazo' -- Evocati/Hastati itd.) -- ten test sprawdza
// filtrowanie Nacja/Typ/Tech, WIEC symulowany gracz ma juz pelny dostep do zelaza.
const RZYM_ZELAZO_CTX = {
  epoch: 3,
  civUnitNacja: 'Rzym',
  civBonusy: [],
  builtBuildingIds: ['odlewnia_zelaza'],
  placedImprovements: null,
  hasKopalniaNaZlozuZelaza: true,
  // UNIT-REPLACE-EVOCATI-Q1 (nota N1): passesAvailabilityGates (production.ts) sprawdza
  // dostep do surowca Braz/Zelazo przez empireStockHas(ctx.empireResourceStock, ...) --
  // bez tego pola KAZDA jednostka Surowiec=Braz/Zelazo jest odrzucana (undefined ?? 0 > 0
  // = false). Symulacja gracza z pelnym magazynem obu surowcow (10 jednostek kazdy) --
  // zgodna z tym, co main.ts realnie przekazuje po naprawie replaceAvailabilityCtxForCity/
  // replaceAvailabilityCtxEmpireWide (przez buildReplaceAvailabilityCtx, patrz sekcja 4 nizej).
  empireResourceStock: { braz: 10, zelazo: 10 },
};
const TECHS_ZELAZO = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'];

console.log('\n[unit-replace-test] Running tests...\n');

// --- Scenario 1: Hastati (Rzym, Zelazo, Typ=Swordsman) ----------------------
console.log('1. Rzym / Zelazo -- zamienniki dla Hastati (Typ=Swordsman)');
{
  const items = availableReplacementsFor('Hastati', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  const ids = items.map(i => i.id);
  assert(ids.length > 0, 'lista niepusta', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Hastati'), 'Hastati nie zastepuje samej siebie', 'ids=' + JSON.stringify(ids));
  assert(ids.includes('Wojownik'), 'zawiera inny miecznik tego samego Typ (Wojownik, uniwersalny)', 'ids=' + JSON.stringify(ids));
  assert(ids.includes('Evocati'), 'zawiera Evocati (Rzym, Typ=Swordsman, odblokowany w Zelazie)', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Hieros Lochos (Święty Zastęp)'), 'NIE zawiera Hieros Lochos (Grecja != Rzym)', 'ids=' + JSON.stringify(ids));
  assert(items.every(i => i.kind === 'jednostka' && typeof i.koszt === 'number'), 'każda pozycja ma kind=jednostka i liczbowy koszt');
}

// --- Scenario 2: Wojownik tyrreński -> Evocati mimo innego Typ --------------
console.log('\n2. "Wojownik tyrreński" (Typ=Offensive) -> dochodzi "Evocati" (Typ=Swordsman)');
{
  const items = availableReplacementsFor('Wojownik tyrreński', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  const ids = items.map(i => i.id);
  assert(ids.includes('Evocati'), 'Evocati obecny mimo innego Typ (pole "Zastąp specjalnie")', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Wojownik tyrreński'), 'nie zastepuje samej siebie', 'ids=' + JSON.stringify(ids));
}

// --- Scenario 2b: bez odblokowanego Evocati (brak tech) -> znika ------------
console.log('\n2b. Bez tech "Hutnictwo żelaza" -- Evocati NIE jest jeszcze "dostępny", znika z listy');
{
  const ctxNoTech = { ...RZYM_ZELAZO_CTX, epoch: 2 }; // Braz -- Evocati wymaga Zelaza
  const items = availableReplacementsFor('Wojownik tyrreński', DATA, ['Brazownictwo', 'Brązownictwo'], ctxNoTech);
  const ids = items.map(i => i.id);
  assert(!ids.includes('Evocati'), 'Evocati zniknal (nieodblokowany w epoce Brazu)', 'ids=' + JSON.stringify(ids));
}

// --- Scenario 3: nieznana jednostka -> pusta lista --------------------------
console.log('\n3. Nieznana nazwa jednostki -> []');
{
  const items = availableReplacementsFor('Nie Ma Takiej Jednostki', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  assert(Array.isArray(items) && items.length === 0, 'zwraca pusta tablice dla nieznanej jednostki');
}

// --- Scenario 4: buildReplaceAvailabilityCtx (UNIT-REPLACE-EVOCATI-Q1, nota N1) ---
// main.ts (replaceAvailabilityCtxForCity/replaceAvailabilityCtxEmpireWide) jest zbyt
// duzy/zalezny od DOM zeby bundlowac go w calosci w tym tescie -- ta sekcja testuje
// WPROST buildReplaceAvailabilityCtx (game/unit-replace-context.ts), czyli DOKLADNIE
// tą funkcję, którą oba miejsca w main.ts wołają zamiast składać kontekst same. Gdyby
// ktoś usunął `empireResourceStock: citySurowceSumForOwner(...)` z main.ts, przestałby
// się kompilować (pole obowiązkowe w ReplaceAvailabilityCtxParams -- patrz tsc bramka);
// gdyby ktoś zepsuł SAMĄ funkcję (np. przestała przepisywać pole do zwracanego obiektu),
// to poniższe asercje behawioralne to wykryją, mimo że tsc by tego nie złapał
// (AvailabilityContext.empireResourceStock jest tam polem opcjonalnym).
console.log('\n4. buildReplaceAvailabilityCtx (main.ts "Zastąp" -- pokrycie UNIT-REPLACE-EVOCATI-Q1)');
{
  const baseParams = {
    epoch: 3,
    builtBuildingIds: ['odlewnia_zelaza'],
    civBonusy: [],
    civUnitNacja: 'Rzym',
    placedImprovements: null,
    hasKopalniaNaZlozuZelaza: true,
    aliveUnitTypeNames: new Set(),
    kosztJednostekPace: 'niski',
    ownerId: 0,
    difficulty: 'normal',
  };

  // 4a. Roundtrip: empireResourceStock przekazany do buildReplaceAvailabilityCtx trafia
  //     1:1 do zwróconego AvailabilityContext (dokładnie to pole main.ts gubił do
  //     UNIT-REPLACE-EVOCATI-Q1 -- główny cel tego testu).
  const stock = { braz: 3, zelazo: 5 };
  const ctxZStokiem = buildReplaceAvailabilityCtx({ ...baseParams, empireResourceStock: stock });
  assert(
    ctxZStokiem.empireResourceStock === stock,
    'empireResourceStock z parametrów trafia 1:1 do zwróconego AvailabilityContext',
    'ctx.empireResourceStock=' + JSON.stringify(ctxZStokiem.empireResourceStock),
  );

  // 4b. Zachowanie end-to-end: kontekst ZE stokiem Żelaza odblokowuje Evocati
  //     (Surowiec=Żelazo) w availableReplacementsFor -- jak realnie w grze po
  //     replaceAvailabilityCtxForCity/EmpireWide (main.ts).
  const itemsZeStokiem = availableReplacementsFor('Wojownik tyrreński', DATA, TECHS_ZELAZO, ctxZStokiem);
  const idsZeStokiem = itemsZeStokiem.map(i => i.id);
  assert(
    idsZeStokiem.includes('Evocati'),
    'ctx z buildReplaceAvailabilityCtx (empireResourceStock={zelazo:5}) odblokowuje Evocati',
    'ids=' + JSON.stringify(idsZeStokiem),
  );

  // 4c. Kontrast: kontekst z PUSTYM magazynem (zero Żelaza) -- Evocati znika. Dowodzi,
  //     że to naprawdę WARTOŚĆ pola (nie sama jej obecność) steruje bramką w
  //     passesAvailabilityGates (production.ts) -- symuluje stan main.ts SPRZED
  //     naprawy UNIT-REPLACE-EVOCATI-Q1 (empireResourceStock brakujące/puste).
  const ctxBezStoku = buildReplaceAvailabilityCtx({ ...baseParams, empireResourceStock: {} });
  const itemsBezStoku = availableReplacementsFor('Wojownik tyrreński', DATA, TECHS_ZELAZO, ctxBezStoku);
  const idsBezStoku = itemsBezStoku.map(i => i.id);
  assert(
    !idsBezStoku.includes('Evocati'),
    'ctx z pustym empireResourceStock NIE odblokowuje Evocati (regresja UNIT-REPLACE-EVOCATI-Q1)',
    'ids=' + JSON.stringify(idsBezStoku),
  );
}

// --- Summary -----------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log('[unit-replace-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[unit-replace-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
