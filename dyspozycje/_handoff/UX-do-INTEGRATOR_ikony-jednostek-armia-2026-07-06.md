# UX → INTEGRATOR — KONTRAKT #8: ikony jednostek (emoji ⚔️ → SVG) w panelach armii/jednostki

**Data:** 2026-07-06 · **Od:** UX (czat 3) · **Dla:** INTEGRATOR
**Dlaczego INTEGRATOR, nie UX:** ikona jednostki jest składana w `main.ts` (poza lane UX = `ui/**`). UX zrobił już 1–7 (czyste ui/); to jest 8 — dotyka `main.ts`.

## CEL
Wszędzie, gdzie w panelach armii/jednostki widać teraz emoji **⚔️** jako ikonę jednostki, pokaż **SVG ikonę jednostki** (per typ, z brand booka). Zero zmian logiki/wartości/zaznaczania — tylko źródło ikony emoji→SVG + render raw.

## SKĄD BRAĆ (assety już w drzewie, nic nie trzeba dorabiać)
- Helper: `unitIconSvg(def: UnitDef | undefined, id?: string): string` w `gra-robocza\srcKopiaMaster\ui\icons\brandAssets.ts` — zwraca SVG @24 z `unit-icon-map.json` + `icons\brand\units\unit-*.svg` (fallback `_default`).
- Wzorzec renderu raw SVG w panelach: `svgThumbHtml(...)` / `mapUnitBrandIconHtml(...)` (już w `ui/`).

## CO ZMIENIĆ (pliki:linie — potwierdź w aktualnym HEAD klonu, mogły się przesunąć)
1. **`srcKopiaMaster\main.ts` ~5137** — `buildArmyStackHudState`: pole `icon` jednostki ustawiane jako emoji ⚔️ → `unitIconSvg(udef, u.typeId)` (`udef` jest w zasięgu). Stos armii = dolny pasek, NAJWYŻSZA widoczność.
2. **`srcKopiaMaster\main.ts` ~2758** — wiersze scalania/rozdzielania (`mergeUnitRow`): `icon` emoji → `unitIconSvg(def, u.typeId)` (`def` w zasięgu).
3. **Render raw w panelach** (dziś `esc(icon)` — po zmianie `icon` jest już SVG, więc renderuj SUROWO, nie przez `esc`):
   - `srcKopiaMaster\ui\armyStackHud.ts` ~168 (`esc(c.icon)` → raw)
   - `srcKopiaMaster\ui\unitPanelHud.ts` ~97 (`esc(u.icon)` → raw; źródło stanu też w main.ts)
   - `srcKopiaMaster\ui\armySplitPanel.ts` ~119 (fallback ⚔️ → `unitIconSvg`, raw)
   - `srcKopiaMaster\ui\armyMergePanel.ts` (analogicznie, wiersz jednostki)

**Alternatywa** (jeśli wolisz nie tykać `main.ts`): przekaż w stanie `typeId` jednostki i niech panel sam woła `unitIconSvg(typeId)` + render raw — ale state-buildery i tak są w `main.ts`, więc pkt 1–2 są prostsze.

## ZASADA
Reskin: NIE zmieniaj logiki, wartości, zaznaczania, kolejności, eventów — tylko źródło ikony (emoji→SVG) i render (esc→raw). Zachowaj fallback, gdy `unitIconSvg` zwróci pusty string.

## WERYFIKACJA (bramka INTEGRATORA)
- Grep: brak `⚔`/`⚔` w `armyStackHud/unitPanelHud/armySplitPanel/armyMergePanel` i w state-builderach; `unitIconSvg` wywołany w pkt 1–2; render raw (nie `esc(icon)`) w pkt 3.
- `tsc = 0` · build z klonu wg zasad [14:05] (świeży clone, HEAD po push Macieja) · host-side kontrola stempla.

## PO WYKONANIU
Meldunek w `KANAL-PRACA.md` (INTEGRATOR): pliki:linie + wynik bramek + stempel; to wchodzi do najbliższego buildu razem z podmianami UX 1–7.
