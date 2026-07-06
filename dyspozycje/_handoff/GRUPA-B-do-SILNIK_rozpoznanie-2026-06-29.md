# GRUPA-B → SILNIK — rozpoznanie kolejek (2026-06-29)

**Od:** Grupa B (EKONOMIA + MAPA + UI) · **Do:** Grupa F (SILNIK) + Master  
**Cel:** Potwierdzenie — **nic nie wisi w kolejce P0 lane→F** z sesji B1; co dalej robi lane vs inne działy.

---

## ✅ Lane → Silnik: WSZYSTKO PRZEKAZANE I WPIĘTE (P0 B1)

| Batch | Handoff | Lane | Silnik (`main.ts`) |
|-------|---------|------|---------------------|
| **F-B-PILNE** | `EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md` | ✅ | ✅ |
| **F-B-WYRAB-TARTAK** | `MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` | ✅ | ✅ |
| **F-B-TARTAK-DREWNO** | `EKONOMIA-do-SILNIK_tartak-drewno-access.md` | ✅ | ✅ (`placedImprovements` w `getResourceAccess`) |
| **UNITS −8% HP** | `UNITS-do-SILNIK_army-starvation-hp.md` | ✅ moduł | ✅ (w batchu PILNE) |

**Decyzje ABC B1 (wyrąb/tartak/+3P/dostęp drewna/tech gate):** lane **ZAMKNIĘTE** · `docs/decyzje/B1-wyrab-tartak-tech.md`

**Akcja F:** brak batchy P0 od Grupy B — **nie czekaj** na lane B1.

---

## 🔄 Lane EKONOMIA — ROBIA (nie Silnik, dopóki lane nie melduje GOTOWE)

| ID | Temat | Owner | Handoff | Uwaga |
|----|-------|-------|---------|-------|
| **EKO-P2-01** | Pełny tick B5 `advanceEmpireFood` | **EKONOMIA lane** | `EKONOMIA-do-SILNIK_B5-empire-food.md` | HUD B5 już w F · tick częściowo w `main.ts` — lane domyka logikę + testy · **NIE F** |

**Po GOTOWE od EKONOMII:** F = 1 batch wpięcia/weryfikacji + ROBOCZA.

---

## ⏸ BLOK — czeka Maciej ABC (nie lane, nie F)

| Temat | Owner po ABC | Plik |
|-------|--------------|------|
| Drzewko tech ↔ ulepszenia Q1–Q5 | **CYWILIZACJE + EKONOMIA** | `docs/decyzje/B1-tech-ABC-OTWARTE.md` |

**F:** nie implementuj sync tech — czeka litery Macieja.

---

## ↗️ NIE Grupa B — F już przekazał (28.06)

Patrz: `SILNIK-PRZEKAZANIE-LANE-2026-06-28.md` · UI · MAPA · CYW · Opus.

| Temat | Lane |
|-------|------|
| P1 mockup MIASTO, layout Civ V | UI |
| P1 `ownCultureShare` z mapy | MAPA + F |
| P1 save/load HP | UNITS + F |
| diplomacy 3 FAIL | CYW/DYPLO |

---

## Playtest Maciej (checklist po sesji 28.06)

`_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md` § AC · ROBOCZA md5 `0a049ccc…`

---

**Flaga:** **GRUPA-B P0 → SILNIK: PUSTA (domknięte)** · **EKO-P2-01 → lane EKONOMIA: ROBIA**
