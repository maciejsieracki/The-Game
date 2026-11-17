# R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1 — raport Obrony (Operator, runda 2)

STATUS: PASS-WITH-NOTES (obrona; werdykt końcowy należy do Final Control)
DOMAIN: GAME (UI armii, web)
TEMAT: R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1
GOAL: rząd chipów „zaznacz wszystkich <typ>” nad listami jednostek armii (panel podziału, panel scalania, pasek zaznaczenia stosu). Chip: stan none/part/all, klik zaznacza albo odznacza wszystkie jednostki typu, sticky u góry przewijanego panelu.
BAZA: 4ac6654472fa97a046b4da9ffaf8ac5df90d75b9 (origin/main)
KANDYDAT (Operator r1): 27832ec6dd6a49bcc99e3265817f8d8c4bf3b08f
ZMIANY-COMMIT (obrona r1): 0dab40782b1addcc7ef831ae77cb9042221b5134 (parent = 27832ec6d; `git merge-base --is-ancestor 27832ec6d 0dab4078` = tak)

## Odpowiedzi na zarzuty Evaluatora (e2d2748e18b87114706d153e8f454ce3cb0319e4)

1. Odstępstwo od allowlisty — PRZYJMUJĘ FAKT, ODRZUCAM „niepotrzebne”, ROZSTRZYGA FC.
   - Poza allowlistą są: `gra/src/ui/hexContextTooltip.ts` (chipy paska stosu, CSS, pole `typeId`), `gra/src/ui/armyStackHud.ts` (+1 pole typu `typeId?`), `gra/src/ui/armyMergePanel.ts` (+pola typu `typeId?`, `typeLabel?`), `gra/src/main.ts` (4 punkty: `mergeUnitRow` z `typeId`/`typeLabel`, karty stosu z `typeId`, routing `pick-type:`, funkcja `togglePickUnitTypeOnStack` jako wywołanie helpera).
   - Uzasadnienie (dowód z dispatchu): 00-dispatch.md wymaga „skróty dodaj do KAŻDEGO takiego miejsca” i wskazuje wielokrotne zaznaczanie. Pasek zaznaczenia stosu (`hexContextTooltip.ts`, `buildUnitStackPickBarHtml`/`buildUnitStackTypeChipsHtml`) jest takim miejscem, a jego stan (`stackPickState`) czyta „Zastąp”/„Rozwiąż”. Bez tego paska wymóg „każde miejsce” nie jest spełniony.
   - Zakres zmian w tej rundzie NIE został poszerzony. Jedyna zmiana: logikę `togglePickUnitTypeOnStack` przeniesiono z `main.ts` do `gra/src/ui/armyTypeChips.ts` (allowlistowany helper), `main.ts` ma teraz jedno wywołanie.
   - DECYZJA DLA FC/ORKIESTRATORA (nie rozstrzygam sam): (a) rozszerzyć allowlistę o `hexContextTooltip.ts`, `armyStackHud.ts`, `armyMergePanel.ts` (tylko typy) i 4 punkty `main.ts`; albo (b) zdjąć pasek stosu z zakresu (wtedy temat jest niezgodny z „KAŻDEGO miejsca” w dispatchu).

2. Brak testu ścieżki paska stosu — PRZYJMUJĘ CZĘŚCIOWO.
   - Naprawa: logika skrótu paska stosu wyniesiona do czystej funkcji `togglePickTypeOnStackState(state, key, stack, typeId)` w `armyTypeChips.ts`. Używa jej `main.ts` (`togglePickUnitTypeOnStack`). Test: sekcja E w `gra/tools/army-type-chips-test.cjs` (7 asercji: zaznaczenie typu bez generała, klucz stanu, drugi klik odznacza, Wojownik bez generała, zmiana klucza stosu zaczyna od pustego zbioru, typ bez jednostek = ten sam obiekt stanu, część → dopięcie).
   - Dowód mutacyjny: usunięcie `&& su.isGeneral !== true` z filtra → `FAIL: stos: skrót Wojownik nie zaznacza generała (2 jednostki) -- ["w1","w2","g1"]`, `SUMMARY 49 pass, 1 fail`. Plik przywrócony z kopii (cp), po przywróceniu 50/0.
   - NIE ZMIERZONO: routing `pick-type:` w `main.ts` (3 linie, ten sam wzorzec co istniejący `pick:`) oraz klik→`onContextAction` w `sidePanelHud` nie są pokryte testem, bo `main.ts` nie jest importowalny w jsdom. Nie zmierzono w grze.

