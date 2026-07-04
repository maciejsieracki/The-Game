# Mapowanie ID — Design Grupa C vs rejestr lane

**Data:** 2026-07-03 · **Decydent:** Maciej / Design brand-book

Design w serii mockupów **Walka 1E** używa **C-04 / C-05** na pole oblężnicze. Rejestr lane (`REJEST-UX-MASTER.md`) ma starsze numery na **mapę świata** i osobno **C-19/C-20** na pole.

---

## Tabela mapowania

| Design mockup (Grupa C 1E) | Plik | Lane rejestr | Kod |
|----------------------------|------|--------------|-----|
| **C-04 Oblężenie** ✅ | `The Game - C04 Oblezenie v2 (1E).dc.html` | **C-19** HUD oblężenia na polu | `battleScene.ts` overlay |
| **C-05 Szturm muru** ✅ | `The Game - C05 Szturm muru v2 (1E).dc.html` | **C-20** mur 3D + szturm | `siegeWall.ts` + `battleScene.ts` |
| *(poza serią Design walka)* | — | **C-04** modal mapa | `cityAttackChoice.ts` |
| *(poza serią Design walka)* | — | **C-05** panel mapa | `siegeMapPanel.ts` |

**Flow gameplay:** mapa (lane C-04→C-05 modal) → pre-bitwa C-01 → pole z **Design C-04/C-05** (lane C-19/C-20).

**Status map-v2 (2026-07-04):** mockupy **C04 Oblezenie v2** + **C05 Szturm muru v2** — warstwa **HUD-only** + placeholder 3D (C-06 v4/C-07). ✅ Design · paczka u Macieja.

**Osobno:** hasło `C04-C05-oblęzenie-mapa-v2` = modal/panel **mapy świata** — **nie** to samo · HOLD do push GitHub.

---

## Stare briefy (archiwum intencji)

- `DESIGN-BRIEF-C04-C05-oblęzenie-v2.md` — opisywał **modal mapy**; **nie** aktualny deliverable Design C-04
- `DESIGN-BRIEF-C19-C20-mur-bitwa-v2.md` — scalony w **`DESIGN-BRIEF-C05-mur-v2.md`**

Przy porcie lane: czytaj **plik mockupu Design**, nie stary numer w briefie.
