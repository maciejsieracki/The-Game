# AutoBot operator — tartak na leśnym wzgórzu: zamknięcie wizualne (runda 1)

**ID powiązane:** `R-ULEPSZENIA-TARTAK-WZGORZE-LAS-Q1`, `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1`, `R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1`
**Branch:** `autobot/R-ULEPSZENIA-TARTAK-WZGORZE-LAS-Q1-r1`
**Baza dispatchu:** `e4af7741`
**Status operatora:** PASS — bieżący kod realizuje wizualny kontrakt; dodano test real-render i dowody. Bez zmiany kodu produktu.
**Granice:** nie commitowano, nie integrowano, nie wypychano ani nie wdrażano. API Kanban jest niedostępne zgodnie z dispatch-em; nie utworzono fikcyjnych kart ani readbacków.

## Wynik rekonesansu i reprodukcji

Sprawdziłem implementację `preservesHillRelief`, `keepsReliefUnderImprovement`, `improvementReliefOpts`, `syncImprovementDecorForHex` i `spawnImprovementMesh`. Tartak jest jawnie na liście ulepszeń zachowujących relief. Render zachowuje dekor wzgórza, a model dostaje opcje reliefu; wyrąb korzysta z `stripForestDependentImprovements`, do którego tartak należy.

Nowy scenariusz `gra/tools/tartak-wzgorze-las-real-render-test.cjs` buduje dwa bundle: kontrolny z cofnięciem obsługi reliefu tartaku w transformacji Vite działającej tylko w pamięci oraz kod bieżący. Chromium ładuje bundle z lokalnego serwera HTTP (w tym środowisku polityka przeglądarki blokuje `file://`). Na żywej mapie scenariusz znajduje leśne wzgórze, zapisuje zrzuty przed i po postawieniu tartaku, mierzy instancje widocznego dekoru, sprawdza nakładkę i warstwy, pozycję grupy modelu oraz próbnik powierzchni wzgórza, po czym wykonuje wyrąb i sprawdza usunięcie tartaku.

W wybranym heksie `(41,28)` bieżący kod zachował `teren=wzgorza`, `overlay=las`, warstwę `tartak` i wszystkie 3 zmierzone instancje dekoru (przed: 3, po: 3). Mesh był obecny; `groupY=0.65`, `topY=0.64`, `sectorR=0.86`, a próbnik reliefu działał. W wariancie z regresją dekor spadł z 3 do 1 instancji, a opcje reliefu zniknęły. Po świadomym wyrębie kod usunął tartak i ustawił `overlay=brak`; pozostała jedna instancja gruntu, która jest oczekiwana i nie jest dekoracją lasu. Dwie sesje nie zgłosiły `pageerror`.

## Bramy i dokładne wyniki

- `node gra/tools/tartak-wzgorze-las-real-render-test.cjs --shots /tmp/sawmill-visual-evidence-r3` — **8 PASS / 0 FAIL** (dwa buildy i żywe Chromium; screenshoty i JSON skopiowano do `evidence-sawmill-visual-r2/`).
- `node gra/tools/sawmill-hill-relief-test.cjs` — **8 asercji PASS**.
- `node gra/tools/map-improvement-qualify-test.cjs` — **133 PASS / 0 FAIL**.
- `node gra/tools/relief-preserving-mine-prefix-test.cjs` — **24 PASS / 0 FAIL**.
- `npm run typecheck -- --pretty false` z katalogu `gra/` — **PASS**.
- `node gra/tools/tartak-oboz-wyscig-race-test.cjs` — **FAIL z błędem harnessu**: w tymczasowym `.tartak-race-player-bundle.cjs` `ReferenceError: setOwnerLastPraca is not defined`; wcześniejsze asercje wyścigu dla AI i gracza przeszły, kontrola dodatnia gracza przerwała test. Tymczasowe pliki harnessu usunięto.
- `node gra/tools/oboz-lowiecki-las-test.cjs` — **72 passed / 19 failed**. To istniejąca szeroka bramka obozu łowieckiego (warunki legalności/fixture wyrębu), poza zakresem samego tartaku; nie zmieniałem tych reguł.
- `git diff --check` — **PASS**.

Dwa ostatnie niezaliczone testy oznaczają, że nie można zadeklarować pełnego PASS dla całego powiązanego obszaru obozu/wyścigu. W szczególności błąd `setOwnerLastPraca` wymaga osobnego naprawienia harnessu, a 19 niezgodności bramki obozu — osobnego rozpoznania przed zamknięciem tamtego ID. Nie podmieniałem ich na fikcyjne zielone wyniki.

## Artefakty i identyfikacja

- Test real-render: `gra/tools/tartak-wzgorze-las-real-render-test.cjs`.
- Screenshoty PRZED/regresja oraz PRZED/PO budowy bieżącego kodu i wynik JSON: `dyspozycje/autobot/runs/R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1/evidence-sawmill-visual-r2/`.
- Test SHA-256: `22e62bcc915fbad844d296b237d5a552a68677ff7606a079d08b6e534be1399e`.
- `results.json` SHA-256: `d220c4d01c4c8b83b4b4c8a51aef7ef021f8d3b78bdf1ab7f551fd65588e9eb6`.
- Kod produktu pozostał bez zmian. Praca operatora nad konkretnym kontraktem tartaku jest zakończona testem i dowodami; wymaga niezależnego ewaluatora/obrony i kolejnych etapów procesu AutoBot przed uznaniem całej poprawki za wdrożoną.
