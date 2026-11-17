# R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1 — obrona Operatora (runda 1/5, odpowiedź na raport Evaluatora r1 `6d104408`)

STATUS: PASS-WITH-NOTES (brak zarzutów blokujących; zarzut 1 odrzucony z dowodem, zarzuty 2 i 3 odrzucone jako defekty, zostają jako NIE_ZMIERZONO)
DOMAIN: GAME (UI bitwy)
TEMAT: R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1
GOAL: W bitwie przy 1024x640, 1280x720 i 1440x900 żaden element UI nie zasłania „Wycofaj się”, wyniku/licznika ani przycisków górnego paska; brak regresji większych rozdzielczości.
BAZA: 87eeecbded76ce7034a35a7bf11cef899094d537 (origin/main). KANDYDAT: d7d0b05c987d661fb4675652c59b5a41dec629ba (rodzic = baza, potwierdzone `git merge-base --is-ancestor`).
GAŁĄŹ OBRONY: `obrona/banner-r1-claude` (wskazuje na kandydata; ten raport jest jedynym nowym commitem).

## Ponowna weryfikacja (ten Operator, liczby z surowego wyjścia)
- `git diff --stat 87eeecbde d7d0b05c9`: 3 pliki, 322 insercje, 2 usunięcia: `gra/src/battle/battleScene.ts` (56 zmian), `gra/tools/battle-banner-retreat-overlap-live-test.cjs` (nowy, 218 linii), `dyspozycje/.../10-operator-claude.md` (nowy, 50 linii). Allowlista zgodna.
- `git diff --check` baza..kandydat: exit 0, bez wyjścia.
- Przegląd diffu `battleScene.ts`: `_syncCommanderPanelLayout()` wywoływane w rAF po konstrukcji (linia ~3446), w `_onResize` (~13116) i na końcu `_syncBattleRosterPanelLayout` (~15301). Zgodne z opisem Evaluatora.
- NIE_ZMIERZONO w tej rundzie: `tsc`, bramki referencyjne, test Chromium. Nie uruchamiałem ich ponownie (wymagałyby npm ci + build). Wyniki podaję wyłącznie z raportu Evaluatora r1 (`6d104408`, sekcja TESTY), oznaczone jako jego odtworzenie, nie moje.

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — [NISKA] zachodzenie banera na pustą ramkę rostera przy 1280x720 i 1440x900
**ODRZUCAM** jako defekt wymagający poprawki w tym temacie.
Dowód:
- Zachodzenie zostało wyznaczone z zrzutów ekranu (`banner-retreat-1280x720.png`, `banner-retreat-1440x900.png`), a nie z rectów. Evaluator sam napisał: „wg zrzutów, nie wg rectów”. Nie ma zmierzonego przecięcia prostokątów, więc nie udowodniono defektu.
- Pod zachodzeniem, według Evaluatora, jest tylko pusta rama, bez przycisku i bez wyniku/licznika. Kryterium GOAL (przyciski górnego paska, wynik/licznik) jest spełnione, bo Evaluator stwierdził: 1280 i 1440 — „przyciski czyste”.
- Dodanie asercji „baner nie przecina rostera” wymagałoby nowego pomiaru i zmiany testu, a nie wynika z dispatchu. Traktuję to jako kandydata na osobny temat niskiego priorytetu (uwaga dla orkiestratora), nie jako poprawkę tej rundy.
Ryzyko, które zostaje: kosmetyka na pustej ramce, nie zmierzona precyzyjnie.

### Zarzut 2 — [NISKA, NIE_ZMIERZONO] tryb AUTO i faza rozstawiania
**ODRZUCAM** jako defekt tego kandydata. To jest luka pomiarowa, nie błąd w kodzie.
Dowód: test `battle-banner-retreat-overlap-live-test.cjs` mierzy wyłącznie bitwę ręczną po „START WALKI” (Evaluator, sekcja NIE_ZMIERZONO). Nie mam dispatchu w żadnej gałęzi (sprawdzone wcześniej przez Evaluatora i potwierdzone: `git show origin/main:...` i `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:...` zwracają „does not exist”), więc nie mogę rozstrzygnąć, czy AUTO jest wymagane. Kod `_syncCommanderPanelLayout` jest wywoływany niezależnie od trybu (rAF po konstrukcji banera i resize), więc nie widzę mechanizmu, który działałby inaczej w AUTO. Nie uruchamiałem AUTO. Do decyzji FC i orkiestratora.

### Zarzut 3 — [NISKA, NIE_ZMIERZONO] zmiana treści banera i resize w trakcie bitwy
**ODRZUCAM** jako defekt. Przyznaję, że to luka pomiarowa.
Dowód z diffu: przeliczenie następuje w `_onResize` (resize okna jest objęty) i po `_syncBattleRosterPanelLayout`. Zmiana treści (liczniki jednostek) nie wywołuje `_syncCommanderPanelLayout` bezpośrednio. Evaluator sam ocenił, że liczniki tylko maleją, więc szerokość banera nie rośnie. Nie mierzyłem tego, więc to pozostaje NIE_ZMIERZONO, a nie „poprawne”.
Uwaga: resize w trakcie bitwy jest w `_onResize`, więc nie jest nieprzetestowany w kodzie, tylko w teście.

## ZMIANY/COMMIT
- Brak zmian w kodzie w tej rundzie. Commit obrony zawiera wyłącznie ten plik raportu.

## TESTY
- Ta runda: `git diff --check` (baza..kandydat): exit 0. Pozostałe bramki NIE uruchamiane w tej rundzie (patrz wyżej); wyniki Evaluatora r1 niezmienione: tsc exit 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; test tematu 6/0 w 1024x640, 1280x720, 1440x900, mutant 4 PASS / 2 FAIL exit 1.

## BLOKADY
- Brak blokad technicznych. Otwarte luki pomiarowe: AUTO, faza rozstawiania, zmiana treści banera i resize w trakcie bitwy (wszystkie NIE_ZMIERZONO).

## RUNDY
1/5 (obrona). Brak kolejnej rundy, jeśli FC uzna zarzuty 1–3 za nieblokujące.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch i DODATEK nie istnieją w żadnej gałęzi/origin/main (potwierdzone), a w raporcie Evaluatora `00-dispatch.md` jest podany jako commit `ce15e4687` w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Ten SHA nie był dostępny w tym worktree przy weryfikacji. Zakres oceniony wg cytatów z dispatchu w zleceniu Workflow.
- Opcjonalny osobny temat niskiego priorytetu (NIE robić w tej rundzie): asercja „baner nie przecina rostera” z pomiarem rectów przy 1280x720 i 1440x900 (zarzut 1).

## NASTĘPNY KROK
Final Control (Sonnet): ocena zarzutów 1–3 i decyzja, czy zachodzenie na pustą ramkę jest akceptowalne.

## NASTĘPNY KROK ORKIESTRATORA
Po FC: integracja z SHA kandydata `d7d0b05c9` (plus commit raportu obrony); deploy/push nie wykonywane w tym etapie.

DEPLOY/PUSH: NIE WYKONANO
