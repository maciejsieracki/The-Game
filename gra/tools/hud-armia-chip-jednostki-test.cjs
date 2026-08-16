'use strict';
/**
 * hud-armia-chip-jednostki-test.cjs — P-ARMIA-CHIP-PELNE-JEDNOSTKI (Maciej 2026-08-12)
 * Run: cd gra && node tools/hud-armia-chip-jednostki-test.cjs
 *
 * Właściciel zgłosił: górny chip "Armia" w HUD pokazywał obok "+" liczbę powiązaną z pulą
 * rekrutów, nie z tym ile PEŁNYCH jednostek da się z niej realnie zwerbować. Panel "Rekruci
 * (pula werbu)" (informacje ogólne + tabela per-miasto) miał analogiczny brak w tabeli.
 *
 * Naprawa dotyka 4 miejsc, WSZYSTKIE muszą liczyć koszt-rekrutów/jednostkę z JEDNEGO
 * wspólnego źródła — `unitManpowerCost()` / `rekrutUnitEquivalents()` z
 * gra/src/game/manpower.ts:
 *   1. Chip "Armia" w HUD (hud.ts)               -> rate: signed(s.rekrutEkw ?? 0)
 *   2. Panel "Rekruci (pula werbu)", notatka ogólna (empireDetailPanel.ts) -> p.rekrutEkw / p.kosztJednostki
 *   3. Tabela per-miasto, nowa kolumna JEDN. (empireDetailPanel.ts)        -> c.rekruci / p.kosztJednostki
 *   4. Wiersz podsumowania RAZEM tej tabeli (empireDetailPanel.ts)         -> p.rekrutEkw (ta sama liczba co #1/#2)
 *
 * Warstwy testu (wzorzec: tools/manpower-test.cjs + tools/hud-obywatele-chip-test.cjs):
 *   A. BUNDLOWANE PRAWDZIWE ŹRÓDŁO — esbuild bundluje src/game/manpower.ts i src/ui/formatPl.ts
 *      naprawdę (nie kopie/nie reimplementacje) i wykonuje ich funkcje na fixture'ach.
 *   B. ŹRÓDŁO main.ts (regex na prawdziwym pliku) — oba miejsca budujące dane (buildHudState
 *      dla chipu, buildEmpireDetailSnap dla panelu) wołają DOKŁADNIE te same dwie funkcje
 *      (`rekrutUnitEquivalents`, `unitManpowerCost`) z tego samego modułu, main.ts nie ma
 *      własnej, konkurencyjnej definicji żadnej z nich.
 *   C. ŹRÓDŁO hud.ts (regex) — chip "Armia" czyta `s.rekrutEkw`, pole zadeklarowane w HudState.
 *   D. ŹRÓDŁO empireDetailPanel.ts (regex) — kolumna JEDN. i wiersz RAZEM czytają `p.rekrutEkw`
 *      / `p.kosztJednostki` (pola EmpireDetailSnap['power'], TE SAME co w B), nie liczą kosztu
 *      osobno; wiersz RAZEM wstawia `p.rekrutEkw` WPROST (nie floor(suma) przeliczone lokalnie).
 *   E. DOWÓD SPÓJNOŚCI end-to-end — na wspólnym fixture (miasta + epoka + maxMult) policz
 *      przez PRAWDZIWE `empirePoborTotals`/`unitManpowerCost`/`rekrutUnitEquivalents`/
 *      `cityManpowerCurrent` (bundle A) to samo, co main.ts robi w obu miejscach (B), i
 *      potwierdź: floor(sum niezaokrąglonych wartości per-miasto z kolumny JEDN.) ==
 *      rekrutEkw chipu/panelu -- czyli wszystkie 4 miejsca UI, mimo że renderowane w 3 różnych
 *      plikach, są matematycznie tym samym liczeniem jednego kosztu/jednostkę.
 *   F. DOWÓD MUTACYJNY — sekcja E pokazuje spójność na JEDNYM, nieruchomym stanie; sekcja F
 *      dowodzi, że ta spójność jest niezmiennikiem POD MUTACJĄ: dwa stany tych samych miast,
 *      różniące się WYŁĄCZNIE `maxMult` (parametr, który skaluje `unitManpowerCost()`),
 *      potwierdzają że koszt/jednostkę faktycznie się zmienia i #1/#2/#4 (rekrutEkw) oraz
 *      #3 (KAŻDY wiersz kolumny JEDN.) poruszają się w lockstep w OBU stanach naraz. Do tego
 *      F2: dwie tymczasowe mutacje REGRESYJNE prawdziwego `manpower.ts` (nie kopii) — rebuild
 *      bundla esbuildem, dowód że inwariant F pęka na czerwono, przywrócenie pliku (try/finally).
 *      UCZCIWY ZAKRES (poprawka po recenzji Evaluatora zaginionej wersji): sekcja F dowodzi
 *      wewnętrznej spójności ARYTMETYKI manpower.ts pod mutacją kosztu — NIE dowodzi sama, że
 *      main.ts/hud.ts/empireDetailPanel.ts faktycznie WOŁAJĄ te funkcje zamiast mieć własną,
 *      konkurencyjną kopię logiki (np. twardy koszt zahardkodowany w panelu). To wiązanie
 *      UI → źródło pilnują sekcje B/C/D (regex na prawdziwych plikach main.ts/hud.ts/
 *      empireDetailPanel.ts), działające RAZEM z F, nie F samodzielnie.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const HUD_TS = path.join(GRA_DIR, 'src/ui/hud.ts');
const PANEL_TS = path.join(GRA_DIR, 'src/ui/empireDetailPanel.ts');
const TYPES_TS = path.join(GRA_DIR, 'src/ui/empireDetailTypes.ts');
const MANPOWER_TS = path.join(GRA_DIR, 'src/game/manpower.ts');

const ENTRY = path.join(__dirname, '.armia-chip-jednostki-entry.ts');
const BUNDLE = path.join(__dirname, '.armia-chip-jednostki-bundle.cjs');

let passCount = 0;
let failCount = 0;

function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

console.log('========================================================================');
console.log('P-ARMIA-CHIP-PELNE-JEDNOSTKI -- pelne jednostki z puli rekrutow (4 miejsca)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Bundle prawdziwego zrodla: game/manpower.ts + ui/formatPl.ts.
// ---------------------------------------------------------------------------
console.log('A. Bundle real source: src/game/manpower.ts + src/ui/formatPl.ts');

fs.writeFileSync(ENTRY, `
import {
  unitManpowerCost,
  rekrutUnitEquivalents,
  empirePoborTotals,
  cityManpowerCurrent,
} from '../src/game/manpower';
import { formatLiczbaPl } from '../src/ui/formatPl';

module.exports = {
  unitManpowerCost,
  rekrutUnitEquivalents,
  empirePoborTotals,
  cityManpowerCurrent,
  formatLiczbaPl,
};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hud-armia-chip-jednostki-test] esbuild bundle failed:', e.message || e);
  process.exit(1);
}

delete require.cache[require.resolve(BUNDLE)];
const mp = require(BUNDLE);

check('bundle eksportuje unitManpowerCost', typeof mp.unitManpowerCost === 'function');
check('bundle eksportuje rekrutUnitEquivalents', typeof mp.rekrutUnitEquivalents === 'function');
check('bundle eksportuje empirePoborTotals', typeof mp.empirePoborTotals === 'function');
check('bundle eksportuje cityManpowerCurrent', typeof mp.cityManpowerCurrent === 'function');
check('bundle eksportuje formatLiczbaPl', typeof mp.formatLiczbaPl === 'function');
console.log('');

// ---------------------------------------------------------------------------
// A2. rekrutUnitEquivalents == Math.floor(pula / unitManpowerCost) -- na kilku fixture'ach
//     (rozne epoki/mnozniki/pule), w tym brzegowe: 0, dokladna wielokrotnosc, mniej niz koszt.
// ---------------------------------------------------------------------------
console.log('A2. rekrutUnitEquivalents(pula, epoka, maxMult) === floor(pula / unitManpowerCost(epoka, maxMult))');

const fixturesA2 = [
  { pula: 0, epoka: 1, maxMult: 1 },
  { pula: 999, epoka: 1, maxMult: 1 },
  { pula: 1000, epoka: 1, maxMult: 1 },
  { pula: 12345, epoka: 3, maxMult: 1 },
  { pula: 20400, epoka: 5, maxMult: 1.5 },
  { pula: 500, epoka: 2, maxMult: 1 },
];
for (const fx of fixturesA2) {
  const koszt = mp.unitManpowerCost(fx.epoka, fx.maxMult);
  const got = mp.rekrutUnitEquivalents(fx.pula, fx.epoka, fx.maxMult);
  const want = koszt > 0 ? Math.floor(fx.pula / koszt) : 0;
  check(
    `pula=${fx.pula} epoka=${fx.epoka} maxMult=${fx.maxMult} -> koszt=${koszt}, rekrutEkw=${got} (want ${want})`,
    got === want,
    { got, want, koszt },
  );
}
console.log('');

// ---------------------------------------------------------------------------
// B. main.ts: OBA miejsca budujace dane (chip HUD + panel imperium) woluja te SAME
//    dwie funkcje z JEDNEGO modulu -- main.ts nie ma wlasnej definicji zadnej z nich.
// ---------------------------------------------------------------------------
console.log('B. main.ts: buildHudState + buildEmpireDetailSnap licza z jednego zrodla');
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

check(
  'main.ts importuje rekrutUnitEquivalents i unitManpowerCost z ./game/manpower',
  /import\s*\{[^}]*\brekrutUnitEquivalents\b[^}]*\}\s*from\s*'\.\/game\/manpower'/s.test(mainTsSrc)
    && /import\s*\{[^}]*\bunitManpowerCost\b[^}]*\}\s*from\s*'\.\/game\/manpower'/s.test(mainTsSrc),
);
check(
  'main.ts NIE definiuje wlasnej funkcji unitManpowerCost (jedyna implementacja w manpower.ts)',
  !/function unitManpowerCost\(/.test(mainTsSrc),
);
check(
  'main.ts NIE definiuje wlasnej funkcji rekrutUnitEquivalents (jedyna implementacja w manpower.ts)',
  !/function rekrutUnitEquivalents\(/.test(mainTsSrc),
);

const buildHudStateMatch = mainTsSrc.match(/function buildHudState\(\): HudState \{[\s\S]{0,20000}?\n {4}\}/);
check('main.ts zawiera funkcje buildHudState(): HudState', buildHudStateMatch !== null);
const buildHudStateBody = buildHudStateMatch ? buildHudStateMatch[0] : '';
check(
  'buildHudState zwraca rekrutEkw: rekrutUnitEquivalents(pobor.rekruci, player.era, mpMults.maxMult)',
  /rekrutEkw: rekrutUnitEquivalents\(pobor\.rekruci, player\.era, mpMults\.maxMult\),/.test(buildHudStateBody),
);
check(
  'buildHudState zwraca kosztJednostki: unitManpowerCost(player.era, mpMults.maxMult)',
  /kosztJednostki: unitManpowerCost\(player\.era, mpMults\.maxMult\),/.test(buildHudStateBody),
);

// Okno rozszerzone 12000 -> 20000 (P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK, Maciej
// 2026-08-16): buildEmpireDetailSnap() urosło o blok armiaProdukcja (~30 linii) i przekroczyło
// stary limit 12000 znaków -- regex przestał znajdywać dopasowanie mimo że oba pola (power:{...})
// wciąż istnieją bez zmian, dając fałszywy FAIL. Ta sama wartość co sąsiedni buildHudStateMatch
// wyżej (linia ~175), więc obie kotwice mają teraz spójny margines bezpieczeństwa.
// / EN: window widened 12000 -> 20000 -- buildEmpireDetailSnap() grew by the armiaProdukcja
// block (~30 lines) and exceeded the old 12000-char cap, so the regex stopped matching even
// though both power:{...} fields are unchanged (false FAIL). Matches the sibling
// buildHudStateMatch window above for a consistent safety margin.
const buildEmpireSnapMatch = mainTsSrc.match(/function buildEmpireDetailSnap\(\): EmpireDetailSnap \{[\s\S]{0,20000}?\n {4}\}/);
check('main.ts zawiera funkcje buildEmpireDetailSnap(): EmpireDetailSnap', buildEmpireSnapMatch !== null);
const buildEmpireSnapBody = buildEmpireSnapMatch ? buildEmpireSnapMatch[0] : '';
check(
  'buildEmpireDetailSnap (power:{...}) zwraca rekrutEkw: rekrutUnitEquivalents(pobor.rekruci, epoka, maxMult)',
  /rekrutEkw: rekrutUnitEquivalents\(pobor\.rekruci, epoka, maxMult\),/.test(buildEmpireSnapBody),
);
check(
  'buildEmpireDetailSnap (power:{...}) zwraca kosztJednostki: unitManpowerCost(epoka, maxMult)',
  /kosztJednostki: unitManpowerCost\(epoka, maxMult\),/.test(buildEmpireSnapBody),
);
console.log('');

// ---------------------------------------------------------------------------
// C. hud.ts: chip "Armia" czyta s.rekrutEkw (nie liczy sam, nie pokazuje juz surowej puli).
// ---------------------------------------------------------------------------
console.log('C. hud.ts: chip "Armia" (rate) czyta s.rekrutEkw; pole zadeklarowane w HudState');
const hudTsSrc = fs.readFileSync(HUD_TS, 'utf8');

check(
  'HudState deklaruje rekrutEkw?: number',
  /rekrutEkw\?: number;/.test(hudTsSrc),
);
check(
  'HudState deklaruje kosztJednostki?: number',
  /kosztJednostki\?: number;/.test(hudTsSrc),
);

const armiaChipMatch = hudTsSrc.match(/label: 'Armia',[\s\S]{0,1500}?title: armiaChipTitle\(s\),/);
check('hud.ts zawiera blok chip6cHtml({ label: \'Armia\', ... })', armiaChipMatch !== null);
const armiaChipBody = armiaChipMatch ? armiaChipMatch[0] : '';
check(
  'chip "Armia": rate: signed(s.rekrutEkw ?? 0) -- pelne jednostki, nie surowa pula/regen',
  /rate: signed\(s\.rekrutEkw \?\? 0\),/.test(armiaChipBody),
);
check(
  'chip "Armia": value dalej String(s.armyUnitsOnMap ?? 0) -- NIEZMIENIONE (wojsko na mapie)',
  /value: String\(s\.armyUnitsOnMap \?\? 0\),/.test(armiaChipBody),
);
check(
  'chip "Armia" NIE uzywa juz s.rekruciRegenPerTurn jako "rate" (przeniesione do tooltipu)',
  !/rate: signed\(s\.rekruciRegenPerTurn/.test(armiaChipBody),
);

check(
  'main.ts: buildHudState liczy rekrutEkw TA SAMA para funkcji co panel (rekrutUnitEquivalents + unitManpowerCost)',
  /rekrutEkw: rekrutUnitEquivalents\(pobor\.rekruci, player\.era, mpMults\.maxMult\),/.test(mainTsSrc)
    && /rekrutEkw: rekrutUnitEquivalents\(pobor\.rekruci, epoka, maxMult\),/.test(mainTsSrc),
);
console.log('');

// ---------------------------------------------------------------------------
// D. empireDetailPanel.ts: kolumna JEDN. per-miasto (niefloorowana, formatLiczbaPl 1 miejsce)
//    + wiersz RAZEM ktory wstawia p.rekrutEkw WPROST (ten sam numer co #1/#2, nie przeliczony).
// ---------------------------------------------------------------------------
console.log('D. empireDetailPanel.ts: kolumna JEDN. + wiersz RAZEM (cityPoborMiniRekruci)');
const panelTsSrc = fs.readFileSync(PANEL_TS, 'utf8');

check(
  'empireDetailPanel.ts importuje formatLiczbaPl z ./formatPl',
  /import\s*\{[^}]*\bformatLiczbaPl\b[^}]*\}\s*from\s*'\.\/formatPl'/s.test(panelTsSrc),
);

const cityPoborFnMatch = panelTsSrc.match(/function cityPoborMiniRekruci\([\s\S]*?\n\): string \{[\s\S]*?\n\}\n/);
check('empireDetailPanel.ts zawiera funkcje cityPoborMiniRekruci', cityPoborFnMatch !== null);
const cityPoborFnBody = cityPoborFnMatch ? cityPoborFnMatch[0] : '';

check(
  'nagłówek tabeli dostał kolumnę JEDN.',
  /miniHeader\(\['MIASTO', 'REKRUCI', 'MAX', 'ODNOWA', 'JEDN\.'\]/.test(cityPoborFnBody),
);
check(
  'wartość per-miasto liczona jako c.rekruci / p.kosztJednostki (TEN SAM koszt co #1/#2, nie osobny)',
  /const ekwMiasto = p\.kosztJednostki > 0 \? c\.rekruci \/ p\.kosztJednostki : 0;/.test(cityPoborFnBody),
);
check(
  'wartość per-miasto renderowana przez formatLiczbaPl(ekwMiasto, 1) -- 1 miejsce po przecinku, NIE floorowana',
  /formatLiczbaPl\(ekwMiasto, 1\)/.test(cityPoborFnBody),
);
check(
  'kod NIE flooruje/roundinguje ekwMiasto przed wyświetleniem (brak Math.floor(ekwMiasto)/Math.round(ekwMiasto))',
  !/Math\.(floor|round)\(ekwMiasto\)/.test(cityPoborFnBody),
);
check(
  'wiersz RAZEM wstawia p.rekrutEkw WPROST w kolumnie JEDN. (identyczny numer co chip/notatka, nie przeliczony lokalnie)',
  /<div>\$\{p\.rekrutEkw\}<\/div><\/div>/.test(cityPoborFnBody),
);
check(
  'notatka ogólna nad tabelą nadal pokazuje "można werbować" p.rekrutEkw + koszt p.kosztJednostki (pkt 2a/2b zadania)',
  /można werbować: <b>\$\{p\.rekrutEkw\}<\/b> jedn\. `/.test(cityPoborFnBody)
    && /\(koszt \$\{p\.kosztJednostki\} rekr\.\/szt\.\)/.test(cityPoborFnBody),
);

const typesTsSrc = fs.readFileSync(TYPES_TS, 'utf8');
check(
  'EmpireDetailSnap.power deklaruje rekrutEkw: number oraz kosztJednostki: number (typ zgodny z main.ts)',
  /rekrutEkw: number;/.test(typesTsSrc) && /kosztJednostki: number;/.test(typesTsSrc),
);
console.log('');

// ---------------------------------------------------------------------------
// E. Dowod spojnosci end-to-end na wspolnym fixture: floor(suma niezaokraglonych JEDN.
//    per-miasto) == rekrutEkw (ta sama liczba, ktora karmi chip HUD i notatke/wiersz RAZEM).
// ---------------------------------------------------------------------------
console.log('E. Fixture: floor(suma JEDN. per-miasto) == rekrutEkw (chip Armia == panel)');

const epoka = 4;
const maxMult = 1;
const fixtureCitiesRaw = [
  { id: 'c0', ownerId: 0, population: 8, manpower: 4260 },
  { id: 'c1', ownerId: 0, population: 5, manpower: 2600 },
  { id: 'c2', ownerId: 0, population: 3, manpower: 1000 },
  { id: 'foreign', ownerId: 1, population: 20, manpower: 99999 }, // obca cyw. -- wykluczona
];

const kosztJednostki = mp.unitManpowerCost(epoka, maxMult);
check('koszt jednostki w epoce fixture > 0 (test ma sens)', kosztJednostki > 0, kosztJednostki);

// To DOKLADNIE to, co main.ts liczy jako `pobor` w obu miejscach (buildHudState linia 14105-ish,
// buildEmpireDetailSnap linia 12105-ish) -- ta sama funkcja empirePoborTotals.
const pobor = mp.empirePoborTotals(fixtureCitiesRaw, 0, epoka, maxMult);
const rekrutEkwChip = mp.rekrutUnitEquivalents(pobor.rekruci, epoka, maxMult); // = pole s.rekrutEkw / p.rekrutEkw

// Kolumna JEDN. per-miasto (mirror cityPoborMiniRekruci): cityManpowerCurrent -- ta sama funkcja,
// ktorej main.ts uzywa do zbudowania cityPobor rows (przez cityManpowerSnapshot -> manpowerBiezacy).
const playerCities = fixtureCitiesRaw.filter((c) => c.ownerId === 0);
let sumEkwMiasto = 0;
const perCityEkw = [];
for (const c of playerCities) {
  const cRekruci = mp.cityManpowerCurrent(c, epoka, maxMult);
  const ekwMiasto = cRekruci / kosztJednostki;
  sumEkwMiasto += ekwMiasto;
  perCityEkw.push({ id: c.id, cRekruci, ekwMiasto, formatted: mp.formatLiczbaPl(ekwMiasto, 1) });
}

check(
  'floor(suma niezaokraglonych JEDN. per-miasto) === rekrutEkw chipu/panelu (spojnosc 4 miejsc)',
  Math.floor(sumEkwMiasto) === rekrutEkwChip,
  { sumEkwMiasto, rekrutEkwChip, perCityEkw, poborRekruci: pobor.rekruci, kosztJednostki },
);
check(
  'obca cywilizacja (ownerId=1) wykluczona z pobor.rekruci (fixture nie przecieka miedzy cywilizacjami)',
  pobor.rekruci === 4260 + 2600 + 1000,
  pobor.rekruci,
);

// Formatowanie PL (1 miejsce po przecinku, przecinek, koncowe zero ucinane) -- fixture
// dobrany tak, zeby 260/100-typu ulamek byl czytelny (np. "2,6").
const cleanKoszt = mp.unitManpowerCost(1, 1); // epoka 1 = 1000 (kanon R-MANPOWER-EPOKA1-500-VS-1000=A)
check('unitManpowerCost(epoka=1, maxMult=1) === 1000 (punkt odniesienia formatowania)', cleanKoszt === 1000, cleanKoszt);
check(
  'formatLiczbaPl(2600 / 1000, 1) === "2,6" (przykład z treści zadania)',
  mp.formatLiczbaPl(2600 / cleanKoszt, 1) === '2,6',
  mp.formatLiczbaPl(2600 / cleanKoszt, 1),
);
check(
  'formatLiczbaPl(3000 / 1000, 1) === "3" (całkowita wartość, bez zbędnego ",0")',
  mp.formatLiczbaPl(3000 / cleanKoszt, 1) === '3',
  mp.formatLiczbaPl(3000 / cleanKoszt, 1),
);
check(
  'formatLiczbaPl(0, 1) === "0" (miasto bez rekrutów -> 0, nie puste pole)',
  mp.formatLiczbaPl(0, 1) === '0',
  mp.formatLiczbaPl(0, 1),
);
console.log('');

// ---------------------------------------------------------------------------
// F. DOWOD MUTACYJNY -- mutacja kosztu-jednostki w JEDNYM miejscu (maxMult) porusza
//    WSZYSTKIE 4 miejsca (chip/notatka/kolumna JEDN./RAZEM) jednoczesnie, bo wszystkie
//    licza z jednego zrodla (manpower.ts). Dwa stany tych samych miast, roznice
//    WYLACZNIE parametrem maxMult -- ktory skaluje unitManpowerCost() (kosztJednostki)
//    I cityManpowerMax() (limit puli), ale fixture dobrany tak, ze city.manpower < max
//    W OBU stanach (clamp nigdy nie wchodzi w gre) -- jedyna rzecz, ktora sie realnie
//    zmienia miedzy stanami, to koszt jednostki, nie surowa pula.
//
//    UCZCIWY ZAKRES: sekcja F dowodzi, ze ARYTMETYKA manpower.ts jest wewnetrznie spojna
//    pod mutacja kosztu (te same 4 wyniki poruszaja sie razem, w obu stanach maxMult).
//    NIE dowodzi sama, ze main.ts/hud.ts/empireDetailPanel.ts faktycznie WOLAJA te
//    funkcje (a nie maja wlasnej, konkurencyjnej kopii logiki -- np. twardy koszt
//    zahardkodowany w panelu) -- to wiazanie UI -> zrodlo pilnuja sekcje B/C/D (regex na
//    main.ts/hud.ts/empireDetailPanel.ts), dzialajace RAZEM z F, nie F samodzielnie.
// ---------------------------------------------------------------------------
console.log('F. Dowod mutacyjny: zmiana kosztu (maxMult) porusza 4 miejsca w lockstep');

const epokaF = 4; // manpowerNaJednostke[4] = 8000 (epoka-ludnosc-manpower.json)
// Manpower dobrany duzo wiekszy niz w fixture sekcji E celowo -- zeby MUT-F1 (nizej,
// F2) mial czym wykryc rozjazd: przy malych liczbach floor(pool/8000) i floor(pool/16000)
// moga przypadkiem wyjsc rowne (falszywy negatyw), przy tych wartosciach nie wychodza.
const fixtureCitiesF = [
  { id: 'c0', ownerId: 0, population: 8, manpower: 42600 },
  { id: 'c1', ownerId: 0, population: 5, manpower: 26000 },
  { id: 'c2', ownerId: 0, population: 3, manpower: 10000 },
  { id: 'foreign', ownerId: 1, population: 20, manpower: 99999 }, // obca cyw. -- wykluczona
];
const playerCitiesF = fixtureCitiesF.filter((c) => c.ownerId === 0);

// Stan liczony przy danym maxMult -- ta sama sciezka co main.ts w OBU miejscach (chip + panel).
function stanPrzyMaxMult(mod, maxMult) {
  const kosztJednostki = mod.unitManpowerCost(epokaF, maxMult);
  const pobor = mod.empirePoborTotals(fixtureCitiesF, 0, epokaF, maxMult);
  const rekrutEkw = mod.rekrutUnitEquivalents(pobor.rekruci, epokaF, maxMult); // = #1 chip / #2 notatka / #4 RAZEM
  let sumEkwMiasto = 0;
  const perCity = [];
  for (const c of playerCitiesF) {
    const cRekruci = mod.cityManpowerCurrent(c, epokaF, maxMult);
    const ekwMiasto = kosztJednostki > 0 ? cRekruci / kosztJednostki : 0; // #3 kolumna JEDN.
    sumEkwMiasto += ekwMiasto;
    perCity.push({ id: c.id, cRekruci, ekwMiasto });
  }
  return { kosztJednostki, pobor, rekrutEkw, sumEkwMiasto, perCity };
}

const stanA = stanPrzyMaxMult(mp, 1); // maxMult=1
const stanB = stanPrzyMaxMult(mp, 2); // maxMult=2 -- WYLACZNIE ten jeden parametr rozny od stanu A

check(
  'Krok 0 -- fixture ma sens: manpower KAZDEGO miasta gracza NIEZMIENIONY miedzy stanami (dowod, ze clamp cityManpowerMax nie zadzialal -- jedyna zmienna to koszt, nie pula)',
  stanA.perCity.every((cA, i) => cA.cRekruci === stanB.perCity[i].cRekruci),
  { A: stanA.perCity.map((c) => c.cRekruci), B: stanB.perCity.map((c) => c.cRekruci) },
);
check(
  'Krok 1 -- koszt jednostki faktycznie sie zmienil miedzy stanami (maxMult 1 -> 2 podwaja koszt: unitManpowerCost)',
  stanB.kosztJednostki === stanA.kosztJednostki * 2 && stanB.kosztJednostki !== stanA.kosztJednostki,
  { A: stanA.kosztJednostki, B: stanB.kosztJednostki },
);
check(
  'Krok 2 -- #1/#2/#4 rekrutEkw (chip "Armia" / notatka "mozna werbowac" / wiersz RAZEM) zmienia sie W LOCKSTEP z kosztem (floor(pula/koszt) w obu stanach, B < A bo koszt 2x)',
  stanA.rekrutEkw === Math.floor(stanA.pobor.rekruci / stanA.kosztJednostki)
    && stanB.rekrutEkw === Math.floor(stanB.pobor.rekruci / stanB.kosztJednostki)
    && stanB.rekrutEkw < stanA.rekrutEkw,
  { rekrutEkwA: stanA.rekrutEkw, rekrutEkwB: stanB.rekrutEkw },
);
check(
  'Krok 3 -- #3 KAZDY wiersz kolumny JEDN. per-miasto zmienia sie proporcjonalnie (ekwMiasto_B == ekwMiasto_A / 2, dla kazdego miasta gracza, bez wyjatku)',
  stanA.perCity.every((cA, i) => Math.abs(stanB.perCity[i].ekwMiasto - cA.ekwMiasto / 2) < 1e-9),
  { A: stanA.perCity.map((c) => c.ekwMiasto), B: stanB.perCity.map((c) => c.ekwMiasto) },
);
check(
  'Krok 4 -- floor(suma JEDN. per-miasto) === rekrutEkw chipu/RAZEM trzyma sie POD OBOMA stanami naraz (sekcja E to sprawdzala tylko na jednym, nieruchomym stanie)',
  Math.floor(stanA.sumEkwMiasto) === stanA.rekrutEkw && Math.floor(stanB.sumEkwMiasto) === stanB.rekrutEkw,
  { sumA: stanA.sumEkwMiasto, rekrutEkwA: stanA.rekrutEkw, sumB: stanB.sumEkwMiasto, rekrutEkwB: stanB.rekrutEkw },
);
console.log('');

// ---------------------------------------------------------------------------
// F2. WERYFIKACJA NEGATYWNA -- dowod, ze sekcja F realnie cos lapie (nie jest tautologia).
//    Dwie tymczasowe mutacje REGRESYJNE PRAWDZIWEGO manpower.ts (nie kopii/reimplementacji),
//    rebuild bundla esbuildem, ponowne przeliczenie inwariantu F (Krok 2+4 dla obu stanow) na
//    zmutowanym module -- oczekujemy CZERWONO. Plik jest PRZYWRACANY zawsze (try/finally),
//    nawet gdyby ktoras asercja nizej zawiodla.
// ---------------------------------------------------------------------------
console.log('F2. Weryfikacja negatywna -- mutacje production code lapane przez inwariant sekcji F');

const manpowerSrcBackup = fs.readFileSync(MANPOWER_TS, 'utf8');
const MUTANT_ENTRY = path.join(__dirname, '.armia-chip-jednostki-mutant-entry.ts');
const MUTANT_BUNDLE = path.join(__dirname, '.armia-chip-jednostki-mutant-bundle.cjs');

function buildMutantManpowerBundle() {
  fs.writeFileSync(MUTANT_ENTRY, `
import {
  unitManpowerCost,
  rekrutUnitEquivalents,
  empirePoborTotals,
  cityManpowerCurrent,
} from '../src/game/manpower';
module.exports = { unitManpowerCost, rekrutUnitEquivalents, empirePoborTotals, cityManpowerCurrent };
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [MUTANT_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: MUTANT_BUNDLE,
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(MUTANT_BUNDLE)];
  return require(MUTANT_BUNDLE);
}

/** Powtorka Krokow 2+4 sekcji F (inwariant "rekrutEkw == floor(suma JEDN.)" w OBU stanach
 *  maxMult) na (ewentualnie zmutowanym) module. Zwraca true gdy inwariant sie trzyma. */
