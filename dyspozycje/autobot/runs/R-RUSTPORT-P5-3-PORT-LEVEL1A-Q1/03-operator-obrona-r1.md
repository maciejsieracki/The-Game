STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1
GOAL: Obrona Operatora wobec zarzutów Evaluatora r1 (`02-evaluator-r1.md`, commit `e92803ee`) dla portu 17 modułów UI poziomu 1 bez cyklu do `src-tauri/frontend-v2/src/ui/`.
ZMIANY/COMMIT: baza = commit Operatora `663ac6dd` (rodzic `0a1569c0`). Zmienione: `src-tauri/frontend-v2/tools/dom-harness/run-level1a.mjs`, `src-tauri/frontend-v2/tools/dom-harness/mutate-level1a.mjs`, `dyspozycje/rust-port/p5/P5-3-PORT-LEVEL1A.md` (§6 dopisek „Obrona r1”), ten raport i `r2-obrona-logi/`. Kod modułów `src/ui/**`, `types.ts`, manifest pinu bez zmian.

ODPOWIEDZI NA ZARZUTY
1. Harness nie weryfikuje mapowania `nazwa → label` (`unitRecruitCard.ts:195`) — PRZYJMUJĘ.
   Poprawka: fikstury mają `nazwa`/`label` różne od `id` (`"<Jednostka> «etykieta k»"`; w interakcji `"Rekrut <i>"` z `<` do kontroli escapowania). Dodana mutacja L17 `name.textContent = item.label` → `item.id`.
   Dowód: `r2-obrona-logi/03-mutations-level1a.log` — `L17 … EXIT=1 WYKRYTA [unitRecruitCard.ts] różnic=78`.
2. Cienkie pokrycie `cityListHud` (2), `armyListHud` (4), `cityAttackChoice` (12/16 pusty DOM) — PRZYJMUJĘ.
   Poprawka: `cityAttackChoice` — log akcji zawiera serializację dzieci `body` w stanie otwartym (przed klawiszem/klikiem) + asercja v2 „stan otwarty niepusty 16/16”; mutacja L18 (legenda klawiszy) WYKRYTA, 16 różnic. `armyListHud` 4 → 23 przypadki (lista 1-elementowa, odwrócona, bez wybranej, każda z 16 kombinacji flag osobno). `cityListHud` 2 → 7 (odwrócona, każde miasto osobno); mutacja L19 w kopii bajtowej (kolor plakietki stolicy) WYKRYTA, 3 różnice.
   Uwaga: metryka `DOM_puste` nadal liczy stan końcowy (12/16 dla `cityAttackChoice` — oczekiwane po zamknięciu); stan otwarty pokrywa asercja i log akcji.

TESTY (`r2-obrona-logi/`, każdy log kończy się `EXIT=`):
- `01-tsc.log` EXIT=0; `01-check.log` 0 trafień bramy w 83 plikach, 0 niezgodności w 411 kopiach, EXIT=0; `01-vite-build.log` EXIT=0.
- `02-dom-harness-level1a.log` (+ `.json`): modułów=17 przypadków=3618 różnic=0 jsdomErrors=0, EXIT=0.
- `03-mutations-level1a.log`: mutacji=19 niewykrytych=0, EXIT=0.
- `04-dom-harness-p52-regresja.log`: 3861 przypadków, 0 różnic, EXIT=0.
- Uwaga proceduralna: pierwszy przebieg `npm run check` wykonany równolegle z testem mutacji dał chwilową niezgodność `bottomBarHud.ts` (mutacja L14 w toku); logi `01-*` są z ponownego, sekwencyjnego przebiegu po przywróceniu plików.
- `node_modules` i `dist` usunięte po pracy.
BLOKADY: brak.
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
