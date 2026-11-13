STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-SORTIE-ANY-TURN-Q1
GOAL: Oblegana armia AI/barbarzyncow o sile >= 80% oblegajacych (10:8) wychodzi i atakuje w kazdej turze oblezenia.

ZMIANY/COMMIT: SHA kodu do integracji = 9f7b91617 (baza 80919e2ae; ff94a0db3, f22639f50, 9f7b91617). Diff do allowlisty: tylko gra/src/game/siege-last-stand.ts, gra/src/main.ts (lastStandSortieCmdsForOwner), gra/tools/siege-last-stand-sortie-test.cjs, runs/R-WEB-SIEGE-SORTIE-ANY-TURN-Q1/**. Zero zmian w gra-robocza, WERSJE.md, rust-port, battle.
TESTY (zweryfikowane samodzielnie, npm ci --ignore-scripts, node_modules usuniety): tsc --noEmit EXIT=0; siege-last-stand-sortie 71/0; siege-ai 17/0; siege-defenders 12/0; oblezenie-test 27/0; siege-surrender-enter-city 32/0. git diff --check: tylko trailing whitespace w logu gate-regresje.txt (kosmetyka). Merge-tree z origin/main (9d41e912c): czysty.
ROZSTRZYGNIECIE ZARZUTOW:
1 (brak Chromium) ODDAL - NIE_ZMIERZONO jawne; dowod D7-D12 + RED/GREEN + mutacje; opcjonalny osobny LIVE-VERIFY.
2 (budzenie garnizonu bez ataku) NAPRAWIONE w 9f7b91617 (bramka widocznosci przed pobudka; wersja "tylko kotwica" slusznie odrzucona - roster ataku zbiera jednostki w promieniu 1).
3 (ruchLeft no-op) ODDAL - exitGarnizon/exitFieldFortify przywracaja ruchLeft ze snapshotu.
4 (war-allin-capital 96/2) ODDAL - zmierzone na bazie 80919e2ae: identyczne 96/2 (gate-war-allin-capital-BASE.txt).
5 (2 testy vite TIMEOUT) ODDAL - zakaz buildu w gra/, zmiana nie dotyka blokady rekrutacji ani wiez.
6 (wypad gracza) DO DECYZJI CZLOWIEKA - produktowa, domyslnie bez zmian.
Brak otwartych NAPRAW -> PASS-WITH-NOTES.
BLOKADY: NIE_ZMIERZONO w Chromium; 2 testy wymagajace vite; decyzja produktowa o przycisku "Wypad" dla gracza (Harappa ze zrzutu, jesli gracza, nie jest naprawiona).
RUNDY: 3/5 (Operator r1, Obrona r2, FC)
KOLEJNOSC: wzgledem origin/rust-port/parity-v2 (b520768b0) niezalezne - temat webowy (gra/), brak wspolnych plikow; integrowac na origin/main (9d41e912c), merge czysty. main.ts zmieniany rownolegle przez ARMYPANEL (inne fragmenty).
NASTEPNY KROK: integracja orkiestratora (scalenie 9f7b91617), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
