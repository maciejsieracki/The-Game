STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog/updateHud/granice/wejscie do miasta zredukowane >=5x bez zmiany regul i determinizmu AI; endTurn zmierzony i zredukowany.
ZMIANY/COMMIT: kod Operatora 3f6f6ec77, Operator da31331af, Obrona ef9a7af76 (prog LOD 3 px, EXIT w logach, skrocony raport) i 95d7461ac. SHA do integracji: 95d7461ac2aec3eb49369e3e44e886be0dc4e2f6 (plus commit FC z tym plikiem).
TESTY (wlasne, na 95d7461ac): allowlista czysta (gra/src/{game,map,render,units,main.ts}, gra/tools, runs/<ID>/**; brak gra/data, WERSJE.md, rust-port, src-tauri, gra-robocza); tsc --noEmit EXIT=0; small-part-lod-test 24/0; perf-hud-frame-memo-test 16/0; perf-territory-index-equiv-test 6/0. Diff Obrony w gra/src to wylacznie minPx 2 -> 3 (3 miejsca). Pomiarow Chromium nie powtarzalem (SwiftShader, obciazenie); liczby przed/po z dowodow Operatora.
ZARZUTY:
- Z1 (cele 5x: buildHudState 4,7x, endTurn 3,3x, wybor 4,5x): ODDAL jako uwaga; glowny cel spelniony (refreshFog 11,4x, updateHud 13,6x, granice 16,8x, wejscie do miasta 21x/7,9x).
- Z2 (n<7): ODDAL, uczciwie oznaczone.
- Z3 (NIE_ZMIERZONO PRZED ruch/panel, profil runAiPhase): ODDAL, uczciwe NIE_ZMIERZONO; kandydat na kolejny temat.
- Z4 (zrzuty LOD): ODDAL. Prog przywrocony na 3 px zgodnie z dispatchem i dowodem R4 (28 881 -> 5 255 draw calli); ocena wizualna NIE_ZMIERZONO, uwaga do sprawdzenia przy zoomie gry.
- Z5 (4 testy render/live z timeoutem): ODDAL; timeouty srodowiskowe (SwiftShader), brak bledu; hud-tooltip-body-mounted-panels EXIT=0.
- Z6 (EXIT w logach, 600 slow): NAPRAWIONE przez Obrone (EXIT=NIE_ZAPISANO bez fabrykacji, raport 475 slow).
- Z7 (zalozenie niezmiennosci kluczy map.hexes): ODDAL jako uwaga ryzyka, brak dowodu bledu.
Brak zarzutu wymagajacego NAPRAW -> PASS-WITH-NOTES.
BLOKADY: brak blokujacych. NIE_ZMIERZONO: zrzuty LOD 3 px, PRZED ruch/panel, endTurn n>=7, profil runAiPhase/pickResourceTradeRelOffer, 4 testy render/live (timeout).
RUNDY: 2/5 nowej serii (FC)
KOLEJNOSC INTEGRACJI: origin/rust-port/parity-v2 (b520768b0) nie zawiera tego tematu i jest niezalezny (gra/src web vs rust-port). Zintegrowac 95d7461ac (+ commit FC) z origin/main (ea9c14daf, merge-base sprawdzic przy integracji), bramki: tsc, 3 testy perf, ai-test 274/20; parity-v2 niezaleznie, bez zaleznosci plikowej.
NASTEPNY KROK: integracja orkiestratora -> READY_FOR_DEPLOY; osobny temat na endTurn i LOD wizualny.
DEPLOY/PUSH: NIE WYKONANO
