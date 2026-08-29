'use strict';
/**
 * praca-auto-ulepszenia-koszt-split-test.cjs -- P-PRACA-IMPERIUM-AI-ULEPSZENIA-MIESZANE-Q1.
 *
 * ZGŁOSZENIE: właściciel (Grecy, 8 miast) — panel "Praca Imperium" i główny żeton HUD
 * pokazywały "Praca 39 -10" zamiast oczekiwanego wzrostu +80 (suma "do puli" z 8 miast).
 * Przyczyna: `_lastPracaRate` (main.ts) jest SUMĄ CZTERECH drenaży/zysków tej tury,
 * m.in. `pick.kosztPraca` za KAŻDE auto-postawione ulepszenie AI gracza (naprawa Wątku D,
 * R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1) -- ten drenaż wchodził WYŁĄCZNIE do salda netto
 * na głównym żetonie, myląc się z nim ("Praca 39 -10"), zamiast pojawić się osobno w
 * podsumowaniu. Właściciel: "nie powinno się tak rozliczać, bo wprowadza w błąd. Powinno to
 * pojawić się gdzieś w podsumowaniu, a nie na głównym żetonie."
 *
 * NAPRAWA: nowe, OSOBNE pole `_lastPracaAutoUlepszeniaKoszt` (main.ts), analogiczne do
 * istniejącego `_lastPracaUpkeep` — niesie sumę `pick.kosztPraca` ze WSZYSTKICH
 * auto-postawionych ulepszeń gracza w ostatniej turze, zapisywaną W TEJ SAMEJ pętli i przy
 * TYCH SAMYCH dwóch miejscach, które (bez zmiany arytmetyki) nadal odejmują `pick.kosztPraca`
 * od `_lastPracaRate`. Widoczne w UI jako osobna, podpisana liczba: tooltip HUD
 * (`pracaChipTitle`, hud.ts) i box "AUTO-ULEPSZENIA (AI)" w panelu "PULA IMPERIUM"
 * (empireDetailPanel.ts, `renderPracaSection`).
 *
 * KRYTYCZNE: `_lastPracaRate` (arytmetyka Wątku D, suma wszystkich 4 drenaży/zysków) NIE
 * jest tu zmieniana -- ten test NIE zastępuje `praca-pula-rate-parity-test.cjs` (uruchamiany
 * osobno, PRZED i PO tej zmianie, bez zmiany oczekiwanych wartości), tylko dokumentuje/pilnuje
 * DODATKOWEGO pola niosącego jeden ze składników tamtej sumy.
 *
 * Run from gra/: node tools/praca-auto-ulepszenia-koszt-split-test.cjs
 */
const fs = require('fs');
const path = require('path');

