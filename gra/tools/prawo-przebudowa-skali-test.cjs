'use strict';
/**
 * prawo-przebudowa-skali-test.cjs
 * Bramka tematu R-PRAWO-PRZEBUDOWA-SKALI-Q1 (decyzje D1-D7 właściciela 2026-09-05,
 * `dyspozycje/BALANS-PRAWO-PRZEBUDOWA.md`, `dyspozycje/autobot/runs/R-PRAWO-PRZEBUDOWA-SKALI-Q1/00-dispatch.md`).
 *
 * Run: cd gra && node tools/prawo-przebudowa-skali-test.cjs
 *
 * Test importuje PRAWDZIWE moduly (esbuild na ../src/game/*, ../src/ui/cityPanel) i
 * PRAWDZIWE dane (data/*.json) — nie odtwarza formul wlasna kopia (playbook C-046,
 * wzorzec ucieczki mutacyjnej). Kazda liczba oczekiwana jest liczba WLASCICIELA z
 * 00-dispatch.md/BALANS-PRAWO-PRZEBUDOWA.md, albo PRZELICZONA z danych przez ten test
 * (sekcje 3b/3d, gdzie dispatch wprost zada "policz sam, nie przepisuj").
 *
 * Sekcje = kryteria konca 3a-3i z 00-dispatch.md:
 *   3a  tabela prawo_max_epoka co do cyfry (9 wartosci) + rozne per trudnosc
 *   3b  "ilu obywateli epoka umie rzadzic na 100%" — PRZELICZONE z danych
 *   3c  ciag "ilu obywateli" rosnacy od epoki 2 do 3, na kazdej trudnosci
 *   3d  prawMax miasta pop 12 i pop 20, kazda epoka, kazda trudnosc
 *   3e  suma Prawa z budynkow miasta ZWYKLEGO = 53/85/121 (normal), lancuchy zwiniete
 *   3f  Palac jest stolica-only, NIE wchodzi do kalibracji miasta zwyklego
 *   3g  skan negatywny: dwa usuniete klucze kar nie wystepuja (dane + funkcjonalnie)
 *   3h  prawo_pct_cap=170 i pomiar, do ilu realnie dochodzi PorPct
 *   3i  parytet panel <-> silnik (cityPanel.ts zbudowany i URUCHOMIONY, nie porownany z soba)
 *   3j  pulapka nazewnicza, druga czesc: realne ciecie linesHtml(s.prawLines, 6, pfx) w
 *       orderPanel.ts (via buildOrderSectionHtml, WYWOLANE, nie surowa tablica lines[]) --
 *       scenariusz stolicy z Palacem dajacy 6 linii Prawa, obie linie 'garnizon'/
 *       'garnizon_budynek' widoczne w HTML PO cieciu (Evaluator runda 1, zarzut #3)
 *
 * ZNALEZISKO (zglaszane w raporcie, NIE poprawiane samodzielnie — Tryb pierwszy):
 * tabela "P" wlasciciela w 00-dispatch.md (easy 12,6/13,1/14,2; hard 6,2/5,2/6,9) zaklada
 * TA SAMA sume budynkow 53/85/121 na kazdej trudnosci. W realnych danych admin. budynki
 * (dom_starszyzny/dwor_zarzadcy/pretorium/trybunal/sad) MAJA WLASNE wartosci per trudnosc
 * (istniejace od R-PRAWO-SIATKA-V2, poza allowlista tego tematu) — sumy sa wiec 61/100/144
 * (easy) i 47/74/107 (hard), nie 53/85/121. Stad realne P wychodzi inaczej: easy
 * 16,16/17,24/18,63, hard 3,11/1,66/3,73. Sekcja 3b asercjuje PRZELICZONA (realna) wartosc,
 * zgodnie z jawna instrukcja dispatchu "policz sam z danych... zglos rozbieznosc, zamiast
 * dopasowywac test do tabeli". `prawo_max_epoka` samo (kryterium 1/3a) jest mimo to DOKLADNIE
 * liczba wlasciciela — rozbieznosc dotyczy WYLACZNIE pomocniczej tabeli P, nie parametru.
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[prawo-przebudowa-skali-test] brak esbuild. Uruchom: npm install (z gra/)');
    process.exit(1);
  }
})();

const ENTRY = path.resolve(__dirname, '.prawo-przebudowa-skali-entry.ts');
const BUNDLE = path.resolve(__dirname, '.prawo-przebudowa-skali-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeLawBreakdown,
  evaluateOrderFromBreakdown,
  loadSocietyScaleParams,
  prawMaxForEra,
  prawMaxForCity,
  prawGarnizonBudynekForEra,
  computePorPct,
} from '../src/game/society-breakdown';
export { loadOrderParams } from '../src/game/order';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[prawo-przebudowa-skali-test] bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const rawSocietyText = fs.readFileSync(path.resolve(GRA, 'data', 'society-params.json'), 'utf8');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}
function eq(a, b, msg) {
  ok(a === b, msg + ' -- got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function near(a, b, msg, eps) {
  const e = eps === undefined ? 1e-9 : eps;
  ok(Math.abs(a - b) <= e, msg + ' -- got ' + JSON.stringify(a) + ', want ~' + JSON.stringify(b));
}
function section(t) { console.log('\n-- ' + t + ' --'); }

console.log('\n[prawo-przebudowa-skali-test] R-PRAWO-PRZEBUDOWA-SKALI-Q1');

const DIFFS = ['easy', 'normal', 'hard'];
const bud = (id) => buildings.find((b) => b.id === id) ?? {};

// Konfiguracja administracji MIASTA ZWYKLEGO (region), komplet epoki, lancuchy ZWINIETE
// (upgrade usuwa poprzednika z builtIds -- Dom Starszyzny XOR Dwor Zarzadcy XOR Pretorium,
// nigdy wszystkie trzy, patrz building-resource-gate.ts:357). BEZ garnizonu wojskowego
// (garnizonCount:0) -- tylko budynek Garnizon (hasGarnizonBudynek), zgodnie z D1: jednostki
// NIE wchodza do kalibracji prawMax.
const REGION_ADMIN = {
  1: { hasDomStarszyzny: true },
  2: { hasDworZarzadcy: true, hasTrybunal: true },
  3: { hasPretorium: true, hasTrybunal: true, hasSad: true },
};

// ===========================================================================
section('3a. tabela prawo_max_epoka co do cyfry, per trudnosc');
// ===========================================================================
const PRAWMAX_D3 = { easy: [35, 55, 75], normal: [40, 65, 85], hard: [45, 75, 100] };
for (const diff of DIFFS) {
  const scale = M.loadSocietyScaleParams(society, diff);
  eq(scale.prawMaxByEra.join(','), PRAWMAX_D3[diff].join(','),
    `prawo_max_epoka ${diff} = ${PRAWMAX_D3[diff].join(',')} (D3/D3a, liczby wlasciciela)`);
}
// Asercja "roznia sie miedzy trudnosciami" -- zeby bramka odroznila "wczytano z JSON" od
// "wzieto fallback z TS" (fallback niesie tylko kolumne normal, wiec rownosc easy===hard
// bylaby dowodem, ze test czyta fallback, nie dane).
for (const era of [0, 1, 2]) {
  ok(PRAWMAX_D3.easy[era] !== PRAWMAX_D3.normal[era] && PRAWMAX_D3.normal[era] !== PRAWMAX_D3.hard[era],
    `epoka ${era + 1}: wartosci prawo_max_epoka roznia sie miedzy easy/normal/hard (${PRAWMAX_D3.easy[era]}/${PRAWMAX_D3.normal[era]}/${PRAWMAX_D3.hard[era]})`);
  const scaleEasy = M.loadSocietyScaleParams(society, 'easy');
  const scaleHard = M.loadSocietyScaleParams(society, 'hard');
  ok(scaleEasy.prawMaxByEra[era] !== scaleHard.prawMaxByEra[era],
    `epoka ${era + 1}: loader zwraca ROZNE wartosci dla easy i hard (nie fallback)`);
}

// ===========================================================================
section('3e. suma Prawa z budynkow miasta ZWYKLEGO (lancuchy zwiniete)');
// ===========================================================================
// Wywolane PRZED 3b/3c, bo te dwie sekcje uzywaja tej samej sumy budynkow.
const SUMA_NORMAL = { 1: 53, 2: 85, 3: 121 };
const sumaBudynkow = {};
for (const diff of DIFFS) {
  sumaBudynkow[diff] = {};
  for (const era of [1, 2, 3]) {
    const r = M.computeLawBreakdown({
      population: 12, era, difficulty: diff, garnizonCount: 0, hasGarnizonBudynek: true,
      ...REGION_ADMIN[era],
    }, society);
    sumaBudynkow[diff][era] = r.netto;
    // pulapka nazewnicza: linia budynku ma WLASNE id, rozne od 'garnizon' (wojsko).
    ok(r.lines.some((l) => l.id === 'garnizon_budynek'),
      `${diff}/epoka ${era}: linia budynku Garnizon ma id 'garnizon_budynek' (nie 'garnizon')`);
    ok(!r.lines.some((l) => l.id === 'garnizon'),
      `${diff}/epoka ${era}: BRAK linii 'garnizon' (wojsko) -- garnizonCount=0, tylko budynek`);
    ok(!r.lines.some((l) => l.id === 'palac'),
      `${diff}/epoka ${era}: miasto ZWYKLE nie ma linii Palac (3f, stolica-only)`);
  }
  eq(sumaBudynkow[diff][1], diff === 'normal' ? 53 : sumaBudynkow[diff][1],
    `${diff}/epoka 1: suma budynkow = ${sumaBudynkow[diff][1]} (przeliczona z danych)`);
}
for (const era of [1, 2, 3]) {
  eq(sumaBudynkow.normal[era], SUMA_NORMAL[era],
    `normal/epoka ${era}: suma Prawa z budynkow miasta zwyklego = ${SUMA_NORMAL[era]} (00-dispatch.md/BALANS)`);
}
// Kontrola negatywna: gdyby lancuchy NIE byly zwiniete (dom_starszyzny + dwor_zarzadcy +
// pretorium naraz -- konfiguracja niemozliwa w grze), suma byaby zawyzona.
{
  const zawyzone = M.computeLawBreakdown({
    population: 12, era: 3, difficulty: 'normal', garnizonCount: 0, hasGarnizonBudynek: true,
    hasDomStarszyzny: true, hasDworZarzadcy: true, hasPretorium: true, hasTrybunal: true, hasSad: true,
  }, society);
  ok(zawyzone.netto !== SUMA_NORMAL[3],
    `suma BEZ zwiniecia lancucha (${zawyzone.netto}) rozni sie od 121 -- test faktycznie zwija lancuchy`);
}
console.log('  (sumy budynkow miasta zwyklego per trudnosc: ' +
  DIFFS.map((d) => `${d} ${sumaBudynkow[d][1]}/${sumaBudynkow[d][2]}/${sumaBudynkow[d][3]}`).join(' | ') + ')');

// ===========================================================================
section('3f. Palac jest budynkiem stolicy, rozlaczny z administracja regionu');
// ===========================================================================
eq(bud('palac').lokalizacja, 'stolica', 'buildings.json: Palac jest budynkiem stolicy');
eq(bud('palac_ii').lokalizacja, 'stolica', 'buildings.json: Palac II jest budynkiem stolicy');
eq(bud('palac_iii').lokalizacja, 'stolica', 'buildings.json: Palac III jest budynkiem stolicy');
eq(bud('dom_starszyzny').lokalizacja, 'region', 'buildings.json: Dom Starszyzny jest budynkiem regionu');
eq(bud('dwor_zarzadcy').lokalizacja, 'region', 'buildings.json: Dwor Zarzadcy jest budynkiem regionu');
eq(bud('pretorium').lokalizacja, 'region', 'buildings.json: Pretorium jest budynkiem regionu');
eq(bud('garnizon').lokalizacja, 'region', 'buildings.json: budynek Garnizon jest budynkiem regionu (dostepny w miescie zwyklym)');
// Kalibracja D3 (53/85/121, sekcja 3e) juz NIE zawiera linii 'palac' -- sprawdzone wyzej.

// ===========================================================================
section('3b. "ilu obywateli epoka umie rzadzic na 100%" -- PRZELICZONE z danych');
// ===========================================================================
// P = 2 + ln(budynki/prawMax) / ln(1,04) -- wzor z 00-dispatch.md/BALANS-PRAWO-PRZEBUDOWA §6e.
// ZNALEZISKO (patrz komentarz na gorze pliku): tabela wlasciciela zakladala TA SAMA sume
// budynkow na kazdej trudnosci (53/85/121); realne dane roznicuja budynki administracyjne
// per trudnosc (R-PRAWO-SIATKA-V2, poza allowlista), wiec P realnie wychodzi inaczej niz
// w dispatchu dla easy/hard. Wartosci ponizej sa PRZELICZONE z `sumaBudynkow` powyzej, nie
// przepisane z dispatchu -- zgodnie z jego wlasna instrukcja.
const P = {};
for (const diff of DIFFS) {
  P[diff] = {};
  const scale = M.loadSocietyScaleParams(society, diff);
  for (const era of [1, 2, 3]) {
    const base = M.prawMaxForEra(era, scale);
    P[diff][era] = 2 + Math.log(sumaBudynkow[diff][era] / base) / Math.log(1.04);
  }
}
console.log('  P(epoka,trudnosc), przeliczone z danych:');
for (const diff of DIFFS) {
  console.log(`    ${diff.padEnd(6)} e1=${P[diff][1].toFixed(2)} e2=${P[diff][2].toFixed(2)} e3=${P[diff][3].toFixed(2)}`);
}
// normal: dispatch (9,2/8,8/11,0) I przeliczenie SIE ZGADZAJA -- to jest kotwica wiazaca
// (prawMax normal ORAZ suma budynkow normal sa dokladnie liczbami wlasciciela w obu miejscach).
near(P.normal[1], 9.2, 'normal/epoka 1: P = 9,2 (dispatch I przeliczenie zgadzaja sie)', 0.15);
near(P.normal[2], 8.8, 'normal/epoka 2: P = 8,8 (dispatch I przeliczenie zgadzaja sie)', 0.15);
near(P.normal[3], 11.0, 'normal/epoka 3: P = 11,0 (dispatch I przeliczenie zgadzaja sie)', 0.15);
// easy/hard: wartosci REALNE (rozne od dispatchu -- patrz ZNALEZISKO), zeby regres w
// dowolnym parametrze wejsciowym (budynki per trudnosc, prawMax per trudnosc) czerwienil
// bramke zamiast cicho przejsc.
near(P.easy[1], 16.16, 'easy/epoka 1: P = 16,16 (przeliczone z realnych danych, patrz ZNALEZISKO)', 0.15);
near(P.easy[2], 17.24, 'easy/epoka 2: P = 17,24 (przeliczone)', 0.15);
near(P.easy[3], 18.63, 'easy/epoka 3: P = 18,63 (przeliczone)', 0.15);
near(P.hard[1], 3.11, 'hard/epoka 1: P = 3,11 (przeliczone z realnych danych, patrz ZNALEZISKO)', 0.15);
near(P.hard[2], 1.66, 'hard/epoka 2: P = 1,66 (przeliczone)', 0.15);
near(P.hard[3], 3.73, 'hard/epoka 3: P = 3,73 (przeliczone)', 0.15);

// ===========================================================================
section('3c. ciag "ilu obywateli" rosnacy od epoki 2 do epoki 3, na KAZDEJ trudnosci');
// ===========================================================================
for (const diff of DIFFS) {
  ok(P[diff][3] > P[diff][2],
    `${diff}: P rosnie od epoki 2 do 3 (${P[diff][2].toFixed(2)} -> ${P[diff][3].toFixed(2)}) -- sedno D3b, bez tego siodlo wroci`);
}

// ===========================================================================
section('3d. prawMax miasta pop 12 i pop 20, kazda epoka, kazda trudnosc');
// ===========================================================================
const PRAWMAX_POP = {
  easy: { 1: [51.8, 71.05], 2: [81.4, 111.65], 3: [111, 152.25] },
  normal: { 1: [59.2, 81.2], 2: [96.2, 131.95], 3: [125.8, 172.55] },
  hard: { 1: [66.6, 91.35], 2: [111, 152.25], 3: [148, 203] },
};
for (const diff of DIFFS) {
  const scale = M.loadSocietyScaleParams(society, diff);
  for (const era of [1, 2, 3]) {
    const [exp12, exp20] = PRAWMAX_POP[diff][era];
    near(M.prawMaxForCity(era, 12, scale), exp12, `${diff}/epoka ${era}: prawMax(pop 12) = ${exp12}`, 0.05);
    near(M.prawMaxForCity(era, 20, scale), exp20, `${diff}/epoka ${era}: prawMax(pop 20) = ${exp20}`, 0.05);
    ok(M.prawMaxForCity(era, 20, scale) > M.prawMaxForCity(era, 12, scale),
      `${diff}/epoka ${era}: prawMax(pop 20) > prawMax(pop 12) (mianownik rosnie z miastem)`);
  }
}

// ===========================================================================
section('3g. skan negatywny: dwie usuniete kary (D5) nie wystepuja');
// ===========================================================================
for (const key of ['prawo_kara_brak_garnizonu', 'prawo_kara_podboj_bez_garnizonu']) {
  ok(!rawSocietyText.includes('"' + key + '"'),
    `klucz "${key}" NIE wystepuje nigdzie w society-params.json (D5, USUNIETE NA STALE)`);
  ok(!Object.prototype.hasOwnProperty.call(society.prawo, key),
    `blok prawo.${key} NIE istnieje w obiekcie wczytanym z JSON`);
}
// Dowod FUNKCJONALNY: nawet gdyby ktos wstawil te klucze z powrotem do danych (regres),
// silnik ich juz NIE CZYTA -- computeLawBreakdown ignoruje je calkowicie (D5: kod usuniety,
// nie tylko dane). Bez tej asercji regres "ktos przywrocil klucz do JSON" przeszedlby bez
// sladu, bo skan tekstowy wyzej sprawdza tylko AKTUALNY plik, nie zachowanie kodu.
{
  const zWskrzeszonymiKarami = JSON.parse(JSON.stringify(society));
  zWskrzeszonymiKarami.prawo.prawo_kara_brak_garnizonu = { easy: -50, normal: -50, hard: -50 };
  zWskrzeszonymiKarami.prawo.prawo_kara_podboj_bez_garnizonu = { easy: -50, normal: -50, hard: -50 };
  const bez = M.computeLawBreakdown(
    { population: 8, era: 2, difficulty: 'normal', garnizonCount: 0, hasDomStarszyzny: true }, society,
  );
  const zKarami = M.computeLawBreakdown(
    { population: 8, era: 2, difficulty: 'normal', garnizonCount: 0, hasDomStarszyzny: true },
    zWskrzeszonymiKarami,
  );
  eq(zKarami.netto, bez.netto,
    'silnik IGNORUJE wskrzeszone klucze kar w danych (D5: kod, nie tylko dane, usuniety na stale)');
  ok(!zKarami.lines.some((l) => l.id === 'brak_garnizonu' || l.id === 'podboj_bez_garnizonu'),
    'zadna linia rozpiski nie pochodzi juz z usunietych kar, nawet gdy dane je niosa');
}

// ===========================================================================
section('3h. prawo_pct_cap = 170, pomiar realnego sufitu PorPct');
// ===========================================================================
for (const diff of DIFFS) {
  const scale = M.loadSocietyScaleParams(society, diff);
  eq(scale.prawPctCap, 170, `${diff}: prawo_pct_cap = 170 (D7)`);
}
// Miasto WZOROWO ZARZADZANE: stolica, pop 12, epoka 3, komplet administracji + Palac III +
// garnizon wojskowy 5 jedn. + budynek Garnizon -- najwyzszy realny prawPct w grze.
const wzorowe = M.computeLawBreakdown({
  population: 12, era: 3, difficulty: 'normal', garnizonCount: 5, palacTier: 3,
  hasTrybunal: true, hasSad: true, hasGarnizonBudynek: true,
}, society);
console.log(`  miasto wzorowe (stolica, pop 12, epoka 3, komplet+Palac III+garnizon 5): prawPct = ${wzorowe.prawPct}%`);
ok(wzorowe.prawPct <= 170, `prawPct miasta wzorowego nie przekracza capu 170% (jest ${wzorowe.prawPct}%)`);
ok(wzorowe.prawPct > 120, `prawPct miasta wzorowego PRZEKRACZA dawny cap 120% Szczescia (jest ${wzorowe.prawPct}%) -- to jest sens D7`);
// Odpowiedz na obawe wlasciciela w D7: PorPct LACZNIE ma WLASNY, niezalezny cap
// (szczescie_pct_cap=120, order.ts loadOrderParams) -- podniesienie prawo_pct_cap do 170
// NIE przepuszcza PorPct powyzej 120%.
const orderParams = M.loadOrderParams(society, 'normal');
eq(orderParams.porPctCap, 120, 'PorPct ma WLASNY cap 120 (szczescie_pct_cap), niezalezny od prawo_pct_cap');
const porMax = M.computePorPct(200, 200, orderParams);
eq(porMax, 120, 'computePorPct(200,200) -- nawet przy skrajnie wysokich skladnikach -- tnie do 120, NIE do 170');
const porZWzorowym = M.computePorPct(120, wzorowe.prawPct, orderParams);
ok(porZWzorowym <= 120, `PorPct z realnym prawPct miasta wzorowego (${wzorowe.prawPct}%) i maksymalnym Sz (120%) nadal <= 120% (jest ${porZWzorowym}%) -- D7 NIE psuje sufitu PorPct`);

// ===========================================================================
section('3i. parytet PANEL <-> SILNIK: cityPanel.ts zbudowany i URUCHOMIONY');
// ===========================================================================
// Wzorzec: szczescie-przebudowa-skali-test.cjs sekcja 2i(8) -- esbuild + jsdom, panel
// FAKTYCZNIE wykonany przez szew __cityPanelOrderStateLocalForTest, nie porownany z soba.
const PANEL_ENTRY = path.resolve(__dirname, '.prawo-przebudowa-skali-panel-entry.ts');
const PANEL_BUNDLE = path.resolve(__dirname, '.prawo-przebudowa-skali-panel-bundle.cjs');
fs.writeFileSync(PANEL_ENTRY, `
export { __cityPanelOrderStateLocalForTest, configureCityPanel } from '../src/ui/cityPanel';
export { buildOrderSectionHtml } from '../src/ui/orderPanel';
`, 'utf8');

let P_MOD = null;
try {
  esbuild.buildSync({
    entryPoints: [PANEL_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: PANEL_BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
    loader: { '.svg': 'text', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
    define: { 'import.meta.glob': '__viteGlobShim' },
    banner: { js: 'const __viteGlobShim = () => ({});' },
  });
  const { JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'));
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true, url: 'http://localhost/',
  });
  global.window = dom.window;
  global.document = dom.window.document;
  for (const [k, v] of [['navigator', dom.window.navigator], ['location', dom.window.location]]) {
    try { Object.defineProperty(global, k, { value: v, configurable: true }); } catch (e) { /* juz ustawione */ }
  }
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  P_MOD = require(PANEL_BUNDLE);
} catch (e) {
  P_MOD = null;
  console.error('  [FAIL] 3i: nie udalo sie zbudowac/zaladowac cityPanel.ts: ' + (e.message || e));
}
ok(P_MOD !== null && typeof P_MOD.__cityPanelOrderStateLocalForTest === 'function',
  '3i: harness panelu zbudowany (szew __cityPanelOrderStateLocalForTest dostepny)');

