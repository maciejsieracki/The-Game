# MAPA TASKOW: temat (milestone) -> task  +  jednolita konwencja nazw

## KONWENCJA NAZW (jednolita)  ->  Civ-<LANE>
Lane = domena PLIKOW (nie milestone), bo o kolizje decyduja PLIKI, nie etapy.
- Civ-MASTER  = koordynacja + recenzja (NIE koduje).
- Civ-SILNIK  = src/main.ts + wpinanie game/* + JEDYNY publisher Gra-podglad.html.
- Civ-UNITS   = src/render/units.ts + src/battle/*  (modele jednostek + bitwa).
- Civ-MAPA    = src/render/scene.ts + src/map/* + src/render/cities.ts.
- Civ-DANE    = Cywilizacje.xlsx / inne xlsx -> docelowe JSON-y.
- Civ-LOGIKA  = NOWE czyste game/*.ts (moduly logiki, bez main.ts).
- Civ-UI      = src/ui/* (panele, menu, HUD w grze) -- gdy potrzebny.

## ZASADA ZELAZNA
Tylko Civ-SILNIK dotyka main.ts i publikuje kanon. Dlatego WPIECIA sa SERYJNE.
NIE dziel wpinania na taski per-milestone (np. osobny "Civ-M4" + "Civ-M5" do wpinania) -- to ten sam
main.ts i sie zderza. Rownolegle moga isc tylko rozne PLIKI: Civ-LOGIKA, Civ-DANE, Civ-UNITS, Civ-MAPA, Civ-UI.

## MATRYCA: milestone -> ktory task to robi
| Milestone                    | Stan     | Task(i) odpowiedzialne                                                            |
|------------------------------|----------|-----------------------------------------------------------------------------------|
| M0 Fundament/dane            | DONE     | Civ-DANE / Civ-SILNIK                                                              |
| M1 Mapa/silnik bazowy        | DONE     | Civ-MAPA / Civ-SILNIK                                                              |
| M2 Ekonomia/miasto           | czesc.   | Civ-SILNIK (wpiecie produkcji/budynkow) + Civ-LOGIKA (upkeep.ts) + Civ-UI (panel) |
| M3 Walka                     | czesc.   | Civ-UNITS (bitwa B7/wizual) + Civ-SILNIK (walka z mapy, wpiecie manual/siege)     |
| M4 AI                        | todo     | Civ-SILNIK (wpiecie ai/victory, nowa gra) + Civ-LOGIKA (barbarians.ts)            |
| M5 Dyplo/cyw/spol.           | todo     | Civ-SILNIK (wpiecie diplo/culture/order) + Civ-DANE (cyw./religie/Celt+Germ)      |
| M6 Save/Menu/HUD             | todo     | Civ-SILNIK (wpiecie save) + Civ-UI (menu, HUD w grze)                             |
| M7 Przyszlosc                | pozniej  | nowe taski pozniej (Civ-LOGIKA / Civ-SILNIK wg tematu)                            |
| Render/Wizual                | czesc.   | Civ-UNITS (jednostki) + Civ-MAPA (mapa ku Civ VI)                                 |
| Infra/koordynacja            | biezace  | Civ-MASTER + Civ-SILNIK                                                            |

## JAK ZAKLADAC NOWE TASKI
- 1 task per LANE (wyzej). Wiecej rownoleglosci = dziel TYLKO Civ-LOGIKA lub Civ-DANE (osobne pliki),
  np. Civ-LOGIKA-barbarians, Civ-LOGIKA-upkeep.
- NIE zakladaj osobnego taska "do wpinania M_x" obok Civ-SILNIK -- to ten sam main.ts.
- Kazdy nowy task: podepnij folder Civ + wklej komunikat kanalu (czyta dyspozycje/<X>.md, pisze <X>-DO-MASTERA.md + w czat).

## MAPOWANIE ISTNIEJACYCH SESJI -> LANE
- "Civilization-master"      -> Civ-MASTER
- "Civ silnik"               -> Civ-SILNIK
- "Civilization Units"       -> Civ-UNITS
- "Civilization RENDER-MAPA" -> Civ-MAPA
- "DANE-CYW"                 -> Civ-DANE
- (brak)                     -> Civ-LOGIKA, Civ-UI (do zalozenia)
