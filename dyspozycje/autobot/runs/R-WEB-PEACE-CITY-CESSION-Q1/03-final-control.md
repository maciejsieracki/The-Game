STATUS: FAIL (niepełny zakres, runda 2 z 5, ten sam ID)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PEACE-CITY-CESSION-Q1
GOAL: Miasto jako pozycja koszyka pokoju (wycena, zakazy, wykonanie, AI oddaje/żąda, UI).
ZMIANY/COMMIT: baza 0083aed43; r1 kod 4b3b0e95a, raport 9ecdbd192; r2 kod d819678ec, testy 14711fc23. Allowlista dotrzymana (6 plików, wszystkie na liście). Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri.
TESTY (zmierzone przeze mnie na 14711fc23): tsc 0; city-cession 78/0; value-catalog 82/0; war-era-counter 82/0; multiwar 57/0; forced-war 14/0; diplomacy 148/0; peace-lock 9/0; profile-unit 198/0; gate 11/0; main-guard 28/0; sim 22/0; d7 8/0; ring 15/0; git diff --check czysty. civ-matrix-ai-diplomacy-wiring 42/1 FAIL: błąd istniejący na bazie (0083aed43 też nie zawiera napisu), nie regresja tematu. Chromium: NIE_ZMIERZONO.
ROZSTRZYGNIĘCIE ZARZUTÓW:
- Z1 cesja nie wykonana: ODDAL (naprawione r2: transferCityByTreaty w main.ts; brak skutków wojennych, zweryfikowane diffem).
- Z2 waga nie w bilansie: ODDAL (cityWeight w diplomacySumPn, actionId w pn-engine). Ścieżka UI nie niesie cityPn/cityWeight (toPnItems) - wchodzi w Z7.
- Z3 zakazy/bramka typu koszyka: ODDAL (diplomacySumPn zwraca null poza pokoj/wasal; planCityCession odrzuca stolicę i ostatnie miasto).
- Z4 wycena 8+8 i złoża z danych: ODDAL (testy na danych buildings.json i diplomacy.json, NaN/Infinity -> 0).
- Z5 (kryterium 4) AI oddaje miasto: NAPRAW - brak kodu w ai.ts/decideAIDiplomacy; progi rw<=0.15-0.01*(agr-5), >=3 miasta; mutacje i testy N-1/N/N+1.
- Z6 (kryterium 5) AI żąda miasta (rw>=0.7 i turnsAtWar>=20 lub zdobycie miasta): NAPRAW - brak kodu i testów progów.
- Z7 (kryterium 6) UI wyboru miasta, przeniesienie cityPn/cityWeight/actionId w toPnItems/basketPnOpts, lista bez stolicy, zrzut modala z Chromium: NAPRAW - brak; grep po gra/src/ui nie znajduje użycia.
- Z8 niepokój 5 tur: ODDAL warunkowo - ZAŁOŻENIE Z3 (brak mechaniki niepokoju w modelu miasta) przyjęte jako udokumentowane odstępstwo; Operator w r3 wdraża minimalny odpowiednik albo jawnie zapisuje odstąpienie. Nie jest decyzją właściciela.
- Z9 bramki bazowe: ODDAL (odtworzone, wyniki wyżej).
- Z10 założenia Z1/Z2: ODDAL (udokumentowane w kodzie).
- Z11 test wiring civ-matrix: ODDAL (preegzystujący).
BLOKADY: NAPRAW Z5, Z6, Z7 (+ Chromium, mutacje progów AI). Decyzja właściciela NIE wymagana.
RUNDY: 2/5 zużyte. Werdykt: FAIL.
NASTĘPNY KROK: runda 3 Operatora (ten sam ID), baza = SHA tego raportu: AI oddaje/żąda + executor, UI wyboru miasta + zrzut Chromium, mutacje N-1/N/N+1.
INTEGRACJA: nie integrować r2 samodzielnie (temat niezamknięty). Po domknięciu: zmiany tylko w gra/**, brak kolizji plików z origin/rust-port/parity-v2 (merge-base f4c89d008), kolejność dowolna; integrować po gałęzi web/integration-20261030.
DEPLOY/PUSH: NIE WYKONANO
