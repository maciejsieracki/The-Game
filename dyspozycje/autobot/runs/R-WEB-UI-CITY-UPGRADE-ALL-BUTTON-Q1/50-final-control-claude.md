# R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1 — Final Control (Claude)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1
GOAL: przycisk „Ulepsz wszystko” w nagłówku sekcji „Ulepsz” panelu miasta, ta sama ścieżka co „Ulepsz” wiersza (addItem upgrade:true), test + mutacja + zrzuty.
ZMIANY-COMMIT: kandydat a26997e44 (baza 2d2c425f80babc40d257be3324e88f1d898d9000 jest przodkiem: merge-base --is-ancestor OK). Diff: cityPanel.ts (+92/-10), nowy gra/tools/city-upgrade-all-button-test.cjs, 3 zrzuty PNG, raporty 10 i 30 — w allowliście, brak plików spoza niej.

OCENA ZARZUTÓW (1-7):
1 test: naprawiony — plik istnieje, 25/0.
2 mutacja: naprawiona — zmutowany 7 FAIL.
3 zrzuty: naprawione z zastrzeżeniem — headless Chromium, lista renderBuildList z fiksturą, nie żywa gra (NOTA).
4 aktywne = nie w kolejce: naprawione w kodzie (activeUpgrades vs readyButQueued, osobny tooltip).
5 wyczerpanie puli: częściowo — tooltip „do N, zależnie od zasobów”, komunikat liczy faktycznie dodane (addItem zwraca bool). Wyczerpanie w połowie serii NIE_ZMIERZONO (ODDAJĘ jako uwagę).
6 odmiana: naprawiona (pluralUlepszenia); formy 1 i 2-4 tylko z przeglądu kodu.
7 status: wyrównany.
Przegląd kodu: klik wiersza (cityPanel.ts:6632) i zbiorczy wołają tę samą addItem; Kup nie wołane; jeden rerender na końcu.

TESTY (własny przebieg na a26997e44, surowe wyniki):
- tsc --noEmit: exit 0
- logic-test: 213/213; tech-tree-test: 20 pass/0 fail; research-test: 33/33; unit-replace-test: 21/21; combat-test: 6/6
- city-panel-growth-percent-separator-test: 29/0
- city-upgrade-all-button-test: prawdziwy fail=0, zmutowany fail=7, exit 0
- upgrade-budynki-test: 60 pass / 1 fail („stale palisade completion…”) — TEN SAM wynik na bazie 2d2c425f8 (wcześniejsza regresja, niezwiązana z cityPanel.ts)
- NIE_ZMIERZONO: fortifications-upgrade-chain-ui (brak chromium-1194), city-panel-refresh-live (żywa gra), wygląd i klik w żywej grze, przewinięcie/fokus.
BLOKADY: brak blokujących. NOTY: wygląd (zrzut nieostylowany, bez powłoki gry) ocenia właściciel.
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: integracja orkiestratora (merge a26997e44 do main, bramki), deploy na ROBOCZĄ za osobną autoryzacją.
DEPLOY-PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: istniejący FAIL upgrade-budynki-test (stale palisade completion) na main.
