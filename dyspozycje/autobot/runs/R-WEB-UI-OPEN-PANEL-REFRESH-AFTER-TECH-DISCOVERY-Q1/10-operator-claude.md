# R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1
GOAL: otwarty panel miasta ma odświeżyć listę budowy/rekrutacji po odkryciu technologii bez ponownego otwierania. Defekt ODTWORZONY, poprawka minimalna: jedno wspólne wywołanie `refreshOpenPanelsAfterTechDiscovery()` w miejscach ukończenia technologii gracza bez awansu epoki.

ZMIANY-COMMIT:
- `gra/src/main.ts`: helper `refreshOpenPanelsAfterTechDiscovery()` (odświeża `refreshCityPanelIfOpen` + `refreshEmpireRecruitPanel`, no-op przy zamkniętych panelach); wywołania: ukończenie badań w EOT (blok `step.completed`), nauka wioski (gałąź `else if`), grant technologii przez handel (gałąź bez awansu). Test-only hook `__eraTestDebug.prepareNonEraCompletion()`. Reguły dostępności nie zmienione.
- `gra/tools/open-panel-refresh-after-tech-live-test.cjs`: żywy strażnik (EOT z realnym `researchStep`, porównanie listy budowy stale vs świeży render).
- `dyspozycje/.../dowody/`: JSON-y i zrzuty tekstu panelu.
- SHA: patrz commit (czubek gałęzi autobot/R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1).

TESTY:
- Reprodukcja na świeżym buildzie bazy 1dd3958b (kopia poza repo): otwarty panel + `unlockAllTech` bez ponownego otwarcia → lista B (stale) różni się od C (świeży): kolejność wierszy, znikają „Mury kamienne”/„Dwór Zarządcy”. Defekt ODTWORZONY.
- Żywy test EOT, build z poprawką: PASS (`completed=true`, `settled=true`, era bez zmian, lista budowy B == C).
- Mutacja (te same wywołania usunięte, hook zostaje): FAIL — ta sama lista w innej kolejności. Test rozróżnia stan stale od świeżego.
- `tsc --noEmit`: 0 błędów (kopia poza repo, źródła z poprawką).
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test OK (exit 0); combat-test 6/6.
- Panele: army-panel-recruit-remove-test 21/0; ai-rekrutacja-parytet-test 7/0; army-recruitment-concentration-test 30/0.
- W18 (`live-verify-w18-w24-manual-losses-w18.cjs`) na buildzie z poprawką: exit 0, werdykt NIE_ZMIERZONO (jak zaprojektowano, brak regresu).
- NIE ZMIERZONO: ścieżka handlu technologią i nauka wioski (tylko kod, bez żywego testu); widok pełnej gry bez haka.

BLOKADY: brak. Build wykonany w kopii poza repo (zakaz `npm run build` w `gra/` zachowany); `gra/` w repo nie ma `dist` ani `node_modules` z builda.

RUNDY: 1/5 (wynik pierwszej rundy, bez FAIL).

NASTĘPNY KROK: Final Control — ponowić build ROBOCZEJ poza repo i uruchomić `open-panel-refresh-after-tech-live-test.cjs` (oczekiwane PASS); potwierdzić, że wywołania w gałęziach handlu/wioski nie zmieniają zachowania (zakres kodowy).

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Test EOT wymaga bufora bramki NNS (hooki `__civTest.setSpichlerzPanstwa` / `__nnsMeasureDebug.setPlayerTreasury`), bo inaczej EOT blokuje prognoza < 0. To ustawienie testowe.
- Po EOT pojawia się karta odkrycia technologii (overlay) zasłaniająca panel miasta. Przycisk „Zamknij” zamyka też panel — osobny problem UX, poza zakresem.
- Licznik nagłówkowy listy budowy zmienia się po EOT niezależnie od technologii; test pomija czysto liczbowe linie.
- Hak `unlockAllTech` nie przechodzi przez potok odkrycia; nie jest dowodem dla ścieżki EOT.
- Manifest ROBOCZEJ (bundle 92afbe82) nie odpowiada bazie 1dd3958b; reprodukcję zrobiono na świeżym buildzie bazy.
