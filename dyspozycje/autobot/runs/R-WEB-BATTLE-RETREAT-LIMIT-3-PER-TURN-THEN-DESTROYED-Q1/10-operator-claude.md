# R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (Operator). Kod i testy jednostkowe gotowe; punkt (4) z dispatchu (realna weryfikacja w Chromium nowej ścieżki unicestwienia i komunikatu) NIE ZMIERZONO — wg dispatchu brak tego = FAIL przy Final Control. Do domknięcia przed FC PASS.
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1
GOAL: armia może wykonać do TRZECH odwrotów w jednej turze (wycofanie przed bitwą albo odwrót ocalałych przegranej o 2 heksy); po wyczerpaniu kolejna przegrana bitwa w tej turze = unicestwienie armii; licznik zeruje się na początku następnej tury; dotyczy gracza i AI.
BAZA: 50f607fe3 (origin/main, „Rejestr: FALA 731”). Worktree odłączony od tego SHA.

## ZMIANY (allowlista)

| Plik | Zmiana |
|---|---|
| `gra/data/combat-params.json` | nowa sekcja `odwrot.max_na_ture = 3` (jedno miejsce prawdy) |
| `gra/src/game/battle-retreat-limit.ts` (NOWY) | helper: `MAX_ODWROTOW_NA_TURE` (z danych), `retreatCountOfUnit` (migracja boolean→1/0), `retreatCountOfRoster` (maksimum po rosterze), `retreatBudgetExhausted`, `recordRetreatOnRoster` (+1 na całym rosterze), `resetRetreatCountOfUnit` |
| `gra/src/units/setup.ts` | pole `odwrotyWTurze?: number` w RuntimeUnit; stare `retreatedThisTurn` zostaje jako legacy (czytane przez migrację) |
| `gra/src/game/post-battle-map.ts` | `PostBattleMapInput.defRetreatBudgetExhausted`; w gałęzi „atakujący wygrywa" w polu: gdy budżet wyczerpany → ocaleli obrony usunięci (unicestwienie), flaga `defenderAnnihilatedByRetreatLimit` w wyniku; w pozostałych przypadkach odwrót ocalałych liczony przez `recordRetreatOnRoster` (pomijany dla garnizonu) |
| `gra/src/main.ts` | `retreatExhaustedThisTurn = retreatBudgetExhausted(defRosterRef)`; po „Wycofaj" `recordRetreatOnRoster(defRosterRef)`; przekazanie `defRetreatBudgetExhausted: !cityOnHex && !allDefendersFortifiedInGarnizon(defRoster) && retreatBudgetExhausted(defRoster)`; komunikat `ARMIA_UNICESTWIONA_KOMUNIKAT` przy unicestwieniu; reset EOT przez `resetRetreatCountOfUnit` |
| `gra/src/ui/preBattle.ts` | tekst wyszarzonego „Wycofaj" po wyczerpaniu: „wyczerpano trzy odwroty w tej turze, rozstrzygnij bitwę (przegrana = unicestwienie armii)" |
| `gra/tools/battle-retreat-limit-test.cjs` (NOWY) | 29 asercji: helper, migracja, applyPostBattleMap (2a–2f), pin main.ts |
| `gra/tools/pre-battle-retreat-exhausted-test.cjs` | zaktualizowany z reguły „1 odwrót" na regułę licznika (3 odwroty, reset); piny na nowe formuły |

COMMIT: SHA w polu `sha` (StructuredOutput) i w `git log -1` na gałęzi roboczej (commit kodu + raportu).

## DECYZJE / ZAŁOŻENIA (rozstrzygnięte kodem, bez DECISION_REQUIRED)

