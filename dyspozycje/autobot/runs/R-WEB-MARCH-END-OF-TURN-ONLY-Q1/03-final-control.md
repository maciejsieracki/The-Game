STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-END-OF-TURN-ONLY-Q1
GOAL: Zaplanowane marsze gracza wykonuja sie tylko w fazie konca tury gracza, przed ekonomia/AI/dyplomacja; nowa tura startuje z jednostkami tam gdzie je zostawiono, z pelnym MP.
ZMIANY/COMMIT: weryfikowany SHA 57426c6c0 (Obrona) na 9d51150de (Operator), baza 80919e2ae. Allowlista OK: gra/src/main.ts, trzy testy w gra/tools (march-end-of-turn-only, army-panel-recruit-rally-general, player-moves-before-ai-turn), runs/<ID>/01,02. Zero WERSJE.md/gra-robocza/rust-port/src-tauri/battle. git diff --check czysty.
Probne scalenie z origin/main dbec5c5c0 (17 commitow przed): czyste, bez konfliktow (main.ts auto-merge).
ROZSTRZYGNIECIE ZARZUTOW:
1 pomiar PRZED: ODDAL (zywe PO + mutacje M1-M4 odtwarzajace stary kod; diagnoza 4 sciezek potwierdzona przegladem kodu).
2 brak zywego scenariusza (b): ODDAL (L8 dodany przez Obrone, 51 OK/0 FAIL zywo).
3 hashe/regresje: ODDAL. Harness war-allin-capital i ai-test uzywaja silnika zastepczego (nie main.ts); diff dotyka wylacznie main.ts, wiec hashe nie moga sie zmienic z konstrukcji. Czesc live regresji (end-turn-input-stability, hotseat-drugi-fotel) nie ruszyla (timeout/INFRA przy load ~25) -> NIE_ZMIERZONO, nie regresja kodu.
4 UX "idz do wodza": ODDAL jako decyzja produktowa A (zgodna z dispatchem).
5 martwy kod: ODDAL (kotwica testow).
Zero NAPRAW.
TESTY (wlasne, na 57426c6c0): tsc --noEmit EXIT=0; march-end-of-turn-only E1-E6 + M1-M5 EXIT=0; planned-march 18/0; march-attack-queue-persist 57/0; rally-point-automarch 30/0; army-panel-recruit-rally-general 5 OK; player-moves-before-ai-turn --no-live 6/0; end-turn-modal-sequencing 41/0. Zywy player-moves-before-ai-turn (Obrona): 51 OK/0 FAIL.
BLOKADY: brak. NIE_ZMIERZONO: pomiar PRZED na starym kodzie, zywe end-turn-input-stability/hotseat-drugi-fotel (INFRA), hashe (nieosiagalne dla diffu).
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora: SHA do integracji = commit tego raportu (na 57426c6c0), merge po origin/main dbec5c5c0; kolejnosc: web do main najpierw, parity-v2 REPIN potem (zmiana tylko w gra/src/main.ts). Wlasciciel: decyzja produktowa A/B/C (pierwszy segment rozkazu gracza natychmiast).
DEPLOY/PUSH: NIE WYKONANO
