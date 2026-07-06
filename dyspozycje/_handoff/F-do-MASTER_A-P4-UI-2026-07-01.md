# GRUPA F → MASTER: A-P4-UI (P2)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Batch** | `A-P4-UI` (A1-Q12 overlay + MAPA-F2 dblclick) |
| **Poprzedni ROBOCZA** | `EDF380D67364F89A9617A9AFE57C003E` (D-SOJUASZ-v12) |

---

## Scope

### Lane A (UI — już w `gra/src/ui/`)

- `hud.ts` — klik 🎭/⛪ na pasku [A] → overlay
- `minimapHud.ts` — klik = toggle zasięgu · dblclick = panel imperium
- `empireOverlayHud.ts` — pola opcjonalne A1-Q12a/b
- `siegeMapPanel.ts` — C3-Q7=A panel boczny

### Integrator F (wpięcie)

- `gra/src/main.ts`:
  - zweryfikowano `minimapLayers` + `getCultureOverlay` / `getReligionOverlay` w `showHud` (~3878, ~4070)
  - wzbogacono `buildCultureOverlayData()` / `buildReligionOverlayData()` o pola opcjonalne (progi, presja, szczęście)

**Handoff Master:** `MASTER-do-INTEGRATOR_A-P4-UI-2026-07-01.md`  
**Lane A:** `A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md`

---

## Bramka

| Test | Wynik |
|------|-------|
| world-density | **28/28** |
| wire-ekonomia | 29/29 |
| logic | 203/203 |
| combat | 6/6 |
| post-battle-map | 10/10 |
| army-merge-bounce | 2/2 |
| civ-bonusy | 33/33 |
| diplomacy | 143/143 |
| ai-test | 193/198 (5× T2S — pre-existing) |
| smoke | OK |
| battle-smoke | OK |
| vite build | OK |

**Backup:** `main.ts.bak-INTEGRATOR-A-P4-2026-07-01`

**Warstwa:** 🟡 cross (HUD + minimapa + overlay imperium)

---

## ROBOCZA (F)

| Plik | md5 |
|------|-----|
| **`Gra-podglad-ROBOCZA.html`** | **`4B360364201828D2F0D5B6C3C40EE556`** |
| **PLAYTEST-*** | ten sam bundle |

**Kanon finalna** (`Gra-podglad.html`) — **bez zmian** · md5 `ED4C8E2B…` (Master promocja po review)

---

## DoD

- [x] Klik Kultura/Religia na pasku [A] otwiera overlay (bez regresji toggle minimapy)
- [x] Dblclick 🎭/⛪ przy minimapie otwiera ten sam overlay (auto-wiring `buildMinimapLayers`)
- [x] Toggle zasięgu na mapie 3D nadal działa (klik pojedynczy)
- [x] Build + smoke OK · ROBOCZA md5 ≠ poprzedni (`EDF380D6…`)

---

## Co sprawdzić po wpięciu (playtest)

1. Pasek [A]: klik 🎭/⛪ → overlay z progami zasięgu / dominacji
2. Minimapa: pojedynczy klik ikony = toggle zasięgu 3D · dblclick = overlay imperium
3. Brak regresji toolbar mapy (toggle kultura/religia 3D)

---

## Następny (czeka w kolejce F)

**P3 B-B5-SPICHLERZ** — **nie** startować przed ACK Master tego batcha.
