# A-MAP-ZIEMIA-1 — układ mapy typu Ziemia

**Status:** ZAMKNIĘTE (wdrożenie w kodzie)  
**Data:** 2026-07-24  
**Decyzja Macieja:** **B**

## Pytanie

Korekta szablonu Ziemi: północ za wysoko (Europa w złym pasie pod klimat), Antarktyda na dole do usunięcia.

## Opcja wybrana — B

- **Ocean arktyczny** u góry playable area: ~30 heksów na mapie standardowej, skalowane `round(30 × innerH / 115)`.
- **Antarktyda:** wycięta z mapowania (`EARTH_TEMPLATE_NR_LAND_MAX = 0.74` w `earth-land-mask.ts`).
- Bez zmiany wymiarów heksów mapy z kreatora.

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
