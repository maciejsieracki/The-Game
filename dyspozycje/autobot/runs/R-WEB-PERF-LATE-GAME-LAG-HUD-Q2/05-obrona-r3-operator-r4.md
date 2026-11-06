STATUS: FAIL (GOAL ≥5x dla refreshFog/buildHudState NIE osiagniety; poprawki LOD i diagnoza renderu wykonane)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog/updateHud/granice >=5x lub poza sciezka interakcji; endTurn zmierzony
ROLA: Operator (obrona) po FC/Evaluator R3 = FAIL

ZMIANY/COMMIT: galaz `claude/perf2-r4` (baza `claude/perf2-r3` 8c71abb79), bez pusha.
- kod+test: c9480c82cd32d255c35eb1c395d9240712b5c7f4
- wycofanie throttle cienia, sonda rAF, dowody, bramki: f30828c0297fd65187096f59432a1ad814265f44
- (poprawka bialych znakow w tescie + ten raport: kolejny commit, SHA w wiadomosci koncowej)
Pliki: gra/src/render/smallPartLod.ts, units.ts, cities.ts, main.ts (tylko LOD-hook; throttle cienia wycofany do stanu sprzed R3), tools/small-part-lod-test.cjs, tools/closure-contract-test.cjs (nowy), tools/perf-late-game-interaction-live-test.cjs (+PERF_PROBE=4). gra-robocza, WERSJE.md, rust-port, src-tauri, battle, gra/data bez zmian.

