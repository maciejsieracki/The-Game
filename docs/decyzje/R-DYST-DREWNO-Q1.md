# R-DYST-DREWNO-Q1 — wymóg drewna (epoka Kamień)

**Status:** 🟡 ZAPISANA · **custom** (2026-08-06)  
**Cytat Macieja:** „R-DYST-DREWNO-Q1 drewno wymóg dla wszystkich jednostek epoki kamienia.”

## Decyzja (nie A/B/C z paczki)

**Wymóg drewna dla wszystkich jednostek epoki Kamień** (nie tylko dystansowych / łuczników).

## Uwagi

- Stary wpis rejestru mówił o dystansowych; Maciej rozszerzył na **całą epokę Kamień**.
- Koliduje z historyczną regułą „dystansowe = 0 surowca” (`R-UNIT-KOSZT-ŁUCZ`) — ta decyzja **nadpisuje** dla epoki Kamień.
- Przed kodem warto doprecyzować w paczce follow-up (ilość drewna, czy Procarz/Osadnik/Robotnik też, parytet AI) — albo wdrożyć po `działaj` z rozsądnym defaultem (np. 1 drewno) jeśli Maciej nie doprecyzuje.

## Następny krok

Po `działaj`: `units.json` / koszty surowcowe jednostek Kamień + parytet AI + panel/test.
