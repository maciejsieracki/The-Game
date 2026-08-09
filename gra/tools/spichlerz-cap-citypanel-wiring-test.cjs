'use strict';
/**
 * spichlerz-cap-citypanel-wiring-test.cjs — R-SPICHLERZ-CAP-LUDNOSCI-ETAP, runda 3
 *
 * Chroni WYŁĄCZNIE jeden wiersz w gra/src/ui/cityPanel.ts (funkcja computeView), tam gdzie
 * panel wylicza `maSpichlerz` do wyświetlenia chipa/karty capu ludności.
 *
 * Kontekst (Evaluator RUNDA 1 + RUNDA 2, PYTANIA-OTWARTE.md): ulepszenie Spichlerza do
 * Spichlerz II USUWA id 'spichlerz' z builtIds (upgradeFrom w buildings.json) — miasto ze
 * Spichlerzem II ma WYŁĄCZNIE 'spichlerz_ii' w builtIds. Stary zapis
 * `built.includes('spichlerz')` przez to gubi wykrycie Spichlerza II i cityPanel znów
 * pokazuje fałszywe „bez Akweduktu max 5" (realnie 8) — dokładnie zgłoszony błąd. Jedyna
 * poprawna forma to wspólny helper `cityHasSpichlerzBuilding(builtIds)`
 * (gra/src/game/building-resource-gate.ts), sprawdzający OBA id ('spichlerz' i
 * 'spichlerz_ii'), użyty tak samo jak w turn-economy.ts:1331 i population-growth-v85.ts.
 *
 * Runda 2 (Evaluator PASS-WITH-NOTES, 1 nota BLOKUJĄCA): mutacja cofająca linię w
 * cityPanel.ts z powrotem do `built.includes('spichlerz')` przeżywała WSZYSTKIE 8 bramek
 * bundlujących ten plik (tsc, logic-test, akwedukt-popcap, population-growth-v85,
 * growthmult-compound, spichlerz-wzrost, ...) — bo żadna z nich nie czyta cityPanel.ts jako
 * tekst. Ten test zamyka dokładnie tę lukę, wzorem border-march-wygasanie-test.cjs /
 * hud-moc-warstwa-test.cjs (main.ts jako tekst + regex na wyciętym ciele funkcji).
 *
 * node tools/spichlerz-cap-citypanel-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');

const CITY_PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts');
const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wytnij ciało computeView(...) — od nagłówka funkcji do zamykającej klamry na tym samym
// wcięciu (rozpoznanej po kolejnej deklaracji top-level function).
// ---------------------------------------------------------------------------
const fnStartMarker = 'function computeView(city: City, map: GameMap, data: GameData): CityView | null {';
const fnStart = src.indexOf(fnStartMarker);
ok(fnStart >= 0, 'znaleziono computeView(...) w cityPanel.ts');

// Koniec funkcji: pierwsza kolejna linia zaczynająca top-level deklarację po fnStart.
const fnEndMarker = '\nfunction ';
const fnEndIdx = fnStart >= 0 ? src.indexOf(fnEndMarker, fnStart + fnStartMarker.length) : -1;
ok(fnEndIdx > fnStart, 'znaleziono koniec computeView(...) (kolejna top-level function)');

const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? src.slice(fnStart, fnEndIdx) : '';

// ---------------------------------------------------------------------------
// Wyciągnij DOKŁADNIE wiersz przypisania `const maSpichlerz = ...;` z ciała funkcji.
// ---------------------------------------------------------------------------
const assignMatch = fnBody.match(/const maSpichlerz = ([^\n]+);/);
ok(!!assignMatch, 'znaleziono wiersz `const maSpichlerz = ...;` w computeView(...)');
const assignExpr = assignMatch ? assignMatch[1] : '';

// Wymóg 1: wiersz MUSI wołać helper cityHasSpichlerzBuilding(...) — nie inline'ować logiki.
ok(/^cityHasSpichlerzBuilding\(built\)$/.test(assignExpr),
  `maSpichlerz wyliczane przez cityHasSpichlerzBuilding(built) — znaleziono: "${assignExpr}"`);

// Wymóg 2: wiersz NIE MOŻE być gołym built.includes('spichlerz') (dowolne cudzysłowy) —
// dokładnie ten regres z rundy 1/2 (gubi wykrycie Spichlerza II).
ok(!/built\.includes\(\s*['"]spichlerz['"]\s*\)/.test(assignExpr),
  'maSpichlerz NIE jest gołym built.includes("spichlerz") (regres rundy 1/2)');

// Wymóg 3: cityHasSpichlerzBuilding musi być zaimportowane z helpera współdzielonego
// (building-resource-gate.ts), nie zdefiniowane lokalnie w cityPanel.ts — jedna konwencja,
// nie kopia.
ok(/import\s*\{[^}]*\bcityHasSpichlerzBuilding\b[^}]*\}\s*from\s*['"][^'"]*building-resource-gate['"]/.test(src),
  'cityHasSpichlerzBuilding zaimportowane z game/building-resource-gate w cityPanel.ts');

// ---------------------------------------------------------------------------
// Wymóg 4/5 (runda 4, Evaluator RUNDA 3 nota blokująca B4): `maSpichlerz` sam w sobie
// poprawny nie chroni przed błędem 6-9 linii niżej w TEJ SAMEJ funkcji — dokładnie tam,
// gdzie renderowany jest chip capu ludności zgłoszony jako zepsuty przez Macieja. Trzy
// mutacje przechodziły niezłapane: (E) maSpichlerz→false wstrzyknięte w wywołanie dla
// popCapAktualny, (F) powrót do martwego params.akweduktProgLudnosci zamiast wywołania
// cityPopulationCap dla popCapBezAkweduktu, (G) zamiana kolejności dwóch argumentów
// boolean w cityPopulationCap(...) — kompilator TS tego nie łapie (oba to boolean).
// ---------------------------------------------------------------------------

// Wymóg 4: `const popCapAktualny = ...;` MUSI wołać cityPopulationCap(maAkwedukt,
// maSpichlerz, params) w DOKŁADNIE tej kolejności argumentów.
const popCapAktualnyMatch = fnBody.match(/const popCapAktualny = ([^\n]+);/);
ok(!!popCapAktualnyMatch, 'znaleziono wiersz `const popCapAktualny = ...;` w computeView(...)');
const popCapAktualnyExpr = popCapAktualnyMatch ? popCapAktualnyMatch[1] : '';
ok(/^cityPopulationCap\(maAkwedukt, maSpichlerz, params\)$/.test(popCapAktualnyExpr),
  `popCapAktualny wyliczane przez cityPopulationCap(maAkwedukt, maSpichlerz, params) — znaleziono: "${popCapAktualnyExpr}"`);

// Wymóg 5: `const popCapBezAkweduktu = ...;` MUSI wołać cityPopulationCap(false,
// maSpichlerz, params) — NIE stary martwy kod (params.akweduktProgLudnosci ani żaden
// sztywny literal), bo to gubi Spichlerz II (regres runda 1/2: "Bez Akweduktu max 5"
// mimo realnego capu 8).
const popCapBezAkweduktuMatch = fnBody.match(/const popCapBezAkweduktu = ([^\n]+);/);
ok(!!popCapBezAkweduktuMatch, 'znaleziono wiersz `const popCapBezAkweduktu = ...;` w computeView(...)');
const popCapBezAkweduktuExpr = popCapBezAkweduktuMatch ? popCapBezAkweduktuMatch[1] : '';
ok(/^cityPopulationCap\(false, maSpichlerz, params\)$/.test(popCapBezAkweduktuExpr),
  `popCapBezAkweduktu wyliczane przez cityPopulationCap(false, maSpichlerz, params) — znaleziono: "${popCapBezAkweduktuExpr}"`);

// ---------------------------------------------------------------------------
// Kontrola przytomności: helper w building-resource-gate.ts faktycznie sprawdza OBA id
// (żeby test nie chwalił poprawnego wywołania helpera, który sam jest zepsuty — poza
// zakresem tej rundy, ale tania, jednolinijkowa asercja na tym samym pliku źródłowym).
// ---------------------------------------------------------------------------
const GATE_TS = path.join(__dirname, '..', 'src', 'game', 'building-resource-gate.ts');
const gateSrc = fs.readFileSync(GATE_TS, 'utf8');
const gateFnMatch = gateSrc.match(
  /export function cityHasSpichlerzBuilding\(builtIds: readonly string\[\]\): boolean \{\s*return ([^\n]+);\s*\}/,
);
ok(!!gateFnMatch, 'znaleziono definicję cityHasSpichlerzBuilding(...) w building-resource-gate.ts');
const gateBody = gateFnMatch ? gateFnMatch[1] : '';
ok(/builtIds\.includes\(\s*['"]spichlerz['"]\s*\)/.test(gateBody)
  && /builtIds\.includes\(\s*['"]spichlerz_ii['"]\s*\)/.test(gateBody),
  `cityHasSpichlerzBuilding sprawdza OBA id ('spichlerz' i 'spichlerz_ii') — znaleziono: "${gateBody}"`);

console.log(`\nspichlerz-cap-citypanel-wiring-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
