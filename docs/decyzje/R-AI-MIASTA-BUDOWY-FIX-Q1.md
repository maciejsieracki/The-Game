# R-AI-MIASTA-BUDOWY-FIX-Q1 — fix produkcji budynków MP

**Status:** 🟢 WDROŻONE (2026-08-05) — AutoBot  
**Poprzednik:** `R-AI-MIASTA-BUDOWY-Q1` audyt ✅

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **R-AI-MIASTA-BUDOWY-FIX-Q1** | **A** | W `chooseCityProduction` / blok `infraOrder` (`defensiveCopy`) dopisywać kandydatów **tylko** gdy `opts.isProductionAllowed?.(cityId, bid) !== false` |

## AC

1. Przy podanym `isProductionAllowed`: studnia/garncarnia zablokowane tech **nie** dostają score ~450.
2. Na starcie Kamienia z bramką: wybór idzie w realnie budowalny item (np. Pałac), nie w `null` wyłącznie przez „wygraną” zablokowanej studni.
3. Bez callbacka `isProductionAllowed` — zachowanie jak przed fixem (testy bez bramki).
4. ZAKAZ: zmiany `ai-params.json`, capów wojska, absorb, major AI poza ścieżką `defensiveCopy` infra.
5. Test: rozszerz / dopnij `city-state-prod-audit-test.cjs` lub nowy celowany — A bez bramki = studnia; z bramką Kamienia = nie studnia.

## Dowód wdrożenia

| AC | Dowód |
|----|-------|
| 1 | `gra/src/game/ai.ts` ~1259–1267 — `prodAllowed?.(cityId, bid) === false` → `continue` przed `candidates.push` |
| 2 | `city-state-prod-audit-test.cjs` B3, E, F7 — wybór `palac` przy bramce Kamień |
| 3 | `city-state-prod-audit-test.cjs` A, G — bez callbacka wybór `studnia` |
| 4 | Diff tylko `ai.ts` infraOrder + test; brak `ai-params.json` / cap / major AI |
| 5 | `city-state-prod-audit-test.cjs` — 17/17 PASS (sekcje A, B, F, G) |

**Bramki:** `npx tsc --noEmit` 0 · `node tools/city-state-prod-audit-test.cjs` 17/17 · `ai-test.cjs` T7D-h/i/j/k PASS (pre-existing 8 fail poza zakresem)

**Branch:** `cursor/fix-mp-budowy-infra-gate-63a1`

## Cytat / źródło

Maciej „1” = A (paczka 1/1 po audycie) · 2026-08-05.
