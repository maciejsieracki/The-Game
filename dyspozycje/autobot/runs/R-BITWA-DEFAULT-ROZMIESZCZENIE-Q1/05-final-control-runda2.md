# AutoBot Final Control — domyślne rozstawienie bitwy, runda 2

DATA: 2026-10-28
WERDYKT: **PASS-WITH-NOTES — READY FOR INTEGRATION tego ograniczonego zakresu**
TEMAT: `R-BITWA-DEFAULT-ROZMIESZCZENIE-Q1`

## Zakres i źródła

Kontrola dotyczy `00-dispatch-runda2.md`, `03-operator-runda2.md` i `04-evaluator-runda2.md` oraz wyłącznie dozwolonego zakresu: `formationRules.ts`, `battleScene.ts` w hunks rozmieszczenia początkowego/resetu i `battle-formation-rules-test.cjs`. Dispatch wyraźnie wyklucza zmiany doktryn Atak/Obrona/Szturm.

HEAD kandydata: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`. Worktree jest współdzielony i zawiera inne niezacommitowane tematy. W scoped diff `battleScene.ts` znajdują się tylko adapter klasyfikatora i dwa miejsca podłączenia formacji dla startu oraz resetu; nie ma hunks doktryn. Nie przypisuję tego runowi ani nie kontroluję pozostałych zmian.

## Niezależne bramki Final Control

- `node tools/battle-formation-rules-test.cjs` — **PASS**.
- `node ./node_modules/typescript/bin/tsc --noEmit` — **PASS**.
- Vite build poza repozytorium (`/tmp/battle-formation-r2-final-dist`) — **PASS**, 916 modułów.
- Scoped `git diff --check` — **PASS**.
- SHA-256 zgodne z raportem Operatora/Evaluatora:
  - `src/battle/formationRules.ts`: `0cfd3d249af3453c7b900f36c88e67d2c85c7439743b03be6d6e322c35df2f7b`
  - `src/battle/battleScene.ts`: `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8`
  - `tools/battle-formation-rules-test.cjs`: `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b`

## Rozstrzygnięcie

Kryterium rundy 2 jest spełnione: produkcyjny adapter `initialBattleRoleOf()` deleguje do eksportowanego klasyfikatora, test wywołuje dokładnie ten klasyfikator na reprezentatywnych kategoriach/nazwach, a oba planery (pierwsze rozmieszczenie i reset) są sprawdzone źródłowo. Próbki obejmują role i dane zgodne z produkcyjnymi `units.json`; klasyfikacja machiny sprawdza `Typ: Siege`.

Uwaga nieblokująca: nie uruchomiono wizualnego playtestu bitwy w przeglądarce. To ograniczenie zostało jawnie opisane przez Operatora, a kryteria dispatchu tej rundy wymagają logiki klasyfikacji i slotów, nie renderowanego zrzutu. Właściciel powinien obejrzeć szyk po integracji.

**Następny etap:** integrator może scalić wyłącznie zatwierdzone hunky i test z tej allowlisty, po zwykłym przeglądzie bez regresji względem współdzielonych zmian. Nie jest to `READY_FOR_DEPLOY`; nie wykonano integracji, commitu, pushu ani deployu.
