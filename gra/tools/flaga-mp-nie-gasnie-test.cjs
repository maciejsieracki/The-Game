'use strict';
/**
 * flaga-mp-nie-gasnie-test.cjs — bramka tematu R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 * ECHO wlasciciela = wariant A: „oznaczenie miasta-panstwa znika przy KAZDYM przejeciu
 * miasta-panstwa, takze zbrojnym".
 *
 * Bramka ma dwie warstwy i obie sa istotne:
 *   A) ZACHOWANIE — na PRAWDZIWYM module `display-names.ts` (bez atrapy): czy po przejeciu
 *      miasta byle miasta-panstwa zdobywca przestaje byc traktowany jak miasto-panstwo,
 *      czy PRAWDZIWE miasta-panstwa nadal nim sa, czy zdobywca wraca do rankingu Mocy
 *      (`filterOwnersForPowerRanking` z `power-ranking.ts`) i odzyskuje portret wladcy
 *      (`shouldForceCultureIconForOwner`).
 *   B) WPIECIE — kanarek zrodlowy na `main.ts`: czy KAZDA sciezka zmiany wlasciciela miasta
 *      w wyniku przejecia faktycznie wola `clearCityStateFlagOnCapture`. Warstwa A nie jest
 *      w stanie tego zobaczyc (main.ts nie jest importowalny bez DOM), a bez wpiecia
 *      poprawna funkcja jest martwa.
 *
 * Uruchomienie (z gra/): node tools/flaga-mp-nie-gasnie-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.flaga-mp-entry.ts');
const bundle = path.join(__dirname, '.flaga-mp-bundle.cjs');

fs.writeFileSync(entry, `
export {
  isOwnerClusterCityState,
  shouldForceCultureIconForOwner,
  clearCityStateFlagOnCapture,
  formatCityMapLabel,
  CITY_STATE_LABEL,
} from '../src/game/display-names';
export { filterOwnersForPowerRanking } from '../src/game/power-ranking';
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
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('flaga-mp-nie-gasnie-test (R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1, wariant A)\n');

/**
 * Scena wspolna: gracz (0), dwie glowne cywilizacje (1, 2) i dwa miasta-panstwa (3, 4).
 * Zbiory `simplifiedOwners` / `typCopyOwners` nadawane sa PRZY SPAWNIE i nie zmieniaja sie
 * w trakcie gry (main.ts: spawnPendingSameTypeRivals / spawnPendingForeignClusters) — tu
 * odwzorowane 1:1, wiec MP zostaje MP niezaleznie od losow swoich miast.
 */
function scena() {
  const cities = [
    { id: 'roma', name: 'Rzym', ownerId: 1, startCityState: false },
    { id: 'kartagina', name: 'Kartagina', ownerId: 2, startCityState: false },
    { id: 'sparta', name: 'Sparta', ownerId: 3, startCityState: true },
    { id: 'mykeny', name: 'Mykeny', ownerId: 4, startCityState: true },
    { id: 'argos', name: 'Argos', ownerId: 4, startCityState: true },
  ];
  const opts = {
    simplifiedOwners: new Set([3, 4]),
    typCopyOwners: new Set([3, 4]),
    cities,
  };
  return { cities, opts };
}

/** Zdobycie sila: jedyna zmiana stanu to wlasciciel + wolanie testowanej funkcji. */
function zdobadz(cities, cityId, newOwnerId) {
  const city = cities.find(c => c.id === cityId);
  M.clearCityStateFlagOnCapture(city);
  city.ownerId = newOwnerId;
  return city;
}

// ── T1. Stan wyjsciowy (kontrola sceny: bez tego kolejne asercje nic nie znacza) ────────
{
  const { opts } = scena();
  assert(M.isOwnerClusterCityState(1, opts) === false, 'T1a: przed zdobyciem AI 1 nie jest miastem-panstwem');
  assert(M.isOwnerClusterCityState(3, opts) === true, 'T1b: przed zdobyciem MP 3 jest miastem-panstwem');
  assert(M.isOwnerClusterCityState(4, opts) === true, 'T1c: przed zdobyciem MP 4 jest miastem-panstwem');
}

// ── T2. RDZEN: zbrojne przejecie miasta MP nie zaraza zdobywcy ──────────────────────────
{
  const { cities, opts } = scena();
  zdobadz(cities, 'sparta', 1);
  assert(cities.find(c => c.id === 'sparta').startCityState === false,
    'T2a: zdobyta Sparta traci oznaczenie miasta-panstwa');
  assert(M.isOwnerClusterCityState(1, opts) === false,
    'T2b: zdobywca (AI 1) NIE jest traktowany jak miasto-panstwo po zbrojnym przejeciu');
  assert(M.isOwnerClusterCityState(2, opts) === false,
    'T2c: postronna cywilizacja (AI 2) bez zmian');
}

