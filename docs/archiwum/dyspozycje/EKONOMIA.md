# DYSPOZYCJA EKONOMIA — podziałHandlu per City (1A, 3A)

**Data:** 2026-06-26. **Decyzje Macieja:** 1A, 3A (default 70/20/10). **NIE ruszać:** `main.ts`.

## Cel

1. Pola na `City` w `cities.ts`:
   - `podzialHandlu?: { procentNauka: number; procentPieniadz: number; procentLuksus: number }`
   - `podzialPracy?: { procentBudynki: number }` (przy okazji — spójność z toEconomyCity)
2. Init nowego miasta: default z `buildEconParams` (70/20/10 handel, 70 budynki praca).
3. `toEconomyCity()` — czytaj z miasta jeśli jest, inaczej global default.
4. Save/load: pola serializowane z miastem (już w cities[]).

## Handoff

`dyspozycje/_handoff/EKONOMIA-do-MASTER_podzial-per-city.md` — typy + przykład merge.

## DoD

- [ ] `toEconomyCity` używa per-city podziału.
- [ ] Test regresji: rozszerz `wire-ekonomia-test.cjs` o scenariusz per-city luksus 30%.
- [ ] Backup plików przed edycją.
- [ ] Meldunek w `EKONOMIA-DO-MASTERA.md`.

## STAN

Czytaj `EKONOMIA-STAN.md`.

---

## DO ZROBIENIA TERAZ

**[2026-06-29] EKO-P2-01 — ✅ LANE GOTOWE → INTEGRATOR**

| ID | Status | Handoff |
|----|--------|---------|
| **EKO-P2-01** | **→ INTEGRATOR: GOTOWE** | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |
| **B1 tech** | **→ INTEGRATOR: GOTOWE** | `_handoff/EKONOMIA+MAPA-do-SILNIK_B1-tech-sync-2026-06-29.md` |

**Następny lane (niski):** B1.4 auto vs ręczne pola pracy

---

## DO ZROBIENIA TERAZ (archiwum 2026-06-28)

**Od Macieja:** to **Twoja** robota, nie SILNIK. W czacie **Civ-EKONOMIA** napisz **`start`**.

| ID | Temat | Handoff |
|----|-------|---------|
| **EKO-P2-01** | Pełny tick B5 `advanceEmpireFood` | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |
| **B1 tech** | Drzewko ↔ ulepszenia | `docs/decyzje/B1-tech-ABC-OTWARTE.md` — **CZEKA litery Macieja** |

**Manifest Macieja:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md` · HUD B5 już w silniku · **NIE** `main.ts`

---

**[2026-06-28] MASTER → EKONOMIA: EKO-P2-01 (po P0 lane)**

| ID | Akcja | Handoff |
|----|-------|---------|
| **EKO-P2-01** | Pełny tick `advanceEmpireFood` (B5) | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |

**HUD B5 (wyświetlanie) = już w silniku** — nie powtarzaj. Lane robi **logikę ticku**.

---

## [2026-06-27] § PILNE — kolejka Macieja

**Source of truth:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| ID | Zadanie | Status |
|----|---------|--------|
| **EKO-P2-01** | B5 żywność imperium (`advanceEmpireFood`) | **DO ZROBIENIA** |

Handoff: `dyspozycje/_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` (utwórz jeśli brak).

**START:** `start EKO-P2-01` — priorytet P2 (po P0 SILNIK).
