# DYSPOZYCJA EKONOMIA — żywność hybrydowa (decyzja Macieja Q1 HUD mapa)

**Data:** 2026-06-26. **Handoff:** `_handoff/MACIEJ-do-EKONOMIA_zywnosc-hybrid.md`. **NIE ruszać:** `main.ts`.

## Cel

Spec + kod lane (turn-economy / upkeep / cities):
1. `zapasyPanstwa` per owner (persist save/load).
2. Suwak imperium: `% zywność → rozwój` vs `% → zapasy państwa` (domyślnie doprecyzuj w spec; rekom. global per gracz).
3. Koszt żywności armii: `jednostki × kosztPerUnit` odejmowany od zapasów państwa co turę.
4. Cap zapasów: **brak** na v1.0.
5. Flaga głodu gdy zapasy < 0 → kontrakt UNITS (−8% maxHP/tura).
6. Miasto: istniejący `magazynZywnosci` / wzrost — bez psucia; strumień „rozwój” karmi dotychczasową logikę.

## DoD

- [ ] Spec 1 strona w `EKONOMIA-DO-MASTERA.md`.
- [ ] Parametry w `econ-params.json` (koszt/jednostka, default suwak).
- [ ] Test `tools/food-army-test.cjs` (lub rozszerzenie upkeep-test).
- [ ] Handoff `EKONOMIA-do-UI_zywnosc-hud.md` + `EKONOMIA-do-UNITS_glod-8hp.md`.

## STAN

Czytaj `EKONOMIA-STAN.md`.
