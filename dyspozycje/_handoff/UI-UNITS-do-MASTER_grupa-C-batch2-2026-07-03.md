# Handoff UI + UNITS → MASTER — Grupa C batch 2

**Status:** **GOTOWE** · lane 2026-07-03  
**Trigger:** Maciej A+B+C+D · dyspozycja `MASTER-do-UI-UNITS_grupa-C-batch2-2026-07-03.md`

---

## Zmiany

| Plik | Co |
|------|-----|
| `gra/src/battle/siegeHud1E.ts` | **NOWY** — HUD C-04 oblężenie + C-05 szturm (faza auto) |
| `gra/src/battle/endScreen1E.ts` | **NOWY** — ekran końca C-12 v2 (wieniec, 3 karty, Bohater, Powrót do mapy) |
| `gra/src/battle/battleHudTheme.ts` | `CMD_SVG`, `PB_SVG` |
| `gra/src/battle/battleScene.ts` | wire siege/end · top HUD 52px · cmd SVG · ATK·Ty / OBR·wróg |
| `gra/src/ui/preBattle.ts` | przyciski SVG C-01 |

**main.ts:** NIE RUSZANY

---

## Testy lane

| Test | Wynik |
|------|-------|
| `node tools/combat-test.cjs` | **6/6 PASS** |
| `npx vite build --outDir $env:TEMP\civ-dist` | **OK** (~8.5 MB) |

---

## Playtest Macieja (po kanonie)

- `Gra-podglad-BITWA.html` → T → POMIN → **C-12** pełny ekran
- `Gra-podglad-OBLEZENIE-BITWA.html` → **C-04/C-05** HUD
- Pre-bitwa → SVG przyciski

---

## Tor C (hub)

`docs/ux/claude-design/The Game - Walka Hub Grupa-C (1E).dc.html` — kafelki 7 ekranów · Design może merge do Przeglądu

## Tor D (A-08)

`dyspozycje/_handoff/UI-do-DESIGN_A08-START-2026-07-03.md` — START Design ulepszenia

---

**→ MASTER: GOTOWE** — bramka + kanon (tor B)
