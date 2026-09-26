STATUS: PASS
DOMAIN: GAME
TEMAT: R-AUTOMANAGE-ULEPSZENIA-NIE-BUDOWANE-Q1-20260925
GOAL: Zdiagnozowac i naprawic zgloszenie: tryb autonomiczny nie buduje ulepszen budynkow mimo ustalonej zasady (nowe budynki pierwszenstwo, potem ulepszenia gdy pula pusta).

ZMIANY/COMMIT:
- gra/src/game/auto-manage.ts (funkcja pickAutoBuildItem): fallback do
  bestCandidateForFocus(upgrades, data, 'zrownowazone') rozszerzony z
  `tryb === 'lista'` na `tryb === 'lista' || tryb === 'priorytet'`.
  Zero zmian w main.ts (diagnostyczny hak __aiBuildingsTestDebug.diagAutoBuild
  dodany i USUNIETY w tej samej sesji, main.ts wraca do stanu origin/main).
  Brak commitu — worktree pozostaje z niezacommitowanym diffem, zgodnie
  z zakazem deploy/push (commit lokalny byl dozwolony, ale pozostawiam
  decyzje integracji orkiestratorowi po review).

REPRODUKCJA (dowod, nie zalozenie):
- Test istniejacy (`auto-manage-ulepszenia-fallback-test.cjs`, 11/11 PASS
  na czystym main) pokrywa WYLACZNIE tryb 'lista'. NIE pokrywa trybu
  'priorytet', ktory jest realnym, typowym wyborem gracza/AI (kazde miasto
  duzego AI startuje z budowaTryb='zrownowazone', ale gracz moze recznie
  przelaczyc na 'priorytet' z waska lista kategorii, np. tylko "wojsko").
- Zywa symulacja (60 tur, headless Chromium, probe .probe-ulepszenia-live.cjs
  + wlasny .probe-diag3.cjs z dodatkowym diagnostycznym hakiem w main.ts)
  potwierdzila: miasta z pusta pula nowych budynkow i dostepnymi,
  oplacalnymi ulepszeniami (np. city2, tura 26-35: builtIds=[stolarnia,...],
  upgradeableIds=[stolarnia], surowce wystarczajace) mimo to mialy
  pick=null przez wiele kolejnych tur w scenariuszu 'priorytet' — ale
  0 przypadkow rzeczywistej straty w trybie domyslnym 'zrownowazone' (ten
  dziala poprawnie, bo buildingMatchesFocus dopasowuje KAZDA kategorie
  budynku dla profilu 'zrownowazone').
- Izolowany test jednostkowy (bundlowany esbuild wprost z pickAutoBuildItem,
  bez mockow) potwierdzil mechanizm: tryb='priorytet',
  budowaPriorytetTypow=['wojsko'] (realistyczna, waska lista), miasto ma
  tylko Stolarnie (kategoria "Produkcja") z dostepnym, oplacalnym
  ulepszeniem -> pick=null PRZED naprawa, pick=Garncarnia (fallback
  'zrownowazone') PO naprawie. Ten sam scenariusz z tryb='lista' (ktory juz
  mial fallback) zawsze zwracal poprawny pick.

PRZYCZYNA:
`pickAutoBuildItem` (auto-manage.ts:340-370) ma dwupoziomowa logike:
poziom 1 nowe budynki wg `pickForTryb(tryb, candidates, ...)`, poziom 2
(fallback R-BUDOWA-AUTO-ULEPSZENIA-Q1) ulepszenia wg tego samego
`pickForTryb`. Gdy `pickForTryb` nie znajdzie dopasowania w POZIOMIE 2
(bo kategorie wybrane przez gracza w `budowaPriorytetTypow` nie pokrywaja
kategorii zadnego z dostepnych ulepszen), byl catch-all fallback do
`bestCandidateForFocus(upgrades, data, 'zrownowazone')` TYLKO dla
`tryb === 'lista'`. Tryb 'priorytet' mial DOKLADNIE ta sama strukturalna
luke, ktora 'lista' mialo przed swoja wczesniejsza naprawa (patrz komentarz
historyczny w kodzie), ale nie zostal wtedy objety poprawka.

NAPRAWA: rozszerzenie warunku `if (tryb === 'lista')` na
`if (tryb === 'lista' || tryb === 'priorytet')` — dokladnie ten sam,
juz zweryfikowany fallback, zaaplikowany do drugiego trybu z ta sama luka.
Zero zmian zachowania dla 'zrownowazone' (nie ma tej luki) ani dla
przypadkow, gdzie 'priorytet' juz trafial poprawnie w poziomie 1 lub 2.

TESTY:
- gra/tools/auto-manage-test.cjs: 45/45 PASS (bez zmian vs baseline)
- gra/tools/auto-manage-ulepszenia-fallback-test.cjs: 11/11 PASS (bez zmian vs baseline)
- gra/tools/ai-mp-rekrutacja-build-gate-test.cjs: 21/21 PASS
- gra/tools/cities-buildings-production-owner-contract-test.cjs: 53/53 PASS, ALL GREEN
- gra/tools/ai-buduje-budynki-test.cjs: 40-41/42 PASS zaleznie od przebiegu —
  1-2 niedeterministyczne FAIL-e ISTNIEJACE i IDENTYCZNE na czystym
  origin/main BEZ mojej zmiany (zweryfikowane: uruchomiony dwukrotnie,
  raz z `git stash` moich zmian, raz bez — ten sam FAIL H1 "zero bledow
  konsoli" z powodu `[Wojna wymuszona] DECISION_REQUIRED: brak
  niezablokowanej sojuszem pary/trojkata...", niezwiazany z auto-manage.
  M6 (MUT-A) w jednym przebiegu tez FAIL z powodu run-to-run
  niedeterminizmu zywej symulacji AI, potwierdzony w obu wariantach
  kodu (z fixem i bez) — preexisting flake tego konkretnego testu,
  NIE regresja wprowadzona ta naprawa.
- Wszystkie pliki znalezione przez grep za `pickAutoBuildItem|autoManageCity|
  buildUpgradeCandidates|auto-manage` w tools/: 5 plikow, wszystkie
  uruchomione i sprawdzone powyzej.
- `npx tsc --noEmit`: czyste (0 bledow).
- `git diff --check` w gra/: czyste.

BLOKADY: brak. Diagnostyczny hak `__aiBuildingsTestDebug.diagAutoBuild`
dodany do main.ts w trakcie dochodzenia zostal w calosci usuniety przed
zakonczeniem — finalny diff dotyka WYLACZNIE auto-manage.ts (11 linii,
w tym 8 linii komentarza uzasadniajacego).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator -> Final Control -> integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
