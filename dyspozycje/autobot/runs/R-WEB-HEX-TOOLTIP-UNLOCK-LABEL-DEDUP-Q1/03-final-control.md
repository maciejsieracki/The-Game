STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HEX-TOOLTIP-UNLOCK-LABEL-DEDUP-Q1
GOAL: etykieta odblokowania nie powtarza surowca z wiersza produkcji w tooltipie heksu.
ZMIANY/COMMIT: SHA do integracji 399777d80 (baza f54fb5c18 = origin/main). Diff: hexContextTooltip.ts, nowy test, run/**. resource-access.ts nietkniety.
TESTY (odtworzone przez FC): tsc --noEmit EXIT 0; nowy test 28/0; hex-tooltip-mozliwe-ulepszenia-zloze 73/1 (regex zrodla, niezalezne od zmiany, identyczne z baza); zarzuty: brak -> ODDAL/NAPRAW: 0.
Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0): merge-tree bez konfliktow (parity-v2 dotyka hexContextTooltip.ts, scalenie czyste). Integrowac na main; parity-v2 pobrac z main po deployu.
NIE_ZMIERZONO: pelna regresja 15 plikow przed/po przez FC.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO
