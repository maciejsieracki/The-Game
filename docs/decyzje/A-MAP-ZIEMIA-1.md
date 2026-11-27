# A-MAP-ZIEMIA-1 — układ mapy typu Ziemia

**Status:** ZAMKNIĘTE (wdrożenie w kodzie)  
**Data:** 2026-07-24  
**Decyzja Macieja:** **B**

## Pytanie

Korekta szablonu Ziemi: północ za wysoko (Europa w złym pasie pod klimat), Antarktyda na dole do usunięcia.

## Opcja wybrana — B (korekta 2026-07-24 wieczór)

- **Ocean arktyczny** u góry playable area: ~30 heksów na mapie standardowej, skalowane.
- **Ocean południowy** u dołu: **ten sam** bufor (~30 heksów skalowanych) — oddech przed krawędzią mapy.
- **Antarktyda:** **USUNIĘTA** z mapy Ziemi (decyzja właściciela **5B**, R-WEB-MAP-EARTH-ANTARCTICA-Q1, 2026-11-26 — ECHO 5B w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; zgodnie z regułą C-MAP-Q3c w `gra/src/map/earth-land-mask.ts`). Pas polarny południowy (3 rzędy nad południowym buforem oceanu + bufor) ma **0 heksów lądu** — oczekiwanie testu `gra/tools/earth-template-test.cjs`.
- **Stan kodu vs. decyzja:** pomiar POLARZERO (r=85, środkowe 35–65% szerokości): brak lądu. Pełna szerokość pasa (test `ziemia standard/duzy: 0 lądu w pasie polarnym południowym`) pokazuje jeszcze **residualny ląd** w najwyższym rzędzie pasa (standard: 6 heksów przy r=85; Duży: 5 heksów terenu przy r=133; Ogromny (szablon): 7 heksów przy r=203). Usunięcie tych heksów wymaga zmiany danych maski/generatora w `gra/src` — poza zakresem tematu ANTARDOC; **DECISION_REQUIRED** (nie wdrożono).

## Zakres (ważne)

**Tylko** opcja kreatora **Typ świata → Ziemia** (`typ === 'ziemia'`).

**Nie** dotyczy:
- **Kontynenty** — proceduralne strefy Voronoi (`typ === 'kontynenty'`)
- Pangea, Wyspy

(Screen z Antarktydą = preset Ziemia, nie proceduralne Kontynenty.)

- `gra/src/map/earth-land-mask.ts`
- Test: `gra/tools/earth-template-test.cjs`

## Cytat

> „b” — bufor morza na północ o ~30 heksów proporcjonalnie + usunięcie Antarktydy (opcja B).
