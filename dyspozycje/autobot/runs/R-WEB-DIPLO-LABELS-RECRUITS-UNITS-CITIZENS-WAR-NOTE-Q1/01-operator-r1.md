STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-LABELS-RECRUITS-UNITS-CITIZENS-WAR-NOTE-Q1
GOAL: Trzy drobne zmiany tekstu dyplomacji (bez zmiany mechaniki): (1) karta listy: wiersz „Rekruci: bieżąca / maks. jedn.” + tooltip z przeliczeniem; audiencja bez zmian; (2) „Ludność” → „Obywatele” w karcie listy; (3) dopisek przy Relacji doprecyzowany na „etykieta Wrogi: limit wojenny 29” (stała WAR_RELATION_SCORE_CAP).
BAZA: origin/main dcca72b78 (FALA 592 CITREC). Dispatch odczytany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (commit 5d7ff15e6). Brak DODATKU w dispatchu — wykonano zakres z GOAL.

ZMIANY/COMMIT (allowlista):
- gra/src/game/diplomacy-display.ts — formatRecruitsUnitsPart: dopisek „jedn.”; nowa stała RECRUITS_UNITS_TOOLTIP_PL (wzór przeliczenia Manpower ÷ koszt jednostki epoki, jak rekrutEkw); „Ludność:” → „Obywatele:” w formatDiploPlayerSummaryLines i formatDiploCivListLines.
- gra/src/ui/diploListHud.ts — tooltip (atrybut title) na linii statystyk, gdy zawiera „Rekruci: ” (karta gracza i karta cywilizacji).
- gra/src/ui/diplomacyAudience.ts — dopisek limitu wojennego: „(etykieta Wrogi: limit wojenny 29)”; liczba z WAR_RELATION_SCORE_CAP; tooltip bez zmian.
- gra/tools/diplomacy-display-test.cjs — asercje pod „jedn.”, „Obywatele”, eksport RECRUITS_UNITS_TOOLTIP_PL.
- gra/tools/diplomacy-respect-true-value-real-render-test.cjs — oczekiwany tekst dopisku.
- dyspozycje/autobot/runs/R-WEB-DIPLO-LABELS-RECRUITS-UNITS-CITIZENS-WAR-NOTE-Q1/01-operator-r1.md (ten raport).
Poza zakresem: nie zmieniano WERSJE.md, gra-robocza/, main.ts, mechaniki, audiencji Rekrutów (surowy Manpower).

TESTY:
- node tools/diplomacy-display-test.cjs → 43 OK, 0 FAIL
- node tools/diplomacy-respect-true-value-real-render-test.cjs → 17 OK, 0 FAIL (render przez Chromium z testu; zrzut PNG cofnięto, bo nie należy do allowlisty)
- node tools/diplo-panel-recruits-level-test.cjs → 22 OK, 0 FAIL
- tsc --noEmit -p gra/tsconfig.json → bez błędów
- git diff --check → czysto
- Render karty listy w Chromium po zmianie: NIE_ZMIERZONO (test jednostkowy sprawdza tekst i atrybut title; wizualny zrzut nie wykonany)

BLOKADY:
- Tooltip „Rekruci” na karcie listy ma wzór, ale NIE podaje liczbowego przeliczenia Manpower ÷ koszt (dane liczbowe: main.ts, poza allowlistą). Do decyzji orkiestratora: dorobić liczby w main.ts (diploListRecruitUnitsForOwner) w osobnym temacie.
- Tooltip jest przypięty do całej linii statystyk (Moc / Ludność-Obywatele / Armia / Rekruci), nie tylko do wiersza Rekruci — ograniczenie pojedynczego atrybutu title w obecnej strukturze karty.
- W audiencji nie znaleziono etykiety „Ludność” (grep diplomacyAudience.ts: 0 trafień); zmieniono tylko kartę listy. Brak zmiany w audiencji dla „Obywatele”.
- Test RESPECT-DISPLAY (diplomacy-respect-true-value-real-render-test) przy uruchomieniu nadpisuje zrzut dowody/01-wojna-respekt-prawda-74-54.png — przywrócono z git, nie commitowano.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) → Final Control; decyzja o liczbowym tooltipie (main.ts) do orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
