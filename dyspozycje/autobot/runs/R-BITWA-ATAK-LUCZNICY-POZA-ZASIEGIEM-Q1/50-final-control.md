# Final Control — R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1

**Werdykt: PASS-WITH-NOTES. Etap: 8/11 — Final Control.** Zakres sprawdzony na drzewie zawierającym produkt `05f66019` i poprawkę regresji Skirmish `27d79fda`, evaluator r2 `f42317c9` oraz aktualizację dispatchu `b1d578ac`. Bez integracji, deployu i pushu.

## Niezależne sprawdzenia

- `node tools/battle-ranged-mounted-doctrine-test.cjs` — **10/10 PASS**, w tym łucznik Skirmish poza zasięgiem przy żywej własnej linii piechoty. Nowa blokada ruchu za piechotą ogranicza się do doktryny Atak (`steady`), a Skirmish zachowuje krok do przodu.
- `node tools/battle-melee-attack-doctrine-test.cjs` — **PASS**. W Ataku i Szturmie piechota 24v24 dochodzi do walki wręcz; każda symulacja wykonała 72 ataki i zadała 720 HP strat.
- `node tools/battle-manual-choice-contract-test.cjs` — **12/12 PASS**.
- `npm run typecheck` — **PASS**.
- Świeży focused Chromium probe użył produkcyjnego `BattleScene`, terenu leśnego i mieszanego składu **42v42**. Łucznik w Ataku wykonał ruchy przez trzy aktywacje; dystans zmalał 8 → 5 → 3, po czym nastąpił strzał w zasięgu 3 i amunicja zmalała 12 → 11. In-range kontrola również oddała strzał i zużyła amunicję.
- Chromium zgłosił wyłącznie znane `404 /favicon.ico`; nie było błędów HTTP testu ani błędów strony.

## Uwagi i ograniczenia

- W świeżym in-range powtórzeniu strzał i amunicja potwierdziły atak, lecz śledzony HP celu pozostał bez zmian (`1000 → 1000`). Evaluator r2 odczytał wcześniejszy in-range raport z obrażeniami (`1000 → 997`); szkoda w tym powtórzeniu nie jest zatem niezależnie powtórzona. To nie obala testu podejścia, którego kryterium to legalny strzał i zużyta amunicja, ale obrażenia powinny być ponownie obserwowane przy szerszej walidacji walki.
- Dodatkowy pełny sześcioscenariuszowy Chromium matrix 42v42 (Atak/Obrona/Szturm, 1/2 linie dystansowe, kilka terenów) wystartował, lecz został przerwany po około 2:40 bez wyniku: Chromium GPU/renderer pozostawał zajęty pod współdzielonym obciążeniem. Nie zaliczam tego runu jako PASS. Wymagany targeted 42v42 approach probe zakończył się poprawnie; ograniczenie matrixu nie zmienia wyniku testów jednostkowych/regresyjnych.
- Browser probes aktywują reprezentatywne jednostki przez produkcyjne ścieżki BattleScene, ale nie symulują pełnej, wieloturowej bitwy 84 jednostek.

## Werdykt

Zmiana spełnia kryterium zgłoszonego błędu w Ataku: łucznik w realnym 42v42 teście zmniejsza dystans i strzela po wejściu w zasięg, zamiast uciekać od celu. Test Skirmish bezpośrednio sprawdza regresję, a Atak, Szturm i kontrakt sterowania ręcznego przechodzą. PASS-WITH-NOTES zachowuje dwa jawne ograniczenia: niepowtarzalny w tym przebiegu spadek HP oraz przerwany rozszerzony matrix. Gotowe do etapu 9 przez orkiestratora; etapy 9–11 nie są zaliczone.
