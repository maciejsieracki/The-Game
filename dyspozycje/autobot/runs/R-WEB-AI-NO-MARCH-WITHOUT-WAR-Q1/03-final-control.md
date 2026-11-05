STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-NO-MARCH-WITHOUT-WAR-Q1
GOAL: AI (cywilizacje i panstwa-miasta) nie wybiera celu ofensywnego, nie zbiera armii i nie rusza marszem na podmiot X bez faktycznego stanu wojny z X.
ZMIANY/COMMIT: ocena 0f6544973 (baza 95731af6a; R1 f038fbd2c/62d02215b). Allowlista OK: ai.ts, main.ts, ai-no-march-without-war-q1-test.cjs, runs/<ID>/**. Brak zmian w WERSJE.md, gra-robocza, rust-port, src-tauri, battle. git diff --check czysty. SHA do integracji: 0f6544973 (+ ten raport). merge-tree z d257ed6d8 (obecny main) bez konfliktow.
TESTY (zweryfikowane samodzielnie na 0f6544973): nowy test PASS 11 EXIT=0; tsc --noEmit EXIT=0; ai-test 274/20 (bez zmian); ai-general-war-campaign 51/0; ai-army-all-civs-general-muster 26/0; ai-no-siege-without-war-r2 PASS 10. Mutacja: usuniecie bramki kampanii wodza w ai.ts lamie teraz test behawioralny ("bez wojny kampania nie zmienia decyzji"). Zbior padajacych PRZED=PO (Obrona: 142 pliki, 0 nowych regresji) zgodny z moim wynikiem R1 (te same 15 na czystej bazie). node_modules usuniete.
WERDYKTY PER ZARZUT:
1 Pomiar Chromium: ODDAL (blokada srodowiskowa, swiat >8 min vs limit 590 s; nie wada kodu). Kryterium PO pokryte jednostkowo; rekomendacja: weryfikacja live po deployu przez wlasciciela / srodowisko bez limitu.
2 Przyczyna zgloszenia: ODDAL. Sciezka produkcyjna nieustalona, ale poprawka patrzy na relacje pary, wiec jest niezalezna od sciezki; luka odtworzona syntetycznie.
3 Brak testu behawioralnego bramki kampanii: ODDAL (naprawione, mutacja potwierdzona).
4 Brak odpoczynku po czyszczeniu / czyszczenie w turze napastnika: ODDAL (naprawione: sweepStaleForcedWarEntries() raz na ture przed wyszukiwaniem celu, uzbraja bronzeForceWarRestUntilByOwner; rejestr zapisywany dopiero po skutecznym wypowiedzeniu, wiec sweep nie kasuje swiezej wojny; pary w stanie wojna: no-op). Pokrycie kolejnosci tylko statyczne (regex) - uwaga.
5 Determinizm/czas w pelnej grze: ODDAL (jednostkowo determinizm OK, ~+0,1 ms/wywolanie; live testy nie uruchamialne bez bundla).
6 Zbior padajacych: ODDAL (zmierzony przez Obrone, zgodny z moim).
BLOKADY: brak technicznych dla integracji. Zalegle NIE_ZMIERZONO: Chromium >=3 ziarna x >=100 tur; testy live forced-war-r9-no-auto-end / trojstronna-domino / war-rules-multiwar. Decyzja produktowa ABC z R1 (A rekomendowana: brak wojny = brak marszu, wypowiedzenie wg istniejacych regul, marsz po zapisie wojny, mozliwy w tej samej turze) - realizowana wariantem A; B/C do decyzji orkiestratora.
RUNDY: FC 1/5 (po R2 Operatora)
NASTEPNY KROK: integracja orkiestratora (cherry-pick/merge 0f6544973 na obecny main, tsc + ai-test + nowy test), potem READY_FOR_DEPLOY po decyzji; zalecana weryfikacja live po deployu. Kolejnosc wzgledem origin/rust-port/parity-v2: zmiana tylko w gra/ (web), niezalezna od Rusta; najpierw main, potem ewentualny REPIN na parity-v2 (REPIN wstrzymany do konca weba).
DEPLOY/PUSH: NIE WYKONANO
