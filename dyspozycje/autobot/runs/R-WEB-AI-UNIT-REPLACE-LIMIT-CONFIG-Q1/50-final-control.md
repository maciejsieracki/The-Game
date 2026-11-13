# Final Control — R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1

STATUS: PASS
ETAP: 8/11 — niezależny Final Control zamknął weryfikację.
MODEL/EFFORT: gpt-6-luna / high (zgodnie z przydziałem).
ZAKRES: `gra/data/ai-params.json`, parser/fallback w `gra/src/game/ai-unit-replace-plan.ts`, wyłącznie import i użycie capu w `gra/src/main.ts`, oraz `gra/tools/ai-unit-replace-same-rules-test.cjs`.

## Weryfikacja

- Niezależnie uruchomiono `cd gra && node tools/ai-unit-replace-same-rules-test.cjs`: **PASS, 44 passed / 0 failed**.
- Niezależnie uruchomiono `cd gra && npm run typecheck`: **PASS**, `tsc --noEmit`, exit 0.
- `git diff --check`: **PASS**.
- `data.aiParams` pochodzi z `ai-params.json` (`gra/src/data/loader.ts`), więc wartość konfiguracyjna trafia do kodu gry. Wpis `ai_zamiana_jednostek_limit_udzial` ma wartość liczbową `0.1`.
- Loader przyjmuje skończoną, nieujemną liczbę; brak, tekst, `NaN` lub wartość nieskończona wraca do poprzedniej stałej `0.1`. Test regresyjny sprawdza konfigurację domyślną, zachowanie capu dla armii 35 jednostek (3), wpływ skonfigurowanego `0.2` (7), oraz fallback dla braku i tekstu.
- Wywołanie w `main.ts` przekazuje załadowany udział do istniejącego `aiUnitReplaceCap`. Domyślnie zachowana jest formuła `max(1, floor(10% armii))` dla niepustej armii oraz wynik 0 dla pustej.

## Uwagi zakresowe

W `gra/src/main.ts` znajduje się niezależny hunk z `Typ` i `Jednostka` w konstrukcji danych walki; pozostaje poza tym Final Control i nie wpływa na ocenę okablowania limitu. Nie oceniano równoległych zmian w `unit-card-stats.ts`, `hexContextTooltip.ts` ani `unit-context-card-test.cjs`.

Brak zastrzeżeń w ocenianym zakresie. Nie wprowadzono zmian kodu ani commita; ten raport jest artefaktem etapu 8.
