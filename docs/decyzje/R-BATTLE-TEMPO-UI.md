# R-BATTLE-TEMPO-UI — panel Tempo przy minimapie bitwy

**Data:** 2026-08-04  
**Status:** CZEKA-NA-DECYZJĘ  
**Ekran:** Bitwa 3D — panel **TEMPO** nad minimapą

## Sytuacja dziś

Rząd przycisków (`battleScene.ts` + `TEMPO_SVG` w `battleHudTheme.ts`):

| Przycisk | Ikona | Skutek |
|----------|-------|--------|
| Pauza | \|\| | pauza |
| ×1 | ▶ | prędkość 1 |
| ×2 | ▶▶ | prędkość 2 |
| ×4 | ▶▶▶ | prędkość 4 |
| AUTO | skrzyżowane miecze | auto-rozegranie |

Silnik ma już `SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]` — wyższe poziomy tylko z klawiatury (**V**). Maciej: zamiast ×2/×4 → **+ / −** (pełna drabina do ×512); zamiast mieczy → **symbol komputera** (auto).

## ABC

`R-BATTLE-TEMPO-UI-Q1` — układ rzędu (rek. **A**).  
`R-BATTLE-TEMPO-UI-Q2` — jak pokazywać aktualną prędkość (rek. **A**).

## Pliki po decyzji

- `gra/src/battle/battleHudTheme.ts` — SVG `plus` / `minus` / `computer`
- `gra/src/battle/battleScene.ts` — przyciski ± po `SPEED_STEPS`, ikona AUTO
