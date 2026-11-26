STATUS: PASS-WITH-NOTES
DOMAIN: GAME (weryfikacja wizualna i pomiar kosztu renderu, bez zmian kodu gry)
TEMAT: R-WEB-MAP-RIVER-RENDER-VISUAL-Q1 (RIVERS3A-VISUAL, tag RIVVISUAL)
GOAL: zrzuty z zywego Chromium dla kandydata ff5223f99 vs baza 7148b2f4e oraz pomiar czasu klatki; zamkniecie blokad FC RIVERS3A (zrzut czytelnosci poziomow rzek, pomiar kosztu sceny).
BAZA: kandydat ff5223f99c9d9b18ca056f84c031d2d953ec88f3; baza 7148b2f4e1b6b927ce572593e7379c641cc1bfe9.

ZMIANY-COMMIT: brak zmian w gra/**. Dodane wylacznie: dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs (skrypt pomiarowy), cand-cala-mapa.png, cand-zblizenie-2x.png, cand-wynik.json, base-cala-mapa.png, base-zblizenie-2x.png, base-wynik.json oraz ten raport.

BUILDY: npm ci --ignore-scripts w gra/ (71 pakietow); vite build kandydata i bazy, oba exit 0 (index.html ok. 15,03 MB). Katalogi buildow poza repo (scratchpad sesji).

TESTY / POMIARY (liczby z surowego wyjscia skryptu):
- Scenariusz: ?civTest=1&dev=1, __nnsMeasureDebug.startGame({seed:1, mapSize:'Standardowy', typSwiata:'kontynenty'}), foundFirstCity, klawisz M (odkrycie lądu w trybie dev). pageerror: 0 w obu wariantach. Chromium nie padl w 2 uruchomieniach.
- Zoom: minimum w buildzie = 85%; po dwoch krokach w gore = 95% (NIE osiagnieto 2x, patrz BLOKADY).
- FPS (rAF, 10 s, 3 powtorzenia, ten sam widok, headless Chromium na programowym GL/SwiftShader):
  kandydat: 1142,54 / 1151,81 / 1457,07 ms -> srednia 1250,47 ms (0,80 fps)
  baza:     1187,00 / 1333,29 / 1277,04 ms -> srednia 1265,78 ms (0,79 fps)
  roznica: kandydat -15,3 ms (-1,2%), w granicy szumu (rozrzut powtorzen ok. 100-300 ms).
  UWAGA: ~0,8 fps to koszt programowego renderowania bez GPU. Nie jest to miara kosztu na realnym sprzecie: koszt na GPU NIE ZMIERZONO.
- Bramki ogolne (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, war-rules-multiwar-main-guard): NIE URUCHOMIONO. Brak zmian w gra/**, wiec ten temat nie moze zmienic ich wynikow. Nowy test z mutacja czerwona: NIE DOTYCZY (brak zmiany kodu).

OBSERWACJE NA ZRZUTACH (kandydat vs baza, widok 85–95%):
- Rzeki widoczne w obu wariantach. W kandydacie linie rzek sa wyraznie szersze (lewa strona i dolny lewy kwadrant widoku) niz w bazie, gdzie czesc rzek to cienkie, ledwo widoczne linie.
- Trzech poziomow NIE da sie jednoznacznie rozroznic na tym widoku bez klasyfikacji rzek: widac roznice grubosci, ale nie przypisanie linii do main/medium/tributary.
- Doplywy (0,30 polowy szerokosci) sa widoczne jako cienkie, ciagle linie: czytelne, ale slabo kontrastowe przy tym zoomie.
- Zrzut calej mapy NIE zostal uzyskany: minimalny zoom (85%) pokazuje tylko wycinek mapy. Faktyczne wymiary tej mapy NIE ZMIERZONO w tym tescie.
- Komunikat „ZAŁÓŻ MIASTO” utrzymywal sie na ekranie (foundFirstCity nie zakonczylo trybu zakladania). Nie blokuje czytelnosci rzek, ale jest widoczny na zrzutach.

REKOMENDACJA (grubosc dopływow): NIE ROZSTRZYGAM na podstawie tego pomiaru. Dane wizualne nie wystarczaja do zmiany wartosci 0,30. Potrzebny jest zrzut calej mapy z oznaczonymi poziomami rzek i zoomem pokazujacym rzeki w skali 1:1. Do czasu tej weryfikacji wartosc 0,30 pozostaje bez zmian.

BLOKADY:
1. Zoom 2x i zrzut calej mapy: build nie daje zoomu powyzej 95% ani widoku calej mapy w 85%. Wymaga haka testowego lub innego trybu widoku (nie wprowadzane tutaj, zakaz zmian gra/**).
2. FPS na realnym GPU: NIE ZMIERZONO (tylko programowy GL, wynik orientacyjny).
3. Trzy poziomy rzek i grubosc 0,30: wymagaja zrzutu z oznaczeniem poziomow: NIE ZMIERZONO.
4. Tryb hotseat i inny seed: poza zakresem dispatchu, NIE ZMIERZONO.

RUNDY: 1/5
NASTEPNY KROK: orkiestrator decyduje, czy otworzyc temat zrzutu z klasyfikacja poziomow rzek (wymaga haka testowego lub widoku calej mapy) przed READY_FOR_DEPLOY RIVERS3A.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Relayed user request (zasada Mennicy: osierocona Mennica nieaktywna, nie znika, mozna ja wyburzyc; w nowej stolicy mozna budowac nowa; po jej zbudowaniu stara znika; powrot stolicy reaktywuje nie wyburzona; Mennica zawsze w stolicy) NIE jest czescia dispatchu tego tematu i NIE zostala zaimplementowana w tym przebiegu. Odpowiada zakresowi #162 MINTORPHAN w liscie zadan orkiestratora.
- Skrypt dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs ma na sztywno sciezke do node_modules/playwright w worktree wf_3eaa9e82-e1d-1; przy innym worktree trzeba ja zmienic.