3. Wymóg sticky — PRZYJMUJĘ dla panelu podziału, ODRZUCAM konieczność dla panelu scalania (z dowodem).
   - Naprawa (split): w `armySplitPanel.ts` dodano regułę `.civ-asp-body>.civ-atc-row{position:sticky;top:-14px;z-index:2;background:rgba(12,17,26,0.98);...}`. Ciało panelu (`.civ-asp-body`, `overflow-y:auto`) to kontener przewijany, więc rząd chipów zostaje u góry.
   - Dowód (Chromium, harness panelu, sekcja „Żywy bieg” niżej): `position: sticky`; offset rzędu względem ciała przed przewinięciem 20 px, po przewinięciu 0 px — przy 1280×720 (scrollTop 244) i przy 900×470 (scrollTop 400). Brak poziomego przewijania dokumentu (`scrollWidth` = szerokość okna).
   - Merge-pick: rząd chipów leży NAD `.civ-ampk-units` (`max-height:150px; overflow-y:auto`, `armyMergePickPanel.ts` ~l. 57), który jest jedynym kontenerem przewijanym; `.civ-ampk-body` (~l. 55) nie ma `overflow`. Chipy są więc zawsze widoczne niezależnie od liczby jednostek. Sticky nie jest tu potrzebne. Ten wniosek wynika z CSS, NIE ZMIERZONO w przeglądarce dla panelu scalania.
   - Wąskie okno / wysokość < 720: zmierzono 900×470 w panelu podziału (patrz wyżej). Nie zmierzono w panelu scalania.

