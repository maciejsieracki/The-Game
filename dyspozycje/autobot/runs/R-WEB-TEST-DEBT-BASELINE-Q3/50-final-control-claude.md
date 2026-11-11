STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: zredukowac dlug testowy bazy bez zmian gra/src i danych gry (tylko gra/tools/*-test.cjs + runs/)
ZMIANY/COMMIT: kandydat a719e0589 (potomek bazy 37bcf8ebb: merge-base --is-ancestor = tak). Diff vs baza: 8 plikow gra/tools/*-test.cjs + 10-operator-claude.md + 30-obrona-claude.md; gra/src, gra-robocza, WERSJE.md NIETKNIETE (allowlista OK). Commit FC dodaje tylko ten raport.

TESTY (wlasny pomiar, surowe wyjscie):
- tsc --noEmit: exit 0
- Bramki: logic 213/213 OK; tech-tree 20 pass 0 fail; research 33/0; unit-replace 21/21; combat 6/6 (wszystkie exit 0)
- Baza 37bcf8ebb vs kandydat (exit): forced-war-bronze 1->0; forced-war-iron 1->0 (35 PASS); ai-dlug-porzadki-q1 1->0 (17/0); hex-tooltip 1->0 (28/0); mgla-sciezka 1->0 (42/0); pre-battle-retreat 1->0 (33/0); okolica-ownership 1->0 (15/15); recruit-rally-default-ui 1->0.
- Nadal czerwone na obu (brak regresji): recruitment-batch-contract (kandydat: ReferenceError effectiveGameDifficultyForOwner; baza: hexHasRoomFor), general-capital-recruitment-order (exit 1, hexHasRoomFor w harnessie), unit-replace-full-cost (39/1: Taran okuty -> Katapulta w Zelazie u 16/16 nacji).
- glod-wojska-karencja, battle-loot, weterani, ai-major-economy, pr141-f04: zielone juz na bazie (exit 0) -- punkty 1-3 listy nie wymagaja zmian.
- Asercja hex-tooltip: wyciecie wiersza "<Nazwa> -> " lapie "odblok." w wierszu Kamieniolomu, nie lapie "odblok. Owce" z sasiedniego wiersza, odporne na kolejnosc Fort/Kamieniolom (granica przesunieta o 1 litere, bez wplywu na wynik).

ZARZUTY:
1. okolica klasa C: ODDAL (naprawione) -- Obrona wykazala klase A (okna regex za krotkie), 15/15 potwierdzone.
2. niedokonczone punkty: pre-battle-retreat naprawione (klasa A). recruitment-batch i general-capital: jawnie OTWARTE (klasa B, lancuch zaleznosci harnessu) -- zgodnie z dispatchem "punkty niedokonczone zostaja jawnie na liscie"; brak regresji, nie blokuje integracji; wymagaja kolejnego tematu (przebudowa harnessu). D-FOG-F: Obrona slusznie odrzucila -- 2 measure + longrun (kontrola negatywna) wlaczaja fogRevealKeyFEnabled przed F i asertuja fogOptionEnabled===true (potwierdzone grepem). ODDAL.
3. unit-replace-full-cost F0: DO DECYZJI CZLOWIEKA (ABC: czy Siege ma miec zamiennik w Zastap -- dane vs test). Asercja nie oslabiona.
4. surowe wyjscia: ODDAL (zalatane w raporcie obrony, zgodne z moim pomiarem).
5. hex-tooltip kruchosc: ODDAL (naprawione granica wiersza, zweryfikowane).
Zadnego NAPRAW -> brak podstaw do FAIL.

BLOKADY: brak dla integracji. Dlug: recruitment-batch-contract, general-capital-recruitment-order (harness klasy B), unit-replace-full-cost F0 (decyzja ABC).
RUNDY: FC po rundzie 2/5
NASTEPNY KROK: integracja orkiestratora (commit FC = a719e0589 + ten raport); osobny temat na harness klasy B; pytanie ABC o Siege/Zastap.
DEPLOY/PUSH: NIE WYKONANO
