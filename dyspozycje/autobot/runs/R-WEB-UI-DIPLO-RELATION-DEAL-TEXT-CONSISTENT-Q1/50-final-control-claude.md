# R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1 — 50-final-control-claude

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1
GOAL: wiersz „Wpływ Relacji na deal” nie pisze „musisz dać więcej (×N PW)” przy ofercie AI→gracz z aktywnym „Przyjmij”; tylko wyświetlanie, bez zmian reguł handlu.
ZMIANY/COMMIT: kandydat 8b2eb4a41237f95d909c90f7366cf94282f8d158 (potomek origin/main 6b9bcaf2b — `merge-base --is-ancestor` OK). Kod gry: tylko gra/src/ui/diplomacyAcceptanceBalance.ts (+12/-2, wariant 'incomingAccepted'); gra/tools: test wyświetlania + test live Chromium; raporty runu. Wszystko w allowliście, zero zmian w gra/src/game, JSON, WERSJE.md.
TESTY (surowe, mierzone przez FC na kandydacie):
- tsc --noEmit: rc=0, 0 linii
- diplomacy-relation-deal-text-consistent-test: 6 pass / 0 fail
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 (wszystkie rc=0; brak czerwonych, więc porównanie z bazą zbędne)
- test live Chromium (vite, HTTP, realny endTurn + klik HUD): 10 pass / 0 fail, rc=0; zrzut obejrzany: okno pokazuje aktywne „Przyjmij”, „Możesz przyjąć — wymiana symetryczna”, wiersz bez „musisz dać więcej”
- mutacja (`false && incomingTrade`): test wyświetlania 4 pass / 2 fail rc=1 (wykryta); plik przywrócony, git status czysty
ZARZUTY:
1. brak testu Chromium — ODDAL (obrona dodała test live 10/0 + mutacja; powtórzone przez FC). Kierunek gracz→AI w grze NIE_ZMIERZONO (brak hooka); wariant 'own' nie zmieniony w diffie i pokryty testem wyświetlania.
2. czerwony ton / „Twoja strona słabsza” przy symetrycznej wymianie — DO DECYZJI CZŁOWIEKA (wizualna, nie sprzeczność „musisz dać więcej”; ton = relationModTone, jak w wariancie traktatowym). Sugestia ABC: neutralny ton przy incomingAccepted.
3. rozjazd Relacja 11,6 vs 90/200 — ODDAL jako poza zakresem (relTotal bez zmian w diffie); osobny temat do zbadania.
4. pliki tymczasowe przy przerwaniu — ODDAL (naprawione obsługą exit/sygnałów; test 6/0 bez residuum; przerwanie sygnałem NIE_ZMIERZONO).
Brak NAPRAW => nie FAIL.
BLOKADY: brak
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: integracja orkiestratora (kod = kandydat 8b2eb4a41; commit raportu FC dodaje tylko ten plik); ABC do właściciela: ton wiersza (zarz. 2) i rozjazd 11,6 vs 90/200 (zarz. 3).
DEPLOY/PUSH: NIE WYKONANO
