STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy; kod gry nietknięty)
TEMAT: R-WEB-TEST-DEBT-TRUCE-L2B-RELABEL-Q1
GOAL: (1) przeetykietować nagłówek, komentarze i komunikaty asercji L2b zgodnie z mechanizmem; (2) wzmocnić L2b tak, by rozróżniała wariant „AI akceptuje od razu” od „oferta w skrzynce gracza”; (3) dodać jawną sekcję POKRYCIE w nagłówku testu.
BAZA: origin/main 0218ac0d9 (checkout --detach).
ZMIANY/COMMIT: gra/tools/diplo-truce-live-test.cjs (allowlista) + dyspozycje/autobot/runs/R-WEB-TEST-DEBT-TRUCE-L2B-RELABEL-Q1/10-operator-claude.md. Brak zmian w gra/src. Mutacja w gra/src/game/diplomacy-peace-lock.ts wykonana tylko lokalnie i cofnięta (git checkout); po cofnięciu git status pokazuje tylko test.

Zmiany w tescie:
- Nagłówek L2 przepisany: mechanizm to OFERTA W SKRZYNCE GRACZA (truceEndOffer z truceEndTickPair, gałąź ports.isHuman(target)), a nie „zgoda AI”. Usunięto błędne zdanie, że L2f–L2h rozróżniają oba warianty (oba używają inicjatora AI).
- L2b: label „status pokoj, bez wojny (oferta pokoju stałego dla gracza, nie decyzja AI)”.
- NOWA asercja L2b2: peaceUntilTurn === null w turze wygaśnięcia. Pokój stały (finalizePeace -> startPeaceTreatyLock) ustawia peaceUntilTurn, więc wariant „AI akceptuje od razu” zostaje wykryty. Wpisu w skrzynce test nie widzi (brak haka odczytu pendingDiplomacyInbox), dlatego rozróżnienie opiera się na peaceUntilTurn.
- Komunikat „L2b-odmowa” przeetykietowany i odsyła do POKRYCIA.

POKRYCIE (w nagłówku pliku):
- POKRYTE: rozejm 5 tur z UI i z akceptacji AI (U1, L1); okno (L2a); wygaśnięcie z ofertą w skrzynce gracza, bez wojny i bez kary (L2b, L2b2, L2g); brak odpowiedzi gracza = wojna bez kary (L2h); złamanie w oknie = kara + flaga (L3).
- NIE POKRYTE (1): odmowa AI wobec propozycji GRACZA. Wymaga haka w gra/src/main.ts (poza allowlistą). PROPOZYCJA, nie zaimplementowana: __truceTestDebug.respondPlayerPeaceProposalForTest(aiId, accept) wołający tę samą ścieżkę co odpowiedź AI na stole, plus odczyt truceEndOffer z meta.
- NIE POKRYTE (2): wariant „AI akceptuje od razu po wygaśnięciu” z inicjatorem-graczem. acceptTruceForTest zawsze ustawia AI jako proponującego. Wymaga osobnego haka (propozycja, nie implementowana). Mutacja tego wariantu jest wykrywana przez L2b2 (patrz TESTY).
- NIE POKRYTE (3): jawna akceptacja/odrzucenie oferty przez gracza w UI (pokryty tylko timeout).

TESTY (liczby z surowego wyjścia):
- Live diplo-truce-live-test, kod origin/main przed zmianą testu: 30 pass / 0 fail (exit 0, ok. 3 min).
- Live po zmianie testu, kod main: 31 pass / 0 fail (exit 0). L2b OK, L2b2 OK.
- MUTACJA NA KOPII (diplomacy-peace-lock.ts: w truceEndTickPair gałąź ports.isHuman(target) finalizuje pokój stały od razu, jak AI-akceptuje): 29 pass / 2 fail. FAIL L2b2 (status pokoj, truceUntilTurn null, peaceUntilTurn 16, turn 6) -> czerwone, jak wymagano. Dodatkowo FAIL L2h (wariant zmienia też gałąź timeoutu). Mutacja cofnięta.
- Pięć bramek referencyjnych (po npm ci w gra/): logic-test exit 0, 213 PASS / 0 FAIL (liczone grep ^PASS/^FAIL); tech-tree-test exit 0, 20 pass / 0 fail; research-test exit 0, PASSED 33 / FAILED 0; unit-replace-test exit 0, [OK] dla wszystkich 15 cywilizacji; combat-test exit 0, COMBAT TEST 6/6 pass.
- tsc --noEmit: exit 0.
- git diff --check: czysto.

BLOKADY: brak dla zakresu tematu. Hak odmowy AI wymaga decyzji właściciela i zgody na zmianę main.ts (poza allowlistą).
NIE ZMIERZONO: osobna mutacja wariantu „AI odrzuca od razu” (status wojna) nie była uruchamiana osobno; L2b status-check by ją wykrył, ale to nie jest zmierzone. Wariant odmowy AI wobec propozycji gracza NIE ZMIERZONO (brak haka).
Dowody repo (dyspozycje/**/dowody) nietknięte: testy uruchomione z jawnym katalogiem ewidencji w scratchpadzie. Usunięto gra/node_modules i buildy w scratchpadzie.

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o haku odmowy AI (propozycja w sekcji POKRYCIE) i o temacie wariantu „AI akceptuje od razu” (inicjator gracz).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch wskazuje 00-dispatch.md na origin/main, a pliku tam nie ma; czytałem wersję z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (DODATEK). Bez wpływu na wynik.
- Dispatch każe uruchamiać testy w tle (setsid nohup); zasada procesowa tej sesji zakazuje run_in_background. Testy uruchomiłem na pierwszym planie (każdy < 4 min).
