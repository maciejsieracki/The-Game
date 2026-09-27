# 00-dispatch — R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2

TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923
RUNDA: 3/5
DATA: 2026-09-24
DOMAIN: GAME
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator GPT-5.6 Luna High / Evaluator GPT-5.6 Luna High / Final Control GPT-5.6 Luna High

**Role:** Operator recovery r2
**Kanban:** `t_60f63d49`
**Base:** `origin/main=a8c9cf6c181f688201dd45e6a5871da1b0eb1301`
**Worktree:** `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`
**Branch:** `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923`

## WYZWALACZ
Powrót po zarzucie Evaluatora: auto-manager/auto-build oraz AI `availableProduction` mogły nadal używać legacy kosztów; poprzednia próba recovery zakończyła się technicznym crashem przed terminalnym raportem.

## GOAL
Podłączyć wszystkie 5 pól produkcyjnych macierzy cywilizacji do realnego runtime produkcji, rekrutacji i rush dla gracza, AI i city-state.

## KRYTERIA KOŃCA — PRAWDA/FAŁSZ
- PRAWDA: realny `civKey` i resolver płyną przez auto-manager/auto-build oraz AI `availableProduction`; FAŁSZ, jeśli żywy consumer zostaje legacy-priced.
- PRAWDA: `node tools/civ-matrix-production-runtime-live-test.cjs` przechodzi w realnym Vite bundle + headless Chromium i obejmuje live auto-build/auto-manager z matrix-adjusted cost; FAŁSZ, jeśli gate jest tylko pure/injectable API.
- PRAWDA: 15 civs i wszystkie 5 parametrów są odczytane z `data/civ-matrix.json`; neutral oraz +/-10% są jawnie sprawdzone; player/AI/city-state/city-panel/world-end-turn są pokryte.
- PRAWDA: focused consumer, logic, typecheck, JSON validation i diff-check przechodzą.
- NOWE sprawdzenie: live auto-build/auto-manager i AI `availableProduction` assertions w `gra/tools/civ-matrix-production-runtime-live-test.cjs`.

## ALLOWLISTA
`gra/src/game/auto-manage.ts`, `gra/src/game/civ-matrix.ts`, `gra/src/game/production.ts`, `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, `gra/tools/civ-matrix-production-consumer-test.cjs`, `gra/tools/civ-matrix-production-runtime-live-test.cjs`, `gra/tools/civ-matrix-production-consumer-evidence.md`, ten run directory.
Zakazane: data files, `ai_*`, save schema, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, commit/push/merge/deploy.

## IZOLACJA
Worktree i branch jak wyżej, baza wcześniejszej pracy `a8c9cf6c`; jeden writer, bez resetu/checkout cudzych zmian.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Nie uznawać testu bundlującego wyłącznie `production.ts` ani testu z resolverem wstrzykiwanym za dowód runtime. Gate musi wywołać prawdziwy bundle `main.ts`, owner routing player/AI/city-state, auto-build/auto-manager oraz city panel/world-end-turn.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny brak z plikiem i funkcją/linią. Operator poprawia wyłącznie wskazany consumer/test w tym samym ID i worktree; po 5 rundach `LIMIT-5-EXCEEDED`.

## GRANICE I OBIEG
Obowiązuje `R-PROC-AUTOBOT.md` §9; szczególnie brak `npm run build/dev` w `gra/`, brak danych/ai_*/save-schema zmian, brak sekretów i brak publikacji. Obieg: Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY → osobna zgoda deploy/push.
