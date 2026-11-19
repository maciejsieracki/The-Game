# R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (hak testowy + narzędzie pomiarowe; bez zmian zasad, balansu i progów)
TEMAT: R-WEB-ECONOMY-MEASURE-PLAYER-AUTOPILOT-Q1
GOAL: hak `setPlayerAiAutopilotForTest` (domyślnie OFF, tylko ?civTest=1) — gracz (0) dostaje w fazie AI decyzje jak AI; runner `--player-ai 0|1`; analizator sekcja „Gracz (autopilot)"; test haka.
BAZA: 472d1e01e (origin/main), detached.
ZMIANY-COMMIT: SHA w polu `sha` odpowiedzi (commit zawiera kod + ten raport).
- `gra/src/main.ts`: flaga `playerAiAutopilotForTest` (false); hak `setPlayerAiAutopilotForTest` / `playerAiAutopilotForTestState` w `__aiEconomyMeasure`; w `runAiPhase` gdy flaga true lista `ownerLoopList` = `[0, ...AI]` (gracz pierwszy). Dodatkowo 3 miejsca czytające pulę Pracy AI (`aiPracaPoolByOwner`) przełączone na `ownerPracaPool`/`setOwnerPracaPool` (dla AI identyczne; dla gracza bez tego zakładanie miast nie działało — poza literą dispatchu, patrz UWAGI).
- `gra/tools/ai-economy-measure-run.cjs`: `--player-ai 1` ustawia hak po starcie gry i drukuje stan.
- `gra/tools/econ-measure-analyze.cjs`: sekcja „Gracz (autopilot)" co 10 tur, tylko gdy gracz ma ≥1 miasto (JSON: `graczAutopilot`).
- `gra/tools/player-ai-autopilot-test.cjs` (nowy): 3 asercje + mutacja (setter no-op).

TESTY (liczby z surowego wyjścia):
- `tsc --noEmit`: exit 0.
- Bieg dymny, seed 4242, 30 tur, `--player-ai 1`: gracz miasta t3=1, t15=2, t27=3, t30=4; budynki 0 do t12, 1 od t15 (>0 w t30 ✓); wojskowe 1, cywilne 2; brak NaN; events.log bez pageerror.
- Parytet flagi OFF vs baza (ten sam seed, 30 tur): 29/29 wierszy jsonl identycznych (wyłączone pola czasowe sec/load1/wallMs/czas); `state.json` identyczny.
- `player-ai-autopilot-test.cjs`: 3/3 zielone (domyślnie false; setter przełącza; bez ?civTest=1 brak haka). Mutacja (setter no-op): 2/3, asercja 2 CZERWONA ✓.
- `ai-economy-measure-hook-test.cjs`: 23/23 zielone.
- `logic-test.cjs` 213/213; `tech-tree-test` 20 pass / 0 fail; `research-test` ALL GREEN; `unit-replace-test` 21/21; `combat-test` exit 0 („All sanity checks passed”, nie liczono 6 przypadków); `ai-unit-replace-same-rules-test` 45/0.
- NIE_ZMIERZONO: bieg 150 tur (nie uruchamiany — dispatch: >30 tur zakazany; robi orkiestrator); czy gracz-autopilot ginie przed t100; ekonomia gracza w późnej grze; zachowanie przy seedzie 7.

BLOKADY: brak.
RUNDY: 1/5. Ostatni werdykt: n/d.

UWAGI-DLA-ORKIESTRATORA:
1. Poza dosłowną allowlistą dispatchu: zmiana `ownerPracaPool` w 3 miejscach `runAiPhase` (linie ~45389, ~46973, ~46995) — bez niej gracz-autopilot nie zakładał miast (pula Pracy gracza leży w `pracaPoolByHuman`). Dla AI zachowanie identyczne (potwierdzone parytetem OFF). Proszę o świadomą akceptację tej części.
2. Gałąź dispatchu „commit tylko raportu”: commit zawiera także kod (inaczej brak zmian = BLOCK wg reguł) — wszystkie pliki dodane jawnie po ścieżce, bez `add -A`.
3. Semantyka: decyzje gracza idą tą samą ścieżką co AI (`ownerLoop`), ale `aiOwnerList` (dyplomacja, forced-war pairing) NIE zawiera gracza — D7 bez zmian. Nie zweryfikowano, czy `decideAITurn` dla właściciela 0 nie wystawia komend dyplomatycznych/wojennych (NIE_ZMIERZONO); przed długim biegiem warto sprawdzić `events.log` pod kątem `wojna`/`[Dyplomacja]` z AI 0.
5. Bieg 150 tur (`setsid nohup`) — do uruchomienia przez orkiestratora: `node tools/econ-measure-run.cjs --dist <abs-dist> --profile <abs> --out <abs> --seed 4242 --turns 150 --player-ai 1`; bundle: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`.

NASTĘPNY KROK: Evaluator — weryfikacja diffu, parytetu OFF oraz uruchomienie testu nowego haka i mutacji.
DEPLOY/PUSH: NIE WYKONANO
