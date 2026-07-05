# DESIGN → UI · POLE-BITWY v5 GAP (1E)

**ZLECENIE-ID:** `POLE-BITWY-v5-gap-2026-07-05`  
**Status:** ⏳ czeka na ZIP od Design  
**Pełna spec:** `docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`

---

## Pliki w ZIP (wypełnij po dostarczeniu)

| Plik mockup | GAP | Moduł kodu |
|-------------|-----|------------|
| `The Game - C23 Szczegoly bitwy v1 … (1E).dc.html` | GAP-01 | `endDetails1E.ts` |
| `The Game - C12 Koniec bitwy v3 … (1E).dc.html` | GAP-02 | `endScreen1E.ts` |
| `The Game - C06 Popup Formacja v1 … (1E).dc.html` | GAP-03 | `battleScene.ts` › deploy toolbar |
| `The Game - C06 Popup Konnica v1 … (1E).dc.html` | GAP-04 | j.w. |
| `The Game - C06 Popup Linie v1 … (1E).dc.html` | GAP-05 | j.w. |
| `The Game - C06 Popup Taktyka v2 … (1E).dc.html` | GAP-06 | j.w. |
| `The Game - C09 Roster lewy panel v5 … (1E).dc.html` | GAP-07 | `battleScene.ts` + `battleHudTheme.ts` |
| `The Game - C06 Deployment v5 … (1E).dc.html` | GAP-08 | top bar cluster (crop OK) |
| `The Game - C09 Tooltip karta jednostki v1 … (1E).dc.html` | GAP-09 | `battleScene.ts` › tooltip |
| `The Game - C22 Baner wyniku v1 … (1E).dc.html` | GAP-10 | opcjonalnie `battleScene.ts` |

---

## Mapowanie region → kod (uzupełnij po mockupach)

| Region UI | Plik/moduł | Uwagi |
|-----------|------------|-------|
| Szczegóły bitwy overlay | `endDetails1E.ts` | Pełny ekran · 2 kolumny · 3 fate |
| Koniec bitwy + replay | `endScreen1E.ts` | 3 CTA · ZWYCIĘSTWO/PORAŻKA |
| Popup Formacja | `battleScene.ts` › `_buildDeployToolbar` | 3 opcje F1/F2/F3 |
| Popup Konnica | j.w. | 2 opcje |
| Popup Linie | j.w. › `_renderDeployLinesPopup` | 2×3 przyciski |
| Popup Taktyka | j.w. › `_renderDeployTacticsPopup` | 4 doktryny |
| Roster puste sloty | `battleHudTheme.ts` › placeholder slot | |
| Tooltip karty | `battleScene.ts` › hover Q3 replacement | |

---

## Po porcie lane

- [ ] Build: `npx vite build --config vite.oblezenie-bitwa.config.ts`
- [ ] Playtest: `gra-kanon/Gra-podglad-POLE-BITWY.html`
- [ ] Flaga: `→ MASTER: GOTOWE` w `dyspozycje/UI-DO-MASTERA.md`

*Lane UI · The Game · 1E · POLE-BITWY v5 GAP · szablon handoff*