4. Żywy bieg tylko na harnessie paneli — PRZYJMUJĘ CZĘŚCIOWO (poprawiono i powtórzono harness, pełnej gry NIE ZMIERZONO).
   - Powtórzono harness panelu podziału z poprawkami (Chromium 1280×720 i 900×470, DPR 1, bundle esbuild poza repo, 50 łuczników + 4 procarzy + 2 wojowników + generał). Wyniki w sekcji „Żywy bieg”. Zrzut: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/live/split-900x470-sticky.png` (rząd chipów „Łucznik ×50 | Procarz ×4 | Wojownik 1/3” przypięty u góry po przewinięciu, lista pod nim).
   - NIE ZMIERZONO: pasek zaznaczenia stosu w pełnej grze (`sidePanelHud`/`hexContextTooltip`) oraz panel scalania w Chromium. Pełna gra wymaga `vite build` poza repo i sceny z 50-jednostkowym stosem; na dysku było 4,7 GB wolnego po `npm ci` (próg tematu ≥ 6 GB przy starcie), więc nie podjęto tego biegu w tej rundzie. Do weryfikacji w grze przez FC/właściciela.

5. Etykiety chipów = surowe typeId — PRZYJMUJĘ, naprawione.
   - `mergeUnitRow` (main.ts) dostaje `typeLabel: String(def?.nazwa ?? def?.Nazwa ?? u.typeId)`; `name` pozostaje `u.typeId` (zmiana `name` zmieniłaby też wiersze list, to osobny dług).
   - `ArmyMergeUnitRow.typeLabel?` (armyMergePanel.ts), `ArmyTypeChipUnit.label?` (armyTypeChips.ts); `groupUnitsByType` używa `label ?? name`; split i merge-pick przekazują `label: u.typeLabel`.
   - Test sekcja D: split pokazuje „Łucznik …” (nie `lucznik_t`), merge pokazuje „Łucznik ×2”, `groupUnitsByType` bierze `label`. Live: chipy „Łucznik ×50”, „Procarz ×4”, „Wojownik 1/3”.
   - Uwaga: wiersze list w panelach (`armyStackCardLabel(u)`) nadal pokazują `u.name` = surowe typeId. To istniejące zachowanie wiersza, nie zmieniane w tym temacie (powiązane z R-WEB-UI-RAW-IDS).

## ZMIANY (commit 0dab40782)
- `gra/src/ui/armyTypeChips.ts` — `label?` w jednostce, `togglePickTypeOnStackState`, eksport typu `StackTypePickUnit`.
- `gra/src/ui/armySplitPanel.ts` — przekazanie `label`, reguła CSS sticky dla rzędu chipów.
- `gra/src/ui/armyMergePickPanel.ts` — przekazanie `label`.
- `gra/src/ui/armyMergePanel.ts` — pole `typeLabel?` w `ArmyMergeUnitRow`.
- `gra/src/main.ts` — `mergeUnitRow` z `typeLabel`; `togglePickUnitTypeOnStack` = wywołanie `togglePickTypeOnStackState`; import zamiast `toggleArmyTypeChip`.
- `gra/tools/army-type-chips-test.cjs` — sekcje D (3 asercje) i E (7 asercji), razem 40 → 50 asercji; tryb `--mutate` bez zmian.
- Nie zmieniano: `WERSJE.md`, manifest, `unitReplacePicker.ts`, `armyMerge.ts`, `gra-robocza/`, `rust-port/`. Nie uruchomiono `npm run build/dev`. Nie użyto `git add -A`.

## TESTY (surowe wyniki z tej rundy, cwd = worktree, gra/)
- `node_modules/.bin/tsc --noEmit` → exit 0 (po wszystkich zmianach, po przywróceniu pliku po mutacji).
- `node tools/army-type-chips-test.cjs` → `SUMMARY army-type-chips-test: 50 pass, 0 fail` (rc 0).
- `node tools/army-type-chips-test.cjs --mutate` → `SUMMARY ... [MUTATE]: 28 pass, 22 fail` (rc 1) — kontrola z poprzedniej rundy nadal czerwieni.
- Mutacja filtra generała w `togglePickTypeOnStackState` → `49 pass, 1 fail` (rc 1); przywrócono, 50/0.
- Regresje paneli armii (rc 0 każdy): army-split-besieging-no-siege-lock `PASS 21 / FAIL 0`; army-split-enemy-city-block `14 PASS, 0 FAIL`; army-split-graphical-hex-picker `14 pass, 0 fail`; army-split-hex-honeycomb `34 pass, 0 fail`; army-split-movement `4 pass, 0 fail`; army-split-ruch-icons `7 pass, 0 fail`; army-merge-bounce `4 pass, 0 fail`; army-merge-colocated `4 pass, 0 fail`; army-merge-panel-list-visibility `104 pass, 0 fail`; army-merge-separate-return `16 pass, 0 fail`; army-merge-dismiss-bounce `16 pass, 0 fail`; army-merge-separate-return-mainguard `73 pass, 0 fail`; army-merge-split-direction-icons `PASS`; army-merge-panel-production-mount `9 pass, 0 fail`; army-merge-stackgroupid `11045 pass, 0 fail`; army-panel-card-move-bar `All ... checks passed`; army-panel-recruit-remove `21 passed, 0 failed`; army-panel-recruit-rally-general `5 assertions passed`.
- Bramki referencyjne (rc 0): logic-test (ostatnia asercja [213]); tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test (macierz OK dla 15 cywilizacji); combat-test `All sanity checks passed.`
- load-game-regression-test → `34 PASS / 0 FAIL` (rc 0).
- NIE URUCHOMIONO (z powodu): `army-split-panel-scroll-grid-test` (w raporcie Evaluatora: FAIL identyczny na bazie 4ac66544, dług istniejący); `army-merge-panel-scroll-real-render-test` (zapisuje do śledzonego PNG w `R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1`, co zmieniało worktree — przywrócono `git restore`, nie wchodzi do commitu); `army-panel-general-label-multiselect-test` (błąd builda `.svg?raw`, dług #427, istniejący na bazie); `load-game-regression-e2e*.cjs` (wymagają przeglądarki/serwera, poza zakresem zmian).

## ŻYWY BIEG (Chromium, harness panelu podziału)
Skrypt w scratchpad (`live/live-split.cjs`, bundle `live/bundle-split.js` z `armySplitPanel.ts`, stub `brandAssets`, `/usr/bin/chromium`, DPR 1). Armia: 50 łuczników, 4 procarzy, 2 wojowników, generał.
- 1280×720: `bodyScrollable: true`, `scrollTop 244`, offset rzędu chipów przed przewinięciem 20 px, po przewinięciu 0 px, `position: sticky`, chipy: `Łucznik ×50`, `Procarz ×4`, `Wojownik 1/3`, `scrollWidth = innerWidth = 1280`.
- 900×470: `scrollTop 400`, offset 20 px → 0 px, `sticky`, te same chipy, `scrollWidth = 900`.
- Po kliknięciu „Łucznik” stan `all` = `Łucznik ×50` (zgodnie z regułą: `all` pokazuje sam total).

## BLOKADY
- Decyzja zakresu: allowlista (punkt 1 wyżej) — wymaga decyzji FC/orkiestratora.
- Brak testu routingu `pick-type:` w `main.ts` i brak biegu paska stosu w grze (punkty 2 i 4).

## RUNDY
2/5 (obrona po Evaluatorze r1). Operator r1: HAIKU 5.5. Obrona: HAIKU 5.5.

## NASTĘPNY KROK
Evaluator (r2, SONNET): przegląd commitu 0dab40782 i decyzja FC w sprawie allowlisty (pkt 1). Przed FC: żywy bieg paska stosu w grze (pkt 4) lub jawne zaakceptowanie NIE ZMIERZONO przez właściciela.

## UWAGI-DLA-ORKIESTRATORA
- Commit kodu 0dab40782 jest na odłączonym HEAD worktree `wf_742d80aa-fc9-3`; raport jest w commicie tej gałęzi (SHA w polu `sha`).
- Wiersze list w split/merge nadal pokazują surowe typeId (`u.name`). Poza zakresem tego tematu; do R-WEB-UI-RAW-IDS.
- Test `army-merge-panel-scroll-real-render-test` nadpisuje śledzony PNG w `dyspozycje/autobot/runs/R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/` — warto przenieść zapis poza repo (już zgłoszone przez Operatora r1).
- `gra/node_modules` zainstalowano przez `npm ci --ignore-scripts` w worktree (gitignored) i usunięto po pracy.
- Dane tymczasowe: `scratchpad/live/` (bundle, skrypt Playwright, zrzut PNG). Poza repo.

DEPLOY/PUSH: NIE WYKONANO
