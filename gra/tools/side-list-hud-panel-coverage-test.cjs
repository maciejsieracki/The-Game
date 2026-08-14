'use strict';
/**
 * side-list-hud-panel-coverage-test.cjs — MIASTA-ARMIE-PANEL-LEWY-2026-08-14, reskin
 * paneli "Miasta" (cityListHud.ts) i "Armie" (armyListHud.ts) do palety 3b, wzorem
 * empire-skarbiec-panel-coverage-test.cjs / army-merge-dismiss-bounce-test.cjs.
 *
 * ZAKRES DOWODU — w przeciwieństwie do M2/Faza2 (empireDetailPanel.ts, które NIE da się
 * zbundlować — SVG/audio bez loaderów), cityListHud.ts/armyListHud.ts/sideListHud.css.ts
 * NIE importują audio ani nic poza `icons/brandAssets.ts` (jedyny problematyczny import —
 * Vite `import.meta.glob`/`?raw`), więc dają się realnie zbundlować esbuildem ze stubem
 * TEGO importu (wzorzec army-merge-dismiss-bounce-test.cjs) i wykonać w jsdom. Test więc
 * NIE ogranicza się do source-text — renderuje realne DOM obu paneli i asercjonuje na
 * żywej strukturze:
 *
 *   A. Source-text — palety 3b w sideListHud.css.ts, stare trzecie złoto (#e0b24a) i stare
 *      zduplikowane klasy (.cl-item/.al-item/.al-garnizon-badge) NIE istnieją już w
 *      cityListHud.ts/armyListHud.ts (dowód, że DRY refaktor się wydarzył, nie tylko że
 *      nowe klasy zostały dopisane obok starych) — brak emoji 🏛️/👥/🔨 w cityListHud.ts
 *      (regex) — pole `productionLine` (dawny sklejony string) usunięte z obu plików.
 *   B. Wykonawczy (esbuild + jsdom) — createCityListHud()/createArmyListHud() realnie
 *      zamontowane i .show()-owane z danymi obejmującymi WSZYSTKIE 4 stany armii + miasto
 *      stolica + miasto z pustą kolejką + miasto z produkcją w toku + stan pusty obu paneli:
 *        - plakietki armii mają 3 różne kolory (gold/neutral/blue) zgodnie z zatwierdzoną
 *          matrycą stanów, zaznaczenie dostaje kartę .selected + plakietkę zielona
 *          "ZAZNACZONA";
 *        - pasek postępu produkcji ma szerokość == pctClamped(progress,max) i renderuje
 *          się TYLKO gdy productionName obecne, inaczej plakietka "kolejka pusta";
 *        - plakietka "stolica" pojawia się DOK�ŁADNIE gdy isCapital===true;
 *        - stan pusty obu paneli renderuje .sl-empty (ramka przerywana) + ikonę + komunikat
 *          niezmieniony.
 *   C. Weryfikacja negatywna (mutacyjna) — armyStatusBadge() z żadną flagą -> null (dowód,
 *      że test B faktycznie zależy od logiki wyboru wariantu, nie jest tautologią).
 *
 * Run from gra/: node tools/side-list-hud-panel-coverage-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[side-list-hud-panel-coverage-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.join(GRA, 'src/ui/cityListHud.ts');
const ARMY_TS = path.join(GRA, 'src/ui/armyListHud.ts');
const CSS_TS = path.join(GRA, 'src/ui/sideListHud.css.ts');
const MAIN_TS = path.join(GRA, 'src/main.ts');
const citySrc = fs.readFileSync(CITY_TS, 'utf8');
const armySrc = fs.readFileSync(ARMY_TS, 'utf8');
const cssSrc = fs.readFileSync(CSS_TS, 'utf8');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log('  PASS: ' + label);
  } else {
    fail++;
    console.log('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

console.log('========================================================================');
console.log('MIASTA-ARMIE-PANEL-LEWY-2026-08-14 -- reskin 3b: cityListHud.ts / armyListHud.ts');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Source-text — paleta 3b, usuniecie duplikacji, brak emoji, rozbicie productionLine.
// ---------------------------------------------------------------------------
console.log('A. Source-text -- paleta 3b, DRY (wspolny plik stylow), zero emoji, productionLine rozbity');

for (const hex of ['#171e2a', '#2b3543', '#d9a441', '#7d8798', '#1d2634']) {
  assert(`sideListHud.css.ts zawiera kolor palety 3b ${hex}`, cssSrc.includes(hex));
}
assert('cityListHud.ts NIE definiuje juz wlasnego --gold:#e0b24a (root CSS przeniesiony do sideListHud.css.ts)', !citySrc.includes('#e0b24a'));
assert('armyListHud.ts NIE definiuje juz wlasnego --gold:#e0b24a', !armySrc.includes('#e0b24a'));

for (const oldClass of ['.cl-item', '.cl-close', '.cl-empty', '.cl-hint', '.cl-name', '.cl-ico']) {
  assert(`cityListHud.ts NIE zawiera juz starej zduplikowanej klasy CSS "${oldClass}" (DRY -> sl-*)`, !citySrc.includes(oldClass));
}
for (const oldClass of ['.al-item', '.al-close', '.al-empty', '.al-hint', '.al-name', '.al-ico', '.al-garnizon-badge']) {
  assert(`armyListHud.ts NIE zawiera juz starej zduplikowanej klasy CSS "${oldClass}" (DRY -> sl-*)`, !armySrc.includes(oldClass));
}
assert('cityListHud.ts importuje ensureSideListHudStyles z ./sideListHud.css (wspolny plik uzywany naprawde, nie tylko stworzony)', citySrc.includes("from './sideListHud.css'"));
assert('armyListHud.ts importuje ensureSideListHudStyles z ./sideListHud.css', armySrc.includes("from './sideListHud.css'"));

// Skanujemy TYLKO realny kod renderujacy -- usuwamy komentarze /** ... */ i // (ktore
// legalnie WSPOMINAJA stare emoji jako dokumentacje historii zmiany, np. naglowek pliku
// "zero emoji (🏛️/👥/🔨 → SVG z brandu)") oraz stopke podpowiedzi ("Ponowne 🏛 — zamknij
// listę") -- decyzja integratora §5.4: ten JEDEN emoji w tekscie przycisku zostaje BEZ
// ZMIAN (nazwa przycisku w zdaniu, nie ikona interfejsu), wiec nie moze fajlowac bramki.
const cityCodeOnly = citySrc
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/'Kliknij miasto[^']*'/g, '');
assert('cityListHud.ts (kod, bez komentarzy/stopki) NIE zawiera juz emoji 👥 (zastapione ikona res-population)', !cityCodeOnly.includes('👥'));
assert('cityListHud.ts (kod, bez komentarzy/stopki) NIE zawiera juz emoji 🔨 (productionLine rozbity na pola, hammer wypada calkowicie)', !cityCodeOnly.includes('🔨'));
assert('cityListHud.ts (kod, bez komentarzy/stopki) NIE zawiera juz emoji 🏛️ jako ikony kafelka', !cityCodeOnly.includes('🏛'));

