STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI: kolejność jednostek na liście rekrutacji (panel miasta i panel Armia)
TEMAT: R-WEB-RECRUIT-LIST-ORDER-BY-ERA-Q1
GOAL: lista jednostek do rekrutacji: najnowsza epoka od góry, potem starsze; w epoce od najmocniejszej do najsłabszej; jeden komparator dla obu paneli.

## Założenia
- Zgłoszenie mówi „kolejka”, ale chodzi o LISTĘ DOSTĘPNYCH JEDNOSTEK (Taran, Rydwan, Wojownik...), nie o kolejkę zleconych rekrutacji (jej kolejność ustawia gracz ↑↓ — nietknięta).
- Miara siły = `fieldPower(def).total` (`gra/src/game/unit-power.ts:100`), ta sama co dotychczasowy `sortByUnitPowerDescending`. Remis: koszt złota (`Pieniądz (koszt)`) malejąco, potem nazwa (pl), potem indeks źródłowy.
- Epoka: pole `Epoka` w `gra/data/units.json` (Kamień/Brąz/Żelazo, rangi 0/1/2 — jak `EPOCH_ORDER` w techTreeView.ts:108). Brak/nieznana epoka = najstarsza (0). Jednostka bez definicji → koniec listy.
- Bez nagłówków epok (domyślnie wg dispatchu).

## Dzisiejszy porządek (przed zmianą)
Jedno miejsce, nie dwa: `recruitPanelPurchasableUnits` (`gra/src/ui/cityPanel.ts:8220`) → `sortByUnitPowerDescending` po samej sile, BEZ epok. Używa go `renderPurchasableUnits` (cityPanel.ts:9116) dla panelu miasta (wywołania w cityPanel.ts:8339, 11917, 12129) ORAZ dla panelu Armia (`mountCityRecruitmentCardsForArmy`, cityPanel.ts:8333 → empireDetailPanel.ts:2805). Efekt: Taran(Kamień) przed Rydwanem mykeńskim(Brąz), Taran okuty(Brąz) przed Katapultą(Żelazo).

## ZMIANY/COMMIT
Commit kodu: 6f61f1d70 (bez push).
- NOWY `gra/src/game/recruit-list-order.ts` — `compareRecruitUnitDefs`, `sortRecruitListByEra`, `recruitEraRank`, `RECRUIT_ERA_ORDER` (czysty, stabilny, deterministyczny, niemutujący).
- `gra/src/ui/cityPanel.ts` — `recruitPanelPurchasableUnits` używa `sortRecruitListByEra`; usunięty już nieużywany import `unit-power`. Koszty, statystyki i dostępność (`purchasableUnits`, `showStockGatedUnits`) bez zmian.
- NOWY `gra/tools/recruit-list-order-by-era-test.cjs`.
- Artefakty: `gate-*.txt`, `zrzuty/*.png` (≤ 260 KB każdy).
- Poza allowlistą NIE ruszane: `main.ts` (snapshot `availableRecruitment` main.ts:17549 jest sortowany po samej sile, ale `recruitmentOptions` nie jest renderowane w `src/ui` — NIE_ZMIERZONO czy ma inny konsument; do decyzji Evaluatora), `production.ts`, `unitRecruitCard.ts`, `empireDetailPanel.ts` (zbędne — panel Armia dziedziczy listę).

## TESTY
- tsc `node ./node_modules/typescript/bin/tsc --noEmit`: EXIT=0 (gate-tsc.txt).
- Nowy test, RED przed (`--before`, człon epoki wyłączony w pamięci bundla): 8 pass / 4 fail (A1, A2, B1, B3) — gate-new-test-RED-before.txt. Faile B1: „E2: Taran(Kamień) przed Rydwan mykeński(Brąz)”, „E3: Taran okuty(Brąz) przed Katapulta(Żelazo)”.
- Nowy test, GREEN po: 18 pass / 0 fail, EXIT=0 (gate-new-test-GREEN.txt). Prawdziwy Chromium + prawdziwy cityPanel + prawdziwe `gra/data`, epoki 1..3: DOM panelu miasta (showCityPanel → REKRUTACJA) == DOM panelu Armia == model; epoka malejąco, w epoce siła malejąco; pierwszy wiersz widoczny bez przewijania; epoka 3: Katapulta, Hieros Lochos, Falanga, Thorakites (Żelazo), potem Brąz, na końcu Kamień.
- Mutacje (C): odwrócenie komparatora epok, wyłączenie członu epoki, odwrócenie siły — każda łamie B1 (3/3).
- Zrzuty: `zrzuty/PRZED-*.png` vs `PO-*.png` (miasto i Armia, epoka 3). PO: Żelazo od góry; PRZED: Wieża oblężnicza(Brąz) na szczycie.
- Regresje (27 testów `*recruit*`, `*unit-replace*`, `*army-merge-panel*`, `*empire-mass-recruitment*`, `unit-power-sort`) PRZED vs PO: wyniki identyczne (gate-regress-pre/post.txt). 21 EXIT=0; 6 EXIT=1 zarówno PRZED jak PO (stan bazowy, niezwiązany): army-panel-recruit-rally-general, era-recruit-panel-refresh (crash), recruitment-no-upkeep-gate (14 FAIL), unit-power-sort (1 FAIL: stara asercja tekstowa o `const units = sortByUnitPowerDescending` w cityPanel — failowała już przed), unit-recruit-nazwa, unit-replace (3 FAIL).

## BLOKADY
Brak. Uwaga: test `unit-power-sort-test.cjs` miał już FAIL na asercji źródłowej cityPanel (baza); nie edytowany (poza zakresem; do rozważenia aktualizacji w kolejnej rundzie, jeśli Evaluator uzna za konieczne).

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (Sonnet 5.5): weryfikacja niezależna; rozstrzygnąć main.ts:17549 (snapshot) i nieaktualną asercję unit-power-sort-test.

DEPLOY/PUSH: NIE WYKONANO
