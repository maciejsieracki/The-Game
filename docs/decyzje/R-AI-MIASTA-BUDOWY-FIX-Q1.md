# R-AI-MIASTA-BUDOWY-FIX-Q1 — fix produkcji budynków MP

**Status:** 🟡 ECHO **A** (2026-08-05) — W TRAKCIE AutoBot  
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

## Cytat / źródło

Maciej „1” = A (paczka 1/1 po audycie) · 2026-08-05.