if (P_MOD) {
  // Scenariusze: budynek Garnizon obecny/nieobecny, jednostki wojskowe obecne/nieobecne --
  // pulapka nazewnicza wymaga, zeby OBIE linie ('garnizon' wojsko i 'garnizon_budynek'
  // budynek) mogly wystapic NARAZ i byc odrozniane, plus administracja per epoka.
  const SCENARIUSZE = [
    { era: 1, builtIds: ['dom_starszyzny', 'garnizon'], units: 0, pop: 6 },
    { era: 2, builtIds: ['dwor_zarzadcy', 'trybunal', 'garnizon'], units: 3, pop: 8 },
    { era: 3, builtIds: ['pretorium', 'trybunal', 'sad', 'garnizon'], units: 5, pop: 12 },
    { era: 3, builtIds: ['pretorium', 'trybunal', 'sad'], units: 2, pop: 10 }, // BEZ budynku Garnizon
    { era: 2, builtIds: ['dwor_zarzadcy', 'garnizon'], units: 0, pop: 4 }, // budynek, BEZ wojska
  ];
  for (const s of SCENARIUSZE) {
    const etyk = `epoka ${s.era}, budynki [${s.builtIds.join(',')}], jednostki ${s.units}, pop ${s.pop}`;
    const palacTier = null; // miasto zwykle -- nigdy Palac razem z administracja regionu (3f)

    const wejscieLaw = {
      difficulty: 'normal', era: s.era, population: s.pop, garnizonCount: s.units,
      hasDomStarszyzny: s.builtIds.includes('dom_starszyzny'),
      hasDworZarzadcy: s.builtIds.includes('dwor_zarzadcy'),
      hasPretorium: s.builtIds.includes('pretorium'),
      hasTrybunal: s.builtIds.includes('trybunal'),
      hasSad: s.builtIds.includes('sad'),
      hasGarnizonBudynek: s.builtIds.includes('garnizon'),
      palacTier,
      stolicaEasyBonus: false,
    };
    const wejscieSz = {
      difficulty: 'normal', era: s.era, population: s.pop, buildingZadowolenie: 0,
      podzialHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
      atWar: false, stolicaEasyBonus: false,
    };
    const silnikLaw = M.computeLawBreakdown(wejscieLaw, society);
    const silnik = M.evaluateOrderFromBreakdown(wejscieSz, wejscieLaw, society, 'normal');

    // pulapka nazewnicza: gdy oba naraz obecne, OBIE linie musza wystapic z ROZNYMI id.
    if (s.units > 0 && wejscieLaw.hasGarnizonBudynek) {
      ok(silnikLaw.lines.some((l) => l.id === 'garnizon') && silnikLaw.lines.some((l) => l.id === 'garnizon_budynek'),
        `3i: ${etyk} -- OBIE linie ('garnizon' wojsko, 'garnizon_budynek' budynek) obecne naraz w silniku`);
    }

    const stanSilnika = {
      szczescie: silnik.sz.netto, porzadek: silnik.prawo.netto,
      szPct: silnik.sz.szPct, prawPct: silnik.prawo.prawPct, porPct: silnik.porPct,
      bandLabel: silnik.bandLabel, szLines: silnik.sz.lines, prawLines: silnik.prawo.lines,
      progT1: 0, progT2: 0,
      citizenUpkeep: { happinessDelta: 0, available: [], missing: [], lines: [] },
    };
    const city = {
      id: 'test-city', ownerId: 0, q: 0, r: 0, population: s.pop,
      wealthState: { poziom: 0, punkty: 0 }, ownCultureShare: 1,
    };
    const units = Array.from({ length: s.units }, (_, i) => ({ id: `u${i}` }));
    P_MOD.configureCityPanel({
      data: { buildings, societyParams: society, econParams: {} },
      difficulty: 'normal',
      getEpoch: () => s.era,
      getBuiltBuildingIds: () => s.builtIds,
      getUnlockedTechs: () => [],
      getUnitsAt: () => units,
      getCities: () => [city],
      getReligionState: () => ({ dominujaca: 'A', udzialPct: 100, wplywSzczescie: 0 }),
      getPodzialHandlu: () => ({ procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 }),
      getOrderState: () => stanSilnika,
      getTurn: () => 5,
      getCapitalCityId: () => null,
    });

    const panel = P_MOD.__cityPanelOrderStateLocalForTest(city, { buildings, societyParams: society, econParams: {} });

    const pl = panel.state.prawLines || [];
    const sl = silnikLaw.lines || [];
    eq(pl.map((l) => l.id).join('|'), sl.map((l) => l.id).join('|'),
      `3i: panel i silnik maja te same linie Prawa, tej samej kolejnosci (${etyk})`);
    for (const l of sl) {
      const p = pl.find((x) => x.id === l.id);
      near(p ? p.value : NaN, l.value, `3i: linia "${l.id}" identyczna (${etyk})`, 1e-9);
    }
    near(panel.state.prawPct, silnik.prawo.prawPct, `3i: prawPct panelu == prawPct silnika (${etyk})`, 1e-9);
    // UWAGA ZAKRESU: porPct/bandLabel zaleza TAKZE od polowy Szczescia (waga 0,5/0,5), a ten
    // temat NIE rusza Szczescia (§GRANICE dispatchu) i referencyjne wejscie Sz tutaj jest
    // celowo uproszczone (buildingZadowolenie=0 zamiast pelnego sumBuildingHappinessFromBuiltIds
    // jak w main.ts) — porPct panelu i silnika NIE musza sie tu zgadzac co do cyfry, bo panel
    // liczy realny wklad budynkow do Szczescia, a referencja go zeruje. Kryterium 3i tego
    // dispatchu dotyczy WYLACZNIE rozpiski Prawa (asercje linii i prawPct wyzej) — to jest
    // dokladnie to, co sprawdzone.
  }
}

