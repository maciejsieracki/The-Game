# GRUPA-E → CYWILIZACJE + SILNIK: barbarzyńcy → buntownicy (ABC 11=C*)

> **Status:** **→ SILNIK: GOTOWE** (lane CYW 2026-06-28) · handoff `CYWILIZACJE-do-SILNIK_barbarians-11C.md`  
> **Decyzja Macieja:** 2026-06-27 · pyt. **11** — reguła epok (nie checkbox menu)

---

## Kanon produktowy

| Okres | Mechanika |
|-------|-----------|
| **Start gry → koniec epoki przed Średniowieczem** | **Barbarzyńcy** aktywni (`barbarians.ts`: obozy, spawn, agresja) |
| **Od epoki Średniowiecze** | Barbarzyńcy **wyłączeni**; **buntownicy** mogą się pojawiać na mapie |

### Buntownicy (od Średniowiecza)

- Powiązanie z istniejącą logiką **buntu / porządku** (`society-breakdown.ts`, `order.ts`, `cities.rebelState`)
- Spawn „gdzieś na mapie" — nie ten sam model co obozy barbarzyńskie; lane CYW + SILNIK definiuje kontrakt
- v1.0 kreator: tylko Kamień–Żelazo → barbarzyńcy **cały ten zakres**; cutoff Średniowiecza gdy epoka w drzewku

---

## Kod dziś

| Moduł | Stan |
|-------|------|
| `barbarians.ts` | Od tury 1, bez cutoff epoki |
| `barbariansActive(turn, params)` | Brak gate epoki Średniowiecze |
| Bunt / rebelianci | Częściowo w EKONOMIA/B2 — nie zastępuje barbarzyńców na mapie świata |

---

## DoD

- [ ] Gate: `barbariansActive` false gdy gra ≥ epoka Średniowiecze
- [ ] Hook awansu epoki: włączenie spawnu buntowników mapowych (spec minimal v1.0)
- [ ] Test: barbarians-test + regresja do epoki 3 w v0.1
- [ ] Meldunek CYWILIZACJE-DO-MASTERA

**Flaga:** CZEKA
