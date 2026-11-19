# 50-final-control-claude — R-WEB-UI-HUD-RESOURCE-CARD-STATE-NET-Q1

STATUS: PASS
DOMAIN: GAME (UI, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-RESOURCE-CARD-STATE-NET-Q1
GOAL: karta surowca w panelu imperium liczy niedobor z netto HUD (resourceIsShortage), jak alert i chip "Surowce".
ZMIANY/COMMIT: kandydat e7d2fe36e36dbc5350ebd661adbd4721b96f9e45; baza 0936a1d9f21615a6652bc50a970c2e7bfc095a44 jest jego przodkiem (merge-base --is-ancestor OK); jeden commit; diff --stat: 3 pliki (empireDetailPanel.ts +5/-3, nowy gra/tools/hud-resource-card-state-test.cjs, 10-operator-claude.md) = w allowliscie. Zmiana: resStateOf uzywa resourceIsShortage(r), eksport do testu; brak duplikacji wzoru. Po zmianie grep `ratePerTurn *< *0` w gra/src/ui i main.ts: 0 trafien.
ZARZUTY EVALUATORA / OBRONA: brak / brak.
TESTY (wlasne uruchomienie, surowe wyjscie): tsc --noEmit exit 0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; hud-shortage-alert-converter 17/0; resource-gross-net-converter-inputs 18/0; hud-resource-deficit-red 41/0 (Chrome); hud-resource-card-state-test 7 ok/0 FAIL (A konwerter bad, B -0,4 good, siatka 105 zgodna, mutant wykryty); resource-card-numbers-only 14/0; resource-cards-gross-net 24/0; resource-usage-breakdown 100/0. NIE ZMIERZONO: resource-cards-plusx-badge, resource-ledger-skad-dom (hardkodowana sciezka chromium; poza zakresem zmiany).
BLOKADY: brak
RUNDY: FC po rundzie 1/5
NASTEPNY KROK: integracja orkiestratora (FF/merge e7d2fe36), deploy wg osobnej autoryzacji.
UWAGI-DLA-ORKIESTRATORA: (1) komentarz "sekcja hero" w empireDetailPanel.ts (~3707-3719) twierdzi, ze resStateOf jest "NIETKNIETE" - nieaktualny, kosmetyka do osobnego tematu; (2) zamierzona zmiana semantyki: deficyt ulamkowy (-0,4) nie jest juz "bad".
DEPLOY/PUSH: NIE WYKONANO
