# Dispatch — R-AI-GENERAL-WAR-5TURN-ATTACK-Q1 — runda 5

**ID:** R-AI-GENERAL-WAR-5TURN-ATTACK-Q1  
**Runda:** 5/5  
**Operator:** AutoBot Operator  
**Baza:** `origin/main` = `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
**Worktree/branch:** `/tmp/the-game-ai-five-turn-20261028`, `codex/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1-r4`  
**Tryb:** bez git add/commit/push/checkout/reset/stash, bez integracji i deployu.

## Goal

Odpowiedzieć na zastrzeżenie Evaluatora: wcześniejszy live harness wywoływał `runCampaignPlannerTurn()` bezpośrednio dla pięciu muster ticków i szóstej tury, a rzeczywisty `triggerPlayerEndTurn()` wykonywał się dopiero później. R5 zastępuje ten dowód sześcioma pełnymi cyklami EOT: pięć pełnych AI owner turns bez ataku, następnie szósta pełna tura EOT z ruchem wszystkich trzech co-located test units oraz fizycznego Generała na tę samą osiągalną stolicę przeciwnika.

## Acceptance

1. Live Chromium harness nie wywołuje `runCampaignPlannerTurn()` w pętli ani do szóstej tury. Każdy z pięciu muster ticków i atak przechodzi przez `triggerPlayerEndTurn()` oraz oczekuje na `turn > before && !endTurnInProgress`.
2. Po każdej z pięciu pełnych tur AI stan kampanii ma właściwy licznik (1–5), nie ma komendy `attack`, a trzy testowe jednostki oraz fizyczny Generał pozostają zebrani.
3. Szósta pełna tura generuje dla całej czwórki komendy `move` z jednym `targetCityId`, a po zakończeniu EOT wszystkie pozycje się zmieniły (`4/4`, w tym 3/3 synthetic + Generał).
4. Zachować focused test bliższego celu noPath/dalszego reachable-by-land, śmierci wodza i pokoju. Test-only mniejszy/land-connected fixture jest dozwolony; nie omijać produkcyjnego EOT ani nie zastępować go planner hookiem.
5. Deadline runu: 5 minut. Gdy pełny scenariusz przekroczy budżet, raportować faktyczny przerwany wynik i konkretny następny pomiar, bez claimu PASS.
6. Zapisać numeryczne testy, dokładną bazę, hashe i ograniczenia w `02-operator-runda5.md`. Evaluator i Final Control pozostają odrębnymi etapami.

## Allowlist

- `gra/tools/ai-general-war-campaign-live-test.cjs`
- `gra/tools/ai-general-war-campaign-live.vite.config.ts`
- `dyspozycje/autobot/runs/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1/00-dispatch-runda5.md`
- `dyspozycje/autobot/runs/R-AI-GENERAL-WAR-5TURN-ATTACK-Q1/02-operator-runda5.md`
- inne pliki produktu tylko gdy pełny EOT dowiedzie regresji wymagającej zmiany
