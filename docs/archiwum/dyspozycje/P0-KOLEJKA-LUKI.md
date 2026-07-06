# P0 — Kolejka luk (częściowe + handoff only) · PILNE

**Data:** 2026-06-27 · **Owner weryfikacji:** Master Silnik · **Decyzje:** D-START, E1, Grupa D

Status: `ROBIA` | `GOTOWE-do-wpiecia` | `WPIETE` | `CZEKA-lane`

---

## Batch SILNIK-2026-06-27-P0 (Master wykonuje teraz)

| ID | Decyzja | Lane | Status | Deliverable |
|----|---------|------|--------|-------------|
| **P0-01** | Crash po N (`tickDiplomacy` + `traktaty`) | CYWILIZACJE + SILNIK | **WPIETE** | `diplomacy.ts` guard |
| **P0-02** | Obcy typ: pełny klaster miast (nie 1 stolica) | MAPA + SILNIK | **WPIETE** | `cluster-spawn.ts` + `applyClusterStartPlan` |
| **P0-03** | D-START-3A: pełna dyplomacja **po kontakcie** | CYWILIZACJE + SILNIK | **WPIETE** | `diplomacy-layers.ts` + `main.ts` |
| **P0-04** | D-START-2B: gracz — wojna/handel + modal D3-Q1=A | UI + SILNIK | **WPIETE** | callbacks + `pre_contact` w panelu |
| **P0-05** | Miasta-kopie: AI **defensywne** | CYWILIZACJE + SILNIK | **WPIETE** | `ai.ts` `defensiveCopy` + `main.ts` |
| **P0-06** | Build playtest | SILNIK | **WPIETE** | `Gra-podglad-ROBOCZA.html` md5 `428E4FD4BD76C46EBC1935AF4B343181` |

---

## → Grupa D (CYWILIZACJE) — po P0 batch

| ID | Decyzja | Status | Plik / AC |
|----|---------|--------|-----------|
| **D-P0-01** | Profil `kopia_typu_obronna` w Excel → `civ-ai.json` | **CZEKA-lane** | `CYWILIZACJE.md` § P0 · 5A |
| **D-P0-02** | Audyt bonusów per owner (`civBonusyForOwnerId`) | **CZEKA-lane** | test regresji |
| **D-P0-03** | Pełne bonusy v1.0 (3A paczka) | **CZEKA-lane** | UNITS/UI handoffy |

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md`

---

## → Grupa E (UI / MAPA / CYWILIZACJE) — osobne batchy

| ID | Decyzja | Lane | Status |
|----|---------|------|--------|
| **E-P0-01** | Menu S0 hybryda 5=C | UI | **CZEKA-lane** → `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |
| **E-P0-02** | Kampania/Multi Wkrótce 6=A | UI | **CZEKA-lane** (z E-P0-01) |
| **E-P0-03** | Wideo tło menu 7=A | UI | **CZEKA-lane** (asset + fallback) |
| **E-P0-04** | Złoża miedź/żelazo 8=B* | MAPA | **CZEKA-lane** → `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| **E-P0-05** | Ukryte złoża przed epoką 9=B | MAPA | **CZEKA-lane** (z E-P0-04) |
| **E-P0-06** | Zwycięstwo Power+rakieta 10=A* | CYWILIZACJE + SILNIK | **✅ DONE lane** → `CYWILIZACJE-do-SILNIK_victory-10A.md` |

---

## DoD batch P0 (Master)

- [x] `cluster-start-test.cjs` ZIELONY (obcy typ ≥2 miasta gdy klaster ma ≥2)
- [x] `diplomacy-test.cjs` ZIELONY
- [ ] Playtest: start kreator → N **bez** BOOT ERROR (Maciej) — checklist w `handoff-test-sesja-2026-06-28.md`
- [x] `Gra-podglad-ROBOCZA.html` zaktualizowany (md5 sesji 28.06: `0a049ccc2d195459a73a619b62a9b325`)
- [ ] diplomacy 135/135 — **3 FAIL** eskalacja CYW (SILNIK re-bramka po fix)
