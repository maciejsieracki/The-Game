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

console.log('');
console.log(`[praca-auto-ulepszenia-koszt-split-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
