# MASTER → INTEGRATOR F: batch A-P4-UI (P2)

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA PO P1** — start po meldunku `D-SOJUASZ-v12` |
| **Data dyspozycji** | 2026-07-01 |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F |
| **Batch** | `A-P4-UI` (A1-Q12 overlay + MAPA-F2 dblclick) |
| **Poprzedni kanon** | md5 z P1 |

---

## Źródło (lane A — UI gotowe)

| Handoff | Rola |
|---------|------|
| `A-do-MASTER_PACZKA-P1-P4-2026-07-01.md` | meldunek · **ACK Master 2026-07-01** |
| `A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` | kontrakt UI |

**Pliki (już w `gra/src/ui/`):**
- `hud.ts` — klik 🎭/⛪ [A] → overlay
- `minimapHud.ts` — dblclick ikon → panel imperium
- `empireOverlayHud.ts` — pola A1-Q12a/b

**Opcjonalnie w `main.ts`:** wzbogacić `buildCultureOverlayData()` / `buildReligionOverlayData()` (patrz handoff lane A).

---

## AC Integratora F

1. Zweryfikuj podpięcie `minimapLayers` + overlay w `main.ts` (już częściowo w kanonie).
2. **Backup:** `main.ts.bak-INTEGRATOR-A-P4-2026-07-01`
3. **Bramka:** `world-density-test.cjs` 28/28 · `bramka-test-publish.ps1` · smoke
4. **Build** → publish **ROBOCZA** + PLAYTEST
5. **Meldunek:** `F-do-MASTER_A-P4-UI-2026-07-01.md` · **`→ MASTER: GOTOWE-ROBOCZA`**

---

## DoD

- [ ] Klik/dblclick minimapy + pasek [A] — overlay bez regresji toggle 3D
- [ ] Kanon zawiera P4 UI (≠ poprzedni md5 paczki A)

**Następny batch:** B-B5-SPICHLERZ — **nie** równolegle.
