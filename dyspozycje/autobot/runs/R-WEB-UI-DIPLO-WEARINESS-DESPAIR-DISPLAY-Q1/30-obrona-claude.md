# R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora 8a6ecb63a)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1
GOAL: w panelu dyplomacji pokazać zmęczenie wojną (strona wygrywająca) i desperację (strona przegrywająca) — wojny gracz↔AI oraz AI↔AI (jedna wartość dla rozmówcy), z procentem i tooltipem.
BAZA/KANDYDAT: 152bf6f97c3f8fd49a3f49285eff4f56ece2d5f0 (start obrony, `git checkout --detach 152bf6f97`).
SHA KOŃCOWY OBRONY: patrz commit tej rundy (pole `sha` w StructuredOutput).

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — brak wpięcia danych w main.ts (GOAL niespełniony w grze)
PRZYJMUJĘ merytorycznie. Dowód: `grep -n warWearinessPairView gra/src/main.ts` → brak trafień; `buildAudienceOtherRelations` (main.ts:8489) i budowa stanu audiencji (main.ts:25838) nie podają `warWeariness`.
NIE WYKONANO w tej rundzie: `gra/src/main.ts` jest POZA ALLOWLISTĄ tematu (00-dispatch.md, linia „ALLOWLISTA”: war-weariness-view.ts, diplomacy-display.ts, diplomacyAudience.ts, test, runs/<ID>/**). Dopisanie main.ts bez decyzji byłoby naruszeniem allowlisty (FAIL wg R-PROC-AUTOBOT §9).
DECYZJA ORKIESTRATORA WYMAGANA: rozszerzyć allowlistę o `gra/src/main.ts` (wąsko: `buildAudienceOtherRelations` i miejsce budowy stanu audiencji) albo wydzielić osobny temat R-WEB-DIPLO-WEARINESS-WIRING-Q1.
Szkic wpięcia (dla wykonawcy po decyzji):
- `buildAudienceOtherRelations(otherOwnerId)`: dla każdej wojny w `base.wars` → `warWearinessPairView({ turnsAtWar, turnsSinceCityChange, a, b, peak })`; `turnsAtWar`/`lostCities`/`turnsSinceCityChange` z `diploWarStateFor` (main.ts:11634), `sila`/`armiaPkt` z `diploMilitarySideOf` (main.ts:11690) — ta sama konstrukcja co `tickAiAiWarWeariness` (main.ts:36644); `peak` = `warWearinessByPairKey.get(diploPairKey(a, b))?.peak`; stronę `otherOwnerId` wybiera się z `rola/zmeczenie/desperacja`.
- Stan audiencji przy `atWar`: `warWeariness = { player: <widok ME()>, other: <widok ownerId> }` z tym samym wywołaniem.

### Zarzut 2 — brak zrzutu żywego Chromium (kryterium c)
PRZYJMUJĘ jako wymóg. NIE_ZMIERZONO: bez wpięcia z zarzutu 1 panel nie ma danych, więc zrzut pokazałby tylko brak wierszy i nie został wykonany. Zrzut (wojna gracz↔AI i AI↔AI) należy zrobić po wpięciu.

### Zarzut 3 — brak testu wiązania main.ts z panelem
PRZYJMUJĘ. Test wiązania (grep `warWearinessPairView(` i `peak` w main.ts) dziś byłby czerwony, bo wpięcia nie ma. Dodać razem z wpięciem (po decyzji z zarzutu 1). Nie dodaję testu czerwonego na tym kandydacie.

### Zarzut 4 — zmęczenie = bieżący poziom, a tick używa szczytu
PRZYJMUJĘ, poprawka w tym commicie.
Dowód z kodu (war-weariness.ts, `runWarWearinessTick`): `const st = stepPairState(...)` (ok. linii 233), `const lvl = st.peak;` (linia 234), `loserDespair({ level: lvl, ... })` (linia 260). Decyzje o pokoju i desperacja AI używają więc `peak`, nie bieżącego `warWearinessLevel`.
Zmiana: `war-weariness-view.ts` przyjmuje opcjonalne `peak` (szczyt z `warWearinessByPairKey`). Gdy podany, `level = peak` (zmęczenie i desperacja z tej samej wartości co tick). Gdy brak, zachowanie bez zmian (bieżący `warWearinessLevel`), więc asercje A1–A4 nie zmieniają się.
Test: `gra/tools/diplo-weariness-display-test.cjs`, nowa sekcja [A5]: z `peak` zmęczenie = peak; desperacja = `loserDespair` z peak; bez `peak` — stare zachowanie. Dla [A5] dodano eksport `wearinessMilitaryShare` we wpisie esbuild.

## ZMIANY / COMMIT
- `gra/src/game/war-weariness-view.ts` — pole `peak?: number` w `WarWearinessPairInput`; `level = peak ?? current`.
- `gra/tools/diplo-weariness-display-test.cjs` — sekcja [A5] (3 asercje) + eksport `wearinessMilitaryShare`.
- `dyspozycje/autobot/runs/R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1/30-obrona-claude.md` — ten raport.
Allowlista: tylko pliki z listy i katalog runs/<ID>/. `git diff --check`: czysto. `main.ts`, `war-weariness.ts`, `war-weariness-params.json` nietknięte.

## TESTY (surowe wyniki, katalog `gra/`)
- `npm ci --ignore-scripts`: exit 0.
- `./node_modules/.bin/tsc --noEmit`: exit 0, 0 linii `error TS`.
- `node tools/diplo-weariness-display-test.cjs`: `PASSED: 26 / FAILED: 0 / TOTAL: 26`, `ALL PASSED` (było 23; +3 z [A5]).
- `logic-test.cjs`: `LOGIC OK (213/213)`.
- `tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`.
- `unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `combat-test.cjs`: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- Mutacja dla [A5]: NIE_ZMIERZONO (asercje [A5] sprawdzają wartość peak wprost).
- Zrzut Chromium: NIE_ZMIERZONO (zarzut 2).

## BLOKADY
1. Wpięcie danych w `gra/src/main.ts` poza allowlistą — wymaga decyzji orkiestratora (zarzut 1).
2. Zrzut Chromium i test wiązania — zależne od (1).

## ZAŁOŻENIA
- Zmęczenie w panelu = szczyt pary (`peak`), zgodnie z tickiem AI. To zmiana względem rundy 1 (bieżący poziom); uzasadnienie: zarzut 4 i kod linii 234/260.
- Remis (próg parytetu z `compareMilitaryStrength`) — bez zmian względem rundy 1.

## UWAGI-DLA-ORKIESTRATORA
- Wiadomość użytkownika w tej rundzie („skarbiec i spichlerz nigdy poniżej zera po turze; pierwsze 10 tur wyjęte”) NIE jest częścią tego tematu i nie była wykonywana. Odpowiada wpisowi #365 w rejestrze — orkiestrator decyduje o osobnym temacie.
- Przy integracji: sprawdzić `git merge-base --is-ancestor 152bf6f97 <SHA integracji>` oraz zgodność z #363 (`war-weariness.ts` — ten sam plik zmienia W-363).

RUNDY: 2/5 (Operator, obrona)
NASTĘPNY KROK: decyzja orkiestratora o allowlistcie main.ts (zarzut 1); po decyzji: wpięcie + test wiązania + zrzut Chromium (wojna gracz↔AI i AI↔AI), potem ponowny Evaluator.
DEPLOY/PUSH: NIE WYKONANO
