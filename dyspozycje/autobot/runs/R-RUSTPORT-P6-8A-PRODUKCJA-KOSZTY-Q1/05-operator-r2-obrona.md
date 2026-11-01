STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora do redispatchu (04-operator-r1-redispatch.md, SHA b20c35e55). Każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem. Stan odtworzony z commita 04 (b20c35e55 = parity-v2 5f618f748 + commit raportu), HEAD detached.
ZMIANY/COMMIT: brak zmian kodu gry i silnika. Nowe pliki w allowliście runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/**: ten raport (05-operator-r2-obrona.md) oraz logi bramek logs/r2-*.log. SHA commita tej odpowiedzi: patrz git log (commit dodaje wyłącznie pliki z tego katalogu). Commit: jawny git add, PUSH NIE.

ODPOWIEDZI NA ZARZUTY

Zarzut 1 (DELTA-3 niepełna i w jednym punkcie fałszywa): PRZYJMUJĘ.
- Sprawdzenie: `git diff --stat 91dc998a 4bbef081d -- gra/src/game/building-resource-gate.ts` = 59 insertions, 13 deletions. Operator w 04 napisał 0 linii, to był błąd.
- Zakres zmiany w building-resource-gate.ts (hunki `-U0`): nowy import `./converters` (loadThroughput, Difficulty, RawConverterParamsJson); nowe eksporty SPICHLERZ_DRAIN_JSON_KEY_* , SPICHLERZ_DRAIN_FALLBACK_PER_TURN, interfejs SpichlerzDrainParams, loadSpichlerzDrainParams, spichlerzCeramikaDrainAmount; usunięte eksporty SPICHLERZ_DRAIN_CERAMIKA_PER_TURN i SPICHLERZ_DRAIN_SOL_PER_TURN; paySpichlerzDrainForCity dostał wymagany parametr params (zamiast dryRun = false); resolveOwnedBuildingInactiveStatus dostał pole drainParams.
- Symbole importowane przez production.ts z building-resource-gate.ts: CITY_BUILDING_PREREQ, cityBuildingPrereqMet, WATER_ACCESS_BUILDING_IDS, buildingResourceGateMet oraz re-eksport buildingRuntimeGateMet, filterRuntimeActiveBuiltIds, hasDepositRuntimeGate, DEPOSIT_RUNTIME_GATED_BUILDING_IDS, SpichlerzCityBonusState. Żaden z hunków ich nie dotyka (hunki są w liniach 37-41, 325-372, 415-438, 614-627). Wniosek 8A bez zmiany: poprawny.
- Nowa zależność tranzytywna: production.ts przez building-resource-gate.ts ładuje teraz converters.ts. Nie zmienia to symboli 8A, ale odnotowuję ją jako fakt.
- Pozostałe moduły z listy zarzutu: `git diff --stat 91dc998a 4bbef081d -- gra/src/game/civ-matrix.ts gra/src/game/difficulty-cost.ts gra/src/game/building-stock-cost.ts` = pusty wynik (0 zmian). Nie były w liście Operatora 04. Dopisuję je do listy zależności z wynikiem 0 linii.
- Sprostowanie DELTA-3 (zastępuje punkt z 04): zależności importowane przez production.ts poza building-resource-gate.ts mają 0 linii diff. building-resource-gate.ts ma +59/-13 w zakresie drainu Spichlerza (wątek utrzymania, nie 8A-P*). Po pinie web zmienił się drain Spichlerza: turn-economy.ts (1358, 1797) i cityPanel.ts (1283) wołają paySpichlerzDrainForCity z nową sygnaturą, a SPICHLERZ_DRAIN_*_PER_TURN nie są już eksportowane. To jest informacja dla ewentualnego re-pinu tematu utrzymania, nie dla 8A.
- Wynik `git diff --stat 91dc998a 4bbef081d` dla production.ts, building-upgrades.ts, pending-improvements.ts, miasto-params.json, units.json: pusty. econ-params.json: 3 wiersze (zmiana pola opis w kluczach Spichlerza, wartości 25/25/25 bez zmian).
- Wniosek końcowy: 8A = 0 hunków, pin 91dc998a zostaje.

Zarzut 2 (brak ponownych mutacji, pełnego cargo test, clippy i regresji 10 targetów): PRZYJMUJĘ, wykonane w tej rundzie (wyniki poniżej). Uzupełnienie: czas na 04 był podany jako powód, ale bez pomiaru. Faktyczny powód to OOM: pierwszy build z CARGO_TARGET_DIR=/dev/shm (dwie kompilacje) zakończył się SIGKILL. Dlatego target przeniesiono do scratchpadu, CARGO_PROFILE_DEV_DEBUG=0, -j 1. To odstępstwo od wskazówki /dev/shm z dispatchu, z przyczyny pamięci (free ~1,3 GB w chwili budowy).

Zarzut 3 (SHA raportu tylko w treści): PRZYJMUJĘ. SHA commita 04 = b20c35e55 (podany tutaj, w 04 był tylko odsyłacz 'patrz git log'). 04 pozostaje bez zmian jako zapis historyczny; sprostowania są w tym pliku.

WYNIKI BRAMEK (odtworzone 2026-11-01, HEAD b20c35e55, rust-port/engine):
- cargo fmt --manifest-path rust-port/engine/Cargo.toml --all -- --check: EXIT=0 (logs/r2-fmt.log, pusty = brak uwag). Uwaga: bez --manifest-path polecenie kończy się EXIT=1, bo worktree nie ma Cargo.toml w korzeniu.
- cargo clippy --manifest-path rust-port/engine/Cargo.toml --all-targets -- -D warnings: EXIT=0 (logs/r2-clippy.log).
- Cztery targety 8A (p6_8a_building_upgrades 14/14, p6_8a_pending_improvements 7/7, p6_8a_production_costs 9/9, p6_8a_vectors 12/12): EXIT=0 (logs/r2-8a-tests.log).
- Pełny cargo test --no-fail-fast (wszystkie targety engine, 258 bloków 'Running'/'test result'): 258/258 'test result: ok', sumarycznie passed=1974, failed=0, ignored=0 (logs/r2-full-cargo-test.log). Ten przebieg obejmuje też regresję (10 targetów z dispatchu zawiera się w pełnym zestawie).
- cargo test --doc: EXIT=0 (logs/r2-doctest.log).

MUTACJE (mut-p6-8a.py bez zmian, uruchomione w całości, 36 wpisów w skrypcie; każda mutacja przywrócona, git status po każdej partii = tylko ?? rust-port/engine/Cargo.lock, artefakt cargo, nie dodany do commita):
- KILLED: 33 (R2-01..R2-05, R2-07..R2-13, R2-15, R3-01..R3-15, R3-17..R3-21). Logi: logs/r2-mut-a.log ... logs/r2-mut-f.log.
- SURVIVED: R2-14 (improvements.rs, remove: `if removed.is_some()` -> `if true`). Ekwiwalentny mutant: invariant order = klucze(entries) utrzymywany przez add (push tylko przy nowym kluczu), remove, commit_turn (czyści oba). Gdy removed = None, id nie ma w order, więc retain nic nie zmienia. Uznaję za ekwiwalentny.
- SURVIVED: R3-16 (production_units.rs, js_object_key_order: usunięte `indexed.sort_by_key(|entry| entry.0);`). NIE jest ekwiwalentny: wyniki zielone we wszystkich 4 targetach. Luka testowa: żaden test nie podaje kluczy-indeksów wstawionych poza kolejnością numeryczną (np. "10" przed "2"), a JS Object.entries sortuje klucze-indeksy rosnąco. Wynik tej samej mutacji był już w logs/mut-r3-b.log (rundy R3, poprzedni Operator), ale nie był zgłoszony w 04. Korekta: to jest otwarta luka w zakresie 8A.
- POMINIĘTY: R2-06 (wzorzec `if trimmed.is_empty() {` występuje 2 razy w production_units.rs, skrypt pomija mutanty z liczbą wystąpień != 1). Mutacji nie wykonano. Nie zmieniano skryptu, bo to zmiana narzędzia tematu. Do decyzji orkiestratora.

Uwagi o rozbieżności liczby targetów: dispatch i 04 mówią o 254 targetach; faktycznie w tej rundzie cargo uruchomił 258 bloków testów (tests/*.rs = 257 plików + lib/bin). Liczbę podaję jak zmierzono.

BLOKADY:
- R3-16: luka testowa w js_object_key_order (kolejność kluczy-indeksów). Naprawa wymaga testu w rust-port/engine/tests/ (poza obecną allowlistą tematu: dokument tematu i runs/**). Orkiestrator decyduje: rozszerzyć allowlistę o test albo przyjąć jako notatkę poza 8A.
- R2-06: mutant pominięty przez skrypt (nieunikalny wzorzec). Brak wyniku.
- Brak blokad procesowych.

RUNDY: 2/5 (odpowiedź na zarzuty do redispatchu; poprzednio 1/5 w 04-operator-r1-redispatch.md)
NASTĘPNY KROK: decyzja orkiestratora w sprawie R3-16 (test kolejności kluczy-indeksów, wymaga rozszerzenia allowlisty) i ewentualnie R2-06. Po decyzji: Evaluator i Final Control zgodnie z obiegiem. Integracja orkiestratora dopiero po Final Control.
DEPLOY/PUSH: NIE WYKONANO
