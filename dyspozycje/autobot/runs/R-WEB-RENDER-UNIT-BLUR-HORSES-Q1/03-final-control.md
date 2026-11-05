STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RENDER-UNIT-BLUR-HORSES-Q1
GOAL: znalezc warunek rozmycia koni/rydwanu i naprawic bez zmian logiki gry
ZMIANY/COMMIT: weryfikowany SHA 56716b8a96a242687e9a934b044456e4c9b96cc7 (baza eb32c5496 na 80919e2ae). Ten plik dodany osobnym commitem FC (SHA w raporcie orkiestratora).
TESTY (powtorzone przez FC):
- Allowlista: diff 80919e2ae..56716b8a9 = tylko gra/src/render/mapRenderStyle.ts (stala 1.5->2.0), gra/tools/render-unit-sharpness-{guard,measure}.cjs, runs/R-WEB-RENDER-UNIT-BLUR-HORSES-Q1/** (176 KB). Zero gra-robocza/WERSJE/rust-port/src-tauri/battle. git diff --check czysty.
- npm ci --ignore-scripts; tsc --noEmit EXIT=0.
- Straznik: PASS EXIT=0; mutacja pixelRatioMax 2.0->1.5: FAIL EXIT=1 (3 naruszenia, w tym wiersz DPR2); po przywroceniu PASS.
- measure --assert (Chromium SwiftShader): PASS, LOD0 ratio >= 0.9 dla DPR1 i DPR2; ruch (offX) ratio 1.02-1.28, brak spadku. EXIT=0.
- Regresje obrony (camera-zoom-block 4/0, city-badge-zoom-lod 67/0, unit-renderer-overlay-sync 17/0, unit-card-3d-preview-coverage 18/0): logi gate-reg-*.txt z EXIT=0, nie powtarzane.
WERDYKTY ZARZUTOW:
1. Przyczyna hipoteza: ODDAL - naglowek w 01 sprostowany na "najbardziej prawdopodobna, niepotwierdzona dla sprzetu wlasciciela" (zweryfikowane). Zrzut-46 nieobecny w repo.
2. LOD1-3 nadal miekkie / brak progu: ODDAL - prog zdefiniowany (--assert, LOD0 >= 0.9 vs natywna referencja), odroznia stan przed/po (mutacja). Zgloszenie dotyczyło widoku z bliska (LOD0); zmiana drabiny LOD to osobny temat (koszt GPU).
3. Straznik tylko stala: ODDAL - obrona dodala macierz behawioralna effectivePixelRatio dla DPR 1/1.5/2 + test pikselowy niezalezny od stalej.
4. Wydajnosc niezmierzona: ODDAL z zalozeniem - NIE_ZMIERZONO na realnym GPU. ZALOZENIE: koszt 1.78x pikseli tylko na DPR>=2 w medium jest akceptowalny (draw calls bez zmian 146; slaby sprzet dostaje low przez RECOMMENDED_QUALITY). Nie jest to blokada; wlasciciel moze zmienic stala jednym znakiem.
5. medium zrownane z high w pixelRatioMax: ODDAL - rozni je AA/cienie/mgla; alternatywa pr1.5+AA zmierzona gorzej (0.155 vs 0.279 natywnie).
6. Sztuczna scena: ODDAL - harness zgodny z produkcja (setSize false, pixelRatio z scene.ts:1626/3239); ruch zmierzony. NIE_ZMIERZONO: pelna gra z mapa/mgla/animacja chodu.
BLOKADY: brak. Zero NAPRAW.
NOTATKI DLA ORKIESTRATORA (osobne tematy, nie blokuja): (a) LOD1-3 na DPR2 nadal miekkie; (b) bufor nie odswieza sie przy zmianie DPR (scene.ts onResize) do nastepnej zmiany LOD - drugi kandydat na "czasem"; (c) pomiar na realnym GPU HiDPI; (d) zapytac wlasciciela o jakosc mapy i DPR.
KOLEJNOSC: zmiana dotyka tylko gra/ (web); parity-v2 (b520768b0) nie rusza mapRenderStyle.ts. Integracja: najpierw origin/main (34f24ef0e, brak konfliktu plikow), parity-v2 pozniej przy REPIN po zmianach weba.
RUNDY: 1/5 (FC)
NASTEPNY KROK: integracja orkiestratora (cherry-pick/merge SHA konczacego na main), potem decyzja o deployu
DEPLOY/PUSH: NIE WYKONANO
