STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog, updateHud/buildHudState, granice na sciezce kliku >=5x (bez zmiany regul i determinizmu AI); endTurn zmierzony i zredukowany.
ZMIANY/COMMIT: raport nadpisuje 01-operator-r1.md (seria 1: 01-operator-r1-seria1.md). Kod operatora: da31331af (baza R6). Korekta obrony R2: prog LOD przywrocony do 3 px (commit podany w 02-obrona-r2.md). Allowlista: gra/src/game/{frame-memo,okolica,production,terrain-improvements,turn-economy}.ts, gra/src/main.ts, gra/src/map/{improvement-build,range-hexes,territory-work,territory}.ts, gra/src/render/{cities,units,smallPartLod}.ts, gra/src/units/setup.ts, gra/tools/{perf-*,small-part-lod-test}.cjs, runs/<ID>/**. Zero zmian w gra/data, WERSJE.md, rust-port, src-tauri, gra-robocza, battle.

CO ZROBIONE (R6): (1) hudPureScope: memo zakresowe czystych odczytow (buildHudState, wybor oferty handlowej AI); stawki terytorium liczone raz per wlasciciel. (2) Indeks wlasciciela heksow terytorium (territoryOwnerLookup) i klucz "q,r" w filtrach okolicy. (3) endTurn: zakres blokady oblezen w computeReachable/computePath (units/setup.ts). (4) LOD drobnych czesci (smallPartLod.ts) z perf2-r4; domyslny prog 3 px (w tej rundzie zmierzony tylko w testach jednostkowych, nie wizualnie). (5) turnEventsFrame uniewazniany przy zagniezdzonym refreshD1bHud + test strukturalny. (6) Usunieto closure-contract-test (dotyczyl domkniec R4 nieobecnych na tej bazie).

POMIARY (harness R2, SwiftShader, 137 miast/321 jednostek; min/mediana/max; load average 3-8, czasy bezwzgledne zawyzone, stosunki wiarygodne). PRZED = baza 33855a540, PO = kandydat:
- micro n=7: updateHud 680/719/780 -> 34/53/223 ms (13,6x med); buildHudState 48,5/49,8/54,5 -> 10,1/10,7/13,9 (4,7x); collectTurnEvents 175/178/191 -> 14/16/31 (10,8x); granice 67/71/86 -> 4,1/4,2/5,1 (16,8x); refreshFog 842/869/948 -> 72/76/99 (11,4x).
- wejscie do miasta (n=6 skutecznych): updateHud 786/3749/3943 -> 42/174/240 (21x med); pure-JS 1292/4466/4898 -> 260/564/740 (7,9x).
- wybor jednostki: pure-JS 1596/1716/1873 -> 120/378/639 (4,5x); updateHud 733/777/849 -> 35/35/47 (n=2 skuteczne, niskie n).
- endTurn (n=2): JS 16,5 s i 17,6 s -> 5,2 s i 5,1 s (3,3x). buildHudState na EOT: 24 i 21 wywolan -> 7 i 6.
- skalowanie z historia (hist 0 / 0,5 / 1,0; 5000-20000 odrzuconych): baza refreshFog 874/927/948 ms, kandydat 80/89/113 ms; brak O(n) po historii w pomiarze.

TESTY: tsc --noEmit EXIT=0. perf-hud-frame-memo-test 16 PASS/0 FAIL; perf-territory-index-equiv-test 6 PASS; small-part-lod-test 24 PASS/0 FAIL (po korekcie progu). okolica-test, okolica-isworkable-silnik, okolica-multi-city-overlap, okolica-tryb-reset-ownership-change, river-fog-visibility, city-hex-movement, move-pass-through-own-units, siege-blockade-no-recruit-reinforce, war-allin-general-path-barb-defense, border-march-scan, war-allin-capital-quick (hash) EXIT=0. ai-test 274 PASS / 20 FAIL (jak baza). Czerwone jak baza: okolica-ownership-change-reconcile (12/15), okolica-load-reconcile (21/23); ai-fog-test EXIT=1 rowniez na bazie. Logi: evidence/gate-r6-*.txt; logi bez kodu wyjscia oznaczone EXIT=NIE_ZAPISANO.
Equiv (scopeEquiv, countEquiv, equiv): mismatches=[], hudFresh stale=false (evidence/gate-r6-cand-equiv.txt).

NIE_ZMIERZONO / BLOKADY: river-path-adjacency-test (timeout 560 s, generacja map); player-moves-before-ai-turn-test (czesc strukturalna OK, czesc zywa L1-L4 OK do 280 s, potem timeout); hotseat-etap6e-render-noop (timeout 190 s, do tury 17 bez bledu); oboz-lowiecki-las-znika-render (timeout 190 s). Zrzuty LOD far/near przy 3 px i ocena wizualna: NIE_ZMIERZONO. Draw calle przy 3 px: 28 881 -> 5 255 (wynik R4, nie ponowiony). Cele <5x: buildHudState/wywolanie 4,7x, endTurn 3,3x (runAiPhase i pickResourceTradeRelOffer nieprofilowane osobno), wybor jednostki 4,5x (JS, render/GL dominuje). PRZED dla ruchu i panelu miasta: NIE_ZMIERZONO w tej rundzie. Panel miasta PO: 1 z 7 klikow skutecznych (n za male).
RUNDY: 2/5 nowej serii
NASTEPNY KROK: Evaluator (R2) -> Obrona -> Final Control; priorytety: endTurn (runAiPhase), zrzuty LOD 3 px, pomiar panelu/ruchu PRZED.
DEPLOY/PUSH: NIE WYKONANO