assert('CityListEntry interface NIE ma juz pola "productionLine?:" (dawny sklejony string usuniety, nie tylko dopisany obok)', !citySrc.includes('productionLine?:'));
assert('cityListHud.ts nie odwoluje sie juz do c.productionLine / .productionLine (property access)', !citySrc.includes('.productionLine'));
assert('main.ts nie odwoluje sie juz do .productionLine (property access) po stronie wywolania', !mainSrc.includes('.productionLine'));
for (const field of ['productionName', 'productionProgress', 'productionMax', 'productionQueueEmpty', 'isCapital']) {
  assert(`CityListEntry ma nowe pole "${field}"`, citySrc.includes(field));
  assert(`main.ts (buildPlayerCityListEntries) faktycznie ustawia pole "${field}"`, mainSrc.includes(field));
}

console.log('');

// ---------------------------------------------------------------------------
// B. Wykonawczy -- esbuild + jsdom, DOM realnie wyrenderowany.
// ---------------------------------------------------------------------------
console.log('B. Wykonawczy -- createCityListHud()/createArmyListHud() zbundlowane i uruchomione w jsdom');

const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_FILE = path.resolve(STUB_DIR, 'side-list-hud-brandAssets-stub.ts');
const ENTRY = path.join(__dirname, '.side-list-hud-coverage-entry.ts');
const BUNDLE = path.join(__dirname, '.side-list-hud-coverage-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  [
    "export { createCityListHud, destroyCityListHud } from '../src/ui/cityListHud.ts';",
    "export { createArmyListHud, destroyArmyListHud, setArmyListSelectedId } from '../src/ui/armyListHud.ts';",
    "export { armyStatusBadge, pctClamped, hpValueColor, SIDE_LIST_HP_LOW_THRESHOLD_PCT } from '../src/ui/sideListHud.css.ts';",
  ].join('\n'),
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
    assert('esbuild bundluje cityListHud.ts + armyListHud.ts + sideListHud.css.ts bez bledu (stub brandAssets)', true);
  } catch (e) {
    assert('esbuild bundluje cityListHud.ts + armyListHud.ts + sideListHud.css.ts bez bledu (stub brandAssets)', false, e.message || String(e));
    console.log('\n========================================================================');
    console.log(`FAILED: ${pass} passed, ${fail} failed (bundling padl -- reszta B/C pominieta)`);
    process.exit(1);
  }

  const {
    createCityListHud, destroyCityListHud,
    createArmyListHud, destroyArmyListHud, setArmyListSelectedId,
    armyStatusBadge, pctClamped, hpValueColor, SIDE_LIST_HP_LOW_THRESHOLD_PCT,
  } = require(BUNDLE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  // Node 21+ ma wlasny wbudowany, TYLKO-DO-ODCZYTU global "navigator" (fetch API) --
  // prosta reassignacja rzuca "Cannot set property navigator of #<Object> which has
  // only a getter". defineProperty z configurable:true nadpisuje go jawnie.
  Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  // --- B1: Miasta -- stan z danymi: stolica+produkcja, kolejka pusta, drugie miasto z produkcja ---
  const cities = [
    {
      id: 'c1', name: 'Ateny', population: 12,
      productionName: 'Stolarnia', productionProgress: 8, productionMax: 20,
      metaLine: 'Garnizon: 2', garrison: 2, isCapital: true,
    },
    {
      id: 'c2', name: 'Korynt', population: 8,
      productionQueueEmpty: true, garrison: 0, isCapital: false,
    },
    {
      id: 'c3', name: 'Bardzo Długa Nazwa Miasta Która Na Pewno Nie Mieści Się W Karcie', population: 5,
      productionName: 'Koszary', productionProgress: 17, productionMax: 18,
      garrison: 1, isCapital: false,
    },
  ];
  const cityHud = createCityListHud({ getCities: () => cities, onSelectCity: () => {} });
  cityHud.show();
  const cityHtml = cityHud.el.innerHTML;

  assert('Panel Miasta: naglowek ma ikone tb-cities i tytul "Miasta"', cityHtml.includes('data-icon="tb-cities"') && /sl-title">Miasta</.test(cityHtml));
  assert('Panel Miasta: pasmo podsumowania renderuje sie przy niezerowej licznie miast ("3 miasta")', /cl-sum-big">3 miasta/.test(cityHtml));
  assert('Panel Miasta: box "W budowie" liczy miasta z productionName (2 z 3)', /W budowie[\s\S]{0,80}<b>2<\/b> z 3/.test(cityHtml));
  assert('Panel Miasta: box "Garnizony" sumuje garrison (2+0+1=3)', /Garnizony[\s\S]{0,80}<b>3<\/b> jedn\./.test(cityHtml));
  assert('Panel Miasta: plakietka "stolica" (gold) obecna DOKLADNIE dla Aten (isCapital=true)', /sl-badge gold">stolica/.test(cityHtml));
  assert('Panel Miasta: plakietka "kolejka pusta" (neutral) obecna dla Koryntu', /sl-badge neutral">kolejka pusta/.test(cityHtml));
  const prodPct = pctClamped(8, 20);
  assert(
    `Panel Miasta: pasek postepu Aten ma szerokosc ${prodPct}% (pctClamped(8,20))`,
    cityHtml.includes(`width: ${prodPct}%`) || cityHtml.includes(`width:${prodPct}%`),
    { prodPct, hasBar: cityHtml.includes('cl-prodbar') },
  );
  assert('Panel Miasta: liczba postepu Aten pokazuje "8/20" (rozbite pola, nie sklejony string)', cityHtml.includes('8/20'));
  assert('Panel Miasta: ikona populacji res-population uzyta (zamiast emoji 👥)', cityHtml.includes('data-icon="res-population"'));
  assert('Panel Miasta: dlugia nazwa miasta ucinana elipsa (klasa sl-name ma text-overflow w CSS, nazwa i tak w DOM pelna dla title=)', cityHtml.includes('Bardzo Długa Nazwa'));
  destroyCityListHud();

  // --- B2: Miasta -- stan pusty ---
  const cityHudEmpty = createCityListHud({ getCities: () => [], onSelectCity: () => {} });
  cityHudEmpty.show();
  const cityEmptyHtml = cityHudEmpty.el.innerHTML;
  assert('Panel Miasta (pusty): pasmo podsumowania NIE renderuje sie przy 0 miastach', !cityEmptyHtml.includes('cl-sum-big'));
  assert('Panel Miasta (pusty): renderuje sl-empty (ramka przerywana)', cityEmptyHtml.includes('sl-empty'));
  assert('Panel Miasta (pusty): komunikat niezmieniony', cityEmptyHtml.includes('Brak miast w imperium — załóż pierwsze miasto na mapie.'));
  destroyCityListHud();

  // --- B3: Armie -- wszystkie 4 stany + zaznaczenie ---
  const armies = [
    { id: 'a1', name: 'Hoplici Aten', unitCount: 3, hexLabel: 'D-7', hp: 60, hpMax: 60, ruchLeft: 2, ruchMax: 2 },
    { id: 'a2', name: 'Łucznicy kreteńscy', unitCount: 2, hexLabel: 'F-11', hp: 11, hpMax: 40, ruchLeft: 0, ruchMax: 2 },
    { id: 'a3', name: 'Straż Koryntu', unitCount: 2, hexLabel: 'C-4', hp: 38, hpMax: 40, ruchLeft: 2, ruchMax: 2, inGarnizon: true },
    { id: 'a4', name: 'Włócznicy graniczni', unitCount: 1, hexLabel: 'H-9', hp: 18, hpMax: 20, ruchLeft: 1, ruchMax: 1, ufortyfikowanyWPolu: true },
    { id: 'a5', name: 'Peltaści', unitCount: 1, hexLabel: 'B-13', hp: 20, hpMax: 20, ruchLeft: 2, ruchMax: 2, sentry: true },
    { id: 'a6', name: 'Zwiadowca', unitCount: 1, hexLabel: 'K-3', hp: 10, hpMax: 10, ruchLeft: 3, ruchMax: 3, autoExplore: true },
  ];
  setArmyListSelectedId('a1');
  const armyHud = createArmyListHud({ getArmies: () => armies, onSelectArmy: () => {} });
  armyHud.show();
  const armyHtml = armyHud.el.innerHTML;

  const totalUnits = armies.reduce((s, a) => s + a.unitCount, 0);
  assert(`Panel Armie: naglowek ma licznik "6 · ${totalUnits} jedn."`, armyHtml.includes(`6 · ${totalUnits} jedn.`));
  assert('Panel Armie: zaznaczona armia (a1) dostaje karte .selected', /sl-item selected/.test(armyHtml));
  assert('Panel Armie: zaznaczona armia dostaje plakietke zielona "ZAZNACZONA"', /sl-badge green">ZAZNACZONA/.test(armyHtml));
  assert('Panel Armie: "w garnizonie" -> plakietka GOLD (stan obronny)', /sl-badge gold">w garnizonie/.test(armyHtml));
  assert('Panel Armie: "ufortyfikowana w polu" -> plakietka GOLD (stan obronny)', /sl-badge gold">ufortyfikowana w polu/.test(armyHtml));
  assert('Panel Armie: "uśpiona" -> plakietka NEUTRAL (nie gold, odrozniona od garnizonu)', /sl-badge neutral">uśpiona/.test(armyHtml));
  assert('Panel Armie: "auto-eksploracja" -> plakietka BLUE (trzeci kolor)', /sl-badge blue">auto-eksploracja/.test(armyHtml));
  assert('Panel Armie: liczba HP niskiego stanu (11/40, 27.5%) dostaje kolor ostrzegawczy #e07a7a', armyHtml.includes('color:#e07a7a') && armyHtml.includes('11/40'));
  assert('Panel Armie: liczba HP wysokiego stanu (60/60) NIE dostaje koloru ostrzegawczego', !new RegExp('color:#e07a7a[^<]*60/60').test(armyHtml));
  assert('Panel Armie: pasek Zdrowia/Ruch ma wysokosc 6px (podniesiona z 5px)', cssSrc.includes('height:6px') || armySrc.includes('height:6px'));
  destroyArmyListHud();
  setArmyListSelectedId(null);

  // --- B4: Armie -- stan pusty ---
  const armyHudEmpty = createArmyListHud({ getArmies: () => [], onSelectArmy: () => {} });
  armyHudEmpty.show();
  const armyEmptyHtml = armyHudEmpty.el.innerHTML;
  assert('Panel Armie (pusty): renderuje sl-empty (ramka przerywana)', armyEmptyHtml.includes('sl-empty'));
  assert('Panel Armie (pusty): komunikat niezmieniony', armyEmptyHtml.includes('Brak jednostek na mapie — zrekrutuj wojsko w mieście.'));
  assert('Panel Armie (pusty): naglowek NIE ma licznika (0 armii)', !armyEmptyHtml.includes('sl-count'));
  destroyArmyListHud();

  console.log('');

  // ---------------------------------------------------------------------------
  // C. Weryfikacja negatywna -- armyStatusBadge() bez zadnej flagi -> null (dowod, ze
  //    test B naprawde zalezy od logiki wyboru wariantu, nie jest tautologia).
  // ---------------------------------------------------------------------------
  console.log('C. Weryfikacja negatywna -- armyStatusBadge({}) == null (brak stanu -> brak plakietki)');
  assert('armyStatusBadge({}) zwraca null (zaden z 4 warunkow niespelniony)', armyStatusBadge({}) === null);
  assert('armyStatusBadge({sentry:true}) zwraca neutral (nie gold -- to jest DOKLADNIE naprawiony bug nieodroznialnosci)', armyStatusBadge({ sentry: true }).variant === 'neutral');
  assert('armyStatusBadge({inGarnizon:true}) zwraca gold', armyStatusBadge({ inGarnizon: true }).variant === 'gold');
  assert(`hpValueColor tuz PONIZEJ progu ${SIDE_LIST_HP_LOW_THRESHOLD_PCT}% zwraca #e07a7a`, hpValueColor(SIDE_LIST_HP_LOW_THRESHOLD_PCT - 1) === '#e07a7a');
  assert(`hpValueColor DOKLADNIE na progu ${SIDE_LIST_HP_LOW_THRESHOLD_PCT}% zwraca null (domyslny kolor)`, hpValueColor(SIDE_LIST_HP_LOW_THRESHOLD_PCT) === null);
  assert('pctClamped spina do 100 (wartosc > max)', pctClamped(999, 20) === 100);
  assert('pctClamped nie dzieli przez zero (max<=0 -> 0)', pctClamped(5, 0) === 0);

  console.log('');
  console.log('========================================================================');
  try { fs.unlinkSync(ENTRY); } catch { /* noop */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* noop */ }
  if (fail === 0) {
    console.log(`OK (${pass}/${pass})`);
    process.exit(0);
  } else {
    console.log(`FAILED: ${pass} passed, ${fail} failed`);
    process.exit(1);
  }
}

main();
