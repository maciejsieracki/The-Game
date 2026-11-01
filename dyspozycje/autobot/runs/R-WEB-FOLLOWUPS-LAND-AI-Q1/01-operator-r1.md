STATUS: DECISION_REQUIRED (3b); (1), (2), (3a) = PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FOLLOWUPS-LAND-AI-Q1
GOAL: Trzy dopalenia: (1) podsumowanie lądu dla Ziemi, (2) fallbacki `?? 30` przy wczytaniu starych zapisów, (3) AI: bonusowe miasto bez biegunów + `hexCityScore` po id terenu.

ZMIANY/COMMIT: SHA w komunikacie końcowym orkiestratora (commit na gałęzi worktree, bez push). Pliki:
- `gra/src/ui/newGameFlow.ts` (~:2222): dla `p.typSwiata === 'ziemia'` wiersz „Ląd / morze” = „szablon kontynentów (bez suwaka)”; pozostałe typy bez zmian.
- `gra/src/main.ts`: import `defaultLandFractionPercentForTyp`; `:40553` `?? defaultLandFractionPercentForTyp(typ)` (typ z meta, domyślnie Kontynenty); regeneracja po wczytaniu `?? defaultLandFractionPercentForTyp(_menuTypSwiata)`. Ścieżka normalnych zapisów (meta.newGameParams) nietknięta. Nieruszone, poza dispatchem: `main.ts:33477` i `:40747` (też `?? 30`) — NIE_ZMIENIONE.
- `gra/src/game/ai-difficulty-bonus.ts` `pickBonusCityHex` (to jest właściwe miejsce funkcji, nie ai.ts/cities.ts — drobne poszerzenie allowlisty, tylko ta funkcja): heks Polarny tylko jako ostatni fallback, gdy w promieniu terytorium nie ma legalnego heksu niepolarnego (ta sama reguła co osadnicy AI). Bez polarnych: zachowanie identyczne.
- NOWY `gra/tools/followups-land-ai-test.cjs` (9 asercji).

(3b) `hexCityScore` — NIE WDROŻONE.
Realny błąd potwierdzony: `ai.ts:1230` `find(t => t.Teren === hex.terenBazowy)`; id terenu to `laka/rownina/...`, w `data/terrain-yields.json` nazwy to `Łąka/Równina/...` -> dopasowanie nigdy nie zachodzi, food/work/trade = 0 dla każdego terenu (punkty tylko z rzeki/złóż).
Pomiar PRZED/PO (zastępczy: `ai-avoid-polar-sim-test` z normalizacją nazw = efekt poprawki; 15 przebiegów = 3 typy x 5 ziaren: 4242, 7777, 1001, 2024, 31337; TURNS=15 iteracji `planCityFounding`, NIE „tura 100”):

| wariant | miasta założone przez planCityFounding | miasta AI łącznie (start 735) |
|---|---|---|
| PRZED (realne dane) | 0 | 735 |
| PO (id terenu) | 3087 | 3822 |

Zmiana tempa ekspansji daleko > 2% (z ~0 do kilku tysięcy; heks dostaje 3-4 pkt i przekracza `ekspansja_min_score_hex`=3). Zgodnie z dispatchem: NIE wdrażam, DECYZJA_WYMAGANA (czy świadomie przywrócić „zamierzone” punkty — odblokuje to ekspansję AI na heksach bez bonusu klastra — i z jakim strojeniem progu/parametrów). Pomiar „tura 100” przez decideAITurn: NIE_ZMIERZONO (brak harnessu).

TESTY (logi `gate-*.txt` w katalogu runu, każdy z linią `EXIT=`):
- tsc `--noEmit`: EXIT=0.
- followups-land-ai-test: 9/9, EXIT=0.
- ai-avoid-polar-pick 16/16, plan (onPolar=0), player-parity PASS, sim RESULT onPolar=0: wszystkie EXIT=0. ai-improvements-test 56/56 EXIT=0. capital-sep-unit 36/36 EXIT=0.
- capital-sep-pangea-test i cluster-spread-test: EXIT=124 (TIMEOUT 200/150 s, ciężkie generowanie map; zmiany nie dotykają clusters/generatora) — NIE_ZMIERZONO, do powtórki z dłuższym limitem przez Evaluatora.
- newgame-defaults-test: NIE_URUCHOMIONO (wymaga serwera dev/build — zakazane w `gra/`); L1 pokryte kontrolą źródła.
- Porównanie PRZED vs PO tych samych testów: ścieżki zmienione dotyczą tylko pickBonusCityHex; testy polar/ai nie zmieniły wyników względem oczekiwań.

BLOKADY: brak techniczny; 3b czeka na decyzję właściciela (orkiestrator).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (powtórka capital-sep-pangea i cluster-spread z dłuższym timeoutem; ocena 3b jako DECYZJA_WYMAGANA).
DEPLOY/PUSH: NIE WYKONANO
