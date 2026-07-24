# A-MAP-ZIEMIA-1 — układ mapy typu Ziemia

**Status:** ZAMKNIĘTE (wdrożenie w kodzie)  
**Data:** 2026-07-24  
**Decyzja Macieja:** **B**

## Pytanie

Korekta szablonu Ziemi: północ za wysoko (Europa w złym pasie pod klimat), Antarktyda na dole do usunięcia.

## Opcja wybrana — B (korekta 2026-07-24 wieczór)

- **Ocean arktyczny** u góry playable area: ~30 heksów na mapie standardowej, skalowane.
- **Ocean południowy** u dołu: **ten sam** bufor (~30 heksów skalowanych) — oddech przed krawędzią mapy.
- **Antarktyda:** **ZOSTAJE** — pełny szablon maski (bez `NR_LAND_MAX`); Antarktyda siedzi tuż nad południowym buforem oceanu.

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
