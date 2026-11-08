STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PEACE-CITY-CESSION-Q1
GOAL: Miasto w koszyku pokoju: AI oddaje (N1a), AI zada (N1b), UI wyboru miasta (N2); transfer wlasnosci bez cichego pokoju.
ZMIANY-COMMIT: weryfikowany commit 0534eacb3 (branch city-cession-r4, baza 4be206647 / kod f73db4cff / origin/web-wip/CITY-CESSION-r2 b9bd7451b). Diff r2..r4 poza run-dir: ai.ts, diplomacy-pn-engine.ts, diplomacy-proposals.ts, main.ts, diplomacyNegotiationModal.ts, diplomacyTradeBasket.ts, tools/*city* (4 pliki) - wszystko w allowliscie. diplomacyDealDisplay.ts: brak roznicy wzgledem bazy. Zero zmian gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml. git diff --check czysty.
TESTY (odtworzone samodzielnie): tsc --noEmit czysty; city-cession-r3 73/0; city-cession 79/0; value-catalog 82/0; war-era-counter 82/0; multiwar 57/0; multiwar-main-guard 21/0; forced-war-relation-gate 14/0; diplomacy 148/0; peace-lock 9/0; profile-unit 198/0; gate 11/0; main-guard 28/0; sim 22/0; d7 8/0; civ-matrix-wiring 42/1 (N4, znane czerwone w bazie, NIE liczone jako zielone). Chromium live city-cession 17/0 (T1 AI oddaje: wlasnosc AI->gracz, status pokoj; T2 AI zada: wlasnosc gracz->AI; T3 stolica: pokoj NIE zawarty, wlasciciel bez zmian, komunikat "Pokoj nie zawarty"; zero pageerror). Chromium city-picker-ui 13/0. ring 15: NIE_ZMIERZONO (brak pliku).
WERDYKT ZARZUTOW:
- N2 brak testu transferu: ODDAL (spelniony: live-test na realnej sciezce aiCommandToPendingProposal->applyProposalOutcome->transferBasketItems->transferCityByTreaty, hak __cityCessionTestDebug).
- N1 kierunek E2E: ODDAL (T1/T2 dowodza kierunku, w tym receiveItems = miasto gracza).
- allowlista diplomacyDealDisplay.ts: ODDAL (cofniety do bazy, renderowanie w diplomacyTradeBasket.ts).
- ciche pominiecie cesji: ODDAL (main.ts ok. l.22097 preflight cityCessionPayloadBlockReason przed transferem i przed pokojem; T3 to dowodzi).
- N1a bramki czasu: ODDAL (aiPeaceTimeOk i !aiFeelsStronger w ai.ts; testy +3 asserty; N1b tylko R5a - ZAŁOŻENIE, uzasadnione: zadanie = przypadek silnego AI).
- N4 czerwone / N3 niepokoj: nie zarzuty (decyzja orkiestratora).
UWAGI (dlug, bez wplywu na werdykt): (1) ZAŁOŻENIE preflight dziala w galezi oneShotTrade (pokoj); sciezka "slodzika" przy traktacie wasala (main.ts ok. l.22079) z miastem nie ma pre-kontroli - przy zmianie stanu miedzy wyborem a akceptacja cesja moze sie nie wykonac (loguje console.error, traktat zawarty). Wasalizacja z miastem jest poza zarzutami i poza testem live. (2) Live test wstrzykuje komende AI przez realny konwerter, nie petle tury AI; guard >1 miasta nie pokryty live. (3) T3 reason "Pokoj zawarty" liczony przed preflightem (kosmetyka). (4) N3 niepokoj 5 tur nie wdrozony. Mutacje operatora (M1-M3) i FC r3 (3 mutacje) nie powtarzane w r4 - NIE_ZMIERZONO; M1 live opiera sie na raporcie operatora, T3 samodzielnie potwierdzony.
RUNDY: FC po rundzie 4/5. Werdykt PASS-WITH-NOTES.
NASTĘPNY KROK: integracja orkiestratora. Kolejnosc: najpierw origin/rust-port/parity-v2 nie dotyczy tego tematu (temat WEB, gra/**; rust-port nietkniety) - brak zaleznosci, mozna integrowac niezaleznie, preferowane po origin/web/integration-20261030 (0083aed43), z ponowieniem bramek po merge. SHA do integracji: 0534eacb3 + commit raportu FC (patrz git log branch city-cession-r4-fc).
DEPLOY-PUSH: NIE WYKONANO
