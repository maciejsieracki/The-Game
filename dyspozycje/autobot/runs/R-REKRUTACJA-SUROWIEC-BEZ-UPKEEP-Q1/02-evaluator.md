# Evaluator report — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
GOAL: Rekrutacja sprawdza wyłącznie jednorazowy koszt zakupu jednostki; przyszłe utrzymanie nie blokuje zakupu i jest rozliczane w następnej turze wraz z istniejącymi konsekwencjami niedoboru.

## IZOLACJA, BAZA I ALLOWLISTA

- Pracowano wyłącznie w `Civ-clean-main-2026-08-20`; stare `Civ` i niezweryfikowany worktree nie były używane.
- Przeczytane: `README.md`, `.claude/skills/autobots/SKILL.md`, `dyspozycje/autobot/README.md`, `00-dispatch.md`, `01-operator.md`.
- Faktyczny `HEAD` to `47cdca15757efb89d5e634e9e9ddff370925708d`; `47cdca15` jest jego przodkiem i dokładną bazą. Zarzut Operatora o HEAD `33f82650` nie potwierdza się w tym checkoutcie.
- Tematyczny diff względem HEAD: `gra/src/game/economy-upkeep.ts`, `gra/src/ui/cityPanel.ts`, `gra/tools/ai-recruit-upkeep-gate-test.cjs` oraz allowlistowy artefakt `gra/tools/recruitment-no-upkeep-gate-test.cjs`. W tych plikach nie ma zmian poza celem.
- Współdzielony worktree ma dodatkowo liczne zmiany innych tematów poza allowlistą (m.in. dokumentacja procesu, `battleScene.ts`, panele UI oraz `ai.ts`/`cities.ts`). Nie przypisuję ich temu runowi i nie rekomenduję integracji pełnego worktree; Final Control ma zatwierdzać wyłącznie allowlistę tematu.

## WERYFIKACJA KONTRAKTU

- Rekrutacja: `canAffordUnitRecruitFull()` i `pickUnitRecruitHint()` używają wyłącznie `unitStockCost()`. Pula dokładnie pokrywająca koszt zakupu przechodzi mimo braku rezerwy upkeep; niedobór samego zakupu odrzuca rekrutację.
- UI: `cityPanel.ts` wylicza `stockMissing` z `unitStockCost`, chip i komunikat nie doliczają przyszłego upkeepu.
- Następna tura: `turn-economy.ts` wylicza `totalUnitResourceUpkeep` per owner, a `main.ts` pobiera `resourceUpkeepUnitsByOwner` dopiero w bloku bankowania/upkeepu. Nie znaleziono poboru upkeepu w ścieżce zakupu.
- Player/AI/MP: helpery są ownerId-agnostic; testy potwierdzają tę samą bramkę dla gracza i AI, a osobny test AI/MP potwierdza ścieżkę `rekrutacja[]`, wykonanie zakupu i migrację legacy.
- Save/load: zmiana nie dodaje pola trwałego stanu; istniejące testy save/load przechodzą, więc migracja nie jest wymagana dla tego kontraktu.

## TESTY

- `node tools/recruitment-no-upkeep-gate-test.cjs` — **10 passed, 0 failed**.
- `node tools/ai-recruit-upkeep-gate-test.cjs` — **27 passed, 0 failed**.
- `node tools/ai-mp-rekrutacja-build-gate-test.cjs` — **21 passed, 0 failed**.
- `node tools/upkeep-test.cjs` — **73 passed, 0 failed**.
- `node tools/save-load-sort-test.cjs` — **4/4**.
- `node tools/fort-nodes-save-load-test.cjs` — **18 passed, 0 failed**.
- `node tools/fsa-autosave-test.cjs` — **55 pass, 0 fail**.
- `node node_modules/typescript/bin/tsc --noEmit` — **exit 0**.
- Testy sąsiednie: `unit-resource-upkeep-test` **3 passed, 4 failed** oraz `unit-stock-cost-test` **41 passed, 17 failed**. Failures dotyczą istniejącego driftu oczekiwań ×1 vs dane FALI 300 ×5; nie dotyczą zmiany gate'u. Zostają jako uwaga, nie jako PASS baseline.
- Początkowy `EPERM` przy testach dotyczył wyłącznie zapisu tymczasowego entry/bundle przez skrypty; po kontrolowanym uruchomieniu testy bundlują się i przechodzą. Bundler/esbuild nie jest blokadą.

## BLOKADY / UWAGI

- Brak blokady mechaniki tematu i brak blokady bundlera/esbuilda.
- Worktree jest zanieczyszczony zmianami spoza allowlisty; to blokuje bezpieczną integrację pełnego stanu, ale nie podważa zweryfikowanego diffu tematycznego.
- Dwa czerwone testy sąsiednie wymagają osobnego tematu albo jawnej decyzji o aktualizacji ich oczekiwań do FALI 300.

## ROUTING

Route: **Final Control** dla tego samego ID, z instrukcją zatwierdzenia wyłącznie allowlisty tematu i pominięcia cudzych zmian worktree. Po pozytywnym Final Control dopiero orkiestrator może integrować. `READY_FOR_DEPLOY` nie wystawiono.

ZMIANY/COMMIT: brak commita; nie wykonano integracji, deployu ani pushu.
NASTĘPNY KROK: Final Control; następnie allowlist-only integration po jego akceptacji.
DEPLOY/PUSH: NIE WYKONANO
