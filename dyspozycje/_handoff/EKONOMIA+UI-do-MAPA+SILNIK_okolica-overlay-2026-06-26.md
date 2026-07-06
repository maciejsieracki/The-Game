# Handoff: Okolica na mapie 3D (Civ V overlay)

**Status:** GOTOWE (prototyp UX) · **Data:** 2026-06-26  
**Nadawca:** Grupa B (EKONOMIA+UI) · **Odbiorcy:** MAPA (render) + Integrator (SILNIK)

## Co przesyłam

1. **Prototyp UX (osobny HTML):** `Gra-podglad-OKOLICA-UX.html` (md5: `6244808E89057B446DC1677219AE33B6`)
   - Instrukcja: `docs/grupa-b/OKOLICA-UX-MACIEJ.md`
2. **Moduł overlay 3D:** `gra/src/render/cityOkolicaOverlay.ts`
   - API: `buildCityOkolicaOverlayGroup`, `syncCityOkolicaOverlay`, `disposeCityOkolicaOverlayGroup`
   - Zasięg (złota obwódka), obrabiane (zielone), etykiety 🍞🔨💰 + 👤
3. **Logika 👤 bez zmian:** `gra/src/game/okolica.ts` (`toggleTileWorker`, `resolveWorkedTiles`)
4. **Drawer bez mini-map (wzorzec):** `gra/src/okolicapreview/drawerShell.ts`

## Co odbiorca ma zrobić

### Integrator (`main.ts`)
- Przy `showCityPanel`: **nie** zamykać panelu; włączyć tryb overlay na scenie 3D
- Klik heks na mapie → `toggleTileWorker` (już jest szkielet `okolicaMapEditCityId` — scalić z drawerem otwartym)
- CSS dim pełnoekranowy (jak prototyp `#civ-ok-dim`), mapa **pełna szerokość** — drawer nad mapą z prawej
- Wyłączyć mini-mapę SVG w `cityPanel.ts` (zakładka Okolica = statystyki + legenda)

### MAPA (opcjonalnie v2)
- Dopracować czytelność etykiet na stromych heksach / lesie
- Tooltip hover jak Civ V (później)

## DoD (akceptacja Macieja)

- [ ] Jedna mapa — brak drugiej siatki w panelu
- [ ] Mapa nie ucięta (drawer float, nie split 55/45 z backdrop)
- [ ] Klik na heks = toggle 👤
- [ ] Plony widoczne na mapie

## Warstwa

🟡 cross-lane (`render/` + `main.ts` + `cityPanel.ts`)

## Prototyp ≠ gra

Prototyp **nie** dotyka `main.ts`, `ROBOCZA`, kanonu. Wpięcie = osobny batch Integratora po sign-off Macieja na `OKOLICA-UX.html`.
