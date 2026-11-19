# R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (hak testowy + narzędzie pomiarowe; bez zmian zasad, balansu i progów)
TEMAT: R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1
GOAL: hak `setPlayerAiAutopilotForTest` (domyślnie OFF, tylko ?civTest=1) — gracz (0) dostaje w fazie AI decyzje jak AI; runner `--player-ai 0|1`; analizator: wiersz gracza oznaczony + sekcja „Gracz (autopilot)"; test haka sprawdza PODPIĘCIE pętli, nie tylko setter.
BAZA: 472d1e01e (origin/main); kandydat do obrony: b96560ddf (commit Operatora r1); poprawki r2 w commicie obrony (SHA w polu `sha` odpowiedzi).
ZMIANY-COMMIT (r2):
- `gra/src/main.ts`: + odczyt testowy `aiPhaseOwnersForTest` (zapis w ownerLoop, tylko do tablicy odczytu; `lastAiPhaseOwnersForTest()` w `__aiEconomyMeasure`). Zero zapisu do stanu gry.
- `gra/tools/player-ai-autopilot-test.cjs`: asercje 4 i 5 (ownerLoop: flaga false → właściciel 0 nieprzetworzony; flaga true → właściciel 0 pierwszy). Mutacja setter nadal aktywna (`--mutant 1`).
- `gra/tools/econ-measure-analyze.cjs`: wiersz gracza w GŁÓWNEJ tabeli oznaczony `0 (gracz)`.
- `dyspozycje/.../dowody/`: r2-* (testy zielone/mutanty, bieg dymny ON/OFF 30 tur, analiza) + pliki r1.

## Odpowiedzi na zarzuty z recenzji Evaluatora

1. PRZYJMUJĘ (naprawione). Test sprawdza teraz podpięcie pętli: asercja 4 (flaga false: `ownerLoop` nie przetwarza właściciela 0, AI przetworzone) i asercja 5 (flaga true: właściciel 0 jest PIERWSZY w `ownerLoop`). Dowód mutacji podpięcia (`return [0, ...aiOwnerList.filter(oid => oid !== 0)];` → `return aiOwnerList;` w main.ts:45098, build do katalogu poza repo, `--dist`): `CZERWONE 5 flaga true ... owners=[40,41,1,...]`, `WYNIK: 4/5 zielone`, exit 1 (`dowody/r2-test-player-ai-autopilot-mutant-podpiecie.log`). Mutacja settera (`--mutant 1`): `CZERWONE 2`, `CZERWONE 5`, `WYNIK: 3/5 zielone (mutant)`, exit 1 (`dowody/r2-test-player-ai-autopilot-mutant-setter.log`). Oryginał (bez mutacji): `WYNIK: 5/5 zielone`, exit 0 (`dowody/r2-test-player-ai-autopilot-zielone.log`). Kod źródłowy po mutacji przywrócony z kopii i zweryfikowany `cmp`.
2. PRZYJMUJĘ (naprawione). Surowy jsonl z biegu dymnego jest w `dowody/`: `r2-smoke-player-ai1-seed4242-30t.jsonl` (29 wierszy, tury 2..30, 0 wierszy z NaN, `events.log` bez `pageerror`/NaN) oraz log biegu `r2-smoke-player-ai1-run.log` (`PODSUMOWANIE ... "endTurn":30,"stop":null`). Dodatkowo wycinek OFF: `r2-smoke-player-ai0-seed4242-30t.jsonl`.
3. PRZYJMUJĘ (naprawione). Analizator oznacza wiersz gracza w głównej tabeli: `10 | 0 (gracz) | 1 | ...` (oraz 25, 50, 75 — patrz UWAGI pkt 2). Sekcja „Gracz (autopilot)" pozostała, co 10 tur, tylko gdy ≥1 miasto: t10 miasta 1, t20 miasta 2, t30 miasta 4; budynki (suma `budynkiPerTyp`) t30 = 1 (`dowody/r2-analiza-smoke-player-ai1.txt`).
4. PRZYJMUJĘ jako notę, z dowodem równoważności dla AI (nie wycofuję zmiany, bo bez niej gracz-autopilot nie zakłada miast — pula Pracy gracza leży w `pracaPoolByHuman`):
   - `ownerPracaPool(id)` (main.ts:38788): dla nie-człowieka = `aiPracaPoolByOwner.get(id) ?? 0` — identyczne z dawnym `aiPracaPoolByOwner.get(ownerId) ?? 0`.
   - `setOwnerPracaPool(id, v)` (main.ts:38791): `v = max(0, value)`; gałąź nie-człowieka = `aiPracaPoolByOwner.set(id, v)` — identyczne z dawnym `aiPracaPoolByOwner.set(ownerId, Math.max(0, (get ?? 0) - cost))`.
   - Trzy miejsca w `runAiPhase`: main.ts:~45396 (`pracaAvailable`), ~46973 (`evaluateFoundCityAffordance`), ~46995 (odjęcie kosztu Pracy po `foundCityAt`).
   - Parytet OFF (ten sam seed 4242, 30 tur, flaga false): wiersze tur 10, 20, 29 jsonl IDENTYCZNE (po wykluczeniu pól czasowych) względem wcześniejszego dowodu kandydata `smoke-player-ai0-seed4242-wycinek.jsonl` (`dowody/r2-smoke-player-ai0-seed4242-30t.jsonl`). UWAGA: to parytet względem kandydata, NIE względem bazy 472d1e01e — pełny parytet z bazą NIE_ZMIERZONO w r2.
   - Dyplomacja wl 0: D7 — `mayDeclare: !isPlayer(declarer)` (diplomacy-military-strength.ts:244); `aiOwnerList` (dyplomacja, forced-war) nie zawiera gracza, więc hak nie dodaje wojen. Pętla tury: main.ts:45098 (lista z hakiem) i 45105 (`ownerLoop`).

