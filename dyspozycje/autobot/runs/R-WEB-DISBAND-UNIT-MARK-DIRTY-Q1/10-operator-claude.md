# R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1
GOAL: po rozwiązaniu jednostki gracza przez realną ścieżkę (`disbandPlayerUnit`) prognoza ekonomii jest przeliczona natychmiast: tooltip „Zakończ turę” w blokadzie i bramka (canEnd) odzwierciedlają nowy stan.
BAZA: 6e72c3c17 (origin/main), worktree odłączony (`--detach`).

## ZMIANY / COMMIT

- `gra/src/main.ts` — funkcja `disbandPlayerUnit` (ok. linii 7697–7742): dodane `markCityStateDirty();` po `units.splice(idx, 1)` i przed `refreshD1bHud()` (z komentarzem R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1). Razem 7 linii dodanych, 0 usuniętych.
- `gra/tools/disband-unit-mark-dirty-test.cjs` — nowy test regresji (statyczny, na źródle main.ts).
- `dyspozycje/autobot/runs/R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1/10-operator-claude.md` — ten raport.

Przeglądy innych ścieżek usuwania jednostek gracza:
- Panel armii „Rozwiąż” (`disbandSelectedOrPickedUnits`, main.ts ~26520–26540), zarówno pojedyncza jednostka, jak i masowe rozwiązanie z zaznaczenia, woła `disbandPlayerUnit` per id. Jedna poprawka w `disbandPlayerUnit` obejmuje obie ścieżki. Nie wymaga osobnej zmiany.
- „Zastąp” (zamiana typu, jednostka zostaje w `units`): nie usuwa jednostki, nie zmienia utrzymania przez usunięcie. Poza zakresem.
- `disbandAiSupportUnit` (main.ts ~7408): ścieżka AI wywoływana z równoważenia tury. Nie dotyczy gracza, a jej wywołanie leży w obrębie tury, która i tak oznacza stan brudny. Bez zmian (zakres allowlisty: ścieżki gracza).
- Hak testowy `disbandPlayerUnits` (main.ts ~31594): już woła `markCityStateDirty()`. Bez zmian.
- Hooki testowe `debugKillPlayer` (main.ts ~31603, `units.splice` na jednostkach gracza) i `removeUnit` (~28924, fortcap): poza ścieżką realnej rozgrywki, poza zakresem. Brak zmian.
- Ścieżka `refreshD1bHud` w `disbandPlayerUnit` pozostaje bez zmian (zachowanie dla innych efektów nie zmienione).

## TESTY

- `npm ci --ignore-scripts` w worktree gra/: `added 71 packages`, EXIT 0 (bez `npm run build`/`dev`).
- `npx tsc --noEmit` (gra/): EXIT 0, bez wyjścia (zielone).
- Nowy test `node tools/disband-unit-mark-dirty-test.cjs` na poprawce: `6 passed, 0 failed`, EXIT 0.
- Mutacja (cofnięcie wywołania `markCityStateDirty()` w `disbandPlayerUnit`): `3 passed, 3 failed`, EXIT 1 (test czerwony). Poprawka przywrócona; po przywróceniu `6 passed, 0 failed`.
- Bramki referencyjne (na poprawce):
  - `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, EXIT 0.
  - `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
  - `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, EXIT 0.
  - `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
  - `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, EXIT 0.
- `git diff --check`: bez wyjścia (czysty).

## DOWÓD BEHAWIORALNY I LIVE

- Test regresji jest statyczny (sprawdza kolejność wywołań w źródle). Nie uruchamia realnej rozgrywki z deficytem tury ≥11 w Node. Scenariusz „przed poprawką stary deficyt / po poprawce nowy deficyt” NIE został wykonany jako test wykonawczy. Powód: `disbandPlayerUnit` działa na stanie zamkniętym w `main.ts` bez haka selekcji jednostki w teście Node.
- Weryfikacja live w Chromium (tooltip po realnym kliknięciu „Rozwiąż” na jednostce, wzór `gra/tools/live-verify-wave-689-697-a1-title-tax.cjs`): NIE_ZMIERZONO. Powód: w tej rundzie nie uruchamiano przeglądarki ani dev-servera (zakaz build/dev w gra/ dla tej rundy; brak hooka selekcji jednostki).
- Założenie (do potwierdzenia przez FC/live): po `markCityStateDirty()` następny `refreshLiveEmpireRates()` przelicza prognozę z nowym utrzymaniem (ścieżka `refreshLiveEmpireRatesUnsafe`), a `nnsEndTurnTooltipText`/bramka czyta cache po tym przeliczeniu.

## BLOKADY

- Brak blokad kodowych.
- Dowód live w Chromium: NIE_ZMIERZONO (patrz wyżej).

## RUNDY

1/5 (runda 1, Operator HAIKU).

## NASTĘPNY KROK

Evaluator: zweryfikować diff (7 linii w `disbandPlayerUnit`), uruchomić `disband-unit-mark-dirty-test.cjs` i mutację; ocenić, czy pokrycie statyczne wystarcza albo wymagany jest live-verify w Chromium (FC decyduje).

## UWAGI-DLA-ORKIESTRATORA

- Brak nowych sesji, zadań ani zaplanowanych wywołań (zakaz zachowany).
- Znalezisko poza zakresem: `spawnAiUnits` (hak testowy, main.ts ~31603 `debugKillPlayer`/`removeUnit` ~28924 nie woła dirty). Oznaczone w dispatchu jako artefakt haka, nie zmieniane.

DEPLOY/PUSH: NIE WYKONANO