function inwariantFTrzymaSie(mod) {
  const a = stanPrzyMaxMult(mod, 1);
  const b = stanPrzyMaxMult(mod, 2);
  return Math.floor(a.sumEkwMiasto) === a.rekrutEkw && Math.floor(b.sumEkwMiasto) === b.rekrutEkw;
}

/** Uruchamia jedna mutacje: podmienia MANPOWER_TS, rebuilduje bundle, liczy inwariant,
 *  ZAWSZE przywraca oryginal (finally). Zwraca { podmianaOk, bladBuduj, inwariantPoMutacji }. */
function uruchomMutacje(anchor, replacement) {
  const podmianaOk = manpowerSrcBackup.includes(anchor);
  const mutated = podmianaOk ? manpowerSrcBackup.replace(anchor, replacement) : manpowerSrcBackup;
  let inwariantPoMutacji = true;
  let bladBuduj = null;
  try {
    fs.writeFileSync(MANPOWER_TS, mutated, 'utf8');
    const mutMod = buildMutantManpowerBundle();
    inwariantPoMutacji = inwariantFTrzymaSie(mutMod);
  } catch (e) {
    bladBuduj = e;
  } finally {
    fs.writeFileSync(MANPOWER_TS, manpowerSrcBackup, 'utf8');
  }
  return { podmianaOk, zmianaFaktyczna: mutated !== manpowerSrcBackup, bladBuduj, inwariantPoMutacji };
}

