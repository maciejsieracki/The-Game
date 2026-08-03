# R-LUDY-MORZA — Ludy Morza bez obozu na wodzie

**Status:** Q1 wdrożone (kod)  
**Data:** 2026-08-03  
**Plan:** `dyspozycje/PLAN-LUDY-MORZA-BEZ-OBOZU-2026-08-02.md`

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-LUDY-MORZA-Q1** | **A** | W Brązie: **zero obozów naval** na morzu; Ludy Morza spawnują już zaokrętowane na wodzie i rajdują. **Lądowe** obozy barbarzyńców w głębi lądu **zostają** (jak w Kamieniu; jednostki Brązu). |

**Cytat Q1:** *„R-LUDY-MORZA-Q1 a"* (+ wcześniejsza wizja: łódki w różnych miejscach, atak bez obozu na wodzie)

## Implementacja (wdrożone)

1. `spawnSeaCamps` — nie wołane w Brązie; `purgeNavalCamps` przy ticku usuwa naval z save.
2. `spawnSeaPeoplesRaiders` — embarked + seaRaider na heksach wody (limit `maxSeaCamps × unitsPerCamp`, co `spawnInterval` tur).
3. Lądowe `spawnCamps` bez zmian.

Pliki: `gra/src/game/barbarians.ts`, `gra/src/main.ts`, `gra/tools/barbarians-test.cjs`.

*Koniec.*
