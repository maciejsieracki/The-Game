# HANDOFF: UNITS → MASTER — oblężenie / taktyczne mapy bitwy w mieście

**Data:** 2026-06-25 · **Od:** Civ-UNITS · **Do:** Master (siege.ts/silnik) + MAPA (wizualia miast)
**Decyzja Naster.** Część po stronie bitwy robi UNITS; reguły mapy/oblężenia wpina Master.

## REGUŁY (Naster)
1. **Miasto BEZ muru** → atakująca armia, która podchodzi i blokuje miasto, zdobywa je **Z MARSZU** (bez taktycznej bitwy oblężniczej).
2. **Miasto Z MUREM** → trzeba przystąpić do **OBLĘŻENIA**:
   - Oblężenie trwa **1 turę** — podczas niej atakujący **buduje machiny**: **katapulta, taran, wieża oblężnicza**.
   - Dopiero po zbudowaniu machiny można atakować **BRAMĘ** (i mur). **Brama jest ZAWSZE** na mapie i jest zdobywalna — ale tylko po wybudowaniu oblężniczego ulepszenia.
   - Różne epoki = różne machiny; na razie wszystkie 3 dostępne już od wczesnego etapu (epoka Brąz w danych).
3. **Mur** daje broniącym **+200% Obrony** (patrz `miasto-params.json: bonus_obrona_mur_proc=200`).

## CO UNITS JUŻ ZROBIŁ
- **`data/units.json`** — dodane 3 machiny (Typ `Siege`, Klasa Specjalna, `Morale ucieczki: null` = niezłomne):
  - **Taran** (Battering Ram): wręcz, łamie BRAMĘ/mur (Uderzenie 10, Przebicie 8, Pancerz 8), słaby vs jednostki; Health 70.
  - **Katapulta** (Catapult): dystansowa (Atak dystansowy 16, zasięg 6, 10 pocisków), burzy mur/bramę zza linii; krucha (Health 25).
  - **Wieża oblężnicza** (Siege Tower): umożliwia piechocie wejście NA MUR (pomost), sama nie atakuje; Health 90, Pancerz 6.
  - Wszystkie: `Dostępna w epokach: Brąz;Żelazo`, Tech Brązownictwo.
- **Taktyczna mapa oblężnicza (wizualia)** — podgląd 9 map per cywilizacja: `Gra-podglad-OBLEZENIE.html` (mury per cyw z `render/bronzeCity.ts` + brama wyróżniona + pole bitwy).

## DO ZROBIENIA (kod — Master + UNITS strona bitwy)
1. **Stan oblężenia (engine, Master):** przy podejściu armii pod miasto: jeśli brak muru → `captureCity()` z marszu; jeśli mur → wejście w stan „oblężenie", 1 tura na budowę machiny (kolejka/akcja), potem taktyczna bitwa oblężnicza.
2. **Teren muru+bramy na polu bitwy (UNITS, battle-terrain.ts/battleScene.ts):** `BTerrain.Wall` (nieprzejezdny, jak River) + `Gate` (przejście dopiero po wyłomie). Generacja: łuk/pierścień muru danej cyw z jedną bramą od strony obrońcy; render muru z modelu cyw.
3. **Brama/mur jako cel z HP:** brama ma wytrzymałość; tylko machiny (taran/katapulta) zadają jej realne obrażenia (zwykłe jednostki ~0). Po wyłomie brama = przejezdna; wieża oblężnicza pozwala piechocie wejść na mur bez bramy.
4. **+200% mur** w obronie garnizonu (siege.ts już ma WALL_*; zgrać z `bonus_obrona_mur_proc`).
5. **Warianty epokowe machin** (później): epoka → zestaw machin.

## ZAŁOŻENIA do potwierdzenia (Naster)
- Machiny dostępne od Brązu (nie Kamienia) — historycznie; jeśli mają być od Kamienia, zmienię `Dostępna w epokach` + `Epoka`.
- Balans machin prowizoryczny (do strojenia razem z resztą jednostek).

— Civ-UNITS