// MUT-F1: rekrutUnitEquivalents (chip "Armia" / notatka / RAZEM) przestaje przekazywac
// maxMult do unitManpowerCost -- symuluje regresje "chip liczy koszt OSOBNO/inaczej niz
// kolumna per-miasto" (np. ktos w przyszlosci doda parametr i zapomni go przekazac w
// jednym z 4 miejsc). Przy maxMult=1 (stan A) mutacja jest niewidoczna (1 to wartosc
// domyslna) -- lapie ja dopiero stan B (maxMult=2), co jest OK: inwariant F sprawdza OBA
// stany naraz (Krok 4), wiec wystarczy ze jeden z nich pęka.
{
  const anchor = 'const cost = unitManpowerCost(epoka, maxMult);';
  const replacement = 'const cost = unitManpowerCost(epoka, 1); // MUTANT-F1 (regresyjny, przywrocony ponizej): ignoruje maxMult';
  const wynik = uruchomMutacje(anchor, replacement);
  check('MUT-F1: kotwica podmiany istnieje w manpower.ts (rekrutUnitEquivalents)', wynik.podmianaOk);
  check('MUT-F1: podmiana faktycznie zmienila zrodlo', wynik.zmianaFaktyczna);
  check('MUT-F1: zbudowana bez bledu esbuild (mutacja jest syntaktycznie poprawnym TS)', wynik.bladBuduj === null, wynik.bladBuduj && (wynik.bladBuduj.message || String(wynik.bladBuduj)));
  check(
    'MUT-F1 ("chip ignoruje maxMult, liczy koszt osobno") lapana CZERWONO przez inwariant sekcji F',
    wynik.inwariantPoMutacji === false,
  );
  check('manpower.ts przywrocony do oryginalu po MUT-F1', fs.readFileSync(MANPOWER_TS, 'utf8') === manpowerSrcBackup);
}