ODPOWIEDZI NA ZARZUTY
1. GOAL/status zawyzony - PRZYJMUJE. Status zmieniony na FAIL. refreshFog 3,9-4,4x, buildHudState nie zbity, ruch/wybor nie poprawione w sensie JS (patrz 4).
2. Pominiete (c)-(f), endTurn - CZESCIOWO PRZYJMUJE.
 (f) WYKONANE: tools/closure-contract-test.cjs 16/0 (kontrakt zrodlowy domkniec: jedyny wolajacy activeOnly=true czyta tylko `.active`; galezie getResourceAccessForCity vs getCityResourceAccessForCity; kazdy klucz ownerScoped ma jedno cialo) + perf-hud-q2-test (#3, #5) rownowaznosc czesci czystych. Domkniecia zyja w main.ts, nie da sie ich zaimportowac - to test kontraktu, nie wykonania.
 endTurn ZMIERZONY (r4-endturn-profile.log.txt): wall 27,7 s w SwiftShader, w tym ~4,7 s kompilacja shaderow (onFirstUse); JS: runAiPhase 6,2 s, pickResourceTradeRelOffer 2,0 s (mergedResourceRatesForOwner 1,9 s, empireTerritoryResourceRatesForOwner 2,1 s), runWorldEndTurn 1,6 s, refreshFog 0,88 s (x3), buildHudState 24 wywolan. Liczniki: syncUnitsRender 37, refreshTerritoryBorderOverlay 4.
 (c) NIE ZROBIONE: 16 wywolan buildHudState/klik pochodzi z getterow paneli (getEmpireHud, getProgress, buildEmpireDetailSnap, getNaukaRate); bez licznika wersji stanu nie ma dowodu braku mutacji miedzy nimi. Memo mergedResourceRatesForOwner w oknie dyplomacji AI odrzucone: ugody pokojowe moga oddawac miasta w tym samym oknie => ryzyko zmiany determinizmu AI.
 (d) NIE ZROBIONE (refreshFog dalej ~3,9-4,4x). (e) NIE_ZMIERZONO (brak zasiewu historii).
3. Rygor pomiaru - CZESCIOWO PRZYJMUJE. 3 pelne przebiegi REPEAT=7 (r4-perf-run2, r4-perf-final; run3 w wiadomosci), load avg 4-8 (przed/po: 5.89->7.78 final; 7.27->8.59 run2). Metryka = zadania >50 ms (klatki <50 ms nie sa listowane). min/mediana/max (final | run2): idle 51/55/83 | 53/53/100; pan 50/62/623 | 51/57/96; wybor 64/1536/3670 | 59/1270/3110; ruch 52/1484/1735 | 54/1502/1771; wejscie do miasta 53/58/1511 | 50/56/77; panel miasta 50/66/1524 | 51/56/1476. Baza dla wejscia/panelu nadal NIE_ZMIERZONO - wniosek "plynne" cofam: wejscie/panel maja w kazdym przebiegu 1-3 klatki 1,0-1,5 s. Przypisanie outlierow kompilacji shaderow POTWIERDZONE profilem: getProgramInfoLog+getShaderInfoLog 4,1 s z 4,9 s renderLoop w select (r4-prof), ~4,7 s w endTurn.
4. Throttle cienia - PRZYJMUJE, WYCOFANY. Dowod (r4-rafprobe-before-after-select.log.txt, PERF_PROBE=4): odstep rAF w TYM SAMYM kadrze (3887 calli, 1,44 mln tri) wynosi 0,8-2,2 s PRZED zaznaczeniem i 0,8-1,7 s PO - czyli 1,2-1,8 s klatki w "ruch/wybor" to koszt rasteryzacji widoku w SwiftShader, niezalezny od zaznaczenia, ruchu i cienia. Czas JS renderer.render (renderProbe: 22-28 ms; pierwsza klatka 4,5 s = kompilacja) nie obejmuje GPU, wiec throttle oparty na nim byl nieskuteczny; wariant oparty na odstepie rAF tez nie dal poprawy (run3: ruch mediana 1510). Przywrocono `isAnimating || galleryOn` (stan sprzed R3); problem "cien po animacji" znika razem z throttle. Profil ruchu: 99% czasu w renderLoop, uniformMatrix4fv/drawElements = stall kolejki GL. Koszt na prawdziwym GPU NIE_ZMIERZONY. Kandydat na dalsza redukcje: 29 meshy instancjonowanych, 37 337 instancji, ~1,34 mln tri w kadrze dist 40 (nie rozwiazane).
5. LOD poprawnosc - PRZYJMUJE (wszystkie 4 punkty) i dodatkowo znaleziona wlasna regresja:
 (1) cache promienia zalezny od skali - usuniety: cache tylko promienia geometrii, skala przodkow liczona przy kazdym przeliczeniu; klucz zawiera podpis korzeni (liczba widocznych + id/scale.x), wiec zmiana skali (wejscie do miasta) wymusza przeliczenie.
 (2) odslanianie korzenia (mgla/stos) wymusza przeliczenie przez ten sam podpis.
 (3) zbior hidden: przy restore odpiete mesze (usuniete modele) sa tylko zapominane, nie dotykane; wersje bumpowane tez przy delete. Reczne ukrycie mesza przez kod gry miedzy przeliczeniami: ZALOZENIE - gra nie przelacza visible na dzieciach tokenow (nie zweryfikowane grepem calosci).
 (4) wersja modelu miasta rosnie przy usunieciu.
 Regresja wykryta pomiarem: pierwsza wersja poprawki iterowala `roots` dwa razy, a wywolujacy przekazuja jednorazowy iterator Map.values() - LOD przestawal dzialac (28 881 calli). Naprawione (bufor korzeni), pokryte testem; po poprawce 5 255 calli, idle 51/55/83 ms. small-part-lod-test 24/0 (nowe: skala, odslanianie, wyciek, iterator, stopAt zagniezdzony).
6. Brak oceny wizualnej LOD / typowy zoom - NIE_ZMIERZONO: brak zrzutow far/near; przy dist 40 LOD nie obniza kosztu (3,9-4,7 tys. calli) - przyznaje, redukcja 5,5x dotyczy maksymalnego oddalenia. Decyzja progu 3 px zostaje dla Evaluatora.
7. Allowlista/bramki - PRZYJMUJE: uruchomione *fog* (ai-fog-test EXIT=1 jak baza R2; river-fog-visibility 31/0), *visib*, *path*/*move* (map-road-movement 26/0, move-pass-through, ai-move-range 46/0, city-hex-movement, terrain-hill 10/0, river-terrain-move, army-split-movement 4/0).

TESTY (gate-r4-*.txt, z EXIT=): tsc EXIT=0; small-part-lod 24/0; closure-contract 16/0; perf-hud-q2 23/0; perf-sibling-memo 13/0; okolica EXIT=0; territory-border 9/0 i dense 15/0; hud-skarbiec 34/0; unit-renderer-overlay-sync 17/0; ai-test 274 pass/20 fail (te same FAIL), EXIT=1.
BLOKADY: brak technicznych; srodowisko bez GPU (SwiftShader) uniemozliwia pomiar kosztu renderu na realnym sprzecie.
RUNDY: 4/5
NASTEPNY KROK: Evaluator R4. Do R5 (jesli wymagane): wersjonowanie stanu pod koalescencje buildHudState, memo empireTerritoryResourceRatesForOwner z kluczem zawartosciowym, zasiew historii (e), redukcja instancjonowanych 1,34 mln tri w kadrze.
DEPLOY/PUSH: NIE WYKONANO
