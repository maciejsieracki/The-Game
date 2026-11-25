# R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1
GOAL: bramka bramki-tmpdir-unikalnosc-test zielona (0 trafień) oraz odpowiedź na zarzuty 1–4 Evaluatora (commit 6fb027243) z dowodem.
BAZA: 60635fa3a (kandydat), gałąź detached. Zmiany tylko w gra/tools/*.cjs, bez gra/src, gra/data, deployu i pusha.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, NAPRAWIONE. `bitwa-obroncy-mur-kolumny-test.cjs:82`: sprzątanie osieroconych katalogów wywoływało `path.join(os.tmpdir(), ent)` (R3). Katalog nadrzędny wyliczono raz jako `TMP_PARENT = path.dirname(TMP_ROOT)` (TMP_ROOT ma znacznik TMPDIR_RUN_ID), a `readdirSync` i `rmSync` idą przez TMP_PARENT. Zmiana dotyczy tylko kasowania wpisów o nazwie unikalnej per przebieg, nie zapisu do stałej nazwy. Asercje nietknięte.
   Dowód: `node gra/tools/bramki-tmpdir-unikalnosc-test.cjs` → `przeskanowano 434 plikow z tmpdir (z 1949 .cjs)`, `PASS=3 FAIL=0`. Przed poprawką: `PASS=2 FAIL=1`, jedno trafienie `[R3] bitwa-obroncy-mur-kolumny-test.cjs:82 ent`.

2. PRZYJMUJĘ CZĘŚCIOWO (ryzyko potwierdzone, pełnego biegu pary nie zrobiono).
   - Potwierdzone: osobne procesy bez `TMPDIR_RUN_ID` dostają różne nazwy. Dowód: `node -e` dwa razy na `_tmp-unique.cjs` → `28060-b2e90e26` i `28067-7ba2e675`. Z `TMPDIR_RUN_ID=fixed-test-1` oba procesy dają `fixed-test-1`.
   - Potwierdzona regresja domyślnej ścieżki konsumenta: `econ-rebalance-model.cjs` czytał `/tmp/econ-final` (stały); teraz `<tmpdir>/econ-final-<id>`. Dane wejściowe nie są produkowane w repo (brak producenta w gra/tools), więc para ręczna z domyślną ścieżką już nie działa. Nagłówek pliku zaktualizowano (komentarz), wskazując jawny katalog albo `TMPDIR_RUN_ID`.
   - Dla producentów `ai-economy-measure-run.cjs`, `ai-economy-measure-hook-test.cjs`, `ai-ai-treaty-live-proof-wiring-run.cjs`, `endturn-t57-repro.cjs` dodano jedną linię `console.log('[tmpdir] TMPDIR_RUN_ID=… DIST=… PROFILE=…')`, żeby ręczny konsument dostał wartość. Jest to odstępstwo od allowlisty „tylko zmiana nazw” (zmiana wyłącznie diagnostyczna, bez zmiany zachowania).
   - NIE ZMIERZONO: pełny bieg pary producent–konsument z Chromium (brak node_modules w worktree, a dispatch zakazuje build w gra/; nie uruchamiano).

3. PRZYJMUJĘ (brak dowodu live). Testy live (79 z 99 zmienionych plików używa przeglądarki) NIE URUCHOMIONO: NIE ZMIERZONO. Dla wszystkich 99 zmienionych plików wykonano `node --check`: `SYNTAX ok=99 bad=0`.
   Testy nie-live uruchomione solo (po `npm ci --ignore-scripts` w gra/, usunięte po bramkach):
   - `city-siege-wall-rules-test.cjs`: rc=0, WYNIK 50 OK, 0 FAIL
   - `cluster-start-recovery2-test.cjs`: rc=0
   - `fortifications-queue-cleanup-test.cjs`: rc=0, WYNIK 10 OK, 0 FAIL
   - `fortifications-superseded-build-test.cjs`: rc=0
   - `fortifications-upgrade-chain-ai-test.cjs`: rc=0, WYNIK 13 OK, 0 FAIL
   - `palisade-battle-wall-rules-test.cjs`: rc=0, WYNIK 55 OK, 0 FAIL
   - `procarz-piercing-shot-test.cjs`: rc=0, ALL PASS
   - `ranged-damage-mult-test.cjs`: rc=0, WSZYSTKIE PASS
   - `ai-ai-alliance-limit-audit.cjs`: rc=0
   - `barb-warrior-audit-sim.cjs`: rc=0
   - `diplo-peace-price-table-a.cjs`: rc=0
   - `cluster-plan-name-test.cjs`: rc=1, ALE TAK SAMO na bazie 180d518b1 (zestawy PASS/FAIL identyczne po odfiltrowaniu PID; porównanie: `diff` pusty). Błąd przed tą rundą, nie z tego tematu.
   - Rc=1 z powodu danych lub stanu poza zakresem (nie z nazw tmp): `resource-ledger-realpath-mutation-test.cjs` (BUILD-FAIL), `save-load-roundtrip-state-drift-test.cjs` (wymaga --dist), `econ-rebalance-model.cjs` (brak danych wejściowych, /tmp/econ-final nie istnieje także na bazie), `diplo-weariness-city-table-measure.cjs` (TypeError: M.wearinessPeaceX nie jest funkcją; w diff tylko nazwa tmp).
   - Rc=124 (timeout 120–150 s, brak wyniku): `ai-army-replacement-sim.cjs`, `ai-economy-measure-upkeep-onoff.cjs`, `weary40-sim-measure.cjs` (rc=1 bez wyniku bramki).
   - Bramki: `tsc --noEmit` rc=0. Bramka logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0 NIE POWTARZANE w tej rundzie (zmiany są tylko w gra/tools; wynik Evaluatora z 6fb027243 traktuję jako ważny dla gra/src bez zmian).

## Zarzut 4 (niska waga): PRZYJMUJĘ, BEZ NAPRAWY W TEJ RUNDZIE
Każdy bieg zostawia artefakt w tmpdir. Skali NIE ZMIERZONO. Centralne sprzątanie w `_tmp-unique.cjs` ODRZUCAM z powodem: para producent–konsument wymaga, by dane producenta przeżyły jego zakończenie (ręczny konsument czyta po zakończeniu producenta), więc sweep martwych PID-ów skasowałby wejście pary. Sprzątanie zostaje w testach. Jeden commit zamiast paczek: przyjmuję jako ograniczenie procesu; zmiany są małe i są w jednym commicie.
`.gitignore:78` (`_tmp-*`) nie dotyczy `_tmp-unique.cjs`, który już jest śledzony w ac74a132b (dodany wcześniej przez `git add -f`).

## Pozostałe znaleziska (UWAGI-DLA-ORKIESTRATORA)
- `cluster-plan-name-test.cjs` jest czerwony już na bazie 180d518b1 (rzymianie/inkowie, seed 202). Pozycja istniejąca w rejestrze jako „cluster-plan-name po polarze”.
- `ai-army-replacement-sim.cjs`, `ai-economy-measure-upkeep-onoff.cjs`, `weary40-sim-measure.cjs` nie kończą się w 120–150 s; pełny bieg wymaga dłuższego limitu.
- Brak node_modules w worktree: dispatch każe usuwać gra/node_modules po bramkach. Zainstalowane `npm ci --ignore-scripts` (71 pakietów), usunięte po testach.
- Usunięto artefakty wygenerowane przez `weary40-sim-measure.cjs` (`gra/tools/.weary40-*`), żeby nie trafiły do commita.

## TESTY (liczby z surowego wyjścia)
- `node gra/tools/bramki-tmpdir-unikalnosc-test.cjs` → PASS=3 FAIL=0 (po poprawce)
- `node --check` 99/99 zmienionych plików
- `npx tsc --noEmit` → rc=0
- testy nie-live: patrz wyżej

## BLOKADY
- Live (79 plików, Chromium) nie uruchomione: NIE ZMIERZONO.
- Pełny bieg pary producent–konsument: NIE ZMIERZONO.

## RUNDY
2/5 (Operator, odpowiedź na zarzuty Evaluatora r1).

## NASTĘPNY KROK
Evaluator r2 na commicie tej rundy (gra/tools: 6 plików, +12/−3). Orkiestrator decyduje o zakresie live.

DEPLOY/PUSH: NIE WYKONANO
