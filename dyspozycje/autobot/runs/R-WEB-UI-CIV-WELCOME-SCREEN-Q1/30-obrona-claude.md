# R-WEB-UI-CIV-WELCOME-SCREEN-Q1 — Obrona Operatora (Haiku 5.5), odpowiedź na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES (obrona; poprawka dla zarzutów 1, 2, 4 — zarzut 3 odrzucony, zarzut 5 częściowo odrzucony)
DOMAIN: GAME (UI ekranu powitalnego, bez zmian reguł)
TEMAT: R-WEB-UI-CIV-WELCOME-SCREEN-Q1
GOAL: zamknięcie zarzutów Evaluatora (d39568599) dowodem w kodzie lub odrzuceniem z cytatem.
BAZA: a3141e9434581d4f2678dd0ec018cefc8a37c723 (kandydat operatora r1), poprawka na tej gałęzi.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (kolejka okien). Poprawka: `gra/src/main.ts`, `tryOpenNextFirstContactCard()` — gdy w DOM jest `.civ-diplo-modal-overlay` (okna dyplomatyczne z-index 500, w tym pokój wymuszony), ekran powitalny się nie otwiera; jeśli są oczekujące karty, ponowienie po 400 ms (`window.setTimeout`). Wniosek z kodu: Esc nie trafia w ekran przykryty przez pokój wymuszony, bo ekran nie jest otwierany nad nim. NIE ZMIERZONO na żywo.
2. PRZYJMUJĘ (hideCivWelcomeScreen nieużywana). Poprawka: `hideCivWelcomeScreen()` dodane do `resetDiplomaticDiscoveryUiState()` (main.ts ~24035). Ta funkcja jest wołana przy resecie, nowej grze i wczytaniu zapisu (lokalizacje: linie 11652, 48872, 49236, 49486, 49721, 50777). Zamyka overlay i zatrzymuje muzykę bez callbacków. Nie dodano jej do `ensureDiplomacyUiClosed()`, bo ta funkcja jest wołana z `selectPlayerUnit` (main.ts 7442) i nie powinna zamykać ekranu przy zwykłym kliku.
3. ODRZUCAM (podpis władcy). Dispatch mówi: „podpis władcy = imię z wodzowie wg epoki cywilizacji”. Kod robi dokładnie to: `civWelcomeLeaderName(civKey, era)` (main.ts ~24096, `era = empireEpochForOwner`). Karta audiencji używa innej funkcji (`leaderNameForOwnerId`). Różnica jest w zgodnej z dispatchem regule, ale to decyzja do potwierdzenia przez właściciela (patrz UWAGI).
4. PRZYJMUJĘ CZĘŚCIOWO (brak testu DOM). Test DOM nie został dodany: `civWelcomeScreen.ts` importuje muzykę i brandAssets, których test w Node nie buduje bez loaderów. Dodano 6 asercji źródłowych w `gra/tools/civ-welcome-screen-test.cjs` (sekcja 7), które padają przy usunięciu: bramki „raz” (`firstContactWelcomeDue`), migracji (`legacyShownMigration`), zamknięcia w resecie (`hideCivWelcomeScreen`), pierwszeństwa okien (`.civ-diplo-modal-overlay`), podpięcia `onOpenCivInfo` oraz przycisku „O cywilizacji” w `diplomacyAudience.ts`. Przyciski Audiencja/Zamknij, Esc i klik w tło: NIE ZMIERZONO (brak testu DOM ani Chromium w tej rundzie). Mutacje na kopii main.ts nie były uruchamiane (test czyta src/main.ts bezpośrednio).
5. CZĘŚCIOWO ODRZUCAM (miejsce przycisku). Dispatch w ALLOWLIŚCIE: „gra/src/ui/diplomacyAudience.ts (TYLKO przycisk „O cywilizacji”)”, a w GOAL (3): „w panelu dyplomacji przycisk „O cywilizacji””. Przycisk siedzi na karcie rozmówcy w `otherCardHtml` (diplomacyAudience.ts ~1590), czyli w oknie audiencji dyplomacji. Lista/panel dyplomacji nie był w allowliście. Zrzuty z Chromium: NIE ZMIERZONO (w tej rundzie nie uruchomiono przeglądarki; to zostaje otwarte).

## ZMIANY-COMMIT
- gra/src/main.ts: +9/−1 (import `hideCivWelcomeScreen`; reset zamyka ekran; kolejka sprawdza `.civ-diplo-modal-overlay` i ponawia po 400 ms)
- gra/tools/civ-welcome-screen-test.cjs: +19 (sekcja 7, asercje źródłowe; razem 309 asercji)
- raport: dyspozycje/autobot/runs/R-WEB-UI-CIV-WELCOME-SCREEN-Q1/30-obrona-claude.md
- Commit: patrz SHA w odpowiedzi (kolejny commit po a3141e943).

## TESTY (surowe wyniki, ta runda)
- npm ci --ignore-scripts w gra/: added 71 packages (exit 0)
- tsc --noEmit (gra/tsconfig.json): exit 0
- logic-test.cjs: LOGIC OK (213/213)
- tech-tree-test.cjs: 20 pass, 0 fail
- research-test.cjs: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test.cjs: COMBAT TEST: 6/6 pass
- civ-welcome-screen-test.cjs: OK (309 asercji)
- vite build poza repo (outDir: scratchpad/cwsb-build): built in 17.55s, exit 0
- git diff --check: czysty; git status: tylko gra/src/main.ts i gra/tools/civ-welcome-screen-test.cjs (+ raport)

## BLOKADY
- Brak testów DOM i żywego Chromium (zrzuty 2 cywilizacji, Esc, klik w tło, koniec tury przy otwartym ekranie): NIE ZMIERZONO.
- Pokój wymuszony otwarty w trakcie już pokazanego ekranu: kolejka tego nie wykrywa (ekran jest nad oknem, z-index 9650 > 500). Obsługiwane tylko przy otwarciu. Poprawka wymaga zmiany showForcedPeaceModal, którego dispatch zabrania.

## RUNDY
1/5 obrony (poprawka po zarzutach Evaluatora r1).

## NASTĘPNY KROK
Evaluator r2 na commicie obrony; FC po PASS.

## UWAGI-DLA-ORKIESTRATORA
- Pytania ABC do właściciela (Operator nie może ich zadać bezpośrednio): (a) podpis władcy: wódz wg epoki cywilizacji (dispatch, kod) czy imię z karty audiencji (leaderNameForOwnerId) — spójność dla gracza; (b) potwierdzenie, że przycisk „O cywilizacji” ma być na karcie w audiencji (obecny stan) — czy także w liście dyplomacji; (c) pokój wymuszony w trakcie wyświetlania ekranu powitalnego — akceptacja obecnego ograniczenia.
- Plik tymczasowy /tmp/cwsb-main-mut1.ts i logi /tmp/cwsb-*.log oraz /home/user/tmp/npmci-cwsb.log do sprzątnięcia przez orkiestratora (nie usuwałem: brak uprawnienia rm w zakazach).
- node_modules w gra/ (71 pakietów) do sprzątnięcia po integracji.

DEPLOY/PUSH: NIE WYKONANO
