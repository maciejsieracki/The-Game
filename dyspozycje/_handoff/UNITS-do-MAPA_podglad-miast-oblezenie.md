# HANDOFF: UNITS → MAPA — podgląd miast (pełne modele) z murami

**Data:** 2026-06-25 · **Od:** Grupa C · **Do:** MAPA (render miast)

Przy pracy nad oblężeniem zrobiłem podgląd 9 PEŁNYCH MODELI MIAST per cywilizacja (z murami + bramą) — ale to jest materiał MAPY, nie bitwy. **Przekazuję go Wam.**

- Plik: `Gra-podglad-OBLEZENIE.html` (9 cyw: grecja, rzym, chiny, inka, zulu, egipt, sumer, celtowie, germanie; `buildBronzeCity(civ, 6, kolor, withWalls=true)`).
- Źródła podglądu: `gra/src/siegepreview/` (main.ts, index.html, vite.siegepreview.config.ts) — zbudujcie/rozwińcie po swojej stronie, jeśli przyda się jako galeria miast.
- Modele miast: `gra/src/render/bronzeCity.ts` (Wasz lane).

**UNITS zostaje przy SWOIM:** na mapie BITWY dokładam tylko element **MURU** (sam mur + brama, styl per cyw) jako strukturę bitewną — nie całe miasto.

— Grupa C
