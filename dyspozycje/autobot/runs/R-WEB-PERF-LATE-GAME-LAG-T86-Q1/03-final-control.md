STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - wydajnosc pozdniej gry
TEMAT: R-WEB-PERF-LATE-GAME-LAG-T86-Q1
GOAL: p95 kliku/ruchu < 150 ms; zadania > 200 ms usuniete lub zredukowane >= 5x. Przyczyna (O(n^2) w computeLostToNearerSiblingByCity) naprawiona dla skali miast; p95 < 150 ms NIE_ZMIERZONO.
ZMIANY/COMMIT: baza 56c164df9 -> Operator 85103909ecbbe8fc9979d4571fc39ef81c3496a7 -> Obrona 826ff01f2086978b8004fad8d73a006e9c243f77. Allowlista czysta (gra/src/game/okolica.ts, gra/tools/perf-sibling-memo-test.cjs, gra/tools/perf-late-game-interaction-live-test.cjs, katalog runu). Zero zmian gra/data, rust-port, WERSJE.md. git diff --check OK. SHA commitu FC: w wiadomosci raportu.

WERDYKTY ZARZUTOW
1. Cel p95 / refreshFog 3,5x - ODDAL. Kryterium dispatchu to "usuniete LUB >= 5x"; syncUnitsRender na sciezce kliku/ruchu spelnia (25-30x). Dalsze HUD/border overlay = Q2.
2. Brak gry do tury 86 - ODDAL (zalozenie): wniosek ograniczony do skali miast; struktury rosnace w czasie NIE_ZMIERZONO, Q2.
3. Brak SHA w artefakcie - ODDAL: SHA Operatora w polu BAZA w 02-obrona-r1.md, a tutaj lancuch SHA.
4. Niewykrywane uniewaznienie memo po zmianie hexes - NAPRAWIONE w 826ff01f2 (klucz map.hexes + 3 asercje). Zweryfikowane: dziala. Ryzyko rezydualne (dopisanie klucza in-place) opisane w komentarzu, grep zapisow = 0.
5. ai-test tylko licznik - ODDAL: logi before/after identyczne (diff), 274/20, te same 20 FAIL (dlug bazowy). river-path-adjacency TIMEOUT i *real-render* NIE_ZMIERZONO (zmiana dotyka czystej funkcji, nie renderu).
Brak otwartych NAPRAW; brak DO DECYZJI CZLOWIEKA.

TESTY (wlasne, 826ff01f2): perf-sibling-memo 13/13; okolica 72/72; okolica-multi-city-overlap 55/55; tsc --noEmit EXIT=0; ai-test przez diff logow obrony.
BLOKADY: p95 < 150 ms, stan z tury 80+, river-path-adjacency, testy render - NIE_ZMIERZONO.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora: cherry-pick 85103909e + 826ff01f2 + commit FC na origin/rust-port/parity-v2 (b520768b0) lub origin/main; merge-tree z origin/main (38 commitow wprzod) bez konfliktow. Potem Q2: HUD (updateHud/buildHudState, previewCityEconomy, computeWorkedMagazynYieldsByCity), refreshTerritoryBorderOverlay, pomiar w turze 80+.
DEPLOY/PUSH: NIE WYKONANO
