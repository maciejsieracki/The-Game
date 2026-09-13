# HANDOFF DLA INTEGRATORA / DEPLOYMENT AGENTA

## Temat

- TEMAT: `R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1`
- FINAL CONTROL: Kanban `t_aebaafea`, run `25`
- WERDYKT: `PASS-WITH-NOTES`
- GOTOWE DO: allowlist-only integration
- `READY_FOR_DEPLOY`: NIE — wymaga osobnej integracji i bramki deploymentu

## Branch i ref

- REMOTE: `origin/hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- VERIFIED HEAD: `4fc53e9ed0a2ffb5333a5fa6963965aefc283fe5`
- PRODUCT IMPLEMENTATION HEAD: `ffefe905910437c5b7c8364bd6adcb3c3a0ee16e`
- BASE RECORDED BY FINAL CONTROL: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- WORKTREE USED: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`

## Zakres do integracji

Allowlist-only:

- `gra/data/ai-params.json`
- `gra/src/game/ai-difficulty-bonus.ts`
- `gra/src/game/ai.ts`
- `gra/tools/ai-difficulty-bonus-test.cjs`
- `gra/tools/city-state-start-units-live-test.cjs`
- `gra/tools/starting-army-first-city-live-test.cjs`
- `dyspozycje/autobot/runs/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1/**`

`gra/src/main.ts` nie ma diffu w tym temacie. Nie przyjmować zmian spoza powyższej listy ani nie wykonywać hurtowego resetu/clean/stash.

## Dowody Final Control

- Właściwy Excel: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`
- Excel SHA-256: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`
- Testy tematu: `90/0`, `16/0`, `18/0`, `31/0`, Chromium `25/0` i `13/0`
- Mutant starego mapowania gracza `1/2/3`: `87 passed, 3 failed`, exit `1`, mutant zabity
- Typecheck: exit `0`
- Syntax: exit `0`
- Map spacing: `0` naruszeń
- Browser: Chrome for Testing `151.0.7922.34`
- Final Control routing: `gpt-5.6-luna` / `openai-codex` / `max` / Fast `priority`

## Nota

Szeroki `ai-test.cjs` pozostaje `291 passed, 4 failed`; te same cztery błędy występują bajtowo identycznie na czystym HEAD i dotyczą istniejącego baseline handlu/dyplomacji. Final Control sklasyfikował je jako niezwiązane z tym tematem.

## Instrukcja przejęcia

1. Odczytać branch i porównać `origin/main...4fc53e9ed0a2ffb5333a5fa6963965aefc283fe5`.
2. Sprawdzić listę plików względem powyższej allowlisty.
3. Odczytać `03-final-control.md` i `03-final-control-evidence.md` z katalogu runu.
4. Wykonać integrację wyłącznie po własnym readbacku diffu i testów.
5. Po integracji uruchomić końcowe bramki na zintegrowanym stanie.
6. Merge i deploy nie zostały wykonane przez tego agenta; wymagają osobnej autoryzacji i właściciela procesu.
