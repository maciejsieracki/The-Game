# Grupa A — indeks handoffów (→ SILNIK / MASTER)

> Pliki źródłowe w `dyspozycje/_handoff/` (append-only). Tu tylko spis + status.

**Batch zbiorczy (2026-06-27):** [`UI-MAPA-do-SILNIK_D1B-A4-batch.md`](../../dyspozycje/_handoff/UI-MAPA-do-SILNIK_D1B-A4-batch.md) — **GOTOWE lane · CZEKA main.ts**

---

## P0 — wpięcie F-HUD

| Handoff | Temat | Status |
|---------|-------|--------|
| `UI-MAPA-do-SILNIK_D1B-A4-batch.md` | Toolbar, WYKONAJ, buildMode, unitPanel, A4 raycaster | **GOTOWE lane** |
| `UI-do-MASTER_hud-D1B-mockupy.md` | Mockupy ABC1=A | GOTOWE |
| `UI-do-MASTER_A2-Q4-panel-jednostki.md` | Panel [H] | GOTOWE |
| `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md` | WYKONAJ + brama tury | GOTOWE spec |
| `UI-do-MASTER_hud-wojna-A1Q5.md` | Pasek wojen | GOTOWE |
| `MAPA-do-MASTER_ulepszenia-D4A.md` | API `improvement-build.ts` | GOTOWE (rev. kwalifikacja 27.06) |
| `MAPA-do-UI_minimap-data.md` | `getMinimapData()` D15=B | GOTOWE |

## P1 — po F-HUD

| Handoff | Temat | Status |
|---------|-------|--------|
| `UI-do-MASTER_map-layers-minimap-A1Q6.md` | Warstwy F2 obok minimapy | GOTOWE spec |
| `MAPA-do-UI_kultura-religia-zasieg-minimapa.md` | Toggle zasięgu A1-Q12 | GOTOWE spec |
| `EKONOMIA-do-UI_zywnosc-hud.md` | Żywność państwa B5 | SPEC |
| `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` | Chip buntu (cross B→A) | GOTOWE spec |
| `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` | Ikona 🔥 na heksie miasta | CZEKA MAPA |
| `MAPA-do-SILNIK_fog-widok-pola-A-FOG-Q1B.md` | **Mgła per jednostka** (Widok=Ruch, Zwiadowca 5) | **→ SILNIK: GOTOWE** |
| `EKONOMIA-do-GRUPA-A_zasieg-miasta-fog.md` | Zasięg pop + mgła per miasto | **CZEKA Grupa B** |

## Superseded (nie czytać jako stan)

| Handoff | Zastąpiony przez |
|---------|------------------|
| `UI-do-MASTER_hud-D1C.md` | D1B mockup + batch D1B-A4 |
| `MAPA-do-MASTER_ulepszenia-terenu.md` | `MAPA-do-MASTER_ulepszenia-D4A.md` |
| `UNITS-do-MASTER_robotnik-ulepszenia-z-mapy.md` | Robotnik OUT; A4 z mapy |
