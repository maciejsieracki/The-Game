# INTEGRATOR → Opus 4.8: review batch F-PANEL-ROSTER-v1

**Tryb:** Ask (read-only) · **Werdykt:** APPROVE lub BLOCK (jedna linia + uzasadnienie)

**Kanon:** `Gra-podglad.html` · md5 `5949422D3C7A614E9F695B07663309D9`  
**Data:** 2026-06-26 · **Integrator:** Grupa F

---

## Co w batchu

1. **Panel-A + Panel-E → silnik** — gra czyta `map-gen-params.json` i `e-start-params.json` (wcześniej JSON był martwy).
2. **Roster 15** — `civs.json` 15 nacji, Sumer `typCywilizacji: sumer`, enum + archetypy dyplomacji.

**Playtest Macieja:** nie w scope — Maciej testuje dopiero przy grywalności v1.

---

## Bramka automatyczna (PASS)

| Suite | Wynik |
|-------|-------|
| logic-test | 203/203 |
| diplomacy-test | 135/135 |
| civ-bonusy-test | 30/30 |
| civ-roster-test | 11/11 |
| victory-test | 12/12 |
| ai-test | 198/198 |
| smoke | OK |

---

## Pliki do review (priorytet)

- `gra/src/data/map-gen-params-loader.ts`
- `gra/src/data/e-start-params-loader.ts`
- `gra/src/map/newGameMapDefaults.ts` (wire E2 + kreator)
- `gra/src/types/player.ts` (enum)
- `gra/src/game/diplomacy.ts` (ARCHETYPE_*)
- `gra/data/civs.json` (15 wpisów)

---

## DoD Opus

- [ ] Fallbacki JSON — brak klucza nie psuje gry
- [ ] 15 typów spójne: civs.json ↔ enum ↔ dyplomacja
- [ ] Brak oczywistej regresji mapgen (deposit/sight/dims)
- [ ] Brak BLOCKERów P0 w kodzie diff

**Po review:** dopisz werdykt do `docs/decyzje/OPUS-REVIEW-QUEUE.md` § F-PANEL-ROSTER-v1.
