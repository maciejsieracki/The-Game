STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
GOAL: Wspólna sekwencja nazw: indeks 0 = stolica, prefix [1..99] = zwykłe miasta, suffix [100..109] = państwa-miasta; overflow nie może wrócić do stolicy.
ZMIANY/COMMIT: poprawiono `gra/src/game/city-names-pool.ts`; dodano regresję w `gra/tools/city-names-pool-test.cjs`; `cluster-start-test.cjs` czyta wspólne źródło; uzupełniono artefakty Operatora i evidence; utworzono ten raport. Commit/push/PR/merge/deploy: NIE WYKONANO.
TESTY: typecheck PASS; city-names-pool 125/0; pozostałe bramki nazw 9/0, 7/0, 47/0, 9/0; smoke startu klastra 2/2; mutacje kopii tymczasowych 121/2 i 122/1 (rc=1); pełny cluster-start-test TIMEOUT po 420 s.
BLOKADY: pełny test klastra nie zakończył się i ma znany baseline placement/hub-chain; oddzielono go od kontraktu nazw. Chromium INFRA poza zakresem.
RUNDY: 2/5; obrona czterech zarzutów PASS-WITH-NOTES.
NASTĘPNY KROK: Final Control — readback zmian, dowodów i osobna ocena baseline map placement.
DEPLOY/PUSH: NIE WYKONANO

# Obrona zarzutów

| Zarzut | Rozstrzygnięcie i dowód |
|---|---|
| 1. `clusterRivalFromPool` przy overflow może zwrócić stolicę (`common[0]`). | TRAFIONY — NAPRAWIONY. `city-names-pool.ts:124-142` buduje overflow z `common.slice(1, CITY_NAMES_POOL_REGULAR_LEN)`, a więc pomija indeks 0 także po suffixie. Regresja `city-names-pool-test.cjs:83-85` sprawdza index 11: `Ateny` → `Sparta`, wynik nie jest stolicą. |
| 2. Dwie asercje nazw w `cluster-start-test` błędnie opisano jako unrelated baseline. | TRAFIONY — NAPRAWIONY. `cluster-start-test.cjs:38-39,95-104,190-193,205-212,221-229` przekazuje `cityNamesPools` do plannerów i porównuje stolicę oraz etykietę z `miasta_cywilizacji[0]`, nie z `Qin`. Smoke: `Xi'an`/`Xi'an`, 2/2. Timeout pełnego testu i baseline placement są raportowane osobno. |
| 3. `Assur` → `Aszur` może być cichą utratą nazwy. | ZARZUT ODRZUCONY — NORMALIZACJA JAWNA. Nie przywrócono `Assur`: ratyfikacja opisuje oba zapisy jako transliteracje tego samego miasta i wymaga `Aszur` na indeksie 0 (`dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/00-dispatch.md:49-54,62-67,178-184`). `city-names-pools.json` ma tam `Aszur` (`:1497-1501`), a `civs.json` jest lustrem (`:2168,2210-2215`). Evidence mówi `14/15`, `asyria.preserved_all_original_names=false`, z opisem `Assur` → `Aszur`; `Ninive` pozostaje dalej na liście. |
| 4. Mutacje nie dowodzą izolacji ani czerwienienia bramki. | POTWIERDZONY DOWÓD. Na tymczasowej kopii bramki w wariancie evaluator (przed dodaniem dwóch asercji overflow), poza repo: `CITY_NAMES_POOL_REGULAR_LEN + index` → `index`: rc=1, `121 passed, 2 failed`; `regular.slice(1)` → `regular`: rc=1, `122 passed, 1 failed`; katalogi usunięto w `finally`, wynik: `temporary mutation copies: cleaned`. Wyniki są w `01-evidence.json:defense_addendum.mutation_probes`. |

Wniosek: kontrakt nazw przechodzi, overflow nie może zwrócić stolicy, a dwa name-failures mają teraz właściwy test wspólnego źródła. `cluster-start-test.cjs` z limitem 420 s nie zakończył się; wcześniejszy baseline placement/hub-chain nie jest przypisywany tej poprawce.
