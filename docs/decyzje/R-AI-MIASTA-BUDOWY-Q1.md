# R-AI-MIASTA-BUDOWY-Q1 — państwa-miasta prawie nie budują

**Status:** 🟡 ECHO **A** (2026-08-05) — W TRAKCIE audyt AutoBot  
**Źródło:** Maciej 2026-07-29 ~02:04 · paczka 2/2

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **R-AI-MIASTA-BUDOWY-Q1** | **A** | Najpierw **audyt** (diag + raport) → dopiero potem jedna mała dźwignia (osobna fala / zgoda) |

## AC (faza audytu)

1. Raport w tym pliku (lub dopisek §Audyt): dlaczego kolejka budynków MP jest pusta / rzadka.
2. Sprawdź: gate kosztów, priorytet produkcji, cap wojska vs budynki, `isProductionAllowed` / difficulty, osobne ścieżki city-state w `ai.ts`.
3. **ZAKAZ** zmiany liczb balansu w tej fazie — tylko diagnoza + rekomendowana jedna dźwignia.
4. Po audycie: krótka rekomendacja A/B dla fixu (nie wdrażaj fixu bez osobnego sygnału, chyba że Grok zatwierdzi jednoznaczny bug-gate).
