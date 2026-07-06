# MASTER → SILNIK — Backlog pilny (audyt 2026-06-27)

**Data:** 2026-06-27  
**Od:** MASTER (Maciej: wszystko „częściowe” + „docs/handoff” → zadania PILNE)  
**Do:** SILNIK — jedyny editor `main.ts` + kanon  
**Priorytet:** wykonaj **kolejność P0→P2**; lane cross → handoff, potem wpiecie

---

## P0 — Oblężenie C3 (logika przed obóz 3D)

| ID | Batch | Status | Pliki | DoD |
|----|-------|--------|-------|-----|
| **OBL-S1** | Q1, zegar głodu, Q3=B, reset | ✅ DONE | `main.ts`, `cityAttackChoice.ts` | dialog, pending kapitulacja, doStartGame reset |
| **OBL-S2** | save/load, validate odjazd, AI auto | ✅ DONE | `main.ts` | meta save, refresh markers, scanAutoSieges |
| **OBL-S3** | panel rozszerzony Q7 | ✅ DONE | `siegeMapPanel.ts`, `main.ts` | atrycja 8%, liczba oblegających, alert pending, placeholder machiny |
| **OBL-S4** | milicja 20% Q6 | ✅ DONE | `main.ts` | `collectSiegeDefRoster` → milicja gdy brak garnizonu |
| **OBL-S5** | machiny Q8=C | **✅ WPIETE** | `siegeMachines.ts`, panel, tick |
| **OBL-S6** | P0 | Obóz 3D Q10=C | **→ MAPA TERAZ** | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **OBL-S7** | AI 3 poziomy Q2 | **✅ WPIETE** | `siegeAi.ts`, test 17/17 |

Spec: `MASTER-do-SILNIK_oblezenie-C3-batchy.md`

---

## P0 — HUD / bramka tury (A1)

| ID | Decyzja | Status | Pliki | DoD |
|----|---------|--------|-------|-----|
| **HUD-S1** | A1-Q18 pusta produkcja | ✅ DONE | `main.ts` | blocking chip + klik otwiera panel miasta |
| **HUD-S2** | A1-Q18 dyplomacja blocking | ✅ DONE | `main.ts`, `diplomacyPendingHud.ts` |
| **HUD-S3** | ABC1=A D1B pełny + Power | ✅ DONE | `hud.ts`, `main.ts` |
| **HUD-S4** | A1-Q17 żywność | **✅ WPIETE** | B5 pełna liczba na HUD |
| **HUD-S5** | A1-Q15 Power overlay | **✅ WPIETE** | Wpływ + overlay 6 składników |
| **HUD-S6** | A1-Q16 overlay kult/rel | **✅ WPIETE** | zasięg 3D toolbar + minimapa F2 |
| **HUD-S7** | Opus → kanon | **CZEKA** | build roboczy OK |

Handoff UI: `UI-do-MASTER_hud-D1B-mockupy.md`

---

## P1 — Start / AI kopie typu (D-START)

| ID | Decyzja | Status | Lane | DoD |
|----|---------|--------|------|-----|
| **DST-S1** | Klaster gracza + nazwy | ✅ SILNIK | — | `cluster-start.ts` wpięte |
| **DST-S2** | Obcy typ = pełny klaster | **✅ WPIETE** | P0-02 `cluster-spawn.ts` |
| **DST-S3** | AI defensywne | **✅ WPIETE** | P0-05 `defensiveCopy` |
| **DST-S4** | Grupa D 5A AI Excel | **❌ CZEKA** | D-P0-01 lane CYW |

Handoff: `CYWILIZACJE-do-MASTER_miasta-kopie-typu.md`

---

## P2 — Mapa / wizual (odłożone krótko)

| ID | Decyzja | Status | Lane |
|----|---------|--------|------|
| **MAP-S1** | A5-Q1 10 poziomów + mury per cyw | **CZEKA MAPA** | `cities.ts`, `bronzeCity` |
| **MAP-S2** | A3-Q1 panel armii bogaty | **ODŁOŻONE** v1.0 | mockup przed kodem |
| **MAP-S3** | A1 mockup wnętrza (Nauka…) | **ODŁOŻONE** | na koniec per A1-Q14 |

---

## Kolejność wykonania SILNIK (dziś)

1. ~~OBL-S3 + OBL-S4 + HUD-S1~~ ✅ DONE 2026-06-27
2. **OBL-S5** (wymaga UNITS kontraktu — `_handoff/UNITS-do-MASTER_oblezenie-mapy-bitwy.md`)
3. Równolegle deleguj lane (Task Composer): **DST-S2** MAPA · **DST-S3/S4** CYW · **HUD-S2…S6** UI
4. **OBL-S6** → MAPA po S5
5. **OBL-S7** → CYW + wpiecie SILNIK
6. Build + testy → Opus review → kanon oficjalny

**Flaga:** po każdym batchu → `SILNIK-DO-MASTERA.md` append + `SILNIK-STAN.md`
