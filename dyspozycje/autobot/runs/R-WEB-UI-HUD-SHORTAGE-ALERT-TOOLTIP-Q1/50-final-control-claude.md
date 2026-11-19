STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/raportowanie, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1
GOAL: alert niedoboru, etykiety i chip "Surowce" liczone z tego samego netto co HUD (resourceIsShortage); tooltip "Brutto · netto" z wierszem wejść przetwórstwa; diagnoza Ceramiki +10/t.
ZMIANY/COMMIT: kandydat 4b5e7809ada4208e72030edd9251e8be2be881f2. merge-base --is-ancestor 6b3458f6e... 4b5e7809... = TAK. diff --stat: 6 plików, +183/-5: resource-gross-net.ts, main.ts, hud.ts, nowy gra/tools/hud-shortage-alert-converter-test.cjs, 10-operator, 30-obrona. Wszystko w allowliście; gra/data, gra-robocza, WERSJE.md, rust-port nietknięte.
TESTY (własne, surowe wyniki, na 4b5e7809): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-economy-measure-hook-test 23/23; hud-shortage-alert-converter-test 17 ok 0 FAIL; resource-gross-net-converter-inputs-test 18 ok 0 FAIL; hud-resource-deficit-red-test 41/0; hud-gross-net-rest-test 820/0; hud-topbar-grid-gross-net-test 1150/0 (podtest [B] pominięty, brak --dist, NIE ZMIERZONO).
DOWÓD PRZEGLĄDARKOWY (własny, jednorazowy, kopia testu w Chromium z prawdziwym hud.ts, niezacommitowana): tooltip z surowceWejscia=15 zawiera "Wejścia przetwórstwa: −15"; z 0 wiersza brak; 43 pass 0 fail, zero błędów JS. Wiązanie main.ts -> HUD (resourceIsShortage na wierszach) nadal tylko statyczne (regex) oraz tsc; bieg na żywo seed 4242 i bundle vite NIE ZMIERZONO.
WERDYKT PER ZARZUT:
1 Ceramika nieodtworzona: ODDAL (uwaga). Dispatch dopuszcza dokumentację bez zmiany kodu; Operator oznaczył NIE ZMIERZONO. Hipoteza (drain Spichlerza, building-resource-gate.ts ~432-437, turn-economy.ts ~2067, econ-params 10) pozostaje niezweryfikowana pomiarem.
2 Nieaktualne komentarze: NAPRAWIONE w 4b5e7809 (main.ts ~23920, hud.ts ~238) - potwierdzone w diffie.
3 empireDetailPanel.ts:3408 resStateOf nadal ratePerTurn<0: ODDAL (uwaga), plik poza allowlistą; osobny temat. Skutek: karta surowca może nie być czerwona, gdy chip/alert zgłaszają niedobór.
4 Słabe pokrycie wiązania: ODDAL (uwaga), częściowo złagodzone dowodem przeglądarkowym tooltipu powyżej.
5 Zmiana semantyki (netto zaokrąglone, niedobór obejmuje zużycie): ODDAL (informacja dla właściciela), zgodne z dispatchem (to samo netto co HUD).
BLOKADY: brak.
RUNDY: Operator 1/5, Obrona 2/5, Final Control; FC bez zmian kodu.
UWAGI-DLA-ORKIESTRATORA: (a) temat do dopisania: resStateOf w empireDetailPanel.ts na resourceIsShortage; (b) ABC dla właściciela: drain Spichlerza (Ceramika 10/t) jako pozycja w HUD netto; semantyka zaokrąglenia/zużycia; (c) po deployu na ROBOCZĄ zalecany wzrokowy test tooltipu i alertu w grze; (d) symlink gra/node_modules w tym worktree usunięty.
NASTĘPNY KROK: integracja orkiestratora (FF kandydata) i bramki po merge.
DEPLOY/PUSH: NIE WYKONANO
