# MASTER → SILNIK — batch integracyjny SIL-INT (2026-06-27)

**Status:** **WPIĘTE w `main.ts`** (MASTER wykonał pilne luki)  
**Cel:** domknięcie handoffów lane bez czekania na osobny czat SILNIK

---

## Co wpięto

| ID | Moduł lane | Integracja w `main.ts` |
|----|------------|------------------------|
| **SIL-INT-1** | MAP-P1-01 pełny klaster | `applyClusterStartPlan` → `plan.spawnCities` (już iteruje wszystkie miasta) |
| **SIL-INT-2** | UN-P1-01 `siegeAi.ts` | `scanAutoSiegesAfterAiTurn`, `maybeAiAssaultAfterMachines`, `executeSilentSiegeStorm` |
| **SIL-INT-3** | OBL-S5 machiny | `siegeMachines.ts` + panel + save/load + szturm z gotowych machin |
| **SIL-P0-05** | D3-Q1 dyplomacja | `buildDiplomacyPanelConfig` callbacks + `getPlayerEra` |
| **CYW-P1-01** | AI defensywne | `defensiveCopy: typCityCopyOwners.has(ownerId)` (już było) |

---

## Nowe pliki

| Plik | Rola |
|------|------|
| `gra/src/game/siegeMachines.ts` | Kolejka Taran/Wieża, tempo C3-Q8=C |
| `gra/src/game/siegeAi.ts` | (lane UNITS) pure logic AI 3 poziomy |

---

## DoD SILNIK (pozostało)

- [ ] `npx vite build --outDir $env:TEMP\civ-dist` → ROBOCZA
- [ ] Bramka: map-siege 6/6, oblezenie 27/27, siege-ai 17/17, cluster 35/35, smoke OK
- [ ] Opus review → `Gra-podglad.html`
- [ ] Playtest Maciej: oblężenie + machiny + AI szturm

---

## CZEKA lane (nie SILNIK)

| ID | Lane | Handoff |
|----|------|---------|
| MAP-P1-02 | OBL-S6 obóz 3D | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| UI-P1-02 | panel jednostki | weryfikacja mockup |
| CYW-P1-03/04 | bonusy reszta / Excel 5A | lane CYW |
| EKO-P2-01 | B5 żywność imperium | lane EKONOMIA |

**Flaga:** **→ SILNIK: WPIĘTE** · czeka build + Opus + kanon