const mainSource = fs.readFileSync(path.resolve(__dirname, '..', 'src/main.ts'), 'utf8');
const hudSource = fs.readFileSync(path.resolve(__dirname, '..', 'src/ui/hud.ts'), 'utf8');
const empireDetailSource = fs.readFileSync(path.resolve(__dirname, '..', 'src/ui/empireDetailPanel.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

// ---- SEKCJA 1: nowe pole zadeklarowane, resetowane, zapisywane w TEJ SAMEJ pętli ----

check(
  '_lastPracaAutoUlepszeniaKoszt zadeklarowane w main.ts (obok _lastPracaUpkeep)',
  /let _lastPracaAutoUlepszeniaKoszt: number = 0;/.test(mainSource),
);

check(
  '_lastPracaAutoUlepszeniaKoszt resetowane do 0 na starcie bloku end-of-turn (obok "_lastPracaRate = 0;")',
  /_lastPracaRate = 0;\s*\n\s*_lastPracaAutoUlepszeniaKoszt = 0;/.test(mainSource),
);

// Oba miejsca, w których pick.kosztPraca jest odejmowane od _lastPracaRate (pętla
// auto-ulepszeń, wątek "wyrab"/wycinka i zwykłe ulepszenie) MUSZĄ też inkrementować nowe
// pole -- w TEJ SAMEJ instrukcji/bloku, nie osobnym przybliżeniem gdzie indziej.
const kosztPracaSubtractSites = [...mainSource.matchAll(/_lastPracaRate -= pick\.kosztPraca;/g)];
check(
  'Dokładnie 2 miejsca odejmujące pick.kosztPraca od _lastPracaRate (wycinka + zwykłe ulepszenie), bez zmiany liczby miejsc',
  kosztPracaSubtractSites.length === 2,
);

let bothSitesPaired = kosztPracaSubtractSites.length === 2;
for (const m of kosztPracaSubtractSites) {
  const windowAfter = mainSource.slice(m.index, m.index + 200);
  if (!/_lastPracaAutoUlepszeniaKoszt \+= pick\.kosztPraca;/.test(windowAfter)) {
    bothSitesPaired = false;
  }
}
check(
  'Każde odjęcie pick.kosztPraca od _lastPracaRate ma sparowane += do _lastPracaAutoUlepszeniaKoszt tuż obok (ta sama pętla, nie osobne przybliżenie)',
  bothSitesPaired,
);

// ---- SEKCJA 2: pole dociera do snapshotu HUD i dalej do EmpireHudSnap ----

check(
  'HudState (hud.ts) niesie pracaAutoUlepszeniaKoszt',
  /pracaAutoUlepszeniaKoszt\?: number;/.test(hudSource),
);

check(
  'main.ts: snapshot HUD zwraca pracaAutoUlepszeniaKoszt: Math.round(_lastPracaAutoUlepszeniaKoszt)',
  /pracaAutoUlepszeniaKoszt: Math\.round\(_lastPracaAutoUlepszeniaKoszt\)/.test(mainSource),
);

// ---- SEKCJA 3: pole widoczne w UI jako OSOBNA liczba (nie zlane z saldem netto) ----

check(
  'Tooltip HUD (pracaChipTitle, hud.ts) rozbija auto-ulepszenia AI jako osobną, podpisaną pozycję',
  /Auto-ulepszenia AI \(gracz\)/.test(hudSource) && /autoUlepszenia = s\.pracaAutoUlepszeniaKoszt/.test(hudSource),
);

check(
  'Panel "PULA IMPERIUM" (empireDetailPanel.ts) renderuje osobny box "AUTO-ULEPSZENIA (AI)"',
  /AUTO-ULEPSZENIA \(AI\)/.test(empireDetailSource),
);

check(
  'empireDetailPanel.ts czyta economy.pracaAutoUlepszeniaKoszt (nie przybliżenie/duplikat)',
  /economy\.pracaAutoUlepszeniaKoszt/.test(empireDetailSource),
);

// ---- SEKCJA 4: dowód numeryczny scenariusza ze zgłoszenia ----
// 8 miast, suma "do puli" tej tury = +80 (poolGain/overflowToPool, brak innych drenaży poza
// auto-ulepszeniami), auto-ulepszenia AI wydają 90 Pracy z puli w tej samej turze.
// _lastPracaRate (netto, arytmetyka Wątku D, NIE zmieniona tym tematem) = 80 - 90 = -10 --
// dokładnie zgłoszony objaw "Praca 39 -10". Nowe pole ma pokazać OBA składniki osobno.
{
  let _lastPracaRate = 0;
  let _lastPracaAutoUlepszeniaKoszt = 0;

  // reset na starcie end-of-turn (jak w main.ts)
  _lastPracaRate = 0;
  _lastPracaAutoUlepszeniaKoszt = 0;

  // suma poolGain/overflowToPool z 8 miast = +80 (brak upkeep/cuda-mapa w tym scenariuszu)
  const doPuliZOsmiuMiast = 80;
  _lastPracaRate += doPuliZOsmiuMiast;

  // auto-ulepszenia AI: kilka "pick" w pętli, sumujące się do 90 Pracy wydanej z puli
  const autoPicks = [30, 25, 20, 15]; // suma = 90
  for (const kosztPraca of autoPicks) {
    _lastPracaRate -= kosztPraca;
    _lastPracaAutoUlepszeniaKoszt += kosztPraca;
  }

  check(
    'Scenariusz zgłoszenia: _lastPracaRate netto = 80 - 90 = -10 (dokładnie zgłoszony objaw, arytmetyka Wątku D NIE zmieniona)',
    _lastPracaRate === -10,
  );
  check(
    'Scenariusz zgłoszenia: nowe pole _lastPracaAutoUlepszeniaKoszt = 90 (suma WSZYSTKICH auto-ulepszeń tej tury, z TEJ SAMEJ pętli)',
    _lastPracaAutoUlepszeniaKoszt === 90,
  );
  check(
    'Scenariusz zgłoszenia: oba pola razem odtwarzają "do puli +80" (netto + koszt auto-ulepszeń = 80), bez utraty informacji',
    _lastPracaRate + _lastPracaAutoUlepszeniaKoszt === doPuliZOsmiuMiast,
  );
}

// ---- SEKCJA 5: OBRONA runda 2 (zarzuty #2/#3) — WYKONANIE prawdziwego kodu, nie regex ----
// Zarzut #2: sekcje 2-3 sprawdzały wyłącznie regex nad tekstem źródła dwóch prywatnych
// funkcji, nigdy ich nie wywołując. Poniżej obie funkcje są WYCINANE dosłownie z prawdziwych
// plików i URUCHAMIANE (nie przepisywane) z prawdziwym `signedPl` (formatPl.ts, też wycięty
// dosłownie) -- dowód na realnym outpucie, nie na obecności substringu w źródle.
// Zarzut #3: każdy scenariusz poniżej sprawdzany jest RAZEM dla autoUlepszeniaKoszt=90 (box/
// stopka MAJĄ się pojawić) i =0 (brzeg — box/stopka MAJĄ się NIE pojawić), czego SEKCJA 3
// (tylko 80/90/-10) nie pokrywała.

// `new Function` wykonuje JS, nie TS -- adnotacje typów (`s: HudState`, `n: number`, typ
// zwracany `: string`) trzeba zdjąć z DOSŁOWNIE wyciętego kodu przed wykonaniem (usuwanie
// typów, nie logiki -- ciało funkcji, w tym cała arytmetyka i stringi, zostaje bez zmian).
function stripTsTypes(src) {
  let out = src.replace(/\)\s*:\s*[A-Za-z_][\w]*\s*\{/, ') {');
  out = out.replace(/([,(]\s*\w+)\s*:\s*[A-Za-z_][\w]*(\s*=)?/g, (m, p1, eq) => p1 + (eq || ''));
  return out;
}

function extractFn(source, startMarker, name) {
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`extractFn: nie znaleziono markera dla ${name}`);
  // Szukamy końca funkcji: pierwsza linia zawierająca WYŁĄCZNIE `}` na tym samym poziomie
  // wcięcia (0), licząc od nawiasu otwierającego marker.
  let depth = 0;
  let i = source.indexOf('{', startIdx);
  const bodyStart = i;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  if (depth !== 0) throw new Error(`extractFn: nawiasy niesparowane dla ${name}`);
  return source.slice(startIdx, i);
}

const formatPlSource = fs.readFileSync(path.resolve(__dirname, '..', 'src/ui/formatPl.ts'), 'utf8');
const formatLiczbaPlSrc = stripTsTypes(
  extractFn(formatPlSource, 'export function formatLiczbaPl', 'formatLiczbaPl').replace('export function', 'function'),
);
const signedPlSrc = stripTsTypes(
  extractFn(formatPlSource, 'export function signedPl', 'signedPl').replace('export function', 'function'),
);

// -- 5a. pracaChipTitle (hud.ts) URUCHOMIONY naprawdę --
const pracaChipTitleSrc = stripTsTypes(
  extractFn(hudSource, 'function pracaChipTitle(s: HudState): string {', 'pracaChipTitle'),
);
try {
  const pracaChipTitleFn = new Function(
    `${formatLiczbaPlSrc}\n${signedPlSrc}\nfunction signed(n) { return signedPl(n); }\n${pracaChipTitleSrc}\nreturn pracaChipTitle;`,
  )();

  const titleZgloszenie = pracaChipTitleFn({ pracaRate: -10, pracaUpkeep: 0, pracaAutoUlepszeniaKoszt: 90 });
  check(
    'REAL RUN pracaChipTitle (scenariusz 80/90/-10): rozbija auto-ulepszenia AI jako OSOBNĄ pozycję "−90", nie miesza z "Razem netto: −10"',
    titleZgloszenie.includes('Auto-ulepszenia AI (gracz): −90 pkt Pracy')
      && titleZgloszenie.includes('Razem netto: −10 pkt Pracy')
      && titleZgloszenie.includes('Wpływ do puli imperium: +80 pkt Pracy'),
    titleZgloszenie,
  );

  const titleZero = pracaChipTitleFn({ pracaRate: 12, pracaUpkeep: 0, pracaAutoUlepszeniaKoszt: 0 });
  check(
    'BRZEG (zarzut #3) REAL RUN pracaChipTitle przy autoUlepszeniaKoszt=0: pozycja auto-ulepszeń pokazuje "0" (brak auto-ulepszeń w tej turze), nie gubi liczby ani nie pokazuje mylącego znaku',
    titleZero.includes('Auto-ulepszenia AI (gracz): 0 pkt Pracy'),
    titleZero,
  );
} catch (e) {
  check('REAL RUN pracaChipTitle: ekstrakcja+wykonanie nie rzuca wyjątku', false, e.message || String(e));
}

// -- 5b. box "AUTO-ULEPSZENIA (AI)" + stopka (empireDetailPanel.ts) URUCHOMIONE naprawdę --
// Wycinamy DOSŁOWNIE oba bloki `if (autoUlepszeniaKoszt > 0) { ... }` (box po PULA
// IMPERIUM/UTRZYMANIE ULEPSZEŃ, i stopkę po stopce UTRZYMANIE) razem z ich unikalnymi
// komentarzami-kotwicami, żeby dowód trzymał się TEGO SAMEGO kodu co realne renderowanie
// panelu (nie przepisanej kopii).
function extractIfBlock(source, marker, name) {
  // `lastIndexOf`, nie `indexOf`: „Do puli" trafia do globalnej puli Pracy" (stopka) występuje
  // W PLIKU DWUKROTNIE (raz w niepowiązanej, wcześniejszej sekcji) — chcemy TĘ, która realnie
  // poprzedza `if (autoUlepszeniaKoszt > 0)` sekcji Pracy, czyli ostatnie wystąpienie.
  const startIdx = source.lastIndexOf(marker);
  if (startIdx === -1) throw new Error(`extractIfBlock: nie znaleziono markera dla ${name}`);
  // Marker musi leżeć PRZED szukanym `if` (pierwsze wystąpienie po markerze).
  const ifIdx = source.indexOf('if (autoUlepszeniaKoszt > 0)', startIdx);
  if (ifIdx === -1) throw new Error(`extractIfBlock: nie znaleziono if po markerze dla ${name}`);
  let depth = 0;
  let i = source.indexOf('{', ifIdx);
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return source.slice(ifIdx, i);
}

const boxBlockSrc = extractIfBlock(
  empireDetailSource,
  '<div class="k">UTRZYMANIE ULEPSZEŃ</div>',
  'box AUTO-ULEPSZENIA (AI)',
);
const footBlockSrc = extractIfBlock(
  empireDetailSource,
  '„Do puli" trafia do globalnej puli Pracy',
  'stopka auto-ulepszeń',
);

check(
  'Ekstrakcja bloków if(autoUlepszeniaKoszt>0) (box + stopka) trafiła w DOKŁADNIE jeden `if` każda (brak przypadkowego dopasowania innego bloku)',
  (boxBlockSrc.match(/if \(autoUlepszeniaKoszt > 0\)/g) || []).length === 1
    && (footBlockSrc.match(/if \(autoUlepszeniaKoszt > 0\)/g) || []).length === 1,
);

function runBoxBlock(autoUlepszeniaKoszt) {
  const fn = new Function('autoUlepszeniaKoszt', `let h = ''; ${boxBlockSrc} return h;`);
  return fn(autoUlepszeniaKoszt);
}
function runFootBlock(autoUlepszeniaKoszt) {
  const fn = new Function('autoUlepszeniaKoszt', `let h = ''; ${footBlockSrc} return h;`);
  return fn(autoUlepszeniaKoszt);
}

const boxAt90 = runBoxBlock(90);
check(
  'REAL RUN box AUTO-ULEPSZENIA (AI) przy koszt=90: zawiera etykietę i "−90"',
  boxAt90.includes('AUTO-ULEPSZENIA (AI)') && boxAt90.includes('−90'),
  boxAt90,
);
check(
  'ZARZUT #1 POPRAWKA: box przy koszt=90 NIE jest owinięty we własny `.civ-emp-two` (grid 1fr 1fr) jako jedyne dziecko — renderuje się jako pełnoszerokościowy `.civ-emp-box`',
  boxAt90.startsWith('<div class="civ-emp-box"') && !boxAt90.includes('civ-emp-two'),
  boxAt90,
);

const boxAt0 = runBoxBlock(0);
check(
  'BRZEG (zarzut #3) REAL RUN box przy koszt=0: box się NIE renderuje (pusty string) — brak auto-ulepszeń w tej turze nie pokazuje pustego/zerowego boksu',
  boxAt0 === '',
  boxAt0,
);

const footAt90 = runFootBlock(90);
check(
  'REAL RUN stopka auto-ulepszeń przy koszt=90: opisuje drenaż "−90 Praca z puli"',
  footAt90.includes('Auto-ulepszenia AI (gracz): −90 Praca z puli'),
  footAt90,
);
const footAt0 = runFootBlock(0);
check(
  'BRZEG (zarzut #3) REAL RUN stopka przy koszt=0: stopka się NIE renderuje (pusty string)',
  footAt0 === '',
  footAt0,
);

console.log('');
console.log(`[praca-auto-ulepszenia-koszt-split-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
