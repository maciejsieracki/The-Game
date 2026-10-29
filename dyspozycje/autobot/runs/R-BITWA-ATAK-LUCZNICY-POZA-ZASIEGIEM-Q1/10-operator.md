# Operator report — `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1`

**Status:** runda 2 Operatora zakończona po zarzucie Evaluatora r1; oczekuje na niezależną ewaluację r2.

**Zakres:** wyłącznie zachowanie łuczników w doktrynie Atak; Obrona i Szturm pozostają bez zmian.

## Root cause

W doktrynie Atak łucznik najpierw próbował strzelać do legalnego celu w zasięgu. Gdy
żaden cel nie był w zasięgu, wykonanie przechodziło do ogólnego `_advanceStep` piechoty.
Ten planer traktuje własną linię jako przeszkodę i potrafił poprowadzić łucznika długą
drogą wokół formacji, oddalając go od wroga. Powtarzalny test początkowy pokazał 18 pól
ruchu bez strzału w sześciu aktywacjach, przy dystansie rosnącym 5, 5, 5, 8, 11, 14.

## Zmiana

- Łucznik poza zasięgiem w doktrynie Atak jest przekazywany do `_rangedAction`, czyli
  planera zbliżania i strzału dla jednostek dystansowych.
- Gdy własny front blokuje prosty krok naprzód, planer może zrobić ograniczony krok
  w bok tylko wewnątrz zakresu wierszy piechoty i tylko jeśli w następnym kroku otwiera
  to legalny postęp ku wrogowi. Ruch nadal nie wyprzedza linii walczącej wręcz.
- Ograniczenie kroku do tyłu linii jest stosowane wyłącznie w doktrynie Atak (`steady`);
  Skirmish zachowuje istniejącą walidację kroku i może zbliżać się przy żywej własnej
  piechocie.
- Nie zmieniono wyboru akcji w Obronie ani w Szturmie; testy regresyjne potwierdzają
  dotychczasowe zatrzymanie/strzelanie w Obronie oraz aktywne ataki w Szturmie.

## Weryfikacja

- Produkcyjny Chromium, mieszana armia 42v42 na lesie, Atak: aktywowana jest także
  blokująca piechota przed kolejną aktywacją łucznika. Łucznik wykonał rzeczywisty ruch
  przez trzy aktywacje i zmniejszył dystans 8 → 5 → 3, następnie oddał strzał w zasięgu
  3; amunicja 12 → 11. Skład zawierał piechotę, oszczepników, łuczników, procarzy,
  konnicę i rydwany. Wynik: `evidence/chromium-ranged-approach-probe-report.json`.
- Kontrola łucznika już będącego w zasięgu: rzeczywisty strzał, zużycie amunicji i spadek
  HP celu: `evidence/chromium-ranged-attack-probe-report.json`.
- `node tools/battle-ranged-mounted-doctrine-test.cjs`: 10/10 PASS. Obejmuje Atak poza
  zasięgiem oraz Skirmish poza zasięgiem przy żywej piechocie przed łucznikiem.
- `node tools/battle-melee-attack-doctrine-test.cjs`: PASS; Atak i Szturm zachowują
  walkę wręcz 24v24 (72 ataki, 720 HP utracone).
- `node tools/battle-manual-choice-contract-test.cjs`: 12/12 PASS.
- `npm run typecheck`: PASS.
- Szersza deterministyczna macierz produkcyjnego BattleScene dla 42v42 i pięciu tur
  zapisana w `../R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json`; nie jest ona
  samodzielnym dowodem pełnej symulacji Chromium.
- Ponowny test Chromium po korekcie: PASS; raport został odświeżony w
  `evidence/chromium-ranged-approach-probe-report.json`.

## Dowody i kolejny krok

Raporty JSON zawierają skład, trace aktywacji, pozycje, odległości, zasięg, amunicję,
zdarzenie strzału i błędy konsoli/sieci. W próbie mixed target po przyjęciu strzału
pozostało przy testowym HP 999; potwierdzeniem obrażeń celu służy osobna kontrola
in-range, gdzie HP spada.

Następny krok: niezależny Evaluator sprawdza poprawkę do zarzutu NOT PASS, nową regresję
Skirmish i powtórne dowody produkcyjne; przy uwagach uruchomić Obrona. Nie scalono, nie
wdrożono i nie wypchnięto.
