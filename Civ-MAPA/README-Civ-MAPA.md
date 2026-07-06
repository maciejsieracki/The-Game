# Civ-MAPA — katalog działu (mapa / teren / render / miasta-render / surowce)

Wszystkie pliki **nie-kodowe** działu Civ-MAPA w jednym miejscu (dokumentacja + panel sterowania + podglądy).
Kod gry pozostaje w `../gra/src/` (scene.ts, map/*, render/cities.ts, stoneCity.ts, bronzeCity.ts, resources.ts).
Skrzynka z masterem pozostaje w `../dyspozycje/MAPA.md` i `../dyspozycje/MAPA-DO-MASTERA.md` (protokół — NIE przenoszę).

## Zawartość
- **DOKUMENTACJA-Civ-MAPA.md** — pełna dokumentacja deweloperska działu (architektura, geometria, generator, rzeki, miasta, surowce, interakcje z działami).
- **Parametry-Civ-MAPA.xlsx** — panel sterowania parametrami (teren, rzeki, biomy-światło, miasta kamień/brąz, surowce, mapowanie→JSON).
- **MAPA-TASKOW.md** — taski/milestone'y działu + konwencja nazw lane.
- **Gra-podglad-MAPA.html** — podgląd mapy świata (F1: teren, rzeki, biomy, miasta i surowce na mapie).
- **Gra-podglad-MIASTA.html** — podgląd miast epoki kamienia (10 poziomów, z/bez murów).
- **Gra-podglad-MIASTA-BRAZ.html** — podgląd miast epoki brązu (Grecja + Rzym; reszta cyw w toku).
- **Gra-podglad-ULEPSZENIA.html** — **START TU** — galeria 18 ulepszeń + warianty + wzgórze (Roblox, 2026-06-29). Opis: `docs/obieg/GALERIA-ULEPSZEN-TERENU.md`
- **Gra-podglad-ULEPSZENIA-ROBLOX.html** — kopia tego samego pliku
- **Gra-podglad-CUDA-ROBLOX.html** — galeria **19 cudów Antyku** 3D na heksie (aktywne / ruiny / porównanie). Decyzja Maciej A 2026-07-05.

## Zakres (wg MAPA-TASKOW)
Civ-MAPA = `src/render/scene.ts` + `src/map/*` + `src/render/cities.ts` (+ stoneCity/bronzeCity/resources).
Granica z Civ-MIASTO: MAPA = wizualne buildery miast; Civ-MIASTO = stan/logika (poziom, mury, produkcja).

Aktualizacja: 05.07.2026 (galeria cudów 3D Roblox).
