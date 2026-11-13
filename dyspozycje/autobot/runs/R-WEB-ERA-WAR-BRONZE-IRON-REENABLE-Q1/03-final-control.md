STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-BRONZE-IRON-REENABLE-Q1
GOAL: enabledForcedWarEras = [stone,bronze,iron]; testy bez SKIP; niezmiennik 3 epok.
ZMIANY-COMMIT: kod+testy do integracji: 3389112bb (baza a66a8480c; fde3aca30 + 4143da656 + 3389112bb). Allowlista: war-rules-params.json, komentarz main.ts:26042, 9 testów gra/tools (w tym nowy era-war-all-eras-test.cjs), katalog runu. Zero zmian logiki w src/. git diff --check czysty.
TESTY (powtórzone przez FC na 3389112bb): era-war-all-eras 10/0; war-rules-multiwar 57/0; war-era-counter 82/0; forced-war-iron-main-guard 35/0; forced-war-bronze-main-guard 22/0; forced-war-bronze-new-game-reset 41/0; war-epoch-player-first-main-guard 34/0; war-epoch-player-first 16/16; war-rules-multiwar-main-guard 21/0; tsc --noEmit exit 0. logic-test/ai-test: wyniki Operatora r1 (213/213; 274/20 = baza) przyjęte jako zgłoszone (src/ bez zmian logiki).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1 live testy (3x) niewykonane: DO DECYZJI ORKIESTRATORA (ograniczenie infra: jeden proces >590 s, build vite). Nie jest to wada kodu. Zalecenie: orkiestrator uruchamia je po integracji poza limitem narzędzia.
2 niezmiennik 3 = poziom modułów: ODDAL. Nagłówek testu mówi to jawnie; flaga jest jedynym wyłącznikiem (war-rules-multiwar.ts:172), E3 dowodzi regresji przy ["stone"].
3 poluzowane testy: ODDAL. Mutacje Obrony (iron-guard FAIL 34/1, bronze-guard FAIL 21/1) potwierdzają czułość; auto-lista (c) cofnięta, jawna lista + kontrola pokrycia.
4 testy menu: ODDAL. Baza ma układ landFraction/cityStateDifficulty/player_epoch_war (test z bazy padał); zmiana tylko guard tekstowy.
5 komentarz main.ts:26042: NAPRAWIONY w 3389112bb.
6 inne blokady: ODDAL. Obrona wskazała plik:linia (próg 25, R1 tura 40, poziom trudności, predykat pary, forcedEraPeace, limit licznika).
BLOKADY: brak techniczny. Otwarte: live w przeglądarce (nota).
RUNDY: 2/5
NASTĘPNY KROK: integracja 3389112bb (+ ten raport) do main; zmiany tylko w gra/ i runie, bez kolizji z origin/rust-port/parity-v2 (rust-port/**), kolejność dowolna, parity-v2 bez zależności. Potem live x3 po integracji.
DEPLOY/PUSH: NIE WYKONANO
