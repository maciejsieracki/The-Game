STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-PLAYER-POOL-DESPITE-STONE-WAR-Q1
GOAL: gracz z >= 20 tur w Brazie/Zelazie wchodzi do puli celow wojny epoki mimo wojny Kamienia (ABC opcja B).
ZMIANY/COMMIT: kod operatora r2 = 39fc14158 (potomek be7977e5c i bazy 2339b3dab, merge-base --is-ancestor OK). Diff do allowlisty: war-rules-multiwar.ts, main.ts, era-war-bronze-player-target-test, forced-war-iron-main-guard-test (wzorzec forced-war*), run/**. Poza literalna allowlista: war-era-counter-test.cjs i wojna-wymuszona-prog-tury-gracz-test.cjs (tylko regexy straznikow tekstowych) -> ZATWIERDZONE jawnie (rozszerzenie allowlisty). war-rules-params.json bez zmian. Brak zmian w rust-port.
ZARZUTY FC r1:
1 filtr kandydatow po wolnym slocie tagu: ODDAL (naprawione, isPlayerEraWarSlotFree w isPlayerPairGateOpen; S-mixed; mutacja filtra -> 40/4, po przywroceniu 44/0 - powtorzone samodzielnie). Kandydaci maja zawsze eraTag != null, wiec galaz tag===null nieosiagalna.
2 test vs main.ts: ODDAL (gateVerdicts uzywa eraWarCounterEpoch(forcedEraTagEpoch(tag), playerEra); scenariusz mieszanych epok dodany).
3 oslabione guardy: ODDAL z adnotacja - okno konczy sie na triggeredSubjects.push, jedyne rozluznienie {0,400}->{0,600} (blok ~560 zn.), asercja !/turn >= 25/ przywrocona, semantyka progu/braku wojny sprawdzana w main.ts i helperze.
4 allowlista: DECYZJA - rozszerzona o dwa pliki testowe (j.w.).
Zmiana zachowania poza Brazem (gracz w Kamieniu z zajetym 0:1 nie blokuje juz AI Kamienia w parze): akceptowana, poprawia stan (wczesniej para odrzucana civ-cap-target co ture).
Zmiana zachowania: gracz w Brazie/Zelazie bez wojny ma prog 20 tur od wejscia w epoke (wczesniej tura >= 25); stary zapis bez wpisu tury wejscia pomija prog (akceptowane).
TESTY (samodzielnie, TS 5.9.3 z package-lock): tsc rc=0; logic 213/213; ai 289/0; era-war-bronze-player-target 44/0; forced-war-bronze ALL GREEN; iron 55/0; stone 31/0; war-rules-multiwar 57/0; reguly-multi-turn-simulation ALL GREEN; ai-war-nearest-city-peace-2t PASS; war-era-counter 82/0; iron-main-guard 35/0; prog-tury-gracz 9/0; war-epoch-player-first 33/0; iron-era-enter-turn-save-load 20/0; bronze-new-game-reset 41/0. NIE_ZMIERZONO: gra w przegladarce / zywa tura.
BLOKADY: brak
RUNDY: 2/5 (r1 be7977e5c, r2 39fc14158, FC r2 = ten raport)
NASTEPNY KROK: integracja orkiestratora: merge 39fc14158 (kod) do main; wzgledem origin/rust-port/parity-v2 niezalezne (zmiany tylko gra/ i dyspozycje/; parity-v2 to rozbiezna galaz Rust) - najpierw main, potem REPIN Rust (dlug: licznik 0:1 gracza, isPlayerEraWarSlotFree, prog tury wejscia gracza).
DEPLOY/PUSH: NIE WYKONANO
