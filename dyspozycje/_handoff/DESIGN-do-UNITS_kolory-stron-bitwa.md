# Handoff — kolory stron bitwy (Design → UNITS/UI)

**Status:** GOTOWE (decyzja Macieja 2026-07-03)  
**Odbiorca:** lane UNITS + UI (port `battleScene.ts`)  
**MASTER:** wpina po review — nie teraz

---

## Co przesyłam

Decyzja UX + mockup: `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`  
Referencja wizualna: `docs/ux/claude-design/The Game - C06 Deployment v3 (1E).dc.html`

| Token | Hex | Użycie |
|-------|-----|--------|
| `--civ-battle-player` / Ty | `#3a6ad0` | lewa strefa, ATK label gdy gracz atakuje, panel wyboru, HP bar własnych |
| `--civ-battle-enemy` / wróg | `#c84040` | prawa strefa, OBR label, wróg |

Etykiety PL: **`ATK · Ty`** (niebieski) · **`OBR · wróg`** (czerwony).

---

## Co odbiorca ma zrobić (przy porcie C-06/C-07)

1. Zamienić `FACTION_ATK` / `FACTION_DEF` na kolory powiązane z **graczem**, nie rolą ATK/DEF w każdej bitwie.
2. Pionowe paski morale boków: gracz = niebieski, wróg = czerwony.
3. Usunąć zielony akcent na paskach HP strony gracza (niebieski zamiast zielonego).
4. Spójność z mockupem v3 — nie z emoji HUD.

---

## DoD

- [x] Batch 1 lane: `battleHudTheme.ts` + `FACTION_*` w `battleScene.ts`
- [ ] Playtest kanon (Maciej po MASTER): `Gra-podglad-BITWA.html` + T
- [ ] Gdy gracz broni miasto: **Ty** nadal niebieski — weryfikacja w batch 2 (`isPlayerSide`)

**Flaga:** spec GOTOWE · implementacja batch 1 ✅ · MASTER handoff `UI-UNITS-do-MASTER_grupa-C-1E-batch1-2026-07-03.md`