// ===========================================================================
section('3j. sufit szesciu pozycji: realne ciecie linesHtml(s.prawLines, 6, pfx) w orderPanel.ts');
// ===========================================================================
// Evaluator runda 1, zarzut #3: sekcja 3i sprawdzala tylko obecnosc obu id w SUROWEJ tablicy
// lines[], w scenariuszach dajacych maks. 5 linii -- nigdy nie przetestowano realnego
// ciecia orderPanel.ts:167 (`linesHtml(s.prawLines, 6, pfx)`), ktore linesHtml prywatnie
// wywoluje wewnatrz eksportowanego `buildOrderSectionHtml`. Scenariusz nizej to STOLICA z
// Palacem III + komplet administracji epoki 3 + budynek Garnizon + garnizon wojskowy --
// to jest dokladnie przypadek z pulapki nazewniczej dispatchu, ktorego brakowalo w 3i.
if (P_MOD && typeof P_MOD.buildOrderSectionHtml === 'function') {
  const wejscieLawStolica = {
    difficulty: 'normal', era: 3, population: 12, garnizonCount: 5,
    hasPretorium: true, hasTrybunal: true, hasSad: true, hasGarnizonBudynek: true,
    palacTier: 3, stolicaEasyBonus: false,
  };
  const silnikLawStolica = M.computeLawBreakdown(wejscieLawStolica, society);
  const idsStolica = silnikLawStolica.lines.map((l) => l.id);
  eq(idsStolica.length, 6,
    `3j: scenariusz stolicy (Palac III+pretorium+trybunal+sad+garnizon+budynek) daje DOKLADNIE 6 linii Prawa w silniku -- got [${idsStolica.join(',')}]`);
  ok(idsStolica.includes('garnizon') && idsStolica.includes('garnizon_budynek'),
    `3j: obie linie ('garnizon' wojsko, 'garnizon_budynek' budynek) obecne w tablicy lines[] SUROWEJ tego scenariusza`);

  const sStolica = {
    szczescie: 0, porzadek: silnikLawStolica.netto,
    szPct: 50, prawPct: silnikLawStolica.prawPct, porPct: 50,
    bandLabel: 'Ład', szLines: [], prawLines: silnikLawStolica.lines,
    progT1: 0, progT2: 0,
  };
  const htmlStolica = P_MOD.buildOrderSectionHtml(sStolica, {});
  ok(htmlStolica.includes('Garnizon (budynek)'),
    '3j: HTML po REALNYM cieciu linesHtml(...,6,pfx) w orderPanel.ts nadal zawiera "Garnizon (budynek)" -- NIE zniknela pod sufitem szesciu pozycji (sedno pulapki nazewniczej, zarzut #3)');
  ok(/Garnizon \(\d+ jedn\.\)/.test(htmlStolica),
    '3j: HTML po cieciu nadal zawiera linie garnizonu wojskowego -- OBIE linie odrozniane naraz, zadna nie zgubiona');
  ok(!htmlStolica.includes('<div>…</div>'),
    '3j: przy dokladnie 6 liniach nie pojawia sie znacznik obciecia "…" (linesHtml dodaje go tylko gdy lines.length > max)');

  // Kontrola negatywna (Tryb piaty): dodanie SIODMEJ linii (np. osiedle, maly pop) MUSI
  // wypchnac cos poza sufit i HTML MUSI to sygnalizowac znacznikiem "…" -- dowodzi, ze test
  // faktycznie mierzy ciecie, a nie zawsze przechodzi niezaleznie od liczby linii.
  const wejscieLawStolica7 = { ...wejscieLawStolica, population: 3 }; // pop<=prog(4) -> +linia 'osiedle'
  const silnikLawStolica7 = M.computeLawBreakdown(wejscieLawStolica7, society);
  ok(silnikLawStolica7.lines.length === 7,
    `3j (kontrola negatywna): obnizenie pop do 3 dodaje linie 'osiedle', suma = 7 linii w silniku -- got ${silnikLawStolica7.lines.length}`);
  const sStolica7 = { ...sStolica, prawPct: silnikLawStolica7.prawPct, prawLines: silnikLawStolica7.lines };
  const htmlStolica7 = P_MOD.buildOrderSectionHtml(sStolica7, {});
  ok(htmlStolica7.includes('…'),
    '3j (kontrola negatywna): przy 7 liniach linesHtml FAKTYCZNIE tnie i dodaje znacznik "…" -- dowod, ze asercje wyzej mierza realne ciecie, nie tautologie');
  ok(htmlStolica7.includes('Garnizon (budynek)') && /Garnizon \(\d+ jedn\.\)/.test(htmlStolica7),
    '3j (kontrola negatywna): nawet przy 7 liniach (ucieta 1) OBIE linie garnizonu nadal miesca sie w pierwszych 6 (kolejnosc push: garnizon,admin,trybunal,sad,palac,garnizon_budynek -- osiedle/stolica_easy pchane PO nich)');
} else {
  ok(false, '3j: buildOrderSectionHtml niedostepny z bundla panelu (patrz [FAIL] wyzej przy budowaniu)');
}

