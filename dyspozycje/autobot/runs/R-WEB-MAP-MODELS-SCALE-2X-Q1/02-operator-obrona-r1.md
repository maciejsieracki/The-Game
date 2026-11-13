STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MAP-MODELS-SCALE-2X-Q1
GOAL: skala x2 wizerunkow zloz oraz Fort/Posterunek na mapie swiata (3D); pozostale ulepszenia bez zmian.

## Odpowiedz na zarzuty (Evaluator R1)

1. Kolizja wizualna (main.ts poza allowlista) — PRZYJMUJE CZESCIOWO. Dopisany pomiar wierzcholkowy (nie bbox) w ttescie, liczby ponizej. main.ts NIE edytowany (poza allowlista). Zgloszone jako DECYZJA_WYMAGANA dla orkiestratora z danymi.
   Pomiar (jednostki HEX_R, heks pointy-top, apothem 0.866; baza -> po x2, najgorsze, plaski teren):
   - koń: wystaje -0.185 -> -0.042 (nadal w srodku heksu, ale 0.467 od srodka; maly model); lama/ruda: bez wystawania.
   - zelazo 0.012 -> 0.353, cyna 0.009 -> 0.347, zloto -0.025 -> 0.279, sol 0.263, glina 0.255, wegiel 0.214, miedz 0.206, bydlo 0.167, owce 0.048.
   - odleglosc najblizszego wierzcholka od srodka heksu (miasto): miedz 0.348 -> 0.092 (!), glina 0.391 -> 0.195, sol 0.359 -> 0.182, wegiel 0.366 -> 0.198.
   - odleglosc od srodka sasiedniego heksu: najgorsze zelazo 0.876 -> 0.520, cyna 0.891 -> 0.548 (test twardo: > 0.25 — PASS, nie siega srodka sasiada).
   Przyczyna: compactDepositAtEdge normalizuje szerokosc do 0.55 HEX_R i mnozy przez depositDisplayScale; x2 daje ok. 1.1 HEX_R szerokosci na jednym slocie przy wierzcholku N (z=-0.62). To wlasciwosc decyzji wlasciciela (x2 w jednym slocie), nie bug mnoznika.
   Koń mial wczesniej depositDisplayScale=2, wiec jest efektywnie x4 vs oryginal, ale jest tez malym modelem i NIE wystaje (-0.042).
   Propozycje korekt (zmierzone harnessem na faktycznym main.ts z podmienionym DEPOSIT_EDGE_R, zrzuty r2-propozycja-edge*-horse.png):
   - A: zostawic (x2 pelne, zloza zachodza na heksy sasiednie i blisko srodka; miedz do 0.09 od srodka).
   - B: DEPOSIT_EDGE_R 0.62 -> 0.50 lub 0.40: NIE pomaga (wystawanie 0.249 / 0.248, ale odleglosc od srodka spada do 0.048 / 0.031 — wchodzi w miasto). ODRZUCONE jako rozwiazanie.
   - C: skala 1.5 zamiast 2 (RESOURCE_MODEL_SCALE, 1 linia w resources.ts): wystawanie max 0.182, min odl. od srodka 0.214 (log info-r2-wariant-skala-1.5.txt) — kompromis, wymaga decyzji wlasciciela (zmienia cel x2).
   - D: x2 + zmiana slotu (np. przesuniecie na bok flat ±X lub wezszy DEPOSIT_TARGET_SPAN 0.55 -> 0.40) w main.ts — wymaga rozszerzenia allowlisty o main.ts.
   Rekomendacja: A albo C; decyzja wlasciciela przez orkiestratora. Nie zmieniam zakresu samodzielnie.

2. Dowod z syntetycznego harnessu i kopii compactDepositAtEdge — PRZYJMUJE. Test (gra/tools/map-models-scale-2x-test.cjs) wycina teraz DEPOSIT_* i compactDepositAtEdge z faktycznego gra/src/main.ts (biezacego i bazowego) i kompiluje do bundla; asercja: fragment identyczny z baza. Uzywa tez prawdziwego collapseToMergedMesh z progiem z main.ts (OVERLAY_COLLAPSE_MIN_MESHES=7) i reliefSurfaceSampler (wzgorza/gory) — zmiana funkcji w main.ts jest wykrywana. Nowe zrzuty (r2-przed/po): horse (koń + 6 sasiadow + miasto na srodku i na sasiedzie), ores (miedz/zelazo/wegiel/zloto/cyna/ruda), saltclay (sol/glina/owce/bydlo/lama/konie), forts, combo (zloze + ulepszenie + miasto), overview (961 heksow). Kamien/drewno: brak osobnego zloza w kodzie (potwierdzone w R1: las pomijany main.ts:2992/3020, kamien = ulepszenie Kamieniolom). NIE_ZMIERZONO: zrzut z pelnej gry (brak harnessu bootujacego main.ts w tools/, ZAKAZ npm run dev/build).

