# DESIGN: cywilizacje i spawn na mapie (sprostowanie 2026-06-22)

ROSTER = GLOWNE TYPY cywilizacji (NIE lista 50 nacji).
- Obecnie 7 typow. Rozwazane +2: Celtowie, Germanie = 9. Kazdy nowy typ wymaga wlasnych jednostek specjalnych.

SPAWN NA MAPIE (skad bralo sie "50"):
- Glowna cywilizacja gracza laduje w terenie; wokol niej (~10 pol) powstaje ~9 miast TEGO SAMEGO typu,
  kazde >=9 pol od innych. Na typ: 10 miast (1 glowna + 9 satelitow).
- Miast na mapie = liczba_typow x 10:  5 typow -> 50 (stara liczba),  7 -> 70,  9 -> 90.
- Satelity = rywale tego samego typu (cel zwyciestwa §8d: zniszcz wszystkich rywali swojego typu).
  Uzywaja danych swojego typu -- nie maja osobnych danych.

WNIOSKI DLA SESJI:
- DANE-CYW: civs.json = TYLKO TYPY (7 -> 9), kazdy z religia + jednostka specjalna. NIE 50/70/90 wpisow.
- GENERATOR/AI: spawn klastrow (typ x10 miast, reguly odleglosci) = osobna robota silnika/mapy.
- UNITS: kazdy nowy typ (Celtowie, Germanie) = nowy zestaw jednostek specjalnych do zbudowania.

TODO: przeniesc do PROJEKT-GRY-master.md §8b przy bezpiecznej edycji (po hydracji).
