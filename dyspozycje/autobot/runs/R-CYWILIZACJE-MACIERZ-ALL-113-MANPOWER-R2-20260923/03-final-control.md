# 03-final-control — R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2
GOAL: Podłączyć mp_regen_proc, mp_max_proc i mp_koszt_jednostki_proc do żywej ścieżki Manpower dla gracza, AI, miasta, kolejki rekrutacji, odnowy i UI.

## WERDYKT

Gotowość do integracji: TAK — wyłącznie allowlist-only, bez integrowania pełnego brudnego worktree.

Wszystkie zarzuty z niezależnego Evaluatora są ODDALONE po świeżym readbacku kodu i bramek:

1. Live queued recruitment: ODDALONY. `gra/src/main.ts:32522–32530` pobiera `civManpowerMultsForOwner(city.ownerId)` i przekazuje niezależne `maxMult` oraz `costMult` do `advanceRecruitmentGated`. Ścieżka `costAlreadyPaid=true` nie pobiera Manpower drugi raz, a zachowuje cap przeskalowany przez `maxMult`.
2. Live AI affordability: ODDALONY. `gra/src/main.ts:34970–34982` pobiera mnożniki ownera i przekazuje oba do `canAffordUnitManpowerEmpire`; zakup przechodzi następnie przez wspólną owner-agnostic ścieżkę `purchaseRecruitmentUnit`.
3. Granica -100% / brak placeholderowego clampu: ODDALONY. `gra/src/game/manpower.ts:458–486` dopuszcza mnożnik 0, a test potwierdza `cityManpowerMax(..., 0) === 0`; nie ma już podłogi `0.1`.

## READBACK SCOPE / BASE / HEAD

- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-manpower-r2-20260923`
- Branch: `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-MANPOWER-R2-20260923`
- `origin/main`: `a8c9cf6c181f688201dd45e6a5871da1b0eb1301`
- `HEAD`: `a8c9cf6c181f688201dd45e6a5871da1b0eb1301`
- `git merge-base --is-ancestor origin/main HEAD`: exit 0
- Status: 8 zmienionych plików kodu/testu oraz katalog artefaktów runu; wszystkie ścieżki mieszczą się w allowliście.
- `git diff --stat` względem working tree: 255 insertions, 58 deletions, 8 plików kodu/testu.
- `git diff -- gra/data/civ-matrix.json`: pusty.
- `git diff --check`: PASS.
- Brak commit/push/merge/deploy.

## KONTRAKT I KONSUMENCI

- Exact IDs są rozwiązywane w `civManpowerMatrixMults()` przez `civMatrixParam()` dla dokładnie: `mp_regen_proc`, `mp_max_proc`, `mp_koszt_jednostki_proc`.
- Macierz zawiera 15 cywilizacji. Świeży odczyt JSON potwierdził pola dla wszystkich 15; `mp_regen_proc` ma wartości `-0.15..0.35`, a `mp_max_proc` i `mp_koszt_jednostki_proc` są obecnie zerowe w danych, co nie usuwa konsumentów ani nie uzasadnia zmiany danych.
- Unknown key w `civMatrixParam()` korzysta z `DATA.defaults[paramId] ?? 0`; brak owner-key w `turn-economy.ts` pozostaje przy fallbacku legacy. Nie stwierdzono wyjątku ani podwójnego zastosowania macierzy.
- Player/AI: `civManpowerMultsForOwner()` rozwiązuje mnożniki per owner; zakup gracza i AI używa tej samej `purchaseRecruitmentUnit()` i tej samej bramki Manpower. AI ma dodatkowo świeżo zweryfikowany exact-ID affordability call-site.
- City max/regen: `advanceCityEconomy()` przekazuje matrix-aware `regenMult`/`maxMult` do `tickManpowerRegen()`; zmiana populacji przekazuje owner-resolved `maxMult` do `refreshManpowerAfterPopChange()`.
- Kolejka rekrutacji: `advanceRecruitmentGated()` ma niezależne `maxMult`/`costMult`; ścieżka opłacona nie pobiera kosztu drugi raz, a ścieżka gated pobiera koszt przez `tryDeductUnitSpawnCosts()`.
- Koszt/refund: zakup, ukończenie jednostki z kolejki Pracy, anulowanie opłaconej rekrutacji i refund jednostki używają owner-resolved `costMult`; cap puli nadal używa `maxMult`.
- Uzupełnianie HP: `tickManpowerUnitReplenishment()` dostaje matrix-aware max/cost override per owner; koszt jednostki jest niezależny od capu.
- UI preview: `cityPanel.ts` korzysta z `getManpowerMultipliers()` z `main.ts`; koszt karty i wiersza rekrutacji używa `costMult`, a bieżąca pula/cap używają właściwych danych snapshotu.
- Brak podwójnego naliczenia: purchase za złoto odejmuje MP przed wpisaniem do `rekrutacja[]`, a completion z `costAlreadyPaid=true` nie odejmuje ponownie.

## DOWODY BRAMEK

- `NODE_PATH=/home/ubuntu/projects/The-Game/gra/node_modules node tools/manpower-test.cjs` → `76 OK, 0 FAIL`.
- Esbuild `0.21.5` z głównego drzewa, parse wszystkich 7 zmienionych plików TS → `TS_PARSE_OK=7`.
- `git diff --check` → PASS.
- Scope readback → 10 status paths, wszystkie w allowliście.
- Data readback → `gra/data/civ-matrix.json` bez diffu.
- Dispatch readback → `00-dispatch.md` zawiera kompletny dispatch runda 2/5; baza i zakazy zgodne.
- Typecheck: `gra/node_modules` w tym worktree jest nieobecne; lokalne `esbuild` i `tsc` są nieobecne. Wynik klasyfikuję jawnie jako `INFRA-MISSING`, nie jako zielony typecheck. Główne drzewo ma TypeScript 5.9.3, ale nie jest lokalną przypiętą zależnością tego worktree.

## ŚLAD PROCESOWY / UWAGI

- Niezależny Evaluator zakończył parent Kanban task `t_e46ddc0b` jako approved; jego świeże wyniki i lista zarzutów są obecne w parent handoff/event readback.
- W katalogu runu nie ma osobnego pliku `02-evaluator.md`, mimo że `00-dispatch.md` wymienia go jako artefakt. Jest to nota kompletności śladu procesowego, nie nierozstrzygnięty zarzut gameplay; integrator powinien zachować parent Kanban receipt jako dowód Evaluatora i nie przedstawiać brakującego pliku jako nieistniejącego artefaktu.
- Final Control nie integruje, nie commituję, nie pushuję i nie deployuję.

## NASTĘPNY KROK

Workerless `INTEGRATION_REQUIRED`: orkiestrator może zintegrować wyłącznie zatwierdzone hunki z 8 plików kodu/testu oraz artefakty runu, po ponownym sprawdzeniu dirty worktree i bez `git add -A`/`git add .`. Po integracji potrzebne są osobne bramki READY_FOR_DEPLOY oraz deploy/push.

## ZMIANY/COMMIT

Final Control nie zmienił plików implementacyjnych. Utworzono wyłącznie ten raport; brak commita.

## DEPLOY/PUSH

NIE WYKONANO
