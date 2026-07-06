# UI → MASTER · batch A1–A7 (2026-07-05)

**Status:** GOTOWE · lane NIE publishował roboczej

## Co w kodzie (gra/src/)

| Pt | Temat | Pliki |
|----|-------|-------|
| A1 | W4 rekrutacja + zakładki | `ui/cityPanel.ts` |
| A2 | C09 karty jednostek | `ui/unitRecruitCard.ts`, `cityPanel.ts` |
| A3 | Popupy deploy v5 | `battle/battleHudTheme.ts`, `battleScene.ts` |
| A4 | POLE-BITWY v4.1 | j.w. · marker `POLE-BITWY-20260705-v4.1-A4` |
| A5 | imp-* SVG budowa | `ui/buildModeHud.ts`, `icons/brand/improvement-icon-map.json` |
| A6 | C12 koniec v2 | `battle/endScreen1E.ts` |
| A7 | Infografiki jednostek | `ui/unitInfographic.ts`, `unitPanelHud.ts`, `armyStackHud.ts` |

**tsc:** `npx tsc --noEmit` w `gra/` — PASS

## Master robi

1. **Mapa:** `publish-robocza-snapshot.ps1` → `gra-robocza/Gra-ROBOCZA.html`
2. **Pole bitwy:** `npx vite build --config vite.oblezenie-bitwa.config.ts` → `Gra-ROBOCZA-POLE-BITWY.html`
3. Playtest Macieja — **blockery wizualne nadal B1–B5 u Design** (A-08 layout, HEX, Moc, C23, C12v3)

## Meldunki szczegółowe

`dyspozycje/UI-DO-MASTERA.md` sekcja ▶ START — wpisy A1–A7

**→ MASTER: GOTOWE-ROBOCZA-A-BATCH** · publish Master 2026-07-05 ~23:52

**Robocza md5 (plik):** `8dd89c81570cde129f6b4b50e83520ec` · stempel HUD **`2d9fc522`** · 23:52  
**POLE-BITWY md5:** `057b028c53ffda1c3c6b29395d021982` · marker **`POLE-BITWY-20260705-v4.1-A4`**  
**Bramka:** tsc=0 · smoke OK · `publish-robocza-snapshot.ps1` + oblezenie rebuild + hub
