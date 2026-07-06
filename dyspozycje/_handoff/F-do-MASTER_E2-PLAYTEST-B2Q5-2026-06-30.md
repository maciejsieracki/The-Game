# GRUPA F → MASTER: E2 PLAYTEST-MAPA + B2-Q5 chip→kamera

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-KANON** |
| **Data** | 2026-06-30 |
| **Obieg** | `_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `DYSPOZYCJA-GRUPA-F.md` |
| **Batch** | `E2-PLAYTEST-B2Q5` |

---

## Co wpięte (`main.ts`)

### E2 — gęstość świata w PLAYTEST-MAPA
- `resolvePlaytestMapaWorldDensity()` w `playtestMapaSwiata.ts`
- `generujSwiat(..., { worldDensity, mapSizeMenuLabel: 'Maly' })` w sandboxie mapy
- URL: `?density=low|medium|high` lub per oś (`?resources=duzo` …)

### B2-Q5 — chip buntu → kamera
- `onEventClick` revolt: `camCtrl.focusAt` + `openCityPanelForPlayer`
- Handoff źródłowy: `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` (część SILNIK)

---

## Bramka

| Test | Wynik |
|------|-------|
| world-density | 28/28 |
| smoke | OK |
| diplomacy | 140/140 |

**Backup:** `main.ts.bak-INTEGRATOR-E2-PLAYTEST-B2Q5-2026-06-30` · `Gra-podglad.html.bak-E2-PLAYTEST-B2Q5-2026-06-30`

---

## Kanon

| Plik | md5 |
|------|-----|
| `Gra-podglad.html` | **`AB471657E64C0D87F3BA7E3094DE0A1B`** |

**Poprzedni:** `5D965EB7…` (AUTO-WALKA-v2b)

---

## DoD Master

- [x] Review subagent (readonly) APPROVE/BLOCK — **APPROVE** 2026-06-30 (md5 dysk + bramka handoff)
- [x] ACK w `MASTER-WATCH.md`
- [x] Slack `#master` ACK

**Playtest Macieja:** 🟡 opcjonalny — E2 density (`?density=low|high`) + klik chip buntu → kamera
