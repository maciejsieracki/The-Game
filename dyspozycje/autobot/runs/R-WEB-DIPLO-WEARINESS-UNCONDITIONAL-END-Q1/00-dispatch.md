# R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1 — dispatch (2026-11-13)

GOAL (decyzja właściciela 2026-11-13, dosłownie): „Jeżeli cena wynosi zero, to nie trzeba oddawać miasta. Generalnie na koniec zmęczenia wojną cywilizacja nawet mocniejsza powinna sama zaproponować pokój bezwarunkowy.” Szczegóły: DODATEK.

BAZA: origin/main d4d261e3b (FALA 686, zawiera krok 4b). Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/src/game/war-weariness.ts, gra/data/war-weariness-params.json, gra/src/game/diplomacy-ai-forced-peace.ts, gra/src/game/diplomacy-ai-offer-balance.ts, gra/src/game/diplomacy-proposals.ts (tylko ścieżki zmęczenia/ochrony i ceny pokoju), gra/src/game/ai.ts (WYŁĄCZNIE bloki zmęczenia wojną i propozycji pokoju przez silniejszą stronę), gra/src/main.ts (WYŁĄCZNIE tickAiAiWarWeariness i wywołania ścieżki zmęczenia; okablowanie do czystych funkcji jak w kroku 4b), istniejące testy w gra/tools/*.cjs tylko w asercjach o regule „jedno miasto nie kupi pokoju” i „zawsze miasto”, NOWY gra/tools/diplo-weariness-unconditional-end-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1/**.
ZAKAZ: wypowiadanie wojny, progi charakteru, liczby zaufania, etykiety, power-objective.ts, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A, spawn_task i inne narzędzia zakładające sesje.