## Dodatkowe zmiany r2 (poza zarzutami)
- Hak `lastAiPhaseOwnersForTest` i zapis `aiPhaseOwnersForTest.push(ownerId)` są czysto odczytowe; `if (startOi === 0) aiPhaseOwnersForTest = []` nie wpływa na stan gry.

## TESTY (liczby z surowego wyjścia, uruchomione w tej rundzie)
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`: exit 0.
- `tools/player-ai-autopilot-test.cjs` (bundle zbudowany do os.tmpdir, poza repo): 5/5 zielone, exit 0.
- Mutacja podpięcia (build z źródła z zamienioną linią, `--dist`): 4/5, exit 1, asercja 5 CZERWONA.
- Mutacja setter (`--mutant 1`): 3/5, exit 1, asercje 2 i 5 CZERWONE.
- `tools/ai-economy-measure-hook-test.cjs`: PODSUMOWANIE 23/23 zielone.
- Bieg dymny ON: `ai-economy-measure-run.cjs --seed 4242 --turns 30 --player-ai 1`: exit 0, `endTurn":30,"stop":null`; gracz t10/t20/t30 miasta 1/2/4; budynki>0 w t30 (1); 0 wierszy NaN; 0 `pageerror` w events.log.
- Bieg dymny OFF: `--player-ai 0`, 30 tur, exit 0 (parytet jak wyżej).
- NIE_ZMIERZONO w r2: `logic-test` 213, `tech-tree` 20, `research` 33, `unit-replace` 21, `combat` 6 — nie uruchamiane ponownie (kod r2 to odczyt testowy + test + analizator; wynik r1 bez zmiany tych bramek). Bieg 150 tur, seed 7, parytet z bazą 472d1e01e — NIE_ZMIERZONO.

BLOKADY: brak.
RUNDY: 2/5. Ostatni werdykt Evaluatora r1: FAIL-zarzuty 1-4 (wszystkie rozstrzygnięte powyżej).
NASTĘPNY KROK: Evaluator (runda 2) — weryfikacja commita obrony względem zarzutów; następnie Final Control.

UWAGI-DLA-ORKIESTRATORA:
1. Test pętli wymaga dwóch realnych `endTurn` na nowej grze (seed 4242) — czas testu ok. kilku minut; w CI/bramce trzeba to uwzględnić.
2. Analizator (pre-istniejące zachowanie, NIE zmieniane w r2): główna tabela bierze „najbliższy rekord ≤ punkt kontrolny” — przy biegu 30-turowym wiersze 50 i 75 powtarzają stan z tury 30. Dla biegu 150-turowego to nie występuje; przy krótkich biegach czytaj tylko tury faktycznie zapisane w jsonl.
3. Operator nie integruje, nie deployuje i nie pushuje; bieg 150 tur (`setsid nohup`) — po stronie orkiestratora.
4. Pliki dowodów z r1 (`smoke-*-wycinek.jsonl`, `test-*.log` bez prefiksu r2) zostają w `dowody/` jako historia.

DEPLOY/PUSH: NIE WYKONANO
