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
- **hex_A_unrotated.png / hex_B_rotated30.png** — referencja geometrii heksa (reguła: pointy-top, ZERO rotateY).

## Zakres (wg MAPA-TASKOW)
Civ-MAPA = `src/render/scene.ts` + `src/map/*` + `src/render/cities.ts` (+ stoneCity/bronzeCity/resources).
Granica z Civ-MIASTO: MAPA = wizualne buildery miast; Civ-MIASTO = stan/logika (poziom, mury, produkcja).

Aktualizacja: 24.06.2026.
