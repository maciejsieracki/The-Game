# R-BATTLE-TEMPO-UI — panel Tempo przy minimapie bitwy

**Data:** 2026-08-04  
**Status:** ZAPISANA · **Q1=A** · **Q2=B**  
**Ekran:** Bitwa 3D — panel **TEMPO** nad minimapą

## Decyzja Macieja (ECHO)

- **Q1 = A:** Rząd panelu = **Pauza · − · + · Komputer (AUTO)**. Bez osobnych przycisków ×1/×2/×4.
- **Q2 = B:** Aktualna prędkość **tylko w tooltipach** przycisków − i + (`title`), **bez** widocznej etykiety ×N między przyciskami.

## Sytuacja (przed zmianą)

Rząd przycisków (`battleScene.ts` + `TEMPO_SVG` w `battleHudTheme.ts`):

| Przycisk | Ikona | Skutek |
|----------|-------|--------|
| Pauza | \|\| | pauza |
| ×1 | ▶ | prędkość 1 |
| ×2 | ▶▶ | prędkość 2 |
| ×4 | ▶▶▶ | prędkość 4 |
| AUTO | skrzyżowane miecze | auto-rozegranie |

Silnik ma `SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]` — wyższe poziomy z klawiatury (**V**, zawijanie).

## Wdrożenie (kod)

- `gra/src/battle/battleHudTheme.ts` — SVG `minus` / `plus` / `computer` (monitor)
- `gra/src/battle/battleScene.ts` — ± po pełnej drabinie `SPEED_STEPS` (clamp 0..max, bez zawijania); AUTO = ikona komputera; tooltips `Zwolnij (teraz ×N)` / `Przyspiesz (teraz ×N)`

**Branch:** `cursor/feat-battle-tempo-ui-63a1` · czeka deploy.
