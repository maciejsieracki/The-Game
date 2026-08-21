# 03-final-control — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
GOAL: Rekrutacja sprawdza wyłącznie jednorazowy koszt zakupu jednostki; przyszłe utrzymanie nie blokuje zakupu i jest rozliczane w następnej turze wraz z istniejącymi konsekwencjami niedoboru.

## ZAKRES I IZOLACJA

- Kontrola wykonana wyłącznie w `Civ-clean-main-2026-08-20`.
- Przeczytane: `README.md`, `.claude/skills/civ-autobot/SKILL.md`, `00-dispatch.md`, `01-operator.md`, `02-evaluator.md`.
- Checkout: branch `work/clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`; baza dispatchu potwierdzona.
- Tematyczny diff względem HEAD jest allowlist-only: `gra/src/game/economy-upkeep.ts`, `gra/src/ui/cityPanel.ts`, `gra/tools/ai-recruit-upkeep-gate-test.cjs` oraz artefakt `gra/tools/recruitment-no-upkeep-gate-test.cjs`.
- Globalny worktree zawiera liczne obce zmiany poza allowlistą. Są oznaczone wyłącznie jako nota; nie zostały integrowane, resetowane ani usuwane i nie są przypisane do tego runu.

## WERYFIKACJA KONTRAKTU

- **Koszt zakupu:** `canAffordUnitRecruitFull()` i UI używają wyłącznie `unitStockCost()`; pula dokładnie pokrywająca koszt rekrutacji przechodzi mimo braku rezerwy upkeep.
- **Upkeep:** `unitResourceUpkeep()` oraz `totalUnitResourceUpkeep()` pozostają osobnym rozliczeniem; `resourceUpkeepUnitsByOwner` jest pobierane w ticku ekonomii następnej tury. Nie znaleziono poboru upkeepu w ścieżce zakupu.
- **Player/AI/MP:** wspólna bramka owner-agnostic; testy potwierdzają parytet gracza i AI oraz ścieżkę AI/MP `rekrutacja[]`, wykonanie zakupu i migrację legacy.
- **UI:** chip i komunikat pokazują wyłącznie brak jednorazowego kosztu rekrutacji; brak upkeepu nie tworzy blokady ani czerwonego chipa.
- **Save/load:** zmiana nie dodaje pola trwałego stanu ani migracji; testy zapisu/odczytu przechodzą.
- **TypeScript:** `node node_modules/typescript/bin/tsc --noEmit` — exit 0.
- **Rzeczywisty diff:** tematyczny zakres jest allowlist-only; obce zmiany globalnego worktree pozostają notą i nie wchodzą do zatwierdzenia.

## DOWODY TESTOWE

- `node tools/recruitment-no-upkeep-gate-test.cjs` — **10 passed, 0 failed**.
- `node tools/ai-recruit-upkeep-gate-test.cjs` — **27 passed, 0 failed**.
- `node tools/ai-mp-rekrutacja-build-gate-test.cjs` — **21 passed, 0 failed**.
- `node tools/upkeep-test.cjs` — **73 passed, 0 failed**.
- `node tools/save-load-sort-test.cjs` — **4/4**.
- `node tools/fort-nodes-save-load-test.cjs` — **18 passed, 0 failed**.
- `node tools/fsa-autosave-test.cjs` — **55 pass, 0 fail**.
- Testy sąsiednie `unit-resource-upkeep-test` i `unit-stock-cost-test` pozostają czerwone według raportu Evaluatora: istniejący drift oczekiwań ×1 vs dane FALI 300 ×5. To osobna nota, nie regresja tego gate'u.

## UWAGI / BLOKADY

- Brak blokady kontraktu rekrutacji, upkeep następnej tury, player/AI/MP, save/load lub tsc.
- Worktree globalny jest zanieczyszczony zmianami innych tematów; nie wolno integrować pełnego worktree. Akceptowalny jest wyłącznie allowlist-only zakres tematu.
- Nie wystawiam `READY_FOR_DEPLOY`; Final Control nie integruje, nie deployuje i nie pushuje.

## NASTĘPNY KROK

Orkiestrator może wykonać wyłącznie osobną integrację allowlist-only tego runu; następnie wymagana jest niezależna bramka deploy/push.

## ZMIANY/COMMIT

Brak integracji i brak commita.

## DEPLOY/PUSH

NIE WYKONANO