// ── T3. Mechanizm NIE zostal wylaczony: prawdziwe MP nadal sa MP ────────────────────────
{
  const { cities, opts } = scena();
  zdobadz(cities, 'sparta', 1);
  assert(M.isOwnerClusterCityState(3, opts) === true,
    'T3a: MP 3 (zbior spawnowy) nadal jest miastem-panstwem po utracie miasta');
  assert(M.isOwnerClusterCityState(4, opts) === true,
    'T3b: nietkniete MP 4 nadal jest miastem-panstwem');
  assert(cities.find(c => c.id === 'mykeny').startCityState === true
    && cities.find(c => c.id === 'argos').startCityState === true,
    'T3c: miasta nietknietego MP zachowuja oznaczenie');
}

// ── T4. MP z dwoma miastami traci JEDNO — nadal jest MP, zdobywca nadal nie jest ─────────
{
  const { cities, opts } = scena();
  zdobadz(cities, 'argos', 2);
  assert(M.isOwnerClusterCityState(4, opts) === true,
    'T4a: MP 4 po utracie jednego z dwoch miast nadal jest miastem-panstwem');
  assert(M.isOwnerClusterCityState(2, opts) === false,
    'T4b: zdobywca Argos (AI 2) nie staje sie miastem-panstwem');
  assert(cities.filter(c => c.ownerId === 4 && c.startCityState).length === 1,
    'T4c: MP 4 zostaje z dokladnie jednym oznaczonym miastem');
}

// ── T5. Skutek: lista poteg (ranking Mocy) ──────────────────────────────────────────────
{
  const { cities, opts } = scena();
  const owners = [0, 1, 2, 3, 4];
  const rankOpts = () => ({ cityStateOpts: opts, discoveredOwners: new Set([1, 2, 3, 4]), showAllCivs: true });
  const przed = M.filterOwnersForPowerRanking(owners, rankOpts());
  assert(przed.includes(1) && !przed.includes(3) && !przed.includes(4),
    'T5a: przed zdobyciem w rankingu sa gracz i glowne AI, nie ma miast-panstw');
  zdobadz(cities, 'sparta', 1);
  const po = M.filterOwnersForPowerRanking(owners, rankOpts());
  assert(po.includes(1), 'T5b: zdobywca (AI 1) ZOSTAJE na liscie poteg po podboju MP');
  assert(!po.includes(3) && !po.includes(4),
    'T5c: prawdziwe miasta-panstwa nadal poza lista poteg');
}

// ── T6. Skutek: portret wladcy w dyplomacji ─────────────────────────────────────────────
{
  const { cities, opts } = scena();
  const portretOpts = (oid) => ({
    ...opts,
    clusterCapitalOwnerIds: new Set([1, 2]),
    playerCivKey: 'grecy',
    ownerCivKey: oid === 1 ? 'rzymianie' : oid === 2 ? 'kartaginczycy' : 'grecy',
  });
  assert(M.shouldForceCultureIconForOwner(1, portretOpts(1)) === false,
    'T6a: przed zdobyciem AI 1 ma portret wladcy');
  zdobadz(cities, 'sparta', 1);
  assert(M.shouldForceCultureIconForOwner(1, portretOpts(1)) === false,
    'T6b: po podboju MP zdobywca NADAL ma portret wladcy (nie symbol kultury)');
  assert(M.shouldForceCultureIconForOwner(4, portretOpts(4)) === true,
    'T6c: prawdziwe MP 4 nadal ma symbol kultury zamiast portretu');
}

// ── T7. Etykieta miasta na mapie ────────────────────────────────────────────────────────
{
  const { cities } = scena();
  const sparta = cities.find(c => c.id === 'sparta');
  const suffix = ' · ' + M.CITY_STATE_LABEL;
  assert(M.formatCityMapLabel(sparta, { playerOwnerId: 0 }) === 'Sparta' + suffix,
    'T7a: przed zdobyciem Sparta ma dopisek miasta-panstwa');
  zdobadz(cities, 'sparta', 1);
  assert(M.formatCityMapLabel(sparta, { playerOwnerId: 0 }) === 'Sparta',
    'T7b: po zdobyciu Sparta traci dopisek miasta-panstwa');
}

// ── T8. Zgodnosc z zapisem gry: flaga zyje na obiekcie miasta, ktory idzie do sejwu ──────
{
  const { cities, opts } = scena();
  zdobadz(cities, 'sparta', 1);
  // main.ts zapisuje `cities: cities.slice()` — round-trip JSON odwzorowuje sejw 1:1.
  const wczytane = JSON.parse(JSON.stringify(cities));
  const optsPo = { simplifiedOwners: new Set([3, 4]), typCopyOwners: new Set([3, 4]), cities: wczytane };
  assert(M.isOwnerClusterCityState(1, optsPo) === false,
    'T8a: po zapisie i wczytaniu zdobywca nadal nie jest miastem-panstwem');
  assert(M.isOwnerClusterCityState(4, optsPo) === true,
    'T8b: po zapisie i wczytaniu prawdziwe MP nadal jest miastem-panstwem');
  // Rekonstrukcja legacy (main.ts: brak pol w meta -> odtworz z c.startCityState).
  const legacy = new Set();
  for (const c of wczytane) if (c.startCityState) legacy.add(c.ownerId);
  assert(!legacy.has(1) && legacy.has(4),
    'T8c: legacy rekonstrukcja zbiorow MP z flag miast nie wciaga zdobywcy');
}