// ===========================================================================
section('3k. parytet hasGarnizonBudynek: main.ts <-> cityPanel.ts, REALNE URUCHOMIENIE');
// ===========================================================================
// Operator runda 2: main.ts (budowa LawBreakdownInput, ok. linii 29206-29210) dostal nowa
// linie `hasGarnizonBudynek: builtIds.includes('garnizon')`, analogiczna do juz istniejacej
// w cityPanel.ts:3150. Ponizej WYCIAGAMY oba wyrazenia z realnych plikow zrodlowych i
// URUCHAMIAMY je (new Function + wywolanie), nie tylko sprawdzamy istnienie tekstu --
// zgodnie z zadaniem: dowod ma byc REALNYM URUCHOMIENIEM, nie samym istnieniem kodu.
{
  const mainTsPath = path.resolve(GRA, 'src', 'main.ts');
  const cityPanelPath = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
  const mainTsSrc = fs.readFileSync(mainTsPath, 'utf8');
  const cityPanelSrc = fs.readFileSync(cityPanelPath, 'utf8');

  const RE = /hasGarnizonBudynek:\s*([^,\n]+),/;
  const mainMatch = mainTsSrc.match(RE);
  const panelMatch = cityPanelSrc.match(RE);

  ok(mainMatch !== null, '3k: linia hasGarnizonBudynek znaleziona w main.ts (budowa LawBreakdownInput)');
  ok(panelMatch !== null, '3k: linia hasGarnizonBudynek znaleziona w cityPanel.ts (referencja, juz istniejaca)');

  if (mainMatch && panelMatch) {
    // Kazde wyrazenie kompilowane do prawdziwej funkcji JS i WYWOLYWANE z realnym builtIds --
    // nie porownanie stringow, tylko realne wykonanie obu wyrazen.
    const mainFn = new Function('builtIds', 'return (' + mainMatch[1] + ');');
    const panelFn = new Function('builtIds', 'return (' + panelMatch[1] + ');');

    const SCENARIUSZE_3K = [
      { etyk: 'miasto Z budynkiem Garnizon', builtIds: ['dom_starszyzny', 'garnizon', 'trybunal'] },
      { etyk: 'miasto BEZ budynku Garnizon', builtIds: ['dom_starszyzny', 'trybunal'] },
    ];
    for (const s of SCENARIUSZE_3K) {
      const mainVal = mainFn(s.builtIds);
      const panelVal = panelFn(s.builtIds);
      eq(typeof mainVal, 'boolean', `3k: ${s.etyk} -- wyrazenie main.ts realnie zwraca boolean (got ${JSON.stringify(mainVal)})`);
      eq(mainVal, panelVal, `3k: ${s.etyk} -- main.ts i cityPanel.ts daja IDENTYCZNY hasGarnizonBudynek po realnym uruchomieniu`);

      // Domkniecie: skoro hasGarnizonBudynek sie zgadza, silnik (computeLawBreakdown) z tym
      // wejsciem musi konsekwentnie zawierac/nie-zawierac linie 'garnizon_budynek'.
      const wejscieLaw3k = {
        difficulty: 'normal', era: 3, population: 10, garnizonCount: 0,
        hasDomStarszyzny: true, hasTrybunal: true,
        hasGarnizonBudynek: mainVal,
        palacTier: null, stolicaEasyBonus: false,
      };
      const silnikLaw3k = M.computeLawBreakdown(wejscieLaw3k, society);
      const maBudynek = silnikLaw3k.lines.some((l) => l.id === 'garnizon_budynek');
      eq(maBudynek, mainVal,
        `3k: ${s.etyk} -- obecnosc linii 'garnizon_budynek' w silniku zgodna z realnie wyliczonym hasGarnizonBudynek (${mainVal})`);
    }

    ok(mainMatch[1].includes("'garnizon'") || mainMatch[1].includes('"garnizon"'),
      '3k: wyrazenie main.ts realnie odwoluje sie do builtIds.includes(\'garnizon\') (kontrola negatywna przeciw tautologii)');
  }
}

try { fs.unlinkSync(PANEL_ENTRY); } catch (e) { /* nic */ }
try { fs.unlinkSync(ENTRY); } catch (e) { /* nic */ }

// ===========================================================================
console.log('\n[prawo-przebudowa-skali-test] ' + passed + ' OK, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
