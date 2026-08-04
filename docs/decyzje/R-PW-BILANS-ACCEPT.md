# R-PW-BILANS-ACCEPT — akceptacja oferty gracza przy bilansie PW ≥ 0

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #70

## Problem

Gdy **gracz proponuje** traktat (handel, pokój, NAP…), AI akceptowało ofertę z **ujemnym bilansem PW** (gracz oddaje mniej niż fair-min wymaga przy danej Relacji).

## Rozwiązanie

W `treatyPnGate` (`diplomacy-proposals.ts`): funkcja `playerTreatyBalanceReject` — gdy proposer = gracz, porównanie `myDisplay` vs `theirDisplay`; odrzucenie gdy `myDisplay < theirDisplay` z komunikatem „dopłać X PW".

Usunięty force-accept `umowa_handlowa` bez bilansu.

## Pliki

`gra/src/game/diplomacy-proposals.ts` · `gra/src/game/diplomacy-acceptance-points.ts`
