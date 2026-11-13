# R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1 — raport Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1
GOAL: w panelu dyplomacji pokazać zmęczenie wojną (strona wygrywająca) i desperację (strona przegrywająca) — wojny gracz↔AI oraz AI↔AI (jedna wartość dla rozmówcy w tej wojnie), z procentem i tooltipem.
BAZA: b29ee096f (kandydat r2), wcześniej scalony origin/main e6776801b (merge 4ccdd9960, bez konfliktów).

## ZMIANY / COMMIT

Allowlista rundy 2 (dispatch, DODATEK): `gra/src/main.ts` (tylko wpięcie panelu, ~33 linie), test, selektor, panel, runs/<ID>/.

- `gra/src/main.ts`:
  - import `warWearinessPairView` z `game/war-weariness-view` (obok importu war-weariness);
  - NOWY helper `diploWarWearinessPairView(a, b)` (po `diploMilitarySideOf`): wejścia identyczne z tickiem AI↔AI (`diploWarStateFor` → turnsAtWar/lostCities/turnsSinceCityChange; `diploMilitarySideOf` → sila/armiaPkt). Szczyt `peak` z `warWearinessByPairKey.get(diploPairKey(a,b))` tylko gdy `warStart` zgadza się z bieżącą wojną (`turn - turnsAtWar`), jak w `stepPairState`; brak stanu → bieżący poziom (wariant dla pary gracz↔AI);
  - `buildAudienceOtherRelations`: wojny AI↔AI (`w.ownerId !== 0`) dostają `warWeariness` = strona `otherOwnerId`;
  - stan audiencji (`openDiplomacyAudience`, obok `otherRelations`): `warWeariness = { player, other }` tylko gdy `getDiploRelation(ME(), ownerId).status === 'wojna'`.
  - ZERO zmian logiki gry: `war-weariness.ts`, `war-weariness-params.json`, `diplomacy-military-strength.ts` nietknięte.
- `gra/tools/diplo-weariness-display-test.cjs`: NOWA CZĘŚĆ D (5 asercji, D1–D5) — statyczne wiązanie: import, wywołanie selektora w helperze, odczyt `peak` z `warWearinessByPairKey`, wiring w wars AI↔AI, wiring w stanie audiencji.
- Poprzednie zmiany rundy 1/obrony (selektor `war-weariness-view.ts` z `peak`, `diplomacy-display.ts`, `diplomacyAudience.ts`) — bez zmian w tej rundzie.

Commit: patrz pole `sha` w wyniku StructuredOutput (czubek tej rundy).

## TESTY (surowe wyniki, katalog `gra/`)

- `npm ci --ignore-scripts`: exit 0 (sam log zawiera rekomendację audytu npm; nie uruchamiano `audit fix`).
- `./node_modules/.bin/tsc --noEmit`: `TSC_EXIT=0`, 0 linii `error TS` (dwukrotnie: przed i po przywróceniu wiązania).
- `node tools/diplo-weariness-display-test.cjs`: `PASSED: 31 / FAILED: 0 / TOTAL: 31`, `ALL PASSED`, exit 0 (23 z rundy 1 + 3 z [A5] + 5 z [D]).
- MUTACJA 1 (usunięte wiązanie audiencji gracz↔AI: `warWeariness: undefined`): `MUT1_EXIT=1`, FAIL `[D5]` — test czerwieni. Wiązanie przywrócone.
- MUTACJA 2 (usunięte wiązanie wojen AI↔AI w `buildAudienceOtherRelations`): `MUT2_EXIT=1`, FAIL `[D4]` — test czerwieni. Wiązanie przywrócone.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/diplomacy-relacje-ai-ai-audiencja-test.cjs` (sąsiedni test audiencji): `PASSED: 20 / FAILED: 0 / TOTAL: 20`, `ALL GREEN`.
- `git diff --check`: czysto.
- Zrzut żywego Chromium (panel z wojną gracz↔AI i AI↔AI): NIE_ZMIERZONO. Powód: w worktree nie ma zbudowanego bundla (`gra/dist` nieobecne), a dispatch zakazuje `npm run build/dev`; nie uruchamiano też skryptów live z `gra/tools` (wymagają builda z vite). Zrzut należy wykonać po wdrożeniu/buildzie z orkiestratora.

## BLOKADY

1. Zrzut Chromium (kryterium c dispatchu) — NIE_ZMIERZONO, patrz wyżej. Wszystkie wartości potwierdzone testami statycznymi i selektorem, nie wizualnie.
2. Test wiązania jest statyczny (grep po źródle main.ts), bo helper żyje w domknięciu `main.ts` i nie da się go zaimportować w Node bez całej gry. Mutacje potwierdzają, że test reaguje na usunięcie wiązania.

## ZAŁOŻENIA

- Zmęczenie = `peak` pary, gdy stan dotyczy bieżącej wojny (zgodnie z uwagą obrony r2 i tickiem); w przeciwnym razie bieżący `warWearinessLevel`.
- Wiersze AI↔AI w „W stanie wojny z” pokazują wartość strony rozmówcy (`otherOwnerId`), nie gracza. Wiersze wojen z graczem (`ownerId === 0`) w tej liście NIE dostają procentu — wojna gracz↔rozmówca jest pokazana w górnej części audiencji (`warWeariness.player/other`).
- Remis siły (próg parytetu) — bez zmian względem rundy 1 (obie strony zmęczenie).

## UWAGI-DLA-ORKIESTRATORA

- Wiadomość użytkownika o oknie „Umowa wymiany surowców” (pozycje dodawane bez przeładowania, obie strony w jednym rzucie) NIE jest częścią tego tematu; odpowiada wpisowi #366 w rejestrze (R-WEB-UI-TRADE-DIALOG-NO-RERENDER-BOTH-SIDES-Q1). Nie wykonywano.
- Wiadomość użytkownika o skarbcu i spichlerzu (#365) również poza tematem.
- Zmiana `war-weariness.ts` (#363) pracuje na tym samym pliku co selektor — przy integracji sprawdzić, czy `warWearinessLevel`/`peak` nadal mają sygnatury używane przez `war-weariness-view.ts`.
- Dowód ancestry: przy integracji `git merge-base --is-ancestor <SHA tej rundy> <SHA integracji>`.

## TESTY-POZA-ZAKRESEM / SPRZĄTANIE

- Pliki pomocnicze testu (`tools/.dip-weariness-*`, `.stubs`) są kasowane przez test po przebiegu; `git status` przed commitem: tylko `gra/src/main.ts` i `gra/tools/diplo-weariness-display-test.cjs` oraz ten raport.
- Nie uruchamiano `npm run build` ani `npm run dev`. Brak `git add -A`. Brak spawn_task/sesji. Brak pushu.

RUNDY: 2/5
NASTĘPNY KROK: zrzut Chromium po buildzie orkiestratora (wojna gracz↔AI i AI↔AI); potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO
