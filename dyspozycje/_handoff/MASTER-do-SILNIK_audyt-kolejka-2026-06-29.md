# MASTER → SILNIK — Audyt kolejki (2026-06-29)

| Pole | Wartość |
|------|---------|
| **Status** | **→ SILNIK: WYKONAJ poniżej** |
| **Od** | MASTER (Maciej: audyt + wypchnięcie tematów) |
| **Kontekst** | Kod sesji 28.06 **WPIĘTY** · bramka **WYKONANA** · delegacja lane **WYSŁANA** |

---

## Werdykt MASTER (krótko)

| Warstwa | Stan |
|---------|------|
| **MASTER kod** | ✅ **PUSTO** — wszystkie batchy P0/HUD/OBL/D-START przekazane do SILNIK |
| **Decyzje D1–D15** | ✅ **15/15** w `docs/master/maciej/MACIEJ-KARTA-DECYZJI.md` |
| **SILNIK własna robota** | 🟡 **częściowo** — bramka OK, playtest Maciej + Opus **CZEKA** |
| **Lane (MAPA/UI/CYW/EKO)** | 🔴 **ROBIA** — delegacja 28.06 bez meldunków GOTOWE |
| **Blokada ABC Macieja** | 🟡 **B1-tech Q1–Q5** (`B1-tech-ABC-OTWARTE.md`) — nie blokuje playtestu |

---

## ✅ MASTER → SILNIK: WPIĘTE (nie koduj ponownie)

| ID | Temat | Dowód |
|----|-------|-------|
| P0-01…05 | D-START crash, klaster, dyplomacja kontakt, panel pre_contact, AI defensywne | `P0-KOLEJKA-LUKI.md` WPIETE |
| OBL-S1…S5, S7 | Oblężenie C3 + machiny + AI | backlog pilny ✅ |
| HUD-S1…S6 | D1B, blocking, Wpływ, B5, F2 overlay | sesja 28.06 |
| F-B-TARTAK-DREWNO | Drewno po tartaku | `EKONOMIA-do-SILNIK_tartak-drewno-access.md` |
| Save ulepszeń | `placedImprovements` meta | `main.ts` |
| DST-S1…S3 | Klaster gracza, spawn obcy, defensiveCopy | P0 batch |

**Publish:** `Gra-podglad.html` = ROBOCZA · md5 sesji: `0a049ccc2d195459a73a619b62a9b325` (SILNIK 28.06)

---

## 🟡 SILNIK — TWOJA KOLEJKA (wykonaj / domknij)

| # | Akcja | Priorytet | AC |
|---|-------|-----------|-----|
| 1 | **Playtest Maciej** — przypomnij checklist | P0 | `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md` § AC |
| 2 | **Opus HUD-S7** — przypomnij Maciejowi Ask | P0 | `docs/decyzje/OPUS-REVIEW-QUEUE.md` batch 28.06 |
| 3 | **diplomacy 3 FAIL** — eskalacja CYW | P1 | `132/135` — fix w `diplomacy.ts`, nie main.ts |
| 4 | **Po `→ SILNIK: GOTOWE` od lane** | P1 | bramka + ROBOCZA + meldunek |
| 5 | **civ-bonusy 4 FAIL** | P2 | lane CYW D-P0-02/03 — nie blokuje HUD |

**NIE koduj** OBL-S6, E-P0 menu, D-P0 Excel, E-P0 złoża — to lane.

---

## 🔴 Delegowane — NIE u SILNIK (status 29.06)

Brak meldunku **GOTOWE** od lane po delegacji 28.06 → **nadal ROBIA**.

| # | Temat | Lane | Plik start | Handoff |
|---|-------|------|------------|---------|
| 1 | OBL-S6 obóz 3D | **MAPA** | `MAPA.md` | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| 2 | E-P0-04/05 złoża | **MAPA** | `MAPA.md` | `GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| 3 | E-P0-01…03 menu S0 | **UI** | `UI.md` | `GRUPA-E-do-UI_menu-S0-5C.md` |
| 4 | D-P0-01 Excel AI | **CYW** | `CYWILIZACJE.md` | `MASTER-do-CYWILIZACJE_D-START-kopie-pilne.md` |
| 5 | E-P0-06 victory Power | **CYW** | `CYWILIZACJE.md` | `GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` |
| 6 | EKO-P2-01 tick B5 pełny | **EKONOMIA** | `EKONOMIA.md` | `EKONOMIA-do-SILNIK_B5-empire-food.md` |
| 7 | MAP-S1 miasta 10 poz | **MAPA** P2 | — | `A5-do-MAPA_miasta-10poziomow-mury.md` |

**Manifest Macieja:** `MASTER-DELEGACJA-LANE-2026-06-28.md`

---

## 🟡 CZEKA Macieja (ABC / playtest — nie MASTER)

| ID | Temat | Plik |
|----|-------|------|
| **B1 Q1–Q5** | Drzewko tech ↔ ulepszenia | `docs/decyzje/B1-tech-ABC-OTWARTE.md` |
| **Playtest** | Checklist HUD/tartak/oblężenie | handoff test 28.06 |
| **Opus** | Sign-off ROBOCZA → kanon | `OPUS-REVIEW-QUEUE.md` |

---

## Stare flagi `→ SILNIK: GOTOWE` (weryfikacja)

Te handoffy były **GOTOWE przed sesją 28.06** — zakładamy **WPIĘTE** w P0/HUD batchach. Jeśli bramka FAIL — meldunek z ID:

- `MAPA-do-SILNIK_spawn-obcy-klaster.md` → P0-02
- `MAPA-do-SILNIK_mgla-miasto-minimapa.md` → fog start
- `CYWILIZACJE-do-SILNIK_bonusy-D4-Q3.md` → civ-bonusy 4 FAIL (lane)
- `EKONOMIA-do-SILNIK_tartak-drewno-access.md` → ✅ sesja 28.06

---

## Meldunek SILNIK (szablon po wykonaniu § TWOJA KOLEJKA)

```
### [2026-06-29] SILNIK → MASTER: audyt kolejki

Playtest Maciej: CZEKA|OK|uwagi: …
Opus: CZEKA|APPROVE|BLOCK
diplomacy re-test: PASS|FAIL (…)
Lane bez GOTOWE: MAPA/UI/CYW/EKO — lista
→ MASTER: audyt-29.06 ZAMKNIĘTY|eskalacja …
```
