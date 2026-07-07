# E-map-worker-overlay — podgląd robotników na mapie świata

**Data:** 2026-07-07  
**Status:** ZAMKNIĘTE (Maciej: E-WORKER-1 = **A**)  
**Grupa:** E (Start/Meta/UI-shell) + Integrator F (wpięcie)

## Decyzja Macieja

**E-WORKER-1 = A** — podgląd robotników pokazuje **wszystkie pola ze 👤 ze wszystkich miast gracza** naraz (ownerId 0).

## Zachowanie

| Element | Ustalenie |
|---------|-----------|
| Przycisk HUD | Obok minimapy — toggle „Pokaż robotników w terenie" (👤) |
| Overlay mapy | Przeźroczyste ikonki 👤 na hexach z przypisanym pracownikiem |
| Zakres danych | Wszystkie miasta gracza (`resolveWorkedTiles` per miasto, agregacja kluczy) |
| Auto-włączenie | Wejście w tryb budowy ulepszeń (`buildModeOpen`) → overlay ON |
| Po wyjściu z trybu | Stan użytkownika zachowany — nie wymuszaj OFF |

## Implementacja

- `gra/src/game/okolica.ts` — `collectWorkedHexKeysForOwner`
- `gra/src/render/workerFieldOverlay.ts` — render ikon na mapie 3D
- `gra/src/ui/minimapHud.ts` — przycisk toggle przy minimapie
- `gra/src/main.ts` — stan `showWorkerOverlay`, auto przy build mode, sync sceny

## Weryfikacja

1. Toggle 👤 obok minimapy — włącza/wyłącza ikonki na mapie
2. Wejście w tryb budowy (🔨) — overlay włącza się automatycznie
3. Wyjście z trybu — overlay zostaje w stanie użytkownika
4. Wiele miast gracza — 👤 widoczne przy wszystkich polach ze wszystkich miast
