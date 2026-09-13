# HANDOFF DLA INTEGRATORA / DEPLOYMENT AGENTA

## Temat

- TEMAT: `R-KREATOR-DOLNA-NAWIGACJA-Q1`
- FINAL CONTROL: Kanban `t_3734405d`, run `27`
- WERDYKT: `PASS-WITH-NOTES`
- GOTOWE DO: allowlist-only integration
- `READY_FOR_DEPLOY`: NIE — wymaga osobnej integracji i bramki deploymentu

## Branch i ref

- REMOTE: `origin/hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1`
- PRODUCT IMPLEMENTATION HEAD: `70172f758c6a7506d46c5885c5a56962a6732d81`
- BASE RECORDED BY FINAL CONTROL: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- WORKTREE USED: `/home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs`

## Zakres do integracji

Allowlist-only:

- `gra/tools/newgame-bottom-navigation-test.cjs`
- `dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/**`

`gra/src/ui/newGameFlow.ts` nie został zmieniony. Nie przyjmować zmian produkcyjnych spoza powyższej listy ani nie wykonywać hurtowego resetu/clean/stash.

## Dowody Final Control

- Runtime Chromium/Playwright: **70/0**
- Viewporty: `2048x1080` i `3840x2160`
- `deviceScaleFactor=1`
- Wstecz/Dalej/Start: widoczne, klikalne, poprawny przepływ kroków
- Mutant ukrywający `.nav`: wykryty, `node --check` exit `0`, runtime exit `1` zgodnie z oczekiwaniem
- Typecheck: exit `0`
- Vite build: exit `0`, `888` modułów, `27.67 s`
- Testy referencyjne: logic `213/213`, tech-tree `19/0`, research `33/33`, unit-replace `13/13`, combat `6/6`
- `newGameFlow.ts` SHA-256: `7ba486932b017a8f271d339f289ebb957c6c0498d18b20747962d2b3c6464113`
- Test regresji SHA-256: `8620ece3115a71bfe117496b6ce3204ea53b551420f3a8a4a3214cd338a844c7`
- Browser: Chrome for Testing `151.0.7922.34`
- Final Control routing: `gpt-5.6-luna` / `openai-codex` / `max` / Fast `priority`

## Znaczenie PASS-WITH-NOTES

Uwagi nie dotyczą tego tematu ani kodu produkcyjnego:

- pre-existing `start-preview-test.cjs`: `1/5`;
- pre-existing `ruch-swiata-tempo-test.cjs`: `33/2`;
- pre-existing stale settings-grid oracle: `66/4`;
- domyślny executable Playwright był niedostępny; użyto jawnie zweryfikowanego Chromium 151 fallback.

Final Control potwierdził, że problem dolnej nawigacji nie występuje na ocenianym HEAD, a uwagi nie naruszają GOAL, dowodu, allowlisty ani granic tematu.

## Instrukcja przejęcia

1. Pobrać `origin/hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1` i porównać `origin/main...70172f758c6a7506d46c5885c5a56962a6732d81`.
2. Sprawdzić listę plików względem allowlisty.
3. Odczytać `03-final-control.md`, `03-final-control-evidence.md`, `final-control-receipt.json` i `final-control-progress.json`.
4. Wykonać integrację wyłącznie po własnym readbacku diffu i testów.
5. Po integracji uruchomić końcowe bramki na zintegrowanym stanie.
6. Do testu użyć bezpośredniego Vite oraz canonical testu z jawnie wskazanym Chromium, zgodnie z raportem; nie używać `npm run build` ani `npm run dev` do publikacji.
7. Merge i deploy nie zostały wykonane przez tego agenta; wymagają osobnej autoryzacji i procesu deploymentu.
