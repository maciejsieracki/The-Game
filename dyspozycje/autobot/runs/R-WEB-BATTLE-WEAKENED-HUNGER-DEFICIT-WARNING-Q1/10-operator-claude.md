# R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod gotowy, bramki zielone; NIE_ZMIERZONO: zrzut Chromium, patrz BLOKADY)
DOMAIN: GAME (tylko wyświetlanie)
TEMAT: R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1
GOAL: okno przed bitwą (preBattle) pokazuje dla każdej strony z karą głodu wojska / deficytu Złota krótkie ostrzeżenie „Osłabieni: głód wojska −25% (poza pancerzem)” (procent z econ-params, nie wpisany na sztywno); brak ostrzeżenia bez kary; barbarzyńcy nigdy.
BAZA: b933923a5 (worktree detached na b933923a5)

## ZMIANY-COMMIT
- NOWY `gra/src/game/battle-weakened-note.ts`: czysta funkcja `buildWeakenedNote`, `weakenedNoteText`, `weakenedPercent`. Procent liczony z mnożnika silnika.
- `gra/src/ui/preBattle.ts`: pole `PreBattleSide.oslabienie`; blok `.pb-weak` („▼ Osłabieni: …”) w `commanderHtml` pod liczbą oddziałów; styl `.pb-weak` (kolor `--pb-gold`).
- `gra/src/main.ts`: `preBattleWeakenedForRoster(roster)`. Flagi jak w `runtimeToBattleUnit` (isArmyHungry / isGoldDeficit && !cywil); mnożniki z `buildEmpireFoodParams(...).glodWojskaStatMult` i `buildGoldDeficitParams(...).zlotoDeficytStatMult`. Podpięte w `preBattleSideFromRoster` i w `mapFieldBattleDeps.oslabienieForRoster`.
- `gra/src/battle/mapFieldBattle.ts`: dep `oslabienieForRoster` (dodany też do listy `Pick` w `planOpenCityFieldBattle`); obie strony w `preBattle` dostają `oslabienie`.
- NOWY `gra/tools/prebattle-weakened-warning-test.cjs`: 16 asercji (a–g).
- NIETKNIĘTE (zgodnie z ZAKAZ): combat.ts, empire-food.ts, gold-deficit.ts (logika), gra/data/*, units.json, combat-params.json, kolejność uderzeń, tryb Trafienia, szarża, wikiBundle.

Punkt 5 dispatchu: w oknie preBattle w main.ts nie ma żadnego tekstu o głodzie/deficycie (grep `głod|glod|deficyt` w zakresie preBattle: zero trafień), więc ostrzeżenie nie dubluje istniejącej informacji.

## TESTY
- `npx tsc --noEmit` (gra/): exit 0, 0 błędów. Pierwszy przebieg dał 2 błędy TS2339 (brak dep w Pick-liście), naprawione.
- Bramki referencyjne (`node tools/<t>.cjs`, exit 0 we wszystkich):
  - logic-test: `LOGIC OK (213/213)`
  - tech-tree-test: `20 pass, 0 fail`
  - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`
  - combat-test: `COMBAT TEST: 6/6 pass`
  - unit-power-test: `=== unit-power-test: 6 pass, 0 fail ===`
- Nowy test `prebattle-weakened-warning-test.cjs`: `== WYNIK: 16 OK, 0 FAIL ==`, exit 0 (gałąź).
- Nowy test NA BAZIE (bez modułu `battle-weakened-note.ts`): exit 1 (czerwony, bundle nie znajduje modułu).
- Dowód mutacyjny (na kopii pliku, potem przywrócony i ponownie zielony):
  - mutacja A: `const deficit = false;` (usunięty warunek deficytu): exit 1, 3 × [FAIL];
  - mutacja B: `if (input.barbarian) return undefined;` wyłączone: exit 1, 2 × [FAIL].
- `git diff --check`: exit 0.

## BLOKADY
- NIE_ZMIERZONO: realna weryfikacja w Chromium (zrzut okna przed bitwą z karą i bez). Przyczyna: brak zainstalowanej przeglądarki Playwright (`~/.cache/ms-playwright` puste), a doprowadzenie gry do okna preBattle przy aktywnym głodzie wymaga osobnego scenariusza.
- NIE_ZMIERZONO: wygląd bloku `.pb-weak` w oknie (układ, brak rozpychania okna z max-wysokością). Tylko z zrzutu.
- Punkt 6 dispatchu (Civpedia): brak właściwego hasła o karze głodu/deficytu w walce w `docs/encyklopedia/` (technologie/wojskowosc.md opisuje tech, pojecia/zmeczenie-wojna.md dyplomację). Nie dodawano zdania i nie regenerowano wikiBundle. Decyzja dla orkiestratora: czy założyć osobne hasło.
- Wiersze kart jednostek w oknie (`preBattleUnitFromRuntime`) nadal pokazują nominalne staty; zakres = tylko ostrzeżenie, nie zmieniano.

## RUNDY
1/5. Ostatni werdykt: brak (pierwsza runda).

## NASTĘPNY KROK
Evaluator (SONNET): przegląd diffu (4 pliki + 1 nowy moduł + test); sprawdzenie, czy `oslabienie` jest ustawiane tylko gdy kara faktycznie działa (flagi i `!isCivilianUnit`); zrzut w Chromium z karą i bez (okno przed bitwą). Final Control po PASS.

## DEPLOY/PUSH: NIE WYKONANO