3. Hitbox/raycast, mgla, cien, las, sasiedztwo miasta — PRZYJMUJE W CZESCI.
   - Hitbox/raycast: ODRZUCAM jako luke: raycast w src/ jest tylko na terrainMeshes (input/picker.ts:192-196), na rootach jednostek (render/units.ts:5881,5914), sprite miast (render/cities.ts:686) i w battleScene; zloza (resourceOverlays) nie biora udzialu w zadnym raycaście (grep Raycaster|intersectObject w gra/src). Nie ma hitboxa do dopasowania.
   - Mgla: kod main.ts:3065-3070 ustawia group.visible i applyFogDimToObject3D na grupie — niezalezne od skali. Cien: castShadow na meshach modeli, skala grupy go skaluje. NIE_ZMIERZONO empirycznie w grze.
   - Sasiedztwo miasta/sasiedniego heksu: pomiar jw. (twardy prog min odl. od srodka sasiada > 0.25 w tescie); odl. od srodka wlasnego heksu (miasto) — patrz zarzut 1.
   - Las: Nakladka.Las pomijana w rebuildResourceOverlays (main.ts:2992,3020) — brak nakladania.

4. Wydajnosc tylko w malej scenie — PRZYJMUJE. Nowy widok overview: 961 heksow z zlozem (12 typow) + fort/posterunek co ~9 heks, 18 serii x 15 klatek, serie przeplatane base/cur. Wynik: draw calls 5632 -> 5632, trojkaty 301116 -> 301116, obiekty sceny 2030 -> 2030 (deterministyczne, asercje twarde). Czas klatki (swiftshader, maszyna wspoldzielona, load ~10): MIN przed 33.70 ms / po 25.60 ms, mediana 51.40 / 45.80 — roznica to szum (znak odwrocony w kolejnym przebiegu: poprzedni przebieg dal 38.30 -> 59.50 mediana). Asercja czasu zastapiona: min z serii <= 1.25x + 1 ms. Skala nie zmienia geometrii ani instancingu; koszt GPU to jedynie fill-rate. NIE_ZMIERZONO: GPU sprzetowe i pelna gra.

5. Szeroka regresja — PRZYJMUJE W CZESCI. Uruchomione WSZYSTKIE testy w tools/ importujace zmienione moduly (render/styleResources|improvements|resources; grep): kopalnia-cyny-render 23/0, zloze-zloto-render 7/0, web-memory-leaks 55/0, improvement-build-highlight-lifecycle 39/0, build-panel-ulepszenia-scroll-real-render 43/0, science-hub-unlock-icons-real-render 53/0, science-picker-tooltip-icons-real-render 141/0, map-models-scale-2x 285/0; tsc --noEmit EXIT=0. Testy PO; PRZED nie powielane (wszystkie zielone po zmianie, brak testow z golden-wartosciami skali — grep depositDisplayScale|SECTOR_SCALE|compactDepositAtEdge w tools/: tylko moj test). NIE URUCHOMIONO: wyrab-wycinka-nazwa-live-test (zapisuje zrzuty do runs innego tematu) oraz reszta z 121 plikow globu (nie importuja zmienionych modulow — grep; setki testow DOM/UI).

6. Koń efektywnie x4 — ODRZUCAM jako zarzut do kodu (udokumentowane zalozenie R1: x2 wzgledem stanu biezacego). Pomiar: koń po x2 NIE wystaje poza heks (-0.042), wiec zarzut 6 nie pogłebia zarzutu 1 dla konia; jedna linia wyjatku w wrapperze (styleResources.ts) jesli wlasciciel chce konia x2 od oryginalu — do decyzji.

## ZMIANY/COMMIT
Tylko: gra/tools/map-models-scale-2x-test.cjs (przepisany), dyspozycje/autobot/runs/R-WEB-MAP-MODELS-SCALE-2X-Q1/** (ten raport, gate-r2-*.txt, zrzuty/r2-*.png, info-r2-wariant-skala-1.5.txt). Kod gra/src bez zmian wzgledem 1f92665f4. Brak zmian w main.ts, gra-robocza, WERSJE.md, rust-port.

BLOKADY: DECYZJA_WYMAGANA (kosmetyczna): kolizja wizualna zloz po x2 (opcje A/C/D wyzej) — nie blokuje testow.
RUNDY: 2/5 (obrona R1)
NASTEPNY KROK: Evaluator R2 (opcjonalnie decyzja wlasciciela A/C/D).
DEPLOY/PUSH: NIE WYKONANO
