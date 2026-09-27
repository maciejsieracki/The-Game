STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-USTAWIENIA-KOPIOWANE-Q1-20260927
GOAL: Niezależne ustawienia per-owner dla obu foteli hot-seat: podziału Pracy, Daniny/Handlu, Racji oraz skarbca/nauki w HUD i panelach.
ZMIANY/COMMIT: Brak commita/push. Zmieniono gra/src/main.ts, gra/src/ui/empireDetailPanel.ts; dodano gra/tools/hotseat-ustawienia-kopiowane-test.cjs; dowody: dowody/hotseat-ustawienia-kopiowane-przed-czerwony.png oraz dowody/hotseat-ustawienia-kopiowane-po-zielony.png.
TESTY: PASS — node ./node_modules/typescript/bin/tsc --noEmit; git diff --check; empire-city-defaults-test: 53/0; hotseat-ustawienia-kopiowane-test: 16/0 (realny Chromium, dwa fotele, czerwony-przed/zielony-po); hotseat-human-owners-test: 29/0; hotseat-etap1-ownerid-test: 14/0; hotseat-etap3-akcesory-test: 64/0; hotseat-etap6c-economy-noop-test: 70/0. Próba pełnego pakietu zatrzymała się na istniejącym długim/niestabilnym hotseat-etap6a-input-noop-test po 9 turach; osobna próba hotseat-etap6d-podetap-b-exec-test zakończyła się ReferenceError: effectiveGameDifficultyForOwner is not defined w istniejącym harnessie testowym, poza zakresem zmian.
BLOKADY: Brak blokady implementacji. Pełny pakiet hot-seat nie został formalnie zamknięty jako 100% PASS z powodu opisanych problemów infrastruktury/istniejącego harnessu; nie przypisuję ich tej zmianie bez baseline.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator powinien niezależnie uruchomić pełny pakiet hot-seat na tej gałęzi i baseline origin/main; po akceptacji osobna integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

USTALENIA:
- initOwnerDefaultPodzialHandlu/initOwnerDefaultCityFields przyjmują humanOwnerIds i są wywoływane po planie startowym z humanSeats.humanOwnerIds; drugi fotel dostaje własne DEFAULT_* zamiast pustego wpisu/fallbacku AI lub fotela 0.
- seedCityOwnerDefaults rozpoznaje dowolny human owner przez isHuman(c.ownerId), więc nowe/przejęte miasto fotela 2 nie dostaje AI-owego 50%/stałego splitu.
- buildHudState(ownerId) czyta per-owner PlayerState dla skarbca, nauki, badanej technologii i ery; buildDiploTreasury oraz oba call-site'y panelu miasta używają ownerTreasury(ownerId).
- empireDetailPanel przekazuje dynamiczny getActiveOwnerId() do podziału Handlu/Podatku, Pracy i Racji oraz zapisów suwaków/Auto-Żywienia.
- Numerowane miejsca naprawy: main.ts:5299-5321, 5327-5385, 5442-5464, 9127-9128, 18648-18875, 19004-19025, 23030-23106, 24794-24880, 36571-36620; empireDetailPanel.ts:58-66, 87-137, 148-245, 1165-1235, 1448-1541.