// ── T9. Funkcja jest idempotentna i nie rusza miast bez flagi ───────────────────────────
{
  const { cities } = scena();
  const roma = cities.find(c => c.id === 'roma');
  assert(M.clearCityStateFlagOnCapture(roma) === false && roma.startCityState === false,
    'T9a: miasto bez oznaczenia MP — funkcja zglasza brak zmiany');
  const sparta = cities.find(c => c.id === 'sparta');
  assert(M.clearCityStateFlagOnCapture(sparta) === true, 'T9b: pierwsze wywolanie gasi flage');
  assert(M.clearCityStateFlagOnCapture(sparta) === false, 'T9c: drugie wywolanie nic nie zmienia');
}

// ── T10-T13. KANAREK ZRODLOWY main.ts — wpiecie na KAZDEJ sciezce przejecia miasta ──────
function sliceFn(src, sig, nextSig) {
  const start = src.indexOf(sig);
  if (start < 0) return '';
  const end = src.indexOf(nextSig, start + sig.length);
  return src.slice(start, end < 0 ? src.length : end);
}

assert(main.includes('clearCityStateFlagOnCapture'),
  'T10: main.ts w ogole importuje/wola clearCityStateFlagOnCapture');

{
  // Sciezka 1 — podboj bojowy / szturm / wejscie do pustego miasta: wszystkie trzy
  // przechodza przez applyCityCaptureToMap -> applyCityCaptureAfterBattle(onOwnerChanged).
  const fn = sliceFn(main,
    'function applyCityCaptureToMap(',
    '\n    function refreshMapAfterCityCapture(');
  assert(fn.length > 0 && fn.includes('clearCityStateFlagOnCapture('),
    'T11: podboj bojowy (applyCityCaptureToMap) gasi flage MP');
}

{
  // Sciezka 2 — kapitulacja glodowa oblezenia (drugie miejsce, gdzie city.ownerId zmienia
  // sie w wyniku wojny; patrz komentarz B1 przy maybeResolveBronzeForcedWarOnCityCapture).
  const fn = sliceFn(main,
    'function resolveSiegeSurrender(cityId: string): void {',
    '\n    function endMapSiege(cityId: string): void {');
  assert(fn.length > 0 && fn.includes('clearCityStateFlagOnCapture('),
    'T12: kapitulacja glodowa oblezenia (resolveSiegeSurrender) gasi flage MP');
}

{
  // Sciezka 3 — pokojowe wchloniecie MP. Dzialalo juz przed tym tematem (recznym
  // przypisaniem); tu tylko pilnujemy, ze nadal gasi i idzie ta sama funkcja.
  const fn = sliceFn(main,
    'function annexCityStateToOwner(csOwnerId: number, annexerId: number): void {',
    '\n    function eliminateOwner(');
  assert(fn.length > 0 && fn.includes('clearCityStateFlagOnCapture('),
    'T13: pokojowe wchloniecie (annexCityStateToOwner) gasi flage MP ta sama funkcja');
}

{
  // Zaden inny fragment main.ts nie moze przypisywac `startCityState` recznie poza spawnem
  // (dwa miejsca: rywale tego samego typu + obce klastry). Jesli pojawi sie trzecie,
  // ten temat trzeba przejrzec ponownie.
  const przypisania = (main.match(/\.startCityState = /g) || []).length;
  assert(przypisania === 2,
    'T14: w main.ts zostaly dokladnie 2 reczne przypisania startCityState (oba to spawn), jest ' + przypisania);
}

// ── T15. Luka Final Control (R-AI-DLUG-PORZADKI-Q1, poz. c): T11/T12 wyzej lapia
// TYLKO zniknięcie wołania clearCityStateFlagOnCapture(...) — NIE lapia zniknięcia
// TOWARZYSZĄCEGO mu markCityStateDirty() (bez niego wygaszona flaga nie przelicza
// ekonomii/HUD do najbliższej innej okazji). Sprawdź PAROWANIE w obu sciezkach
// zbrojnych naraz — usuniecie ktoregokolwiek `markCityStateDirty()` po
// `clearCityStateFlagOnCapture(...)` w ktoryms z dwoch blokow ma zaczerwienic ta asercje.
{
  const fnBattle = sliceFn(main,
    'function applyCityCaptureToMap(',
    '\n    function refreshMapAfterCityCapture(');
  const fnSiege = sliceFn(main,
    'function resolveSiegeSurrender(cityId: string): void {',
    '\n    function endMapSiege(cityId: string): void {');
  const pairPattern = /clearCityStateFlagOnCapture\([^)]*\)\)\s*markCityStateDirty\(\);/;
  assert(pairPattern.test(fnBattle) && pairPattern.test(fnSiege),
    'T15: markCityStateDirty() bezposrednio po clearCityStateFlagOnCapture(...) w OBU sciezkach zbrojnych (applyCityCaptureToMap + resolveSiegeSurrender)');
}

console.log('\nWynik: ' + passed + ' PASS, ' + failed + ' FAIL');
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* sprzatanie */ }
process.exit(failed === 0 ? 0 : 1);
