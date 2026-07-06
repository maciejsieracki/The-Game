# PILNA KOLEJKA — 2026-06-27 (Maciej: zero „wiszenia”)

**Źródło:** audyt częściowych 🔵/🟡 z czatu MASTER + Grupa C.  
**Zasada:** każdy wiersz = **ROBIA** (lane) → **→ SILNIK: GOTOWE** (handoff) → build/test → Opus → kanon.

**Kanon techniczny dziś:** md5 `bf99e18b…` (ROBOCZA = `Gra-podglad.html`).

---

## P0 — SILNIK (main.ts + kanon) — start natychmiast

| ID | Zadanie | Stan | Handoff / pliki |
|----|---------|------|-----------------|
| **SIL-P0-01** | Opus review + playtest Maciej checklist OBL-MAP-01 §5 | **CZEKA Opus** | `GRUPA-C-do-SILNIK_oblezenie-mapy-kanon.md` |
| **SIL-P0-02** | OBL-S4: milicja w `collectSiegeDefRoster` (C3-Q6) | **✅ GOTOWE** | `main.ts` — `makeMilitia` gdy brak garnizonu |
| **SIL-P0-03** | OBL-S5: kolejka machin mapa (C3-Q8=C) | **✅ WPIĘTE** | `siegeMachines.ts` + panel + szturm |
| **SIL-P0-04** | Wire `setSiegePanelBesiegerCount` przy otwarciu panelu | **✅ GOTOWE** | `syncSiegePanelMeta()` w startMapSiege + klik |
| **SIL-P0-05** | Wpięcie D3-Q1 dyplomacja (callback z UI) | **✅ GOTOWE** | `buildDiplomacyPanelConfig` + `getPlayerEra` |
| **SIL-P0-06** | Integracja handoffów lane po `→ SILNIK: GOTOWE` | **✅ WPIĘTE** | `MASTER-do-SILNIK_SIL-INT-batch-2026-06-27.md` |

---

## P1 — UI

| ID | Zadanie | Owner | → SILNIK |
|----|---------|-------|----------|
| **UI-P1-01** | D3-Q1 modal wojny + przyciski akcji | **✅ GOTOWE** | SIL-P0-05 wpięte |
| **UI-P1-02** | A2 panel jednostki — weryfikacja vs mockup | **→ UI** | decyzja A2-Q4=A |
| **UI-P1-03** | HUD D1B wnętrza ekranów (odłożone A1-Q14=C) | **BACKLOG v1.1** | po P0 |

**Dyspozycja:** `dyspozycje/UI.md` § PILNE

---

## P1 — UNITS

| ID | Zadanie | Owner | → SILNIK |
|----|---------|-------|----------|
| **UN-P1-01** | C3-Q2 AI 3 poziomy oblężenia (pure logic) | **✅ GOTOWE → SILNIK** | `_handoff/UNITS-do-SILNIK_AI-siege-3poziomy.md` |
| **UN-P1-02** | Kontrakt milicja → RuntimeUnit dla szturmu | **✅ GOTOWE (SILNIK)** | `collectSiegeDefRoster` w main.ts |
| **UN-P1-03** | Machiny w bitwie 3D (już jest) — kontrakt do mapy S5 | **GOTOWE** | istniejący `battleScene` |

**Dyspozycja:** `dyspozycje/UNITS.md` § PILNE

---

## P1 — MAPA

| ID | Zadanie | Owner | → SILNIK |
|----|---------|-------|----------|
| **MAP-P1-01** | D-START: pełny klaster obcych typów (nie 1 stolica) | **✅ GOTOWE → SILNIK** | `_handoff/MAPA-do-SILNIK_spawn-obcy-klaster.md` |
| **MAP-P1-02** | OBL-S6 obóz 3D (C3-Q10=C) | **→ MAPA** | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **MAP-P1-03** | A5 — 10 poziomów miasta per cyw | **BACKLOG v1.1** | decyzja A5-Q1 custom |
| **MAP-P1-04** | A4-D4 ulepszenia — balans/qualifying hexes audit | **→ MAPA** | `terrain-improvements.json` |

**Dyspozycja:** `dyspozycje/MAPA.md` § PILNE

---

## P1 — CYWILIZACJE

| ID | Zadanie | Owner | → SILNIK |
|----|---------|-------|----------|
| **CYW-P1-01** | D-START miasta-kopie: AI defensywne (`ai.ts`) | **✅ GOTOWE → SILNIK** | `_handoff/CYWILIZACJE-do-SILNIK_AI-defensywne-kopie.md` |
| **CYW-P1-02** | Naprawa `civ-bonusy-test.cjs` (4 FAIL) | **✅ GOTOWE 30/30** | `_handoff/CYWILIZACJE-do-SILNIK_bonusy-D4-Q3.md` |
| **CYW-P1-03** | D4-Q3 pełne bonusy v1.0 (reszta) | **→ CYW** | `CYWILIZACJE.md` D-P0-03 |
| **CYW-P1-04** | Grupa D 5A — AI-zachowanie w Excel/JSON | **→ CYW** | `GRUPA-D-PACZKA-ABC-2026-06-27.md` Q5 |

**Dyspozycja:** `dyspozycje/CYWILIZACJE.md` § PILNE

---

## P2 — EKONOMIA

| ID | Zadanie | Owner | → SILNIK |
|----|---------|-------|----------|
| **EKO-P2-01** | B5 żywność imperium (`advanceEmpireFood` pełna) | **→ EKONOMIA** | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |

**Dyspozycja:** `dyspozycje/EKONOMIA.md` § PILNE

---

## Zamknięte dziś (nie wracać do pytań)

- C1-Q1…Q5, C2-Q2…Q7, C3-Q1…Q10 (decyzje)
- D-START-1B/2B/3A, N-1A…N-5B
- A-FOG jednostka, B-zasięg miasta (w kodzie)
- OBL-S1/S2 rdzeń oblężenia mapy
- Playtest walki sign-off Macieja

---

## Kolejność wykonania (Master) — zaktualizowano 2026-06-27 wieczór

```
✅ 1. UI D3-Q1 + SILNIK wire (SIL-P0-05) + getPlayerEra
✅ 2. CYW civ-bonusy 30/30 (CYW-P1-02)
✅ 3. SILNIK OBL-S4 milicja (SIL-P0-02) + S3 besieger count (SIL-P0-04)
✅ 4. UNITS AI 3-poziomy (UN-P1-01) → handoff SILNIK
✅ 5. MAPA obcy klaster (MAP-P1-01) → handoff SILNIK
→ 6. CYW AI defensywne (CYW-P1-01) → handoff SILNIK ✅
→ 7. SILNIK batch integracyjny: AI siege + foreign cluster + OBL-S5 machiny ✅
→ 8. MAPA obóz 3D (MAP-P1-02) po S5
→ 9. Opus + kanon (ROBOCZA zbudowana — czeka review)
```

**Melduj:** `<LANE>-DO-MASTERA.md` + wpis tutaj (status ROBIA/GOTOWE).
