# R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, nowa funkcja)
TEMAT: R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1
GOAL: „Ulepsz wszystko” w nagłówku „Ulepsz” dodaje do kolejki aktywne ulepszenia tą samą ścieżką co „Ulepsz” wiersza. GOAL 3 (test) i GOAL 4 (zrzuty) wykonane.
ZMIANY-COMMIT: SHA w polu sha. Pliki: `gra/src/ui/cityPanel.ts`, `gra/tools/city-upgrade-all-button-test.cjs`, `dowody/*.png`, ten raport.

ZARZUTY:
1. PRZYJMUJĘ — test `gra/tools/city-upgrade-all-button-test.cjs` (jsdom, bundel prawdziwego cityPanel.ts).
2. PRZYJMUJĘ — mutacja w kopii src (wywołanie `enqueueActiveUpgradeRows` → `n = 0`): 7 FAIL.
3. PRZYJMUJĘ — zrzuty: `dowody/przed-panel-miasta-ulepsz.png`, `po-panel-miasta-ulepsz.png`, `po-klik-ulepsz-wszystko.png`.
4. PRZYJMUJĘ, NAPRAWIONE — aktywne = włączone i nie w kolejce (`buildingTypeQueued`). Test F.
5. PRZYJMUJĘ częściowo — N w komunikacie = faktycznie dodane; tooltip to górna granica („do N, zależnie od zasobów”). Wyczerpanie puli w połowie serii NIE_ZMIERZONO.
6. PRZYJMUJĘ, NAPRAWIONE — `pluralUlepszenia` (1 ulepszenie / 2–4 ulepszenia / 5+ ulepszeń). Test E sprawdza N=6; formy 1 i 2–4 NIE_ZMIERZONO (przegląd kodu).
7. PRZYJMUJĘ — status wyrównany do faktów.

Dodatkowo naprawiono: po „Ulepsz wszystko” pozycje znikają z listy „Ulepsz”, więc nagłówek i komunikat nie były renderowane. `appendUpgradeAllStatus` wołana na końcu renderu listy i w gałęzi pustej listy.

TESTY (surowe wyniki):
- `tsc --noEmit`: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: exit 0.
- combat-test: PASS, All sanity checks passed.
- city-panel-growth-percent-separator-test: 29 passed, 0 failed.
- upgrade-budynki-test: 60 PASS, 1 FAIL (`stale palisade completion…`) — ta sama regresja co w rundzie 1; test nie ładuje cityPanel.ts.
- NOWY city-upgrade-all-button-test: prawdziwy PASS 25 / FAIL 0; zmutowany FAIL 7 (oczekiwane).
- NIE_ZMIERZONO: fortifications-upgrade-chain-ui-test (brak chromium-1194); city-panel-refresh-at-turn-start-live-test (wymaga żywej gry).

ZRZUTY: headless Chromium `/opt/pw-browsers/chromium-1243`, DSF 1, `renderBuildList` z fiksturą (6 ulepszeń). To NIE jest żywa gra: bez powłoki panelu i stylów z index.html. Wygląd w grze NIE ZMIERZONO.

BLOKADY:
- Wygląd w żywej grze do oceny właściciela.
- Klik w żywym UI nie wykonany.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 2) na SHA z pola sha.
DEPLOY/PUSH: NIE WYKONANO
