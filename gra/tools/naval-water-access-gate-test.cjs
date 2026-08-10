'use strict';
/**
 * naval-water-access-gate-test.cjs -- R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE
 * (Maciej 2026-08-09): jednostki morskie (Typ='Naval', dziś wyłącznie Galera)
 * wymagają, żeby TO miasto miało dostęp do wody (morze LUB rzeka) -- ta sama
 * bramka co Port/Port wielki (TEMAT 8 Q2), reużywająca `ctx.cityHasCoastOrRiver`.
 *
 * Run from gra/: node tools/naval-water-access-gate-test.cjs
 *
 * Pokrywa (a)-(e) z opisu odtworzenia + bramki production.ts:
 *   (a) miasto z dostępem do morza -> Galera dostępna w produkcji
 *   (b) miasto z dostępem do rzeki -> Galera dostępna (main.ts traktuje rzekę
 *       jak wodę -- cityHasCoastOrRiverAccess = isCoastalCity(...) || cityHasWaterAccess(...),
 *       weryfikowane niżej źródłowo; na poziomie production.ts obie sytuacje
 *       sprowadzają się do tej samej flagi ctx.cityHasCoastOrRiver=true, więc
 *       zachowanie behawioralne jest identyczne z (a))
 *   (c) miasto śródlądowe (bez wody) -> Galera NIEDOSTĘPNA w kolejce produkcji
 *   (d) grandfather (decyzja B): istniejąca w kolejce/na mapie Galera w mieście
 *       bez wody NIE jest usuwana/przenoszona -- potwierdzone STRUKTURALNIE:
 *       availableProduction/availableReplacementsFor nie przyjmują rosteru
 *       jednostek ani stanu mapy jako argument (nie MOGĄ nic usunąć z mapy --
 *       to czyste funkcje listujące, nie mutatory)
 *   (e) 5 pinów tekstowych main.ts (wpięcie bonusu ekonomicznego + kontekst
 *       "Zastąp" per-miasto/empire-wide + getCityHasCoastOrRiver)
 *
 * Wzorce zapożyczone z tools/unit-replace-test.cjs (bundling produkcji przez
 * esbuild) i tools/border-march-wygasanie-test.cjs (wycinanie okna wokół kotwicy
 * tekstowej w main.ts).
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  PASS:', label); }
  else { fail++; console.error('  FAIL:', label); }
}

// ---------------------------------------------------------------------------
// CZĘŚĆ 0 -- bundlowanie production.ts przez esbuild (wzorzec unit-replace-test.cjs)
// ---------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[naval-water-access-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.naval-water-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.naval-water-gate-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  availableProduction,
  availableReplacementsFor,
  epochNumber,
} from '../src/game/production';
`, 'utf8');

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
  console.error('[naval-water-access-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableProduction, availableReplacementsFor } = M;

const unitsJson = require('../data/units.json');
const DATA = { buildings: [], units: unitsJson };

const galeraDef = unitsJson.find(u => u.Jednostka === 'Galera');
if (!galeraDef) {
  console.error('[naval-water-access-gate-test] units.json nie zawiera "Galera" -- test nieaktualny wobec danych.');
  process.exit(1);
}
ok(galeraDef.Typ === 'Naval', 'sanity: Galera ma Typ="Naval" w units.json (jeśli to padnie, dane się zmieniły)');

// Ctx bazowy: epoka Brąz (Galera.Epoka='Brąz'=2), Koszary wybudowane (Koszary gate,
// epoch===2 wymaga built.has('koszary')), zapas Brąz>0 w magazynie państwa (Galera.Surowiec='Brąz'),
// technologia 'Żegluga' odblokowana (Galera.Tech='Żegluga'). Nacja='' w danych Galery -->
// unitAllowedForCivNation przepuszcza niezależnie od civUnitNacja.
const TECHS = ['Żegluga'];
function baseCtx(cityHasCoastOrRiver) {
  return {
    epoch: 2,
    builtBuildingIds: ['koszary'],
    civBonusy: [],
    empireResourceStock: { braz: 10 },
    cityHasCoastOrRiver,
  };
}
const city = { id: 'c1', q: 0, r: 0, ownerId: 0, name: 'TestMiasto', population: 5, kulturaSkumulowana: 0 };

// ---------------------------------------------------------------------------
// (a) miasto z dostępem do morza -> Galera dostępna
// ---------------------------------------------------------------------------
console.log('\n(a) miasto z dostępem do morza -- Galera dostępna w availableProduction');
{
  const items = availableProduction(city, DATA, TECHS, baseCtx(true));
  const ids = items.map(i => i.id);
  ok(ids.includes('Galera'), 'availableProduction zawiera Galera gdy cityHasCoastOrRiver=true (morze)', 'ids=' + JSON.stringify(ids));
}

// ---------------------------------------------------------------------------
// (b) miasto z dostępem do rzeki -> Galera dostępna (rzeka = woda, main.ts)
// ---------------------------------------------------------------------------
console.log('\n(b) miasto z dostępem do rzeki -- Galera dostępna (rzeka traktowana jak woda)');
{
  // Na poziomie production.ts nie ma rozróżnienia morze/rzeka -- obie ścieżki main.ts
  // (isCoastalCity / cityHasWaterAccess) redukują się do JEDNEJ flagi cityHasCoastOrRiver
  // (weryfikacja OR-a w main.ts -- patrz CZĘŚĆ E niżej, "cityHasCoastOrRiverAccess = ... || ...").
  // Tu potwierdzamy, że ta sama flaga=true (niezależnie od źródła) odblokowuje Galerę --
  // dokładnie tak samo jak w scenariuszu (a).
  const items = availableProduction(city, DATA, TECHS, baseCtx(true));
  const ids = items.map(i => i.id);
  ok(ids.includes('Galera'), 'availableProduction zawiera Galera gdy cityHasCoastOrRiver=true (rzeka, ta sama flaga co morze)', 'ids=' + JSON.stringify(ids));
}

// ---------------------------------------------------------------------------
// (c) miasto śródlądowe (bez wody) -> Galera NIEDOSTĘPNA
// ---------------------------------------------------------------------------
console.log('\n(c) miasto śródlądowe (bez wody) -- Galera NIEDOSTĘPNA w availableProduction');
{
  const items = availableProduction(city, DATA, TECHS, baseCtx(false));
  const ids = items.map(i => i.id);
  ok(!ids.includes('Galera'), 'availableProduction NIE zawiera Galera gdy cityHasCoastOrRiver=false', 'ids=' + JSON.stringify(ids));
}
{
  // undefined (pole nieprzekazane) musi się zachowywać jak false -- domyślny kontekst {}
  // (ctx.cityHasCoastOrRiver undefined) reprezentuje "nie wiadomo/nie liczone", które NIE MOŻE
  // fałszywie odblokować jednostki morskiej (fail-closed, nie fail-open).
  const ctxNoField = { epoch: 2, builtBuildingIds: ['koszary'], empireResourceStock: { braz: 10 } };
  const items = availableProduction(city, DATA, TECHS, ctxNoField);
  const ids = items.map(i => i.id);
  ok(!ids.includes('Galera'), 'availableProduction: cityHasCoastOrRiver nieprzekazane (undefined) -- fail-closed, Galera niedostępna', 'ids=' + JSON.stringify(ids));
}

// ---------------------------------------------------------------------------
// availableReplacementsFor -- ta sama bramka wewnątrz passesAvailabilityGates
// ---------------------------------------------------------------------------
console.log('\n(a/c dla "Zastąp") availableReplacementsFor -- ta sama bramka dla ścieżki "Zastąp"');
{
  // Zastąp inną jednostkę Typ='Naval' Galerą -- tu Galera zastępuje samą siebie w innym
  // mieście nie ma sensu (currentUnitName!=='Galera'), więc symulujemy zastępowanie
  // hipotetycznej innej jednostki Naval przez ustawienie currentUnitName='Galera' i patrzymy,
  // czy INNA jednostka Naval by się pojawiła -- ponieważ dziś istnieje TYLKO Galera jako
  // Typ=Naval w units.json, testujemy wprost przez wywołanie z innym currentUnitName
  // (jednostka lądowa) i potwierdzamy, że Galera (Typ inny niż lądowy) i tak NIE wchodzi
  // do listy A) (bo utyp!==currentTyp) -- to sprawdza specyficznie bramkę cityHasCoastOrRiver
  // przez wymuszenie ścieżki B) "Zastąp specjalnie" nie jest dostępne dla Galery (pole "—"),
  // więc bezpośredni test bramki robimy inaczej: wołamy availableReplacementsFor('Galera', ...)
  // z ctx cityHasCoastOrRiver=false i sprawdzamy, że wynik NIE zawiera żadnej innej jednostki
  // Naval (bo Galera jest jedyna -- lista i tak pusta), a z cityHasCoastOrRiver=true kontrolnie
  // potwierdzamy że gate nie blokuje niepotrzebnie inne Typ (Galera dalej nie zastępuje samej
  // siebie, ale test dowodzi że wołanie nie wybucha i respektuje ctx).
  const itemsBlocked = availableReplacementsFor('Galera', DATA, TECHS, baseCtx(false));
  const itemsAllowed = availableReplacementsFor('Galera', DATA, TECHS, baseCtx(true));
  ok(Array.isArray(itemsBlocked) && itemsBlocked.length === 0,
    'availableReplacementsFor("Galera", cityHasCoastOrRiver=false) -- pusta lista (jedyna jednostka Naval to Galera sama, samo-zastępowanie wykluczone niezależnie)');
  ok(Array.isArray(itemsAllowed),
    'availableReplacementsFor("Galera", cityHasCoastOrRiver=true) -- nie wybucha, zwraca tablicę');
}

// ---------------------------------------------------------------------------
// MUTACJA (a)-(c): realna mutacja bramki -> FAIL -> przywrócenie -> PASS
// ---------------------------------------------------------------------------
console.log('\nMUTACJA: gate w availableProduction (odwrócenie warunku) -- FAIL potwierdzony, przywrócenie -- PASS potwierdzony');
{
  const prodSrcPath = path.resolve(__dirname, '..', 'src', 'game', 'production.ts');
  const original = fs.readFileSync(prodSrcPath, 'utf8');
  const gateLine = "if ((u.Typ ?? '').toString().trim() === 'Naval' && !ctx.cityHasCoastOrRiver) continue;";
  ok(original.includes(gateLine), 'gate line znaleziona w production.ts (availableProduction) przed mutacją');

  const mutated = original.replace(
    gateLine,
    "if ((u.Typ ?? '').toString().trim() === 'Naval' && ctx.cityHasCoastOrRiver) continue;", // odwrócony warunek
  );
  ok(mutated !== original, 'mutacja faktycznie zmieniła tekst źródłowy');
  fs.writeFileSync(prodSrcPath, mutated, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
    delete require.cache[require.resolve(BUNDLE_FILE)];
    const Mmut = require(BUNDLE_FILE);
    const itemsMut = Mmut.availableProduction(city, DATA, TECHS, baseCtx(true)); // teraz TRUE blokuje (odwrócone)
    const idsMut = itemsMut.map(i => i.id);
    ok(!idsMut.includes('Galera'), 'MUTACJA (warunek odwrócony): Galera znika przy cityHasCoastOrRiver=true -- dowód, że gate faktycznie kontroluje wynik (FAIL scenariusza (a) potwierdzony pod mutacją)');
  } finally {
    fs.writeFileSync(prodSrcPath, original, 'utf8');
  }
  // przywrócenie -- ten sam test co (a) musi znów przejść
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  delete require.cache[require.resolve(BUNDLE_FILE)];
  const Mrestored = require(BUNDLE_FILE);
  const itemsRestored = Mrestored.availableProduction(city, DATA, TECHS, baseCtx(true));
  ok(itemsRestored.map(i => i.id).includes('Galera'), 'PO PRZYWRÓCENIU: Galera znów dostępna przy cityHasCoastOrRiver=true (scenariusz (a) ponownie zielony)');
}

console.log('\nMUTACJA: gate w passesAvailabilityGates (availableReplacementsFor) -- FAIL potwierdzony, przywrócenie -- PASS potwierdzony');
{
  const prodSrcPath = path.resolve(__dirname, '..', 'src', 'game', 'production.ts');
  const original = fs.readFileSync(prodSrcPath, 'utf8');
  const gateLine = "if ((u.Typ ?? '').toString().trim() === 'Naval' && !ctx.cityHasCoastOrRiver) return false;";
  ok(original.includes(gateLine), 'gate line znaleziona w production.ts (passesAvailabilityGates) przed mutacją');

  const mutated = original.replace(gateLine, ''); // usunięcie bramki całkowicie
  ok(mutated !== original, 'mutacja (usunięcie bramki) faktycznie zmieniła tekst źródłowy');
  fs.writeFileSync(prodSrcPath, mutated, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
    delete require.cache[require.resolve(BUNDLE_FILE)];
    const Mmut = require(BUNDLE_FILE);
    // Dodaj drugą jednostkę Naval fikcyjną do lokalnej kopii danych, żeby wykryć,
    // że gate przestał blokować -- prościej: sprawdź samo currentUnitName='Galera' w mieście
    // BEZ wody, ale przez zmodyfikowany DATA z dodatkową jednostką Naval "Galera Testowa"
    // tego samego Typ, dostępną (epoch/tech/nacja spełnione) -- bez bramki wody powinna
    // się pojawić w availableReplacementsFor('Galera', ..., cityHasCoastOrRiver=false).
    const galeraTestowa = { ...galeraDef, Jednostka: 'Galera Testowa' };
    const DATA_MUT = { buildings: [], units: [...unitsJson, galeraTestowa] };
    const itemsMut = Mmut.availableReplacementsFor('Galera', DATA_MUT, TECHS, baseCtx(false));
    const idsMut = itemsMut.map(i => i.id);
    ok(idsMut.includes('Galera Testowa'), 'MUTACJA (bramka usunięta): "Galera Testowa" (Typ=Naval) dostępna w Zastąp mimo cityHasCoastOrRiver=false -- dowód, że bramka faktycznie blokowała');
  } finally {
    fs.writeFileSync(prodSrcPath, original, 'utf8');
  }
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  delete require.cache[require.resolve(BUNDLE_FILE)];
  const Mrestored = require(BUNDLE_FILE);
  const galeraTestowa = { ...galeraDef, Jednostka: 'Galera Testowa' };
  const DATA_MUT = { buildings: [], units: [...unitsJson, galeraTestowa] };
  const itemsRestored = Mrestored.availableReplacementsFor('Galera', DATA_MUT, TECHS, baseCtx(false));
  ok(!itemsRestored.map(i => i.id).includes('Galera Testowa'), 'PO PRZYWRÓCENIU: "Galera Testowa" znów zablokowana bez wody (bramka Zastąp ponownie zielona)');
}

try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }

// ---------------------------------------------------------------------------
// (d) grandfather (decyzja B): brak parametru rosteru/mapy w sygnaturach
// ---------------------------------------------------------------------------
console.log('\n(d) grandfather (decyzja B) -- availableProduction/availableReplacementsFor NIE przyjmują rosteru jednostek ani mapy');
{
  const prodSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'production.ts'), 'utf8');
  const sigAP = prodSrc.slice(
    prodSrc.indexOf('export function availableProduction('),
    prodSrc.indexOf('ProductionItem[] {', prodSrc.indexOf('export function availableProduction(')) + 'ProductionItem[] {'.length,
  );
  ok(sigAP.length > 0, 'znaleziono sygnaturę availableProduction w production.ts');
  ok(!/roster|units:\s*readonly|unitsOnMap|mapa:|map:/i.test(sigAP),
    'sygnatura availableProduction nie przyjmuje rosteru jednostek/mapy jako parametru -- ' + sigAP.replace(/\s+/g, ' '));

  const sigAR = prodSrc.slice(
    prodSrc.indexOf('export function availableReplacementsFor('),
    prodSrc.indexOf('ProductionItem[] {', prodSrc.indexOf('export function availableReplacementsFor(')) + 'ProductionItem[] {'.length,
  );
  ok(sigAR.length > 0, 'znaleziono sygnaturę availableReplacementsFor w production.ts');
  ok(!/roster|units:\s*readonly|unitsOnMap|mapa:|map:/i.test(sigAR),
    'sygnatura availableReplacementsFor nie przyjmuje rosteru jednostek/mapy jako parametru -- ' + sigAR.replace(/\s+/g, ' '));

  // Obie funkcje przyjmują wyłącznie (city/currentUnitName, data, unlockedTechs, ctx) --
  // żadna z nich nie może więc "usunąć" ani "przenieść" istniejącej jednostki z mapy: są to
  // funkcje LISTUJĄCE dostępne opcje w UI, nie mutatory stanu gry. Roster jednostek (main.ts
  // `units`) i mapa żyją poza tym modułem (production.ts jest pure-logic, patrz doc-komentarze
  // przy AvailabilityContext) -- fizycznie nie ma jak stąd dosięgnąć istniejącej Galery na mapie.
  ok(true, 'strukturalnie: production.ts jest pure-logic (brak dostępu do main.ts `units`/`map`) -- istniejąca Galera w mieście bez wody nie może zostać tu usunięta/przeniesiona');
}

// ---------------------------------------------------------------------------
// CZĘŚĆ E -- pięć pinów main.ts (WKLEJONE DOSŁOWNIE z opisu odtworzenia)
// ---------------------------------------------------------------------------
console.log('\n(e) pięć pinów tekstowych main.ts');
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainTs = fs.readFileSync(MAIN_TS, 'utf8');

// Pin 1 (M11, najważniejszy -- łapie brak wpięcia bonusu ekonomicznego)
const seaBonusLoopRe = /for\s*\(const\s*\[cityIdSea,\s*bonusSea\]\s*of\s*seaTradeBonusIncomeByCity\)\s*\{\s*tradeIncomeByCity\.set\(cityIdSea,\s*\(tradeIncomeByCity\.get\(cityIdSea\)\s*\?\?\s*0\)\s*\+\s*bonusSea\);\s*\}/;
ok(seaBonusLoopRe.test(mainTs), 'main.ts wpina bonus morski do tradeIncomeByCity: for ([cityIdSea, bonusSea] of seaTradeBonusIncomeByCity) tradeIncomeByCity.set(...)');

// Pin 2
const seaBonusCallRe = /computeSeaTradeBonusIncomeByCity\(\s*computeSeaTradeRouteCountByCity\(tradeRoutes\),?\s*\)/;
ok(seaBonusCallRe.test(mainTs), 'main.ts woła computeSeaTradeBonusIncomeByCity(computeSeaTradeRouteCountByCity(tradeRoutes))');

// Pin 3 -- okno ok. 1800 znaków od "function replaceAvailabilityCtxForCity("
{
  const anchorIdx = mainTs.indexOf('function replaceAvailabilityCtxForCity(');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "function replaceAvailabilityCtxForCity("');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 1800) : '';
  ok(/cityHasCoastOrRiver:\s*cityHasCoastOrRiverAccess\(city\)/.test(win),
    'replaceAvailabilityCtxForCity zawiera cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city)');
}

// Pin 4 -- okno ok. 1800 znaków od "function replaceAvailabilityCtxEmpireWide("
{
  const anchorIdx = mainTs.indexOf('function replaceAvailabilityCtxEmpireWide(');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "function replaceAvailabilityCtxEmpireWide("');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 1800) : '';
  ok(/cityHasCoastOrRiver:\s*cities\.some\(c\s*=>\s*c\.ownerId\s*===\s*0\s*&&\s*cityHasCoastOrRiverAccess\(c\)\)/.test(win),
    'replaceAvailabilityCtxEmpireWide zawiera wariant cities.some(...)');
}

// Pin 5 -- okno ok. 250 znaków od "getCityHasCoastOrRiver:"
{
  const anchorIdx = mainTs.indexOf('getCityHasCoastOrRiver:');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "getCityHasCoastOrRiver:"');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 250) : '';
  ok(/return\s+c\s*\?\s*cityHasCoastOrRiverAccess\(c\)\s*:\s*false;/.test(win),
    'getCityHasCoastOrRiver zwraca wynik cityHasCoastOrRiverAccess(c), nie stałą');
}

// ---------------------------------------------------------------------------
// Dodatkowe piny źródłowe: gate w purchaseRecruitmentUnit + import + rzeka=woda (OR)
// ---------------------------------------------------------------------------
console.log('\nDodatkowe piny źródłowe main.ts (import, gate zakupu za złoto, rzeka=woda)');
{
  ok(/computeSeaTradeRouteCountByCity,\s*\n\s*computeSeaTradeBonusIncomeByCity,/.test(mainTs),
    'main.ts importuje computeSeaTradeRouteCountByCity i computeSeaTradeBonusIncomeByCity z trade-routes.ts');

  const purchaseIdx = mainTs.indexOf('function purchaseRecruitmentUnit(');
  ok(purchaseIdx >= 0, 'znaleziono function purchaseRecruitmentUnit(');
  const purchaseWin = purchaseIdx >= 0 ? mainTs.slice(purchaseIdx, purchaseIdx + 1600) : '';
  ok(/unitDefForGate\?\.Typ.*'Naval'.*!cityHasCoastOrRiverAccess\(city\)/s.test(purchaseWin),
    'purchaseRecruitmentUnit zawiera bramkę Naval + !cityHasCoastOrRiverAccess(city) (siatka bezpieczeństwa dla zakupu za złoto)');

  ok(/function cityHasCoastOrRiverAccess\(city: Pick<City, 'q' \| 'r'>\): boolean \{\s*return isCoastalCity\(map, city\) \|\| cityHasWaterAccess\(city, map\);/.test(mainTs),
    'cityHasCoastOrRiverAccess = isCoastalCity(...) || cityHasWaterAccess(...) -- rzeka traktowana jak woda (decyzja Macieja, pokrywa scenariusz (b))');

  // N1 (runda 3, tanie przy okazji): zaostrzenie pina zakupu -- wymóg obecności "return false;"
  // W CIELE bloku bramki Naval, nie tylko samego warunku "if (...)". Bez tego mutacja, która
  // usuwa "return false;" (zostawiając pusty/no-op blok if) nie jest łapana, mimo że zakup
  // przechodzi mimo braku dostępu do wody.
  const purchaseGateReturnFalseRe = /unitDefForGate\?\.Typ.*?'Naval'.*?!cityHasCoastOrRiverAccess\(city\)\)\s*\{[\s\S]{0,250}?return false;/s;
  ok(purchaseGateReturnFalseRe.test(purchaseWin),
    'purchaseRecruitmentUnit: bramka Naval zawiera "return false;" w ciele bloku (nie tylko sam warunek if)');
}

// ---------------------------------------------------------------------------
// R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (runda 3, B2): piny regex dla PARYTETU AI --
// trzy miejsca zasilające availableProduction (planowanie AI, egzekucja AI, lista
// rekrutacji gracza), które NIE były wcześniej pinowane. Wzorem pinów 3/4 wyżej:
// okno ~1800 znaków od kotwicy + regex na dokładny literał.
// ---------------------------------------------------------------------------
console.log('\n(B2 runda 3) trzy piny parytetu AI: productionAvailabilityCtxForCity / isProductionAllowed / isBuildAllowed');

// Pin B2.1 -- lista rekrutacji gracza (productionAvailabilityCtxForCity)
{
  const anchorIdx = mainTs.indexOf('function productionAvailabilityCtxForCity(');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "function productionAvailabilityCtxForCity("');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 1800) : '';
  ok(/cityHasCoastOrRiver:\s*cityHasCoastOrRiverAccess\(city\)/.test(win),
    'productionAvailabilityCtxForCity zawiera cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city) (lista rekrutacji gracza)');
}

// Pin B2.2 -- planowanie AI (isProductionAllowed)
{
  const anchorIdx = mainTs.indexOf('isProductionAllowed: (cityId: string, itemId: string)');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "isProductionAllowed: (cityId: string, itemId: string)"');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 1800) : '';
  ok(/cityHasCoastOrRiver:\s*cityHasCoastOrRiverAccess\(c\)/.test(win),
    'isProductionAllowed zawiera cityHasCoastOrRiver: cityHasCoastOrRiverAccess(c) (planowanie AI -- chooseCityProduction)');
}

// Pin B2.3 -- egzekucja AI (isBuildAllowed). Okno szersze niż pozostałe (2200 zn.) -- ten
// blok ma dłuższy komentarz źródłowy (TEMAT 8 Q2 -- parytet AI) między kotwicą a polem.
{
  const anchorIdx = mainTs.indexOf('isBuildAllowed: (id) =>');
  ok(anchorIdx >= 0, 'znaleziono kotwicę "isBuildAllowed: (id) =>"');
  const win = anchorIdx >= 0 ? mainTs.slice(anchorIdx, anchorIdx + 2200) : '';
  ok(/cityHasCoastOrRiver:\s*cityHasCoastOrRiverAccess\(city\)/.test(win),
    'isBuildAllowed zawiera cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city) (egzekucja AI -- executeBuild)');
}

console.log(`\nnaval-water-access-gate-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
