STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, etykieta)
TEMAT: R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1
GOAL: licznik "Dostępne za N tur" przy Pokoju w oknie hotseat, spójny z bramką (to samo źródło turnsAtWar).
ZMIANY/COMMIT: kandydat 2c726f7b1; baza 7148b2f4e1b6b927ce572593e7379c641cc1bfe9 jest przodkiem (merge-base --is-ancestor OK). Diff: gra/src/game/diplomacy-peace-proposal-timing.ts (+13, peaceCounterLabel), gra/src/main.ts (+3, tylko dane okna hotseat: getDiploRelation + diploWarStateFor, to samo źródło co peaceProposalIsTooEarly), gra/src/ui/interHumanDiplomacyHud.ts (+34/-5), gra/tools/hotseat-peace-counter-ui-test.cjs (nowy), raporty 10/30. Wszystko w allowliście; zero zmian reguł (tylko etykieta/blokada UI), brak zmian w gra-robocza/kanon/WERSJE/rust-port.
TESTY (własne, na 2c726f7b1, tsc 5.9.3 po npm ci): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat-peace-protection 4/0; diplo-human-peace-no-war 13/0; hotseat-etap6d b-exec 48/0, d-exec 46/0, e-exec 24/0, e-source 77/0, diplomacy-engine PASS; hotseat-peace-counter-ui-test PASS=25 FAIL=0.
Własne mutacje na interHumanDiplomacyHud.ts: usunięcie syncPeaceBlock(k) w handlerze change -> FAIL=1; usunięcie syncPeaceBlock(defaultKind) -> FAIL=1; usunięcie straży w click handlerze -> FAIL=1; usunięcie newSubmit.disabled w sync -> FAIL=1. Plik przywrócony (cmp identyczny). Zarzut 1 Evaluatora naprawiony przez obronę, potwierdzone.
OCENA ZARZUTÓW: 1 - naprawiony (zasadny, domknięty). 2 - brak renderu w żywym Chromium/DOM: zasadny jako luka dowodowa, ODDAL jako uwaga (NIE ZMIERZONO); zmiana jest etykietą+disabled, spójną źródłowo z bramką; asercje części (b) to dopasowania tekstu źródła.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora; deploy wymaga osobnej autoryzacji. Po deployu zweryfikować okno hotseat na żywo.
UWAGI-DLA-ORKIESTRATORA: render DOM okna hotseat NIE ZMIERZONO (dotyczy też #152). Przy blokadzie Akceptuj dla przychodzącej propozycji pokoju jest disabled tylko w oknie (bramka w main.ts nadal rządzi).
DEPLOY/PUSH: NIE WYKONANO