// MUT-F2: empirePoborTotals przestaje filtrowac miasta po ownerId -- pula "przecieka" z
// obcej cywilizacji do puli gracza (regresja: dokladnie ten blad, ktoremu ma zapobiegac
// miasto "foreign" w fixture E/F). Lapana w OBU stanach (maxMult nie ma tu znaczenia --
// przeciek jest w sumowaniu, nie w koszcie).
{
  const anchor = '  for (const c of cities) {\n    if (c.ownerId !== ownerId) continue;\n    sumaLudkow += clampLudki(c.population);';
  const replacement = '  for (const c of cities) {\n    // MUTANT-F2 (regresyjny, przywrocony ponizej): filtr ownerId usuniety -- pula przecieka miedzy cywilizacjami\n    sumaLudkow += clampLudki(c.population);';
  const wynik = uruchomMutacje(anchor, replacement);
  check('MUT-F2: kotwica podmiany istnieje w manpower.ts (empirePoborTotals)', wynik.podmianaOk);
  check('MUT-F2: podmiana faktycznie zmienila zrodlo', wynik.zmianaFaktyczna);
  check('MUT-F2: zbudowana bez bledu esbuild', wynik.bladBuduj === null, wynik.bladBuduj && (wynik.bladBuduj.message || String(wynik.bladBuduj)));
  check(
    'MUT-F2 ("pula przecieka z obcej cywilizacji, foreign 99999 wlicza sie do rekrutEkw") lapana CZERWONO przez inwariant sekcji F',
    wynik.inwariantPoMutacji === false,
  );
  check('manpower.ts przywrocony do oryginalu po MUT-F2', fs.readFileSync(MANPOWER_TS, 'utf8') === manpowerSrcBackup);
}

try { fs.unlinkSync(MUTANT_ENTRY); } catch (_e) { /* brak pliku -- ok */ }
try { fs.unlinkSync(MUTANT_BUNDLE); } catch (_e) { /* brak pliku -- ok */ }
console.log('');

// ---------------------------------------------------------------------------
// Sprzatanie plikow tymczasowych (wzor: hud-obywatele-chip-test.cjs / manpower-test.cjs).
// ---------------------------------------------------------------------------
try { fs.unlinkSync(ENTRY); } catch (_e) { /* brak pliku -- ok */ }
try { fs.unlinkSync(BUNDLE); } catch (_e) { /* brak pliku -- ok */ }

console.log('========================================================================');
if (failCount === 0) {
  console.log(`OK (${passCount}/${passCount})`);
  process.exit(0);
} else {
  console.log(`FAILED: ${passCount} passed, ${failCount} failed`);
  process.exit(1);
}
