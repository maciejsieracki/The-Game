STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-NO-SIEGE-WITHOUT-WAR-Q1
GOAL: Zadna cywilizacja ani panstwo-miasto (barbarzyncy poza regula) nie oblega, nie atakuje ani nie zdobywa miasta podmiotu, z ktorym nie jest w stanie wojny.
ZMIANY/COMMIT: SHA do integracji 368d707d8 (baza origin/main 522271468). Allowlista OK: gra/src/main.ts (+5, wywolanie validateActiveSieges w setDiploRelation), nowy test ai-no-siege-without-war-r2-test.cjs, aktualizacja straznika liczby wywolan w oblezenie-siege-lifted-po-bitwie-test.cjs (5->6, uzasadnione), 02-operator-r2.md. Brak zmian w ai.ts, WERSJE.md, rust-port, src-tauri.
TESTY (wlasne, FC): tsc --noEmit EXIT=0; ai-no-siege-without-war-r2 PASS 10; ai-siege-requires-war 49/0; oblezenie-siege-lifted-po-bitwie 16/0; diplomacy-war-gates 22/0; siege-surrender-enter-city 32/0; siege-last-stand-sortie 58/0; siege-surrender-forecast 56/0; ai-test 274/20 (bez zmian); git diff --check czysty. Zywy pomiar Chromium, hashe war-allin-capital-quick, czas decyzji AI: NIE_ZMIERZONO (ai.ts nietkniety).
ZARZUTY: 1 ODDAL (jest poprawka + test RED/GREEN), 2 ODDAL (pomiar zastapiony testami deterministycznymi, zalozenie), 3 ODDAL, 4 ODDAL (kontrola dodatnia i mutacja w tescie), 5 ODDAL (jedyny wywolujacy decideAITurn przekazuje canEngageOwner; areEnemyOwners przy wykonaniu), 6 ODDAL czesciowo (H1 pokazana testem; tozsamosc oblegajacego bez zapisu NIE_ZMIERZONO), 7 ODDAL (okno po pokoju naprawione). Zero NAPRAW.
BLOKADY: brak technicznej. Do decyzji produktowej (opcjonalna): karta Wojny pokazuje wojny z niekontaktowanymi jako nieznana cywilizacja. Przyczyna zgloszenia wlasciciela nie potwierdzona bez zapisu gry.
RUNDY: 3/5 (FC po R2)
NASTEPNY KROK: integracja orkiestratora: cherry-pick 368d707d8 na swiezy origin/main PRZED origin/rust-port/parity-v2 (zmiana webowa gra/ nie zalezy od portu; port repinuje po webie).
DEPLOY/PUSH: NIE WYKONANO