1. Licznik wspólny na rosterze bitwy (armia), liczy się zarówno wycofanie przed bitwą, jak i odwrót ocalałych (dispatch: „przyjmij wspólny licznik").
2. Licznik zapisywany na każdej jednostce rosteru; odczyt = maksimum po rosterze.
3. Stare zapisy: pole `retreatedThisTurn === true` czytane jako 1 odwrót (migracja boolean→1/0 bez zmiany ładowania zapisu).
4. Miasto (`cityOnHex`): unicestwienie NIE dotyczy walk o miasto — przegrani giną jak dotąd (zgodnie z istniejącą decyzją z 2026-11-11 o odwrocie tylko w polu).
5. Garnizon (`allDefendersFortifiedInGarnizon`): odwrót nie jest liczony i nie wywołuje unicestwienia; mechanika garnizonu bez zmian.
6. AI: ścieżka po bitwie jest niezależna od właściciela, więc parytet jest zachowany; AI nie ma przycisku „Wycofaj" przed bitwą (bez zmian).
7. Remis (`retreatDefendersOnTie`): **NIE ZMIENIANO** — odwrót obrońców przy remisie nie jest liczony do licznika i nie unicestwia. To luka względem dosłownego „wszystkie ścieżki bitwy" z dispatchu; do rozstrzygnięcia przez FC/orkiestratora (propozycja: traktować jak odwrót, bez unicestwienia).
8. Komunikat unicestwienia: `showHintMessage` (6 s). Wpis w panelu podsumowania bitwy / dzienniku wydarzeń: **NIE ZMIERZONO**.

## TESTY (liczby z surowego wyjścia)

- `npx tsc --noEmit` (w `gra/`): 0 błędów (brak wyjścia, kod 0).
- `node tools/logic-test.cjs`: exit 0, ostatnia linia `PASS [213]` (213/213).
- `node tools/tech-tree-test.cjs`: `20 pass, 0 fail`.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs`: exit 0 (kod wyjścia; linie [OK]).
- `node tools/combat-test.cjs`: exit 0, `All sanity checks passed.`
- `node tools/unit-power-test.cjs`: `6 pass, 0 fail`.
- `node tools/battle-defeat-survivor-retreat-two-hex-test.cjs`: `44 pass, 0 fail`.
- `node tools/retreat-garnizon-fortyfikacja-test.cjs`: `27 pass, 0 fail`.
- `node tools/pre-battle-retreat-exhausted-test.cjs`: `37 pass, 0 fail` (po aktualizacji do reguły licznika).
- `node tools/battle-retreat-limit-test.cjs` (NOWY): `29 pass, 0 fail`.
- `node tools/pre-battle-defender-retreat-test.cjs`: exit 0 (brak linii podsumowania w wyjściu — wynik wyłącznie po kodzie wyjścia).
- `node tools/mgla-sciezka-inwariant-test.cjs`: `41 pass, 1 fail`. Trafienie dotyczy `src/game/ai.ts` (l. 3741 i dalej), czyli plików, których ten temat nie dotyka; zgodnie z notatką w rejestrze (`41/1`, ECHO właściciela) to stan wcześniejszy. NIE ZWERYFIKOWANO na bazie 50f607fe3 osobnym uruchomieniem.
- `git diff --check`: czysto.
- **Dowód mutacyjny** (nowy test): wyłączenie unicestwienia w `post-battle-map.ts` (`input.defRetreatBudgetExhausted === true` → `false && ...`) → `battle-retreat-limit-test` daje 4 FAIL (2c ×2, 2c, 2d); plik przywrócony z kopii, `cmp` potwierdził.
- Test nowy na bazie 50f607fe3: NIE URUCHAMIANO na bazie osobno; z konstrukcji (brak modułu `battle-retreat-limit`) jest czerwony.
- **Chromium (realna przeglądarka, Playwright + vite)**: `node tools/battle-defeat-survivor-retreat-browser-test.cjs` → `BROWSER PASS` (cztery przypadki pole/oblężenie/instant/cap; ocaleli przegranych stoją 2 heksy od bitwy, polegli nie wracają). To potwierdza brak regresji ścieżki odwrotu ocalałych przy niewyczerpanym budżecie. NIE jest to dowód nowej funkcji.

## BLOKADY

- **Punkt (4) dispatchu — NIE ZMIERZONO**: nie wykonano w Chromium sceny z trzema odwrotami w turze, czwartym (ostatecznym) odwrotem zablokowanym (przycisk wyszarzony z powodem) i komunikatem unicestwienia; brak zrzutów. Powód: do tej sceny potrzebny jest pełny start gry i sterowanie bitwą; nie zbudowałem harnessu w tej rundzie. Wg dispatchu bez tego = FAIL przy FC.
- **Punkt (5) dispatchu — NIE ZMIERZONO**: brak wpisu Civpedia/poradnik i wzmianki w `wikiBundle` (allowlista to dopuszcza; nie wykonano).
- **Luka remisu** (decyzja 7 powyżej) — wymaga rozstrzygnięcia.
- **Wpis w podsumowaniu bitwy** (decyzja 8) — tylko hint; panel podsumowania nietknięty.
- Brak wpisu `dyspozycje/REJESTR-PROSB-I-ZADAN.md` i `WERSJE.md` — zgodnie z zakazem (WERSJE.md przed deployem zakazane; rejestr to zadanie orkiestratora).

## OBSERWACJE / UWAGI-DLA-ORKIESTRATORA

- `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` w worktree (71 pakietów). Do sprzątania po FC; w repo nie commitowane (gitignore).
- Wykryte poza zakresem (NIE RUSZANE): `mgla-sciezka-inwariant` 41/1 w `ai.ts` (znane z rejestru).
- Test `pre-battle-retreat-exhausted-test.cjs` miał w części C mirror reguły „1 odwrót"; zamieniony na mirror licznika — pełne pokrycie prawdziwego helpera jest w `battle-retreat-limit-test.cjs`.

## NASTĘPNY KROK

1. Zamknąć punkt (4) w Chromium (scena: 3 odwroty → 4. przegrana → komunikat + wyszarzony przycisk, zrzuty) — ew. jako osobna runda Operatora.
2. Rozstrzygnąć remis (decyzja 7) — ABC lub założenie orkiestratora.
3. Evaluator (SONNET) i Final Control (SONNET) na tej gałęzi; potem integracja orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
