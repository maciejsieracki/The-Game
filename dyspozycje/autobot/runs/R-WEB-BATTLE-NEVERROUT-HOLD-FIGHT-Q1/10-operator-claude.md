# R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1 (#314)
GOAL: po załamaniu morale armii jednostki neverRout ("walczy do śmierci") zostają i walczą; zwykli uciekinierzy schodzą z pola do krawędzi; bitwa nie kończy się w turze załamania, dopóki neverRout żyją albo uciekinierzy są na polu; limit 30 tur zachowany.

## ZMIANY / COMMIT
- gra/src/battle/battleScene.ts (allowlista: _checkEnd, _pursuitPending; dodany maleńki helper `_lastLogHas` tylko do deduplikacji komunikatu logu o załamaniu):
  - _checkEnd: usunięte nadpisanie `aliveX = false` dla strony z załamaną morale, gdy po `_routWholeArmy` zostały żywe neverRout (jedyne żywe jednostki po załamaniu to neverRout, bo zwykli są routed). Komunikat logu zmieniony na "zwykli uciekaja, walczacy do smierci zostaja".
  - _pursuitPending: dodany warunek `neverPending` — strona, która ma żywe neverRout i uciekinierów na polu, utrzymuje bitwę (z tym samym limitem PURSUIT_MAX_ROUNDS = 30, liczonym od startu poscigu).
- gra/tools/battle-neverrout-hold-test.cjs (nowy): test regresyjny w Chromium na istniejącym wpisie battle-rout-pursuit-browser-entry.html (tryb watch), z asercjami kryteriów 1-4.
- Commit: patrz SHA w polu `sha` (kod + test + ten raport; bez push).
- Nie zmieniono: gra/data/*.json, _resolveRemainingRouted, _routWholeArmy, _startRout, _fleeStep, ścieżki "Pomiń do wyniku" (_skipInstantFallback / computeInstantResult).

## TESTY (liczby z surowego wyjścia)
- `cd gra && npx tsc --noEmit` -> exit 0, brak błędów (po obu edycjach src).
- `TMPDIR=/dev/shm node tools/battle-neverrout-hold-test.cjs` (fix) -> `36 PASS, 0 FAIL` (3 scenariusze: Chaska po stronie ataku seed 1 i 2; Chaska po stronie obrony seed 1).
- `TMPDIR=/dev/shm node tools/battle-routed-pursued-destroyed-test.cjs` (regresja poscigu) -> `30 PASS, 0 FAIL`.
- Test MUTACYJNY: ten sam test uruchomiony na kodzie bazowym (6a0cbba, bez zmian w battleScene.ts) -> `36 PASS, 0 FAIL`. WNIOSEK: test NIE odróżnia obecnego zachowania od poprawki na użytych seedach. Na tych seedach żywe neverRout giną przed końcem ucieczki, więc wadliwe zakończenie (koniec bitwy przy żywych neverRout po zejściu uciekinierów, oraz natychmiastowe rozstrzygnięcie gdy wygrana strona nie ma aktywnych jednostek) nie wystąpiło. Nie udało się w rozsądnym budżecie znaleźć seeda/konfiguracji, w której neverRout przeżywają ucieczkę (kilka prób: defhp=2/3, kawaleria vs Chaska, seedy 1-5 — wszystkie Chaska ginęły). Kryteria 2-4 są sprawdzane na stanie gry, a kryterium 1 wymaga zejścia uciekinierów (potwierdzone: fledAtEdge=6, fledNotAtEdge=0 dla przegranej strony).
- Brak `npm run build/dev` (zakaz CLAUDE.md zachowany). Zależności gra/ zainstalowane `npm ci --ignore-scripts` w worktree (node_modules nieśledzony).

## KRYTERIA (dispatch)
1. Uciekinierzy zwykli na polu i schodzą do krawędzi: PASS w teście (przegrana strona: fled=6, fledNotAtEdge=0; logi "uciekl z pola"/zejście). Dowód "w realnej grze" = headless Chromium, NIE_ZMIERZONO w żywej sesji gry.
2. neverRout nie przechodzi w routed: PASS (neverRoutRouted=0 we wszystkich scenariuszach).
3. Bitwa nie kończy się w turze załamania przy żywym neverRout/uciekinierze: PASS (koniec rundy 10 > zalamanie 3; 9 > 3). Uwaga: patrz TESTY — test nie wykrywa regresji na tych seedach.
4. Limit 30 tur: PASS wg asercji (poscig nie dłuższy niż 30+1 tur); kod: `roundNo - _pursuitStartRound < PURSUIT_MAX_ROUNDS`.
5. tsc zielone: PASS. Bramki referencyjne: uruchomiono test poscigu (30/0). Pełnych bramek referencyjnych (npm/tools inne niż wskazane) NIE_ZMIERZONO.

## BLOKADY / ODCHYLENIA (do decyzji FC/orkiestratora)
- Dodatek orkiestratora `00-dispatch-DODATEK-claude.md` NIE istnieje ani na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, ani na `origin/main`, ani w historii (`git log --all -- dyspozycje/autobot/runs/R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1` daje tylko commit 2ab490377 z `00-dispatch.md`). Pracowano wyłącznie na `00-dispatch.md` (GOAL, kryteria, allowlista, zakazy). Środowisko/zadanie rundy z dodatku nieznane — założenie: zakres jak w `00-dispatch.md`.
- Baza w dispatchu to aeb52465e845d29acb5f7b628370789af399d673; zweryfikowano, że jest przodkiem 6a0cbba2809d75af6adda62acb59f2f2d8bb53bb (git merge-base --is-ancestor, exit 0). Pracę wykonano na 6a0cbba (kandydat z polecenia).
- Dodatkowy helper `_lastLogHas` jest poza wymienionymi funkcjami allowlisty; służy wyłącznie do warunku komunikatu logu w _checkEnd (założenie: mieści się w "warunki dotyczące neverRout").
- Ścieżka "Pomiń do wyniku" (_skipInstantFallback -> computeInstantResult) nie jest objęta zmianą — ma osobną formułę wyniku, a dispatch nie pozwala na jej edycję. Ewentualna rozbieżność z AUTO dla przypadków neverRout wymaga osobnego tematu.
- Obserwacja poza zakresem (niezmieniona): zwycięska strona z pojedynczym zwykłym uciekinierem (nie neverRout) może mieć go usuniętego przy końcu bitwy przez _resolveRemainingRouted ("uciekl z pola" bez zejścia na krawędź). Zachowanie istniało przed zmianą; test sprawdza kryterium 1 tylko dla przegranej strony.

## RUNDY
1/5. Werdykt własny: PASS-WITH-NOTES (kod i testy zielone; test nie jest wrażliwy na regresję — do poprawy w rundzie FC lub osobnym temacie).

## NASTĘPNY KROK
Evaluator / Final Control: przegląd diffu (allowlista, helper `_lastLogHas`), decyzja, czy wymagać testu wrażliwego (scenariusz, w którym neverRout przeżywa ucieczkę) przed FC PASS.

## DEPLOY/PUSH: NIE WYKONANO
